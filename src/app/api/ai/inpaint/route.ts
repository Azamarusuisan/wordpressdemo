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

// デザイン定義（参考画像から解析されたスタイル）
interface DesignDefinition {
    colorPalette: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
    typography: {
        style: string;
        mood: string;
    };
    layout: {
        density: string;
        style: string;
    };
    vibe: string;
    description: string;
}

interface InpaintRequest {
    imageUrl?: string;
    imageBase64?: string;
    mask?: MaskArea;        // 単一選択（後方互換性）
    masks?: MaskArea[];     // 複数選択
    prompt: string;         // 修正指示
    referenceDesign?: DesignDefinition; // 参考デザイン定義（オプション）
    referenceImageBase64?: string; // 参考デザイン画像（Base64、オプション）
}

interface InpaintHistoryData {
    originalImage: string;
    masks: MaskArea[];
    prompt: string;
}

export async function POST(request: NextRequest) {
    const startTime = createTimer();
    let inpaintPrompt = '';

    // ユーザー認証
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { imageUrl, imageBase64, mask, masks, prompt, referenceDesign, referenceImageBase64 }: InpaintRequest = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: '修正指示(prompt)を入力してください' }, { status: 400 });
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

        // 複数の選択範囲を説明に変換
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

        // 参考デザインスタイルの説明を生成
        let designStyleSection = '';
        if (referenceDesign || referenceImageBase64) {
            if (referenceImageBase64) {
                // 参考画像が添付されている場合
                designStyleSection = `
【参考デザイン画像について】
2枚目の画像は「参考デザイン」です。この画像のデザインスタイル（色使い、雰囲気、トーン、質感）を参考にして、1枚目の画像を編集してください。
`;
            }
            if (referenceDesign) {
                const { colorPalette, typography, layout, vibe, description } = referenceDesign;
                designStyleSection += `
【参考デザインスタイル解析結果】
- カラーパレット:
  - プライマリ: ${colorPalette.primary}
  - セカンダリ: ${colorPalette.secondary}
  - アクセント: ${colorPalette.accent}
  - 背景: ${colorPalette.background}
- タイポグラフィ: ${typography.style}（${typography.mood}）
- レイアウト: ${layout.style}（密度: ${layout.density}）
- 雰囲気: ${vibe}
- スタイル説明: ${description}

編集後の画像は上記のデザインスタイル（色味、雰囲気、トーン）に合わせてください。
`;
            }
        }

        // テキスト追加系の指示かどうかを判定
        const isTextAddition = /(?:入れ|追加|書い|変更|テキスト|文字|タイトル|見出し)/i.test(prompt);

        // インペインティング用プロンプト - 画像生成を強制（日本語対応強化）
        inpaintPrompt = `あなたは画像編集の専門家です。提供された画像を編集して、新しい画像を生成してください。

【修正指示】
${prompt}

【対象エリア】
${areasDescription}
${designStyleSection}
【重要なルール】
1. 指定されたエリア内の要素のみを修正してください
2. 文字・テキストの変更が指示されている場合は、正確にその文字列に置き換えてください
3. ${(referenceDesign || referenceImageBase64) ? '参考デザインスタイルの色味、雰囲気、トーンを反映してください' : '元の画像のスタイル、フォント、色使いをできる限り維持してください'}
4. 修正箇所以外は変更しないでください
5. 画像全体を出力してください（説明文は不要です）
${isTextAddition ? `
【テキスト追加時の厳守事項】
- 絶対に白い背景や白い余白を追加しないでください
- テキストは選択エリアの既存の背景色・画像の上に直接描画してください
- 選択エリアの周囲の背景色・デザインを維持したまま、テキストのみを追加してください
- 背景を塗りつぶさず、元の背景を活かしてテキストを重ねてください
- テキストの色は背景とコントラストが取れる色を選んでください（背景が明るい場合は暗い文字、背景が暗い場合は明るい文字）
` : ''}

Generate the complete edited image now.`;

        // リクエストのpartsを構築（編集対象画像 + 参考画像（任意） + プロンプト）
        const requestParts: any[] = [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            }
        ];

        // 参考デザイン画像がある場合は追加
        if (referenceImageBase64) {
            // Base64データURLから実データを抽出
            const refBase64 = referenceImageBase64.replace(/^data:image\/\w+;base64,/, '');
            const refMimeMatch = referenceImageBase64.match(/^data:(image\/\w+);base64,/);
            const refMimeType = refMimeMatch ? refMimeMatch[1] : 'image/png';

            requestParts.push({
                inlineData: {
                    mimeType: refMimeType,
                    data: refBase64
                }
            });
        }

        // プロンプトを追加
        requestParts.push({ text: inpaintPrompt });

        // Gemini 3.0 Pro（最新画像生成モデル）を使用
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: requestParts
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE", "TEXT"],
                        temperature: 1.0,
                        // 高解像度出力
                        imageConfig: {
                            imageSize: "2K"
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
            console.error('Gemini Flash API error:', errorText);
            throw new Error(`インペインティングに失敗しました: ${response.status}`);
        }

        const data = await response.json();
        const modelUsed = 'gemini-3-pro-image-preview';
        const estimatedCost = estimateImageCost(modelUsed, 1);
        const durationMs = Date.now() - startTime;

        // 履歴用データを準備
        const historyData: InpaintHistoryData = {
            originalImage: imageUrl || `data:${mimeType};base64,${base64Data.substring(0, 50)}...`, // URLがない場合は識別子
            masks: allMasks,
            prompt: prompt,
        };

        const result = await processInpaintResponse(
            data,
            user.id,
            { model: modelUsed, estimatedCost, durationMs },
            historyData
        );

        // ログ記録（成功）
        await logGeneration({
            userId: user.id,
            type: 'inpaint',
            endpoint: '/api/ai/inpaint',
            model: modelUsed,
            inputPrompt: inpaintPrompt,
            imageCount: 1,
            status: 'succeeded',
            startTime
        });

        return result;

    } catch (error: any) {
        console.error('Inpaint Error:', error);

        // ログ記録（エラー）
        await logGeneration({
            userId: user.id,
            type: 'inpaint',
            endpoint: '/api/ai/inpaint',
            model: 'gemini-3-pro-image-preview',
            inputPrompt: inpaintPrompt || 'Error before prompt',
            status: 'failed',
            errorMessage: error.message,
            startTime
        });

        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

interface CostInfo {
    model: string;
    estimatedCost: number;
    durationMs: number;
}

async function processInpaintResponse(
    data: any,
    userId: string | null,
    costInfo?: CostInfo,
    historyData?: InpaintHistoryData
) {
    console.log('Gemini Response:', JSON.stringify(data, null, 2));

    const parts = data.candidates?.[0]?.content?.parts || [];
    let editedImageBase64: string | null = null;
    let textResponse: string | null = null;

    for (const part of parts) {
        console.log('Part keys:', Object.keys(part));
        if (part.inlineData?.data) {
            editedImageBase64 = part.inlineData.data;
            console.log('Found image data, length:', editedImageBase64?.length);
        }
        if (part.text) {
            textResponse = part.text;
            console.log('Text response:', textResponse);
        }
    }

    if (!editedImageBase64) {
        console.log('No image data found in response');
        return NextResponse.json({
            success: false,
            message: '画像の編集に失敗しました。選択範囲やプロンプトを変更してお試しください。',
            textResponse
        });
    }

    // Supabaseにアップロード
    const buffer = Buffer.from(editedImageBase64, 'base64');
    const filename = `inpaint-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;

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
            userId,
            filePath: publicUrl,
            mime: 'image/png',
            width: 0,  // 元画像サイズを維持
            height: 0,
        },
    });

    // インペイント履歴を保存
    let history = null;
    if (historyData) {
        history = await prisma.inpaintHistory.create({
            data: {
                userId,
                originalImage: historyData.originalImage,
                resultImage: publicUrl,
                prompt: historyData.prompt,
                masks: JSON.stringify(historyData.masks),
                model: costInfo?.model || 'unknown',
                estimatedCost: costInfo?.estimatedCost || null,
                durationMs: costInfo?.durationMs || null,
            },
        });
    }

    return NextResponse.json({
        success: true,
        media,
        textResponse,
        history,
        costInfo: costInfo ? {
            model: costInfo.model,
            estimatedCost: costInfo.estimatedCost,
            durationMs: costInfo.durationMs
        } : null
    });
}
