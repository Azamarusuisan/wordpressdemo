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

// カラーログ
const log = {
    info: (msg: string) => console.log(`\x1b[36m[IMPORT-URL INFO]\x1b[0m ${msg}`),
    success: (msg: string) => console.log(`\x1b[32m[IMPORT-URL SUCCESS]\x1b[0m ✓ ${msg}`),
    error: (msg: string) => console.log(`\x1b[31m[IMPORT-URL ERROR]\x1b[0m ✗ ${msg}`),
};

// スタイル定義
const STYLE_DESCRIPTIONS: Record<string, string> = {
    professional: 'プロフェッショナルでビジネス向けのクリーンなデザイン。信頼感のある青系カラーと整然としたレイアウト。',
    pops: '明るくポップでカラフルなデザイン。親しみやすく、若々しい印象。',
    luxury: 'ラグジュアリーで高級感のあるデザイン。ゴールド・ブラック・深い色調を使用。',
    minimal: 'シンプルでミニマルなデザイン。余白を活かした洗練されたレイアウト。',
    emotional: '情熱的でエネルギッシュなデザイン。赤やオレンジなど暖色系で力強い印象。',
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

// AI画像変換処理
async function processImageWithAI(
    imageBuffer: Buffer,
    importMode: 'light' | 'heavy',
    style: string,
    segmentIndex: number,
    apiKey: string,
    userId: string | null
): Promise<Buffer | null> {
    const startTime = createTimer();
    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.professional;

    const prompt = importMode === 'light'
        ? `This is a screenshot of a website section. Recreate this image while:
- MAINTAINING the exact same layout, structure, and composition
- KEEPING all elements in the same positions
- CHANGING only the visual style to: ${styleDesc}
- DO NOT include any text, letters, or characters
- Keep it as a website design visual

Output the modified image directly.`
        : `This is a screenshot of a website section. Use this as inspiration to create a completely NEW design:
- REFERENCE the general layout and composition concept
- CREATE a fresh, original design with style: ${styleDesc}
- DO NOT copy the original - make it unique
- DO NOT include any text, letters, or characters
- Design for a high-quality landing page visual

Output the new image directly.`;

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
                        temperature: importMode === 'heavy' ? 1.2 : 0.8
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
    const { url, device = 'desktop', importMode = 'faithful', style = 'professional' } = body;

    if (!url) {
        return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // ストリーミングレスポンスを返す
    return createStreamResponse(async (send) => {
        log.info(`========== Starting URL Import ==========`);
        log.info(`URL: ${url}, Mode: ${importMode}, Style: ${style}, Device: ${device}`);

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

            send({
                type: 'progress',
                step: 'processing',
                message: importMode !== 'faithful'
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

            // AI processing if needed
            if (importMode !== 'faithful' && googleApiKey) {
                log.info(`Segment ${i + 1}: Applying AI transformation...`);
                const aiBuffer = await processImageWithAI(
                    buffer,
                    importMode as 'light' | 'heavy',
                    style,
                    i,
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
