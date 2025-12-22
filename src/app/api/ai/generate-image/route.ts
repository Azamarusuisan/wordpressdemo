import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// LPデザイナーとしてのシステムプロンプト
const LP_DESIGNER_SYSTEM_PROMPT = `あなたはプロフェッショナルなLPデザイナーです。
1つのランディングページを構成する複数の画像を生成します。

【重要】すべての画像で以下を統一してください：
- 色調・トーン: 同じカラーパレットを使用
- スタイル: 統一されたビジュアルスタイル
- 品質: 高解像度、商用利用可能なクオリティ
- 雰囲気: 一貫したブランドイメージ

【禁止事項】
- テキスト、文字、ロゴは一切含めない
- 各セクションでバラバラなスタイルにしない
- 低品質な画像は生成しない

あなたが生成するすべての画像は、同じLPの一部として自然につながるものでなければなりません。`;

export async function POST(request: NextRequest) {
    try {
        const { prompt, taste, brandInfo } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        if (!GOOGLE_API_KEY) {
            return NextResponse.json({ error: 'Google API key is not configured' }, { status: 500 });
        }

        // テイストに応じたスタイル指示
        const tasteStyles: Record<string, string> = {
            'ビジネス・信頼': '青系の落ち着いた色調、クリーンでプロフェッショナル、信頼感のあるビジネスライクなスタイル',
            'ポップ・親しみ': '明るくカラフル、親しみやすい、楽しげで活気のあるスタイル',
            '高級・洗練': 'ダークトーンまたはゴールド系、高級感、ミニマルで洗練されたスタイル',
            'シンプル・清潔': '白ベース、余白を活かした、清潔感のあるミニマルスタイル',
            '情熱・エモい': '赤やオレンジの暖色系、ダイナミック、感情に訴えかけるスタイル'
        };

        const styleInstruction = taste && tasteStyles[taste]
            ? `\n\n【指定されたテイスト】${taste}\nスタイル: ${tasteStyles[taste]}`
            : '';

        const brandContext = brandInfo
            ? `\n\n【ブランド/商材情報】${brandInfo}`
            : '';

        // Gemini 3 Pro Image (Nano Banana Pro) で画像生成
        const imagePrompt = `${prompt}${styleInstruction}${brandContext}

【要件】
- このLPの他の画像と統一感のあるビジュアル
- 高解像度、シャープな画質
- LP/広告に適した構図
- テキストや文字は一切含めない（純粋な画像のみ）`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: LP_DESIGNER_SYSTEM_PROMPT }]
                    },
                    contents: [{
                        parts: [{ text: imagePrompt }]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE", "TEXT"]
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini 3 Pro Image API error:', errorText);

            // Fallback to Gemini 2.5 Flash Image
            console.log('Trying fallback: gemini-2.5-flash-preview-image-generation');
            const fallbackResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent?key=${GOOGLE_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: imagePrompt }]
                        }],
                        generationConfig: {
                            responseModalities: ["IMAGE", "TEXT"]
                        }
                    })
                }
            );

            if (!fallbackResponse.ok) {
                const fallbackError = await fallbackResponse.text();
                console.error('Fallback model error:', fallbackError);
                throw new Error(`画像生成に失敗しました: ${response.status} - ${errorText}`);
            }

            const fallbackData = await fallbackResponse.json();
            return await processImageResponse(fallbackData);
        }

        const data = await response.json();
        return await processImageResponse(data);

    } catch (error: any) {
        console.error('Image Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

async function processImageResponse(data: any) {
    const parts = data.candidates?.[0]?.content?.parts || [];
    let base64Image: string | null = null;

    for (const part of parts) {
        if (part.inlineData?.data) {
            base64Image = part.inlineData.data;
            break;
        }
    }

    if (!base64Image) {
        throw new Error('画像が生成されませんでした。プロンプトを変更してお試しください。');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Image, 'base64');

    // Upload to Supabase Storage
    const filename = `nano-banana-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
    const { data: uploadData, error: uploadError } = await supabase
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

    // Get Public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('images')
        .getPublicUrl(filename);

    // Create DB Record
    const media = await prisma.mediaImage.create({
        data: {
            filePath: publicUrl,
            mime: 'image/png',
            width: 1024,
            height: 1024,
        },
    });

    return NextResponse.json(media);
}
