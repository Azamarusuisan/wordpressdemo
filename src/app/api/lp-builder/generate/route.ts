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

// ビジネス情報から不足している変数を自動生成
function enrichBusinessInfo(info: any): Record<string, string> {
    const toneDescriptions: Record<string, { urgency: string; guarantee: string }> = {
        professional: {
            urgency: '今なら無料相談実施中',
            guarantee: '安心の返金保証付き',
        },
        friendly: {
            urgency: 'お気軽にお問い合わせください',
            guarantee: '初回無料でお試しいただけます',
        },
        luxury: {
            urgency: '限定のプレミアムオファー',
            guarantee: '品質保証・アフターサポート完備',
        },
        energetic: {
            urgency: '今すぐ始めよう！期間限定キャンペーン中',
            guarantee: '結果が出なければ全額返金',
        },
    };

    // 安全なデフォルト値を設定
    const businessName = info.businessName || '当社';
    const industry = info.industry || 'サービス業';
    const service = info.service || 'サービス';
    const target = info.target || 'お客様';
    const strengths = info.strengths || '高品質なサービス';
    const tone = info.tone || 'professional';

    const toneConfig = toneDescriptions[tone] || toneDescriptions.professional;

    return {
        businessName,
        industry,
        service,
        target,
        strengths,
        differentiators: info.differentiators || strengths,
        priceRange: info.priceRange || '詳細はお問い合わせください',
        tone,
        // 自動生成される変数（安全に文字列を構築）
        painPoints: `${target}が抱える課題（${service}に関する悩み）`,
        concerns: `${service}の導入・利用に関する不安や疑問`,
        process: `${industry}における一般的な契約・購入プロセス`,
        planCount: '3',
        mainFeatures: strengths,
        offer: `${service}の特別オファー`,
        urgency: toneConfig.urgency,
        guarantee: toneConfig.guarantee,
        results: `${strengths}による具体的な成果・効果`,
    };
}

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

    // Override with Design Definition if present (with safe property access)
    if (designDefinition && designDefinition.colorPalette) {
        const vibe = designDefinition.vibe || 'Modern';
        const primaryColor = designDefinition.colorPalette?.primary || '#000000';
        const bgColor = designDefinition.colorPalette?.background || '#ffffff';
        const description = designDefinition.description || '';
        const mood = designDefinition.typography?.mood || 'Professional';

        styleInstruction = `
\n【DESIGN INSTRUCTION - STRICTLY FOLLOW】
Reference Design Vibe: ${vibe}
Colors: Primary=${primaryColor}, Background=${bgColor}
Style: ${description}
Mood: ${mood}
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

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { businessInfo } = body;

        if (!businessInfo) {
            return NextResponse.json({
                error: 'ビジネス情報が入力されていません。フォームに必要事項を入力してください。'
            }, { status: 400 });
        }

        // Validate business info
        const validation = validateRequest(businessInfoSchema, businessInfo);
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error,
                details: validation.details
            }, { status: 400 });
        }

        const GOOGLE_API_KEY = await getGoogleApiKeyForUser(user.id);
        if (!GOOGLE_API_KEY) {
            return NextResponse.json({
                error: 'Google API key is not configured. 設定画面でAPIキーを設定してください。'
            }, { status: 500 });
        }

        // Prepare Prompt with enriched business info
        const enrichedInfo = enrichBusinessInfo(businessInfo);
        prompt = fillPromptTemplate(FULL_LP_PROMPT, enrichedInfo);

        // Design Definition Injection (with safe property access)
        const designDefinition = body.designDefinition;
        if (designDefinition && typeof designDefinition === 'object') {
            const vibe = designDefinition.vibe || 'Modern';
            const description = designDefinition.description || '';
            const primaryColor = designDefinition.colorPalette?.primary || '#3b82f6';
            const secondaryColor = designDefinition.colorPalette?.secondary || '#6366f1';
            const bgColor = designDefinition.colorPalette?.background || '#ffffff';
            const typographyStyle = designDefinition.typography?.style || 'Sans-Serif';
            const typographyMood = designDefinition.typography?.mood || 'Modern';
            const layoutStyle = designDefinition.layout?.style || 'Standard';
            const layoutDensity = designDefinition.layout?.density || 'Medium';

            prompt += `\n\n【IMPORTANT: DESIGN INSTRUCTION】
You MUST strictly follow the "Design Definition" below for the visual style, color palette, and component structure.
The user wants to REPLICATE the design style of a specific reference image.

<Design Definition>
- Vibe: ${vibe}
- Description: ${description}
- Color Palette: Primary=${primaryColor}, Secondary=${secondaryColor}, Background=${bgColor}
- Typography: ${typographyStyle} (${typographyMood})
- Layout: ${layoutStyle} (Density: ${layoutDensity})
</Design Definition>

Use these colors and styles in your Tailwind classes.
For example, if the background is dark, use 'bg-slate-900' or similar.
If the layout is 'Hero-focused', ensure the Hero section is dominant.
`;
        }


        // Call Gemini API for text content (using user's API key)
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await textModel.generateContent([
            { text: SYSTEM_PROMPT },
            { text: prompt }
        ]);
        const response = await result.response;
        const text = response.text();

        log.info("Gemini text content generated successfully");

        // Parse Response - より堅牢なJSONパース
        let generatedData;
        try {
            let jsonString = text.trim();

            // マークダウンコードブロックを削除（複数パターン対応）
            // パターン1: ```json ... ```
            const jsonBlockMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                jsonString = jsonBlockMatch[1];
            } else {
                // パターン2: ``` ... ```
                const codeBlockMatch = jsonString.match(/```\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonString = codeBlockMatch[1];
                } else {
                    // パターン3: 先頭/末尾の```を除去
                    jsonString = jsonString.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
                }
            }

            // JSONオブジェクトを抽出（先頭の{から最後の}まで）
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
            }

            generatedData = JSON.parse(jsonString);

            // 必須フィールドの検証
            if (!generatedData.sections || !Array.isArray(generatedData.sections)) {
                throw new Error('Invalid response structure: sections array is missing');
            }
        } catch (e: any) {
            log.error("JSON Parse Error - AI response was not valid JSON");
            log.error(`Raw Text: ${text.substring(0, 500)}`);
            log.error(`Parse Error: ${e.message}`);
            return NextResponse.json({
                error: 'AIからの応答を処理できませんでした。もう一度お試しください。問題が続く場合は、入力内容を簡潔にしてみてください。'
            }, { status: 500 });
        }

        // 各セクションの画像を並列生成（高速化）
        const sections = generatedData.sections || [];
        const sectionCount = sections.length;
        log.info(`========== Starting PARALLEL image generation for ${sectionCount} sections ==========`);

        // 並列で画像生成を実行（Promise.allSettledで全て完了を待つ）
        const imageGenerationPromises = sections.map((section: any, index: number) => {
            // 各リクエストに少しずつ遅延を入れてレート制限を回避（0ms, 500ms, 1000ms, ...）
            const delay = index * 500;
            return new Promise<{ section: any; imageId: number | null }>(async (resolve) => {
                await new Promise(r => setTimeout(r, delay));
                log.progress(`Processing section: ${section.type}`);

                const imageId = await generateSectionImage(
                    section.type,
                    businessInfo,
                    GOOGLE_API_KEY,
                    user.id,
                    3, // maxRetries
                    body.designDefinition // Pass Design Definition
                );

                resolve({
                    section,
                    imageId,
                });
            });
        });

        const results = await Promise.allSettled(imageGenerationPromises);

        // 結果を整理
        const sectionsWithImages = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                const { section, imageId } = result.value;
                return {
                    ...section,
                    imageId: imageId,
                    properties: section.data || section.properties || {},
                };
            } else {
                // Promise rejected（通常は起きないが念のため）
                log.error(`Section ${index} failed: ${result.reason}`);
                return {
                    ...sections[index],
                    imageId: null,
                    properties: sections[index].data || sections[index].properties || {},
                };
            }
        });

        // 結果サマリー
        const successCount = sectionsWithImages.filter(s => s.imageId).length;
        const failCount = sectionsWithImages.filter(s => !s.imageId).length;

        log.info(`========== Image generation complete ==========`);
        log.success(`Successfully generated: ${successCount}/${sectionsWithImages.length} sections (parallel)`);
        if (failCount > 0) {
            log.warn(`Failed to generate: ${failCount} sections`);
        }

        // ログ記録（テキスト生成）
        await logGeneration({
            userId: user.id,
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
                userId: user.id,
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
            userId: user.id,
            type: 'lp-generate',
            endpoint: '/api/lp-builder/generate',
            model: 'gemini-1.5-flash',
            inputPrompt: prompt || 'Error before prompt',
            status: 'failed',
            errorMessage: error.message,
            startTime
        });

        // ユーザーフレンドリーなエラーメッセージを生成
        let userMessage = 'LP生成中にエラーが発生しました。';

        if (error.message?.includes('API key')) {
            userMessage = 'APIキーに問題があります。設定画面でAPIキーを確認してください。';
        } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
            userMessage = 'API利用上限に達しました。しばらく待ってから再試行してください。';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            userMessage = 'ネットワークエラーが発生しました。接続を確認して再試行してください。';
        } else if (error.message?.includes('timeout')) {
            userMessage = '処理がタイムアウトしました。もう一度お試しください。';
        } else {
            userMessage = 'LP生成中に予期せぬエラーが発生しました。もう一度お試しください。問題が続く場合はサポートにご連絡ください。';
        }

        return NextResponse.json({
            error: userMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
