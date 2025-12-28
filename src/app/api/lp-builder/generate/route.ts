import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    SYSTEM_PROMPT,
    FULL_LP_PROMPT,
    fillPromptTemplate,
} from '@/lib/gemini-prompts';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { getGoogleApiKeyForUser } from '@/lib/apiKeys';
import { logGeneration, createTimer } from '@/lib/generation-logger';
import { businessInfoSchema, validateRequest } from '@/lib/validations';

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// カラーログ用のヘルパー
const log = {
    info: (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
    success: (msg: string) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ✓ ${msg}`),
    warn: (msg: string) => console.log(`\x1b[33m[WARN]\x1b[0m ⚠ ${msg}`),
    error: (msg: string) => console.log(`\x1b[31m[ERROR]\x1b[0m ✗ ${msg}`),
    progress: (msg: string) => console.log(`\x1b[35m[PROGRESS]\x1b[0m → ${msg}`),
};

// セクションタイプ別の画像生成プロンプト
const SECTION_IMAGE_PROMPTS: Record<string, (info: any) => string> = {
    hero: (info) => `${info.industry}業界の${info.businessName}のLPヒーローセクション用画像。
${info.service}を象徴する、${info.tone === 'luxury' ? '高級感のある' : info.tone === 'friendly' ? '親しみやすい' : info.tone === 'energetic' ? '活気のある' : 'プロフェッショナルな'}ビジュアル。
ターゲット: ${info.target}。メインイメージとして使える印象的な画像。人物やプロダクトを含めてもOK。`,

    features: (info) => `${info.industry}業界の${info.businessName}の特徴・メリットを表現する画像。
${info.strengths}を視覚的に表現。信頼感と価値を伝えるクリーンなビジュアル。アイコンや図解的な要素は不要。`,

    pricing: (info) => `${info.industry}業界の${info.businessName}の料金・プランセクション用背景画像。
${info.tone === 'luxury' ? 'プレミアム感のある' : 'シンプルで清潔感のある'}背景。価格表の背景として適した、邪魔にならない上品なビジュアル。`,

    testimonials: (info) => `${info.industry}業界の${info.businessName}のお客様の声セクション用画像。
実際のユーザーや顧客を想起させる、${info.target}層に響く信頼感のあるビジュアル。笑顔や満足感を表現。`,

    faq: (info) => `${info.industry}業界の${info.businessName}のFAQセクション用背景画像。
疑問解決、サポート、安心感を表現する明るくクリーンなビジュアル。`,

    cta: (info) => `${info.industry}業界の${info.businessName}のCTA（行動喚起）セクション用画像。
${info.tone === 'energetic' ? 'ダイナミックで情熱的な' : info.tone === 'luxury' ? '洗練された高級感のある' : '行動を促す力強い'}ビジュアル。
今すぐアクションを起こしたくなるようなインパクトのある画像。`,
};

// 画像生成関数（リトライ付き）
async function generateSectionImage(
    sectionType: string,
    businessInfo: any,
    apiKey: string,
    userId: string | null,
    maxRetries: number = 3,
    designDefinition?: any // Added Design Definition
): Promise<number | null> {
    const promptGenerator = SECTION_IMAGE_PROMPTS[sectionType];
    if (!promptGenerator) {
        log.warn(`No image prompt defined for section type: ${sectionType}`);
        return null;
    }

    const imagePrompt = promptGenerator(businessInfo);

    // テイストに応じたスタイル
    const tasteStyles: Record<string, string> = {
        'professional': '青系の落ち着いた色調、クリーンでプロフェッショナル、信頼感のあるビジネスライクなスタイル',
        'friendly': '明るくカラフル、親しみやすい、楽しげで活気のあるスタイル',
        'luxury': 'ダークトーンまたはゴールド系、高級感、ミニマルで洗練されたスタイル',
        'energetic': '赤やオレンジの暖色系、ダイナミック、感情に訴えかけるスタイル'
    };

    let styleInstruction = businessInfo.tone && tasteStyles[businessInfo.tone]
        ? `\nスタイル: ${tasteStyles[businessInfo.tone]}`
        : '';

    // Override with Design Definition if present
    if (designDefinition) {
        styleInstruction = `
\n【DESIGN INSTRUCTION - STRICTLY FOLLOW】
Reference Design Vibe: ${designDefinition.vibe}
Colors: Primary=${designDefinition.colorPalette.primary}, Background=${designDefinition.colorPalette.background}
Style: ${designDefinition.description}
Mood: ${designDefinition.typography.mood}
The generated image MUST match this specific visual style.
`;
    }

    const fullPrompt = `${imagePrompt}${styleInstruction}

【要件】
- 縦長の画像（アスペクト比 9:16）を生成すること
- 高解像度、シャープな画質
- LP/広告に適した構図
- テキストや文字は一切含めない（純粋な画像のみ）`;

    // リトライループ
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            log.progress(`Generating image for [${sectionType}] section... (attempt ${attempt}/${maxRetries})`);

            // Gemini 3 Pro Image で画像生成
            let response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: fullPrompt }]
                        }],
                        generationConfig: {
                            responseModalities: ["IMAGE", "TEXT"]
                        }
                    })
                }
            );

            let data;
            if (!response.ok) {
                const errorText = await response.text();
                log.warn(`Primary model failed (${response.status}): ${errorText.substring(0, 200)}`);

                // Fallback to Gemini 2.5 Flash
                log.info('Trying fallback model...');
                const fallbackResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: fullPrompt }]
                            }],
                            generationConfig: {
                                responseModalities: ["IMAGE", "TEXT"]
                            }
                        })
                    }
                );

                if (!fallbackResponse.ok) {
                    const fallbackError = await fallbackResponse.text();
                    log.error(`Fallback model also failed (${fallbackResponse.status}): ${fallbackError.substring(0, 200)}`);

                    // リトライ前に待機（指数バックオフ）
                    if (attempt < maxRetries) {
                        const waitTime = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
                        log.info(`Waiting ${waitTime}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                    log.error(`[${sectionType}] 画像生成に失敗しました（両モデルでエラー）`);
                    return null;
                }
                data = await fallbackResponse.json();
            } else {
                data = await response.json();
            }

            // 画像データを抽出
            const parts = data.candidates?.[0]?.content?.parts || [];
            let base64Image: string | null = null;

            for (const part of parts) {
                if (part.inlineData?.data) {
                    base64Image = part.inlineData.data;
                    break;
                }
            }

            if (!base64Image) {
                log.error(`No image data in response for [${sectionType}]`);
                if (attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 2000;
                    log.info(`Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                log.error(`[${sectionType}] 画像データが取得できませんでした`);
                return null;
            }

            // 成功 - 画像をアップロード
            const buffer = Buffer.from(base64Image, 'base64');
            const filename = `lp-${sectionType}-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;

            const { error: uploadError } = await supabase
                .storage
                .from('images')
                .upload(filename, buffer, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                log.error(`Upload error for [${sectionType}]: ${uploadError.message}`);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
                return null;
            }

            const { data: { publicUrl } } = supabase
                .storage
                .from('images')
                .getPublicUrl(filename);

            // MediaImageレコード作成
            const media = await prisma.mediaImage.create({
                data: {
                    userId,
                    filePath: publicUrl,
                    mime: 'image/png',
                    width: 768,
                    height: 1366,
                },
            });

            log.success(`Image generated for [${sectionType}] → ID: ${media.id}`);
            return media.id;

        } catch (error: any) {
            log.error(`Exception on attempt ${attempt} for [${sectionType}]: ${error.message || error}`);
            if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 2000;
                log.info(`Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    log.error(`====== [${sectionType}] 画像生成に完全に失敗しました（${maxRetries}回リトライ後）======`);
    return null;
}

export async function POST(req: NextRequest) {
    const startTime = createTimer();
    let prompt = '';

    // ユーザー認証を確認してAPIキーを取得
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    try {
        const body = await req.json();
        const { businessInfo } = body;

        if (!businessInfo) {
            return NextResponse.json({ error: 'Business info is required' }, { status: 400 });
        }

        // Validate business info
        const validation = validateRequest(businessInfoSchema, businessInfo);
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error,
                details: validation.details
            }, { status: 400 });
        }

        const GOOGLE_API_KEY = await getGoogleApiKeyForUser(user?.id || null);
        if (!GOOGLE_API_KEY) {
            return NextResponse.json({
                error: 'Google API key is not configured. 設定画面でAPIキーを設定してください。'
            }, { status: 500 });
        }

        // Prepare Prompt
        prompt = fillPromptTemplate(FULL_LP_PROMPT, {
            businessName: businessInfo.businessName,
            industry: businessInfo.industry,
            service: businessInfo.service,
            target: businessInfo.target,
            strengths: businessInfo.strengths,
            differentiators: businessInfo.differentiators || '特になし',
            priceRange: businessInfo.priceRange || '相談に応じて',
            tone: businessInfo.tone,
        });

        // Design Definition Injection
        const designDefinition = body.designDefinition;
        if (designDefinition) {
            prompt += `\n\n【IMPORTANT: DESIGN INSTRUCTION】
You MUST strictly follow the "Design Definition" below for the visual style, color palette, and component structure.
The user wants to REPLICATE the design style of a specific reference image.

<Design Definition>
- Vibe: ${designDefinition.vibe}
- Description: ${designDefinition.description}
- Color Palette: Primary=${designDefinition.colorPalette.primary}, Secondary=${designDefinition.colorPalette.secondary}, Background=${designDefinition.colorPalette.background}
- Typography: ${designDefinition.typography.style} (${designDefinition.typography.mood})
- Layout: ${designDefinition.layout.style} (Density: ${designDefinition.layout.density})
</Design Definition>

Use these colors and styles in your Tailwind classes.
For example, if the background is dark, use 'bg-slate-900' or similar.
If the layout is 'Hero-focused', ensure the Hero section is dominant.
`;
        }


        // Call Gemini API for text content
        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: prompt }
        ]);
        const response = await result.response;
        const text = response.text();

        log.info("Gemini text content generated successfully");

        // Parse Response
        let jsonString = text;
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

        let generatedData;
        try {
            generatedData = JSON.parse(jsonString);
        } catch (e) {
            log.error("JSON Parse Error - AI response was not valid JSON");
            log.error(`Raw Text: ${text.substring(0, 500)}`);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        // 各セクションの画像を生成
        const sectionCount = generatedData.sections?.length || 0;
        log.info(`========== Starting image generation for ${sectionCount} sections ==========`);
        const sectionsWithImages = [];

        for (const section of generatedData.sections || []) {
            log.progress(`Processing section: ${section.type}`);

            // 画像を生成
            const imageId = await generateSectionImage(
                section.type,
                businessInfo,
                GOOGLE_API_KEY,
                user?.id || null,
                3, // maxRetries
                body.designDefinition // Pass Design Definition
            );

            sectionsWithImages.push({
                ...section,
                imageId: imageId,
                properties: section.data || section.properties || {},
            });

            // APIレート制限を避けるため待機（2秒）
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 結果サマリー
        const successCount = sectionsWithImages.filter(s => s.imageId).length;
        const failCount = sectionsWithImages.filter(s => !s.imageId).length;

        log.info(`========== Image generation complete ==========`);
        log.success(`Successfully generated: ${successCount}/${sectionsWithImages.length} sections`);
        if (failCount > 0) {
            log.error(`Failed to generate: ${failCount} sections`);
        }

        // ログ記録（テキスト生成）
        await logGeneration({
            userId: user?.id || null,
            type: 'lp-generate',
            endpoint: '/api/lp-builder/generate',
            model: 'gemini-1.5-flash',
            inputPrompt: prompt,
            outputResult: JSON.stringify(generatedData),
            status: 'succeeded',
            startTime
        });

        // ログ記録（画像生成サマリー）
        if (successCount > 0) {
            await logGeneration({
                userId: user?.id || null,
                type: 'lp-generate',
                endpoint: '/api/lp-builder/generate',
                model: 'gemini-3-pro-image-preview',
                inputPrompt: `LP image generation for ${sectionsWithImages.length} sections`,
                imageCount: successCount,
                status: 'succeeded',
                startTime
            });
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Cost Calculation (JPY Estimation)
        // Gemini 1.5 Flash (Text): ~0.01 JPY / 1k input chars, ~0.03 JPY / 1k output chars
        // Gemini Image (Flash/Pro): ~0.6 JPY (Flash) - ~4.0 JPY (Pro) per image
        // *Using conservative estimates for user display*

        const textInputCost = (prompt.length / 1000) * 0.01;
        const textOutputCost = (text.length / 1000) * 0.03;

        // Image usage: successCount images
        // Assuming mix of Pro/Flash or just strictly estimating roughly 2 JPY per image for safety/clarity
        const imageCost = successCount * 2.0;

        const totalCost = Math.ceil((textInputCost + textOutputCost + imageCost) * 100) / 100; // Round to 2 decimals

        return NextResponse.json({
            success: true,
            data: {
                ...generatedData,
                sections: sectionsWithImages
            },
            meta: {
                duration: duration,
                estimatedCost: totalCost
            }
        });

    } catch (error: any) {
        log.error(`Generation API Error: ${error.message || error}`);

        // ログ記録（エラー）
        await logGeneration({
            userId: user?.id || null,
            type: 'lp-generate',
            endpoint: '/api/lp-builder/generate',
            model: 'gemini-1.5-flash',
            inputPrompt: prompt || 'Error before prompt',
            status: 'failed',
            errorMessage: error.message,
            startTime
        });

        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
