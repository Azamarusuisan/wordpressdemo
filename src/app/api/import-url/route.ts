import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';
import { getGoogleApiKeyForUser } from '@/lib/apiKeys';
import { logGeneration, createTimer } from '@/lib/generation-logger';
import { importUrlSchema, validateRequest } from '@/lib/validations';

// カラーログ
const log = {
    info: (msg: string) => console.log(`\x1b[36m[IMPORT-URL INFO]\x1b[0m ${msg}`),
    success: (msg: string) => console.log(`\x1b[32m[IMPORT-URL SUCCESS]\x1b[0m ✓ ${msg}`),
    error: (msg: string) => console.log(`\x1b[31m[IMPORT-URL ERROR]\x1b[0m ✗ ${msg}`),
};

// スタイル定義（日本語で具体的なデザイン指示）
const STYLE_DESCRIPTIONS: Record<string, string> = {
    sampling: '元デザイン維持：色、フォント、ボタン形状、装飾など元のデザインのスタイルをそのまま維持。テキストの書き換えと軽微なレイアウト調整のみ行う',
    professional: '企業・信頼感スタイル：ネイビーブルー(#1E3A5F)と白を基調、クリーンなゴシック体、控えめなシャドウ、角丸の長方形ボタン、プロフェッショナルな印象',
    pops: 'ポップ・活気スタイル：明るいグラデーション（ピンク→オレンジ、シアン→パープル）、丸みのある形状、太字フォント、楽しいアイコン、若々しく元気な印象',
    luxury: '高級・エレガントスタイル：黒とゴールド(#D4AF37)を基調、明朝体、細くエレガントなライン、贅沢な余白、上質なテクスチャ、洗練された高級感',
    minimal: 'ミニマル・シンプルスタイル：モノクロ+単一アクセントカラー、最大限の余白、細い軽量フォント、シンプルな幾何学形状、装飾なし、禅のようなシンプルさ',
    emotional: '情熱・エネルギースタイル：暖色系（深紅#C41E3A、オレンジ）、強いコントラスト、インパクトのある大きな文字、ダイナミックな斜め要素、緊急性とエネルギー',
};

// カラースキーム定義（具体的なカラーコード付き）
const COLOR_SCHEME_DESCRIPTIONS: Record<string, string> = {
    original: '',
    blue: 'カラー変更：メイン=#3B82F6、サブ=#1E40AF、アクセント=#60A5FA、背景=#F0F9FF。すべての色をこのブルー系パレットに置き換えてください。',
    green: 'カラー変更：メイン=#22C55E、サブ=#15803D、アクセント=#86EFAC、背景=#F0FDF4。すべての色をこのグリーン系パレットに置き換えてください。',
    purple: 'カラー変更：メイン=#A855F7、サブ=#7C3AED、アクセント=#C4B5FD、背景=#FAF5FF。すべての色をこのパープル系パレットに置き換えてください。',
    orange: 'カラー変更：メイン=#F97316、サブ=#EA580C、アクセント=#FDBA74、背景=#FFF7ED。すべての色をこのオレンジ系パレットに置き換えてください。',
    monochrome: 'カラー変更：黒(#000000)、白(#FFFFFF)、グレー(#374151, #6B7280, #9CA3AF, #E5E7EB)のみ使用。他の色は禁止。',
};

// レイアウトオプション定義（具体的な数値指示付き）
const LAYOUT_DESCRIPTIONS: Record<string, string> = {
    keep: '',
    modernize: 'レイアウト調整：余白を50%増加、セクション間にゆとりを追加、大きめのマージン。モダンで開放的な印象に。',
    compact: 'レイアウト調整：余白を30%削減、要素間を詰める、スクロールなしでより多くのコンテンツを表示。情報密度を高く。',
};

// デバイスプリセット（高解像度対応）
const DEVICE_PRESETS = {
    desktop: {
        width: 1280,
        height: 800,
        deviceScaleFactor: 2,
        isMobile: false,
        userAgent: undefined
    },
    mobile: {
        width: 375,
        height: 812,
        deviceScaleFactor: 3,
        isMobile: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    }
};

// デザインオプションの型定義
interface DesignOptions {
    style: string;
    colorScheme?: string;
    layoutOption?: string;
    customPrompt?: string;
}

// AI画像変換処理
async function processImageWithAI(
    imageBuffer: Buffer,
    importMode: 'light' | 'heavy',
    designOptions: DesignOptions,
    segmentIndex: number,
    totalSegments: number,
    apiKey: string,
    userId: string | null
): Promise<Buffer | null> {
    const startTime = createTimer();
    const { style, colorScheme, layoutOption, customPrompt } = designOptions;
    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.professional;
    const colorDesc = colorScheme ? COLOR_SCHEME_DESCRIPTIONS[colorScheme] || '' : '';
    // lightモードではレイアウト固定なのでlayoutOptionは無視
    const layoutDesc = (importMode === 'heavy' && layoutOption) ? LAYOUT_DESCRIPTIONS[layoutOption] || '' : '';

    // カスタムプロンプトとオプションを組み合わせる
    const additionalInstructions = [
        colorDesc,
        layoutDesc,
        customPrompt ? `ユーザー指示：${customPrompt}` : ''
    ].filter(Boolean).join('\n');

    // セグメント位置と役割の定義（セグメント独立処理のため詳細に）
    const segmentInfo = segmentIndex === 0
        ? { position: 'ヘッダー・ヒーローセクション', role: 'ナビゲーション、ロゴ、メインビジュアル、キャッチコピーを含む最重要セクション' }
        : segmentIndex === totalSegments - 1
        ? { position: 'フッターセクション', role: 'CTA、問い合わせ、著作権表示などページの締めくくり' }
        : { position: `コンテンツセクション（${segmentIndex + 1}/${totalSegments}）`, role: '商品説明、特徴、お客様の声などの本文コンテンツ' };

    // samplingモードの場合は特別に厳格なプロンプト
    const isSamplingMode = style === 'sampling';

    const prompt = importMode === 'light'
        ? (isSamplingMode
            ? `この画像をほぼそのまま再現してください。

【最重要】入力画像を可能な限り忠実にコピーしてください。

【許可される変更】
- テキストの言い回しのみ微調整（例：「詳しくはこちら」→「もっと見る」）

【禁止事項】
- 色の変更禁止
- レイアウトの変更禁止
- フォントの変更禁止
- 要素の追加・削除禁止
- 背景の変更禁止

【出力】入力画像とほぼ同一の画像を出力。テキストの言い回しのみ変更可。`
            : `あなたはプロのWebデザイナーです。Webページの一部分（セグメント画像）を新しいスタイルに変換してください。

【重要】この画像はページ全体の一部分です。他のセグメントと結合されるため、以下を厳守してください。

【セグメント情報】
- 位置：${segmentInfo.position}（全${totalSegments}セグメント中）
- 役割：${segmentInfo.role}

【絶対厳守ルール】
1. 画像サイズ維持：入力画像と完全に同じ縦横比・解像度で出力する
2. レイアウト固定：要素の位置、サイズ、間隔は1ピクセルも変えない
3. 上下の端：他セグメントと繋がるため、背景色やパターンが途切れないようにする

【スタイル変更ルール】
4. 適用スタイル：${styleDesc}
5. テキスト書き換え：意味を保ち言い回しを変える（例：「今すぐ始める」→「スタートする」）
6. 色の統一：全セグメントで同じカラーパレットを使用する
7. 形状の統一：ボタンは全て同じ角丸、シャドウは同じ深さ、フォントは同じウェイト
${additionalInstructions ? `8. 追加指示：${additionalInstructions}` : ''}

【出力】入力と同じサイズの高品質なWebデザイン画像を出力。`)
        : `あなたはクリエイティブなWebデザイナーです。Webページの一部分（セグメント画像）を参考に新しいデザインを作成してください。

【重要】この画像はページ全体の一部分です。他のセグメントと結合されるため、以下を厳守してください。

【セグメント情報】
- 位置：${segmentInfo.position}（全${totalSegments}セグメント中）
- 役割：${segmentInfo.role}

【絶対厳守ルール】
1. 画像サイズ維持：入力画像と完全に同じ縦横比・解像度で出力する
2. 上下の端：他セグメントと繋がるため、背景色が途切れないようにする
3. 横幅いっぱい：左右の余白を統一し、コンテンツ幅を揃える

【デザイン変更ルール】
4. 新スタイル：${styleDesc}
5. レイアウト再構成：要素の配置は自由に変更してよいが、セクションの役割は維持
6. テキスト書き換え：意味を保ち新鮮な言い回しに変更
7. デザインシステム統一：色、フォント、ボタン形状、余白リズムを全セグメントで統一
${additionalInstructions ? `8. 追加指示：${additionalInstructions}` : ''}

【出力】入力と同じサイズの高品質なWebデザイン画像を出力。`;

    log.info(`[AI] Processing segment ${segmentIndex + 1} with ${importMode} mode, style: ${style}`);

    try {
        const base64Data = imageBuffer.toString('base64');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { inlineData: { mimeType: 'image/png', data: base64Data } },
                            { text: prompt }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE", "TEXT"],
                        // sampling: 最小、light: 低め、heavy: 創造性重視
                        temperature: isSamplingMode ? 0.1 : (importMode === 'heavy' ? 0.8 : 0.3)
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
        const parts = data.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData?.data) {
                log.success(`[AI] Segment ${segmentIndex + 1} processed successfully`);

                await logGeneration({
                    userId,
                    type: 'import-arrange',
                    endpoint: '/api/import-url',
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

        await logGeneration({
            userId,
            type: 'import-arrange',
            endpoint: '/api/import-url',
            model: 'gemini-3-pro-image-preview',
            inputPrompt: prompt,
            status: 'failed',
            errorMessage: error.message,
            startTime
        });

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

export async function POST(request: NextRequest) {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    const body = await request.json();

    // Validate input
    const validation = validateRequest(importUrlSchema, body);
    if (!validation.success) {
        return Response.json({
            error: validation.error,
            details: validation.details
        }, { status: 400 });
    }

    const {
        url,
        device = 'desktop',
        importMode = 'faithful',
        style = 'professional',
        colorScheme,
        layoutOption,
        customPrompt
    } = validation.data;

    // デザインオプションをまとめる
    const designOptions: DesignOptions = {
        style,
        colorScheme,
        layoutOption,
        customPrompt,
    };

    // ストリーミングレスポンスを返す
    return createStreamResponse(async (send) => {
        log.info(`========== Starting URL Import ==========`);
        log.info(`URL: ${url}, Mode: ${importMode}, Device: ${device}`);
        if (importMode !== 'faithful') {
            log.info(`Design Options: Style=${style}, Color=${colorScheme || 'original'}, Layout=${layoutOption || 'keep'}`);
            if (customPrompt) {
                log.info(`Custom Prompt: ${customPrompt.substring(0, 100)}${customPrompt.length > 100 ? '...' : ''}`);
            }
        }

        send({ type: 'progress', step: 'init', message: 'インポートを開始しています...' });

        const deviceConfig = DEVICE_PRESETS[device as keyof typeof DEVICE_PRESETS] || DEVICE_PRESETS.desktop;

        // 1. Launch Puppeteer
        send({ type: 'progress', step: 'browser', message: 'ブラウザを起動中...' });
        log.info('Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        await page.setViewport({
            width: deviceConfig.width,
            height: deviceConfig.height,
            deviceScaleFactor: deviceConfig.deviceScaleFactor,
            isMobile: deviceConfig.isMobile,
            hasTouch: deviceConfig.isMobile
        });

        if (deviceConfig.userAgent) {
            await page.setUserAgent(deviceConfig.userAgent);
        }

        // Navigate to URL
        send({ type: 'progress', step: 'navigate', message: 'ページを読み込み中...' });
        log.info('Navigating to URL...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Scroll to trigger lazy loading
        send({ type: 'progress', step: 'scroll', message: 'コンテンツを読み込み中...' });
        for (let pass = 0; pass < 3; pass++) {
            log.info(`Scroll pass ${pass + 1}/3 starting...`);

            await page.evaluate(async () => {
                const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
                const scrollStep = 300;

                let maxScroll = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                );

                for (let y = 0; y < maxScroll; y += scrollStep) {
                    window.scrollTo(0, y);
                    await delay(50);

                    const newHeight = Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight
                    );
                    if (newHeight > maxScroll) maxScroll = newHeight;
                }

                window.scrollTo(0, maxScroll);
                await delay(300);
            });

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Remove popups
        log.info('Removing popups...');
        await page.evaluate(() => {
            const modalSelectors = [
                '[class*="modal"]', '[class*="Modal"]', '[class*="popup"]', '[class*="Popup"]',
                '[class*="overlay"]', '[class*="Overlay"]', '[class*="dialog"]', '[class*="Dialog"]',
                '[class*="lightbox"]', '[class*="cookie"]', '[class*="Cookie"]', '[class*="banner"]',
                '[class*="consent"]', '[class*="gdpr"]', '[class*="newsletter"]', '[class*="subscribe"]',
                '[class*="notification"]', '[id*="modal"]', '[id*="popup"]', '[id*="overlay"]',
                '[id*="cookie"]', '[id*="dialog"]', '[role="dialog"]', '[role="alertdialog"]',
                'div[style*="position: fixed"]', 'div[style*="position:fixed"]',
            ];

            modalSelectors.forEach(selector => {
                try {
                    document.querySelectorAll(selector).forEach(el => {
                        const element = el as HTMLElement;
                        const rect = element.getBoundingClientRect();
                        const computedStyle = window.getComputedStyle(element);
                        const isHeader = rect.top < 100 && rect.height < 150;
                        const isNav = element.tagName === 'NAV' || element.tagName === 'HEADER';
                        const zIndex = parseInt(computedStyle.zIndex) || 0;
                        const isHighZIndex = zIndex > 100;
                        const coversScreen = rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5;

                        if (!isHeader && !isNav && (isHighZIndex || coversScreen)) {
                            element.remove();
                        }
                    });
                } catch (e) { }
            });

            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Fix fixed/sticky elements for proper fullPage screenshot
        log.info('Converting fixed/sticky elements to static...');
        await page.evaluate(() => {
            // Convert fixed/sticky elements to static to prevent them from repeating in fullPage screenshot
            const fixedElements = document.querySelectorAll('*');
            fixedElements.forEach(el => {
                const element = el as HTMLElement;
                const computedStyle = window.getComputedStyle(element);
                const position = computedStyle.position;

                if (position === 'fixed' || position === 'sticky') {
                    const rect = element.getBoundingClientRect();
                    // Keep header-like elements at top, but make them static
                    if (rect.top < 200) {
                        element.style.position = 'absolute';
                        element.style.top = '0';
                    } else {
                        // For other fixed elements (like floating CTAs), convert to static
                        element.style.position = 'static';
                    }
                }
            });
        });

        await new Promise(resolve => setTimeout(resolve, 300));

        // Take screenshot
        send({ type: 'progress', step: 'screenshot', message: 'スクリーンショットを撮影中...' });
        log.info('Taking full page screenshot...');
        const fullScreenshot = await page.screenshot({ fullPage: true }) as Buffer;
        await browser.close();

        // Debug save
        const debugDir = '/tmp/import-debug';
        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
        fs.writeFileSync(path.join(debugDir, `full-${Date.now()}-${device}.png`), fullScreenshot);

        // Get metadata
        const metadata = await sharp(fullScreenshot).metadata();
        const height = metadata.height || 0;
        const width = metadata.width || 0;

        if (height === 0 || width === 0) {
            throw new Error('Screenshot failed: zero dimensions captured.');
        }

        log.info(`Screenshot dimensions: ${width}x${height}px`);

        const baseSegmentHeight = 800;
        const segmentHeight = baseSegmentHeight * deviceConfig.deviceScaleFactor;
        const numSegments = Math.ceil(height / segmentHeight);
        const createdMedia: any[] = [];

        log.info(`Segmenting into ${numSegments} parts (segmentHeight=${segmentHeight}px)...`);
        log.info(`Segment breakdown: ${Array.from({ length: numSegments }, (_, i) => `[${i}] top=${i * segmentHeight}px`).join(', ')}`);

        // Get API key if needed
        let googleApiKey: string | null = null;
        if (importMode !== 'faithful') {
            googleApiKey = await getGoogleApiKeyForUser(user?.id || null);
            if (!googleApiKey) {
                throw new Error('Google API key is not configured. アレンジモードを使用するには設定画面でAPIキーを設定してください。');
            }
            log.info(`AI processing enabled (mode: ${importMode}, style: ${style})`);
        }

        send({
            type: 'progress',
            step: 'segments',
            message: `${numSegments}個のセグメントを処理中...`,
            total: numSegments,
            current: 0
        });

        // Process each segment
        for (let i = 0; i < numSegments; i++) {
            const top = i * segmentHeight;
            const currentSegHeight = Math.min(segmentHeight, height - top);

            if (currentSegHeight <= 0) continue;

            // samplingモードはAI処理をスキップ（スクショそのまま使用）
            const shouldProcessWithAI = importMode !== 'faithful' && style !== 'sampling' && googleApiKey;

            send({
                type: 'progress',
                step: 'processing',
                message: shouldProcessWithAI
                    ? `セグメント ${i + 1}/${numSegments} をAI処理中...`
                    : `セグメント ${i + 1}/${numSegments} を保存中...`,
                total: numSegments,
                current: i + 1
            });

            log.info(`Segment ${i + 1}: extracting top=${top}, height=${currentSegHeight}`);

            let buffer = await sharp(fullScreenshot)
                .extract({ left: 0, top, width, height: currentSegHeight })
                .png()
                .toBuffer();

            // AI processing if needed (samplingモードはスキップ)
            if (shouldProcessWithAI && googleApiKey) {
                log.info(`Segment ${i + 1}: Applying AI transformation...`);
                const aiBuffer = await processImageWithAI(
                    buffer,
                    importMode as 'light' | 'heavy',
                    designOptions,
                    i,
                    numSegments,
                    googleApiKey,
                    user?.id || null
                );

                if (aiBuffer) {
                    buffer = aiBuffer;
                    log.success(`Segment ${i + 1}: AI transformation complete`);
                } else {
                    log.error(`Segment ${i + 1}: AI transformation failed, using original`);
                }
            }

            // Upload to Supabase
            const filename = `import-${Date.now()}-seg-${i}.png`;

            const { error: uploadError } = await supabase
                .storage
                .from('images')
                .upload(filename, buffer, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                log.error(`Upload error for segment ${i}: ${uploadError.message}`);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase
                .storage
                .from('images')
                .getPublicUrl(filename);

            const processedMeta = await sharp(buffer).metadata();
            const finalWidth = processedMeta.width || width;
            const finalHeight = processedMeta.height || currentSegHeight;

            const media = await prisma.mediaImage.create({
                data: {
                    filePath: publicUrl,
                    mime: 'image/png',
                    width: finalWidth,
                    height: finalHeight,
                    sourceUrl: url,
                    sourceType: importMode === 'faithful' ? 'import' : `import-${importMode}`,
                },
            });

            log.success(`Segment ${i + 1}/${numSegments} created → MediaImage ID: ${media.id} (order: ${createdMedia.length})`);
            createdMedia.push(media);
            log.info(`  → createdMedia now has ${createdMedia.length} items, IDs: [${createdMedia.map(m => m.id).join(', ')}]`);
        }

        log.info(`========== Import Complete ==========`);
        log.success(`Total segments: ${createdMedia.length}`);
        log.info(`Final media order: [${createdMedia.map((m, idx) => `${idx}:ID${m.id}`).join(', ')}]`);

        // Send final result
        send({
            type: 'complete',
            success: true,
            media: createdMedia,
            device,
            importMode,
            style
        });
    });
}
