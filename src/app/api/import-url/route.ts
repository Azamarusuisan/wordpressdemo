import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 1. Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Set viewport for a standard desktop view or mobile depending on preference
        await page.setViewport({ width: 1280, height: 800 });

        // Go to URL
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 2. Take Full Page Screenshot
        const fullScreenshot = await page.screenshot({ fullPage: true });
        await browser.close();

        // 3. Segment the screenshot
        const metadata = await sharp(fullScreenshot).metadata();
        const height = metadata.height || 0;
        const width = metadata.width || 0;

        if (height === 0 || width === 0) {
            throw new Error('Screenshot failed: zero dimensions captured.');
        }

        const segmentHeight = 800;
        const numSegments = Math.ceil(height / segmentHeight);
        const createdMedia = [];

        for (let i = 0; i < numSegments; i++) {
            const top = i * segmentHeight;
            const currentSegHeight = Math.min(segmentHeight, height - top);

            // Safety check for leftover pixels
            if (currentSegHeight <= 0) continue;

            const buffer = await sharp(fullScreenshot)
                .extract({ left: 0, top, width, height: currentSegHeight })
                .png()
                .toBuffer();

            const filename = `import-${Date.now()}-seg-${i}.png`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('images')
                .upload(filename, buffer, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase
                .storage
                .from('images')
                .getPublicUrl(filename);

            const media = await prisma.mediaImage.create({
                data: {
                    filePath: publicUrl,
                    mime: 'image/png',
                    width,
                    height: currentSegHeight,
                },
            });
            createdMedia.push(media);
        }

        return NextResponse.json({ success: true, media: createdMedia });

    } catch (error: any) {
        console.error('URL Screenshot Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
