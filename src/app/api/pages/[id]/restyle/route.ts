import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { getGoogleApiKeyForUser } from '@/lib/apiKeys';
import { logGeneration, createTimer } from '@/lib/generation-logger';
import {
    generateDesignTokens,
    tokensToPromptDescription,
} from '@/lib/design-tokens';
import { DesignTokens } from '@/types';
import { z } from 'zod';

// カラーログ
const log = {
    info: (msg: string) => console.log(`\x1b[36m[RESTYLE INFO]\x1b[0m ${msg}`),
    success: (msg: string) => console.log(`\x1b[32m[RESTYLE SUCCESS]\x1b[0m ${msg}`),
    error: (msg: string) => console.log(`\x1b[31m[RESTYLE ERROR]\x1b[0m ${msg}`),
};

// バリデーションスキーマ
const restyleSchema = z.object({
    style: z.enum(['sampling', 'professional', 'pops', 'luxury', 'minimal', 'emotional']),
    colorScheme: z.enum(['original', 'blue', 'green', 'purple', 'orange', 'monochrome']).optional(),
    layoutOption: z.enum(['keep', 'modernize', 'compact']).optional(),
    customPrompt: z.string().max(500).optional(),
    mode: z.enum(['light', 'heavy']).default('light'),
});

// スタイル定義
const STYLE_DESCRIPTIONS: Record<string, string> = {
    sampling: '元デザイン維持：色、フォント、ボタン形状、装飾など元のデザインのスタイルをそのまま維持',
    professional: '企業・信頼感スタイル：ネイビーブルー(#1E3A5F)と白を基調、クリーンなゴシック体',
    pops: 'ポップ・活気スタイル：明るいグラデーション（ピンク→オレンジ）、丸みのある形状、太字フォント',
    luxury: '高級・エレガントスタイル：黒とゴールド(#D4AF37)を基調、明朝体、細くエレガントなライン',
    minimal: 'ミニマル・シンプルスタイル：モノクロ+単一アクセントカラー、最大限の余白',
    emotional: '情熱・エネルギースタイル：暖色系（深紅#C41E3A、オレンジ）、強いコントラスト',
};

// AI画像変換処理
async function processImageWithAI(
    imageBuffer: Buffer,
    mode: 'light' | 'heavy',
    style: string,  // スタイルID（samplingモード判定用）
    styleDesc: string,
    designTokens: DesignTokens,
    segmentIndex: number,
    totalSegments: number,
    customPrompt: string,
    apiKey: string,
    userId: string | null,
    styleReferenceImage?: Buffer  // 最初のセグメントの結果を参照として渡す
): Promise<Buffer | null> {
    const startTime = createTimer();
    const tokenDescription = tokensToPromptDescription(designTokens);

    const segmentInfo = segmentIndex === 0
        ? { position: 'ヘッダー・ヒーローセクション', role: 'ナビゲーション、ロゴ、メインビジュアル' }
        : segmentIndex === totalSegments - 1
        ? { position: 'フッターセクション', role: 'CTA、問い合わせ、著作権表示' }
        : { position: `コンテンツセクション（${segmentIndex + 1}/${totalSegments}）`, role: '本文コンテンツ' };

    // 参照画像がある場合（2番目以降のセグメント）は一貫性指示を追加
    // ただしsamplingモードでは元画像の忠実な再現が目的なので、参照画像は使用しない
    const isSamplingMode = style === 'sampling';
    const hasStyleReference = !isSamplingMode && styleReferenceImage && segmentIndex > 0;
    const styleReferenceInstruction = hasStyleReference
        ? `【最重要：スタイル統一】
添付した「スタイル参照画像」は、このページの最初のセグメントです。
以下を参照画像と完全に統一してください：
- 背景色・グラデーション
- ボタンの色・形状・角丸
- フォントスタイル
- アイコンのスタイル
- シャドウの強さ
- 装飾要素のスタイル

`
        : '';

    const prompt = mode === 'light'
        ? `あなたはプロのWebデザイナーです。Webページの一部分（セグメント画像）を新しいスタイルに変換してください。

${styleReferenceInstruction}【重要】この画像はページ全体の一部分です。他のセグメントと結合されるため、以下を厳守してください。

【セグメント情報】
- 位置：${segmentInfo.position}（全${totalSegments}セグメント中）
- 役割：${segmentInfo.role}

【絶対厳守ルール】
1. 画像サイズ維持：入力画像と完全に同じ縦横比・解像度で出力する
2. レイアウト固定：要素の位置、サイズ、間隔は1ピクセルも変えない
3. 上下の端：他セグメントと繋がるため、背景色やパターンが途切れないようにする

【スタイル変更ルール】
4. 適用スタイル：${styleDesc}
5. テキスト書き換え：意味を保ち言い回しを変える

${tokenDescription}

${customPrompt ? `【ユーザー指示】${customPrompt}` : ''}

【出力】入力と同じサイズの高品質なWebデザイン画像を出力。`
        : `あなたはクリエイティブなWebデザイナーです。Webページの一部分（セグメント画像）を参考に新しいデザインを作成してください。

${styleReferenceInstruction}【セグメント情報】
- 位置：${segmentInfo.position}（全${totalSegments}セグメント中）
- 役割：${segmentInfo.role}

【絶対厳守ルール】
1. 画像サイズ維持：入力画像と完全に同じ縦横比・解像度で出力する
2. 上下の端：他セグメントと繋がるため、背景色が途切れないようにする

【デザイン変更ルール】
3. 新スタイル：${styleDesc}
4. レイアウト再構成：要素の配置は自由に変更してよいが、セクションの役割は維持

${tokenDescription}

${customPrompt ? `【ユーザー指示】${customPrompt}` : ''}

【出力】入力と同じサイズの高品質なWebデザイン画像を出力。`;

    log.info(`[AI] Processing segment ${segmentIndex + 1} with ${mode} mode${hasStyleReference ? ' (with style reference)' : ''}`);

    try {
        const base64Data = imageBuffer.toString('base64');

        // API リクエストのパーツを構築
        const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

        // 参照画像がある場合、最初に追加（スタイル参照として）
        if (hasStyleReference && styleReferenceImage) {
            const refBase64 = styleReferenceImage.toString('base64');
            parts.push({ inlineData: { mimeType: 'image/png', data: refBase64 } });
            parts.push({ text: '↑ スタイル参照画像（このスタイルに合わせてください）' });
        }

        // 処理対象の画像を追加
        parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
        parts.push({ text: hasStyleReference ? `↑ 処理対象画像\n\n${prompt}` : prompt });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE", "TEXT"],
                        // 温度設定の最適化（一貫性重視）
                        // light: 0.15（レイアウト固定、スタイルのみ変更）
                        // heavy: 0.35（デザイン変更しつつ一貫性維持）
                        // 参照画像がある場合はさらに低めに設定して一貫性を高める
                        temperature: hasStyleReference ? 0.1 : (mode === 'heavy' ? 0.35 : 0.15),
                    },
                    toolConfig: { functionCallingConfig: { mode: "NONE" } }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            log.error(`[AI] Gemini API error: ${errorText}`);
            return null;
        }

        const data = await response.json();
        const responseParts = data.candidates?.[0]?.content?.parts || [];

        for (const part of responseParts) {
            if (part.inlineData?.data) {
                log.success(`[AI] Segment ${segmentIndex + 1} processed successfully`);

                await logGeneration({
                    userId,
                    type: 'import-arrange',
                    endpoint: '/api/pages/[id]/restyle',
                    model: 'gemini-3-pro-image-preview',
                    inputPrompt: prompt,
                    imageCount: 1,
                    status: 'succeeded',
                    startTime
                });

                return Buffer.from(part.inlineData.data, 'base64');
            }
        }

        log.error(`[AI] No image data in response for segment ${segmentIndex + 1}`);
        return null;

    } catch (error: any) {
        log.error(`[AI] Error processing segment ${segmentIndex + 1}: ${error.message}`);
        return null;
    }
}

// ストリーミングレスポンス用のエンコーダー
function createStreamResponse(processFunction: (send: (data: any) => void) => Promise<void>) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                await processFunction(send);
            } catch (error: any) {
                send({ type: 'error', error: error.message });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const pageId = parseInt(id);

    if (isNaN(pageId)) {
        return Response.json({ error: 'Invalid page ID' }, { status: 400 });
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    const body = await request.json();
    const validation = restyleSchema.safeParse(body);

    if (!validation.success) {
        return Response.json({
            error: 'Validation failed',
            details: validation.error.issues
        }, { status: 400 });
    }

    const { style, colorScheme, layoutOption, customPrompt, mode } = validation.data;

    return createStreamResponse(async (send) => {
        log.info(`========== Starting Restyle for Page ${pageId} ==========`);
        log.info(`Style: ${style}, Mode: ${mode}`);

        send({ type: 'progress', step: 'init', message: 'スタイル変更を開始しています...' });

        // ページとセクションを取得
        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: {
                sections: {
                    include: { image: true },
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!page) {
            throw new Error('Page not found');
        }

        const sections = page.sections.filter(s => s.image?.filePath);
        const totalSegments = sections.length;

        if (totalSegments === 0) {
            throw new Error('No sections with images found');
        }

        log.info(`Found ${totalSegments} sections with images`);

        // API キーを取得
        const googleApiKey = await getGoogleApiKeyForUser(user?.id || null);
        if (!googleApiKey) {
            throw new Error('Google API key is not configured');
        }

        // デザイントークンを生成
        send({ type: 'progress', step: 'tokens', message: 'デザイントークンを生成中...' });
        const designTokens = generateDesignTokens(style, colorScheme, layoutOption);
        log.success(`Design tokens generated: primary=${designTokens.colors.primary}`);

        const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.professional;
        const updatedSections: any[] = [];

        // ========================================
        // 参照画像方式：最初のセグメントの結果を保存
        // 後続セグメントに渡してスタイル一貫性を確保
        // ========================================
        let firstSegmentResult: Buffer | null = null;

        // 各セクションを処理
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            send({
                type: 'progress',
                step: 'processing',
                message: `セクション ${i + 1}/${totalSegments} を処理中...${i > 0 && firstSegmentResult ? '（参照画像あり）' : ''}`,
                total: totalSegments,
                current: i + 1
            });

            log.info(`Processing section ${i + 1}: ${section.id}`);

            try {
                // 画像をダウンロード
                const imageResponse = await fetch(section.image!.filePath);
                const imageArrayBuffer = await imageResponse.arrayBuffer();
                let imageBuffer = Buffer.from(imageArrayBuffer);

                // 2番目以降のセグメントには最初のセグメントの結果を参照として渡す
                // ただしsamplingモードでは元画像の忠実な再現が目的なので、参照画像は使用しない
                const isSamplingMode = style === 'sampling';
                const styleReference = (!isSamplingMode && i > 0 && firstSegmentResult) ? firstSegmentResult : undefined;

                // AI処理
                const aiBuffer = await processImageWithAI(
                    imageBuffer,
                    mode,
                    style,  // スタイルID追加
                    styleDesc,
                    designTokens,
                    i,
                    totalSegments,
                    customPrompt || '',
                    googleApiKey,
                    user?.id || null,
                    styleReference  // 参照画像を渡す
                );

                if (aiBuffer) {
                    // 最初のセグメントの結果を保存（後続セグメントの参照用）
                    // samplingモード以外の場合のみ
                    if (i === 0 && !isSamplingMode) {
                        firstSegmentResult = aiBuffer;
                        log.success(`Section 1: Saved as style reference for subsequent sections`);
                    }
                    // 新しい画像をアップロード
                    const filename = `restyle-${Date.now()}-seg-${i}.png`;

                    const { error: uploadError } = await supabase
                        .storage
                        .from('images')
                        .upload(filename, aiBuffer, {
                            contentType: 'image/png',
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        log.error(`Upload error for section ${i}: ${uploadError.message}`);
                        throw uploadError;
                    }

                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('images')
                        .getPublicUrl(filename);

                    const processedMeta = await sharp(aiBuffer).metadata();

                    // 新しいMediaImageを作成
                    const newMedia = await prisma.mediaImage.create({
                        data: {
                            filePath: publicUrl,
                            mime: 'image/png',
                            width: processedMeta.width || section.image!.width || 0,
                            height: processedMeta.height || section.image!.height || 0,
                            sourceUrl: section.image!.filePath,
                            sourceType: `restyle-${mode}`,
                        },
                    });

                    // セクションを更新
                    await prisma.pageSection.update({
                        where: { id: section.id },
                        data: { imageId: newMedia.id },
                    });

                    updatedSections.push({
                        sectionId: section.id,
                        oldImageId: section.imageId,
                        newImageId: newMedia.id,
                        newImageUrl: publicUrl,
                    });

                    log.success(`Section ${i + 1} updated: ${section.id} -> ${newMedia.id}`);
                } else {
                    log.error(`Section ${i + 1} AI processing failed, keeping original`);
                }
            } catch (error: any) {
                log.error(`Error processing section ${i + 1}: ${error.message}`);
            }
        }

        log.info(`========== Restyle Complete ==========`);
        log.success(`Updated ${updatedSections.length} sections`);

        send({
            type: 'complete',
            success: true,
            updatedCount: updatedSections.length,
            totalCount: totalSegments,
            sections: updatedSections,
        });
    });
}
