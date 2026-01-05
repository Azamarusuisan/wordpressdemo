import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { getGoogleApiKeyForUser } from '@/lib/apiKeys';
import { logGeneration, createTimer } from '@/lib/generation-logger';
import { estimateImageCost } from '@/lib/ai-costs';

interface MaskArea {
    x: number;      // 選択範囲の左上X（0-1の比率）
    y: number;      // 選択範囲の左上Y（0-1の比率）
    width: number;  // 選択範囲の幅（0-1の比率）
    height: number; // 選択範囲の高さ（0-1の比率）
}

interface TextFixRequest {
    imageUrl?: string;
    imageBase64?: string;
    mask?: MaskArea;
    masks?: MaskArea[];
    originalText: string;      // OCRで認識された元のテキスト
    correctedText: string;     // ユーザーが修正した正しいテキスト
}

export async function POST(request: NextRequest) {
    const startTime = createTimer();
    let textFixPrompt = '';

    // ユーザー認証
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { imageUrl, imageBase64, mask, masks, originalText, correctedText }: TextFixRequest = await request.json();

        if (!correctedText || !correctedText.trim()) {
            return NextResponse.json({ error: '修正後のテキストを入力してください' }, { status: 400 });
        }

        // 複数選択か単一選択か判定
        const allMasks: MaskArea[] = masks && masks.length > 0 ? masks : (mask ? [mask] : []);

        const GOOGLE_API_KEY = await getGoogleApiKeyForUser(user.id);
        if (!GOOGLE_API_KEY) {
            return NextResponse.json({
                error: 'Google API key is not configured. 設定画面でAPIキーを設定してください。'
            }, { status: 500 });
        }

        // 画像データ取得
        let base64Data: string;
        let mimeType = 'image/png';

        if (imageBase64) {
            base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        } else if (imageUrl) {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error('画像の取得に失敗しました');
            }
            const arrayBuffer = await imageResponse.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString('base64');
            mimeType = imageResponse.headers.get('content-type') || 'image/png';
        } else {
            return NextResponse.json({ error: '画像を指定してください' }, { status: 400 });
        }

        // 選択範囲の説明を生成
        const getPositionDesc = (m: MaskArea) => {
            const xPercent = Math.round(m.x * 100);
            const yPercent = Math.round(m.y * 100);
            let pos = '';
            if (yPercent < 33) pos = '上部';
            else if (yPercent < 66) pos = '中央';
            else pos = '下部';
            if (xPercent < 33) pos += '左側';
            else if (xPercent < 66) pos += '中央';
            else pos += '右側';
            return pos;
        };

        const areasDescription = allMasks.map((m, i) => {
            const xPercent = Math.round(m.x * 100);
            const yPercent = Math.round(m.y * 100);
            const widthPercent = Math.round(m.width * 100);
            const heightPercent = Math.round(m.height * 100);
            return `領域${i + 1}: ${getPositionDesc(m)}（左から${xPercent}%、上から${yPercent}%、幅${widthPercent}%、高さ${heightPercent}%）`;
        }).join('\n');

        // テキストを単語単位に分解（精度向上のため）
        const textWords = correctedText.trim().split(/\s+/);
        const isShortText = textWords.length <= 3 && correctedText.length <= 25;

        // 文字化け修正専用プロンプト - Gemini 3 Pro最適化（94%精度達成のためのベストプラクティス適用）
        textFixPrompt = `You are an expert image editor specializing in text correction. Edit the provided image to fix the text.

【TEXT CORRECTION TASK】
Replace the corrupted text with the correct text below.

Current text (corrupted/garbled):
"${originalText}"

Correct text to render:
"${correctedText}"
${isShortText ? `
[WORD-BY-WORD SPECIFICATION - for higher accuracy]
${textWords.map((word, i) => `Word ${i + 1}: "${word}"`).join('\n')}
` : ''}
【TARGET AREA】
${areasDescription}

【CRITICAL TEXT RENDERING RULES - for 94% accuracy】
1. Render text with EVENLY SPACED LETTERS
2. Use a clean, bold, sans-serif font style matching the original design
3. Place text on a solid contrasting background (maintain original)
4. Render each character with crystal-clear, sharp edges
5. For Japanese text: prioritize hiragana clarity, then katakana, then kanji
6. Maintain exact font weight, size, and color from original
7. Apply proper anti-aliasing for smooth edges without blur

【DESIGN PRESERVATION RULES】
1. ONLY modify text in the specified area
2. Preserve the original image's style, colors, and layout exactly
3. Keep text positioning aligned with original placement
4. Do NOT change anything outside the target area
5. Output the COMPLETE edited image

Generate the edited image with crystal-clear, perfectly legible text now.`;

        // Gemini 3.0 Pro Image で画像生成
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data
                                }
                            },
                            { text: textFixPrompt }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE", "TEXT"],
                        temperature: 0.5,  // 低温度でテキスト精度向上（ドキュメント推奨）
                        // 高解像度出力を指定
                        imageConfig: {
                            imageSize: "2K"  // テキスト精度と解像度のバランス
                        }
                    },
                    toolConfig: {
                        functionCallingConfig: {
                            mode: "NONE"
                        }
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            throw new Error(`テキスト修正に失敗しました: ${response.status}`);
        }

        const data = await response.json();
        const modelUsed = 'gemini-3-pro-image-preview';
        const estimatedCost = estimateImageCost(modelUsed, 1);
        const durationMs = Date.now() - startTime;

        // 画像データを抽出
        const parts = data.candidates?.[0]?.content?.parts || [];
        let editedImageBase64: string | null = null;
        let textResponse: string | null = null;

        for (const part of parts) {
            if (part.inlineData?.data) {
                editedImageBase64 = part.inlineData.data;
            }
            if (part.text) {
                textResponse = part.text;
            }
        }

        if (!editedImageBase64) {
            console.log('No image data found in response');
            return NextResponse.json({
                success: false,
                message: 'テキスト修正画像の生成に失敗しました。選択範囲やテキストを変更してお試しください。',
                textResponse
            });
        }

        // Supabaseにアップロード
        const buffer = Buffer.from(editedImageBase64, 'base64');
        const filename = `text-fix-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;

        const { error: uploadError } = await supabase
            .storage
            .from('images')
            .upload(filename, buffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error('画像のアップロードに失敗しました');
        }

        // 公開URL取得
        const { data: { publicUrl } } = supabase
            .storage
            .from('images')
            .getPublicUrl(filename);

        // DB保存
        const media = await prisma.mediaImage.create({
            data: {
                userId: user.id,
                filePath: publicUrl,
                mime: 'image/png',
                width: 0,
                height: 0,
                sourceType: 'text-fix',
            },
        });

        // ログ記録
        await logGeneration({
            userId: user.id,
            type: 'text-fix',
            endpoint: '/api/ai/text-fix',
            model: modelUsed,
            inputPrompt: textFixPrompt,
            imageCount: 1,
            status: 'succeeded',
            startTime
        });

        return NextResponse.json({
            success: true,
            media,
            textResponse,
            costInfo: {
                model: modelUsed,
                estimatedCost,
                durationMs
            }
        });

    } catch (error: any) {
        console.error('Text Fix Error:', error);

        // ログ記録（エラー）
        await logGeneration({
            userId: user.id,
            type: 'text-fix',
            endpoint: '/api/ai/text-fix',
            model: 'gemini-3-pro-image-preview',
            inputPrompt: textFixPrompt || 'Error before prompt',
            status: 'failed',
            errorMessage: error.message,
            startTime
        });

        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
