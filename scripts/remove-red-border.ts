/**
 * 赤枠除去スクリプト
 *
 * 背景色統一機能のバグで生成された赤枠付き画像から赤枠を除去します。
 *
 * 使用方法:
 *   npx ts-node scripts/remove-red-border.ts <image-url-or-section-id>
 *
 * 例:
 *   npx ts-node scripts/remove-red-border.ts 1234
 *   npx ts-node scripts/remove-red-border.ts https://xxx.supabase.co/storage/v1/object/public/images/bg-unify-xxx.png
 */

import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Supabase設定（環境変数から読み込み）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const log = {
    info: (msg: string) => console.log(`\x1b[36m[RED-BORDER-FIX]\x1b[0m ${msg}`),
    success: (msg: string) => console.log(`\x1b[32m[RED-BORDER-FIX]\x1b[0m ${msg}`),
    error: (msg: string) => console.log(`\x1b[31m[RED-BORDER-FIX]\x1b[0m ${msg}`),
    warn: (msg: string) => console.log(`\x1b[33m[RED-BORDER-FIX]\x1b[0m ${msg}`),
};

/**
 * 画像に赤枠があるかチェック
 */
async function hasRedBorder(buffer: Buffer): Promise<boolean> {
    const image = sharp(buffer);
    const { width, height } = await image.metadata();

    if (!width || !height) return false;

    // 画像の生データを取得
    const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

    const channels = info.channels;

    // 上端・下端・左端・右端の数ピクセルをチェック
    const borderWidth = 6; // チェックする幅
    const redThreshold = 180; // 赤とみなすR値の閾値
    const greenBlueThreshold = 100; // G,B値の上限

    let redPixelCount = 0;
    let totalBorderPixels = 0;

    // 上端をチェック
    for (let y = 0; y < borderWidth && y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            totalBorderPixels++;
            if (r > redThreshold && g < greenBlueThreshold && b < greenBlueThreshold) {
                redPixelCount++;
            }
        }
    }

    // 下端をチェック
    for (let y = height - borderWidth; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            totalBorderPixels++;
            if (r > redThreshold && g < greenBlueThreshold && b < greenBlueThreshold) {
                redPixelCount++;
            }
        }
    }

    // 左端をチェック
    for (let y = borderWidth; y < height - borderWidth; y++) {
        for (let x = 0; x < borderWidth && x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            totalBorderPixels++;
            if (r > redThreshold && g < greenBlueThreshold && b < greenBlueThreshold) {
                redPixelCount++;
            }
        }
    }

    // 右端をチェック
    for (let y = borderWidth; y < height - borderWidth; y++) {
        for (let x = width - borderWidth; x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            totalBorderPixels++;
            if (r > redThreshold && g < greenBlueThreshold && b < greenBlueThreshold) {
                redPixelCount++;
            }
        }
    }

    const redRatio = redPixelCount / totalBorderPixels;
    log.info(`Red pixel ratio in border: ${(redRatio * 100).toFixed(2)}% (${redPixelCount}/${totalBorderPixels})`);

    // 5%以上の赤ピクセルがあれば赤枠ありと判定
    return redRatio > 0.05;
}

/**
 * 赤枠を除去（内側のピクセル色で塗りつぶし）
 */
async function removeRedBorder(buffer: Buffer): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) {
        throw new Error('Cannot get image dimensions');
    }

    // 画像の生データを取得
    const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    const newData = Buffer.from(data);

    const borderWidth = 5; // 修正する枠の幅
    const redThreshold = 180;
    const greenBlueThreshold = 100;

    // 各辺について、赤いピクセルを内側のピクセル色で置き換え

    // 上端
    for (let y = 0; y < borderWidth && y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            if (r > redThreshold && g < greenBlueThreshold && b < greenBlueThreshold) {
                // 下方向から参照色を取得
                const refY = Math.min(borderWidth + 2, height - 1);
                const refIdx = (refY * width + x) * channels;
                newData[idx] = data[refIdx];
                newData[idx + 1] = data[refIdx + 1];
                newData[idx + 2] = data[refIdx + 2];
                if (channels === 4) newData[idx + 3] = data[refIdx + 3];
            }
        }
    }

    // 下端
    for (let y = height - borderWidth; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = newData[idx];
            const g = newData[idx + 1];
            const b = newData[idx + 2];

            if (r > redThreshold && g < greenBlueThreshold && b < greenBlueThreshold) {
                // 上方向から参照色を取得
                const refY = Math.max(height - borderWidth - 3, 0);
                const refIdx = (refY * width + x) * channels;
                newData[idx] = data[refIdx];
                newData[idx + 1] = data[refIdx + 1];
                newData[idx + 2] = data[refIdx + 2];
                if (channels === 4) newData[idx + 3] = data[refIdx + 3];
            }
        }
    }

    // 左端
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < borderWidth && x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = newData[idx];
            const g = newData[idx + 1];
            const b = newData[idx + 2];

            if (r > redThreshold && g < greenBlueThreshold && b < greenBlueThreshold) {
                // 右方向から参照色を取得
                const refX = Math.min(borderWidth + 2, width - 1);
                const refIdx = (y * width + refX) * channels;
                newData[idx] = data[refIdx];
                newData[idx + 1] = data[refIdx + 1];
                newData[idx + 2] = data[refIdx + 2];
                if (channels === 4) newData[idx + 3] = data[refIdx + 3];
            }
        }
    }

    // 右端
    for (let y = 0; y < height; y++) {
        for (let x = width - borderWidth; x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = newData[idx];
            const g = newData[idx + 1];
            const b = newData[idx + 2];

            if (r > redThreshold && g < greenBlueThreshold && b < greenBlueThreshold) {
                // 左方向から参照色を取得
                const refX = Math.max(width - borderWidth - 3, 0);
                const refIdx = (y * width + refX) * channels;
                newData[idx] = data[refIdx];
                newData[idx + 1] = data[refIdx + 1];
                newData[idx + 2] = data[refIdx + 2];
                if (channels === 4) newData[idx + 3] = data[refIdx + 3];
            }
        }
    }

    // 新しい画像を生成
    return sharp(newData, {
        raw: {
            width,
            height,
            channels: channels as 1 | 2 | 3 | 4,
        }
    })
    .png()
    .toBuffer();
}

/**
 * セクションIDから画像を取得して赤枠を除去
 */
async function fixSectionById(sectionId: number): Promise<void> {
    log.info(`Fetching section ${sectionId}...`);

    const section = await prisma.pageSection.findUnique({
        where: { id: sectionId },
        include: { image: true }
    });

    if (!section) {
        log.error(`Section ${sectionId} not found`);
        return;
    }

    if (!section.image?.filePath) {
        log.error(`Section ${sectionId} has no image`);
        return;
    }

    await fixImageByUrl(section.image.filePath, section.image.id);
}

/**
 * 画像URLから赤枠を除去
 */
async function fixImageByUrl(imageUrl: string, mediaImageId?: number): Promise<void> {
    log.info(`Fetching image: ${imageUrl}`);

    // 画像をダウンロード
    const response = await fetch(imageUrl);
    if (!response.ok) {
        log.error(`Failed to fetch image: ${response.status}`);
        return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    log.info(`Image size: ${buffer.length} bytes`);

    // 赤枠チェック
    const hasRed = await hasRedBorder(buffer);
    if (!hasRed) {
        log.warn('No red border detected in this image');
        return;
    }

    log.info('Red border detected! Removing...');

    // 赤枠を除去
    const fixedBuffer = await removeRedBorder(buffer);
    log.success('Red border removed');

    // 新しいファイル名を生成
    const timestamp = Date.now();
    const newFilename = `fixed-${timestamp}.png`;

    // Supabaseにアップロード
    log.info(`Uploading fixed image as ${newFilename}...`);
    const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(newFilename, fixedBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        log.error(`Upload failed: ${uploadError.message}`);
        return;
    }

    const newImageUrl = supabase.storage.from('images').getPublicUrl(newFilename).data.publicUrl;
    log.success(`Uploaded: ${newImageUrl}`);

    // MediaImageを更新（IDが指定されている場合）
    if (mediaImageId) {
        log.info(`Updating MediaImage ${mediaImageId}...`);
        await prisma.mediaImage.update({
            where: { id: mediaImageId },
            data: { filePath: newImageUrl }
        });
        log.success(`MediaImage ${mediaImageId} updated`);
    }

    log.success('Done!');
}

/**
 * bg-unify で生成された全画像をスキャンして修正
 */
async function fixAllBgUnifyImages(): Promise<void> {
    log.info('Scanning all bg-unify generated images...');

    // bg-unifyで生成された画像を検索
    const images = await prisma.mediaImage.findMany({
        where: {
            OR: [
                { filePath: { contains: 'bg-unify-' } },
                { sourceType: 'background-unified' }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });

    log.info(`Found ${images.length} bg-unify images`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const image of images) {
        log.info(`\n--- Processing image ${image.id}: ${image.filePath} ---`);

        try {
            const response = await fetch(image.filePath);
            if (!response.ok) {
                log.error(`Failed to fetch: ${response.status}`);
                errors++;
                continue;
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            const hasRed = await hasRedBorder(buffer);

            if (!hasRed) {
                log.info('No red border, skipping');
                skipped++;
                continue;
            }

            log.info('Red border found, fixing...');
            const fixedBuffer = await removeRedBorder(buffer);

            // 新しいファイル名
            const newFilename = `fixed-${image.id}-${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(newFilename, fixedBuffer, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                log.error(`Upload failed: ${uploadError.message}`);
                errors++;
                continue;
            }

            const newImageUrl = supabase.storage.from('images').getPublicUrl(newFilename).data.publicUrl;

            await prisma.mediaImage.update({
                where: { id: image.id },
                data: { filePath: newImageUrl }
            });

            log.success(`Fixed image ${image.id}`);
            fixed++;

        } catch (err: any) {
            log.error(`Error processing image ${image.id}: ${err.message}`);
            errors++;
        }
    }

    log.info('\n========== Summary ==========');
    log.success(`Fixed: ${fixed}`);
    log.info(`Skipped (no red border): ${skipped}`);
    log.error(`Errors: ${errors}`);
}

// メイン処理
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Usage:
  npx ts-node scripts/remove-red-border.ts <section-id>
  npx ts-node scripts/remove-red-border.ts <image-url>
  npx ts-node scripts/remove-red-border.ts --all

Examples:
  npx ts-node scripts/remove-red-border.ts 1234
  npx ts-node scripts/remove-red-border.ts https://xxx.supabase.co/storage/v1/object/public/images/bg-unify-xxx.png
  npx ts-node scripts/remove-red-border.ts --all
        `);
        process.exit(0);
    }

    const input = args[0];

    try {
        if (input === '--all') {
            await fixAllBgUnifyImages();
        } else if (input.startsWith('http')) {
            await fixImageByUrl(input);
        } else if (!isNaN(parseInt(input))) {
            await fixSectionById(parseInt(input));
        } else {
            log.error(`Invalid input: ${input}`);
            process.exit(1);
        }
    } catch (err: any) {
        log.error(`Fatal error: ${err.message}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
