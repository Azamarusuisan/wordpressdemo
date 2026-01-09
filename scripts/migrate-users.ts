import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting user migration to ZettAI...');

    // Update all pages to ZettAI
    const pageResult = await prisma.page.updateMany({
        where: {
            OR: [
                { userId: { not: 'ZettAI' } },
                { userId: null }
            ]
        },
        data: { userId: 'ZettAI' }
    });
    console.log(`Updated ${pageResult.count} pages`);

    // Update all media images to ZettAI
    const mediaResult = await prisma.mediaImage.updateMany({
        where: {
            OR: [
                { userId: { not: 'ZettAI' } },
                { userId: null }
            ]
        },
        data: { userId: 'ZettAI' }
    });
    console.log(`Updated ${mediaResult.count} media images`);

    // Update GenerationRun
    const genResult = await prisma.generationRun.updateMany({
        where: {
            OR: [
                { userId: { not: 'ZettAI' } },
                { userId: null }
            ]
        },
        data: { userId: 'ZettAI' }
    });
    console.log(`Updated ${genResult.count} generation runs`);

    // Update InpaintHistory
    const inpaintResult = await prisma.inpaintHistory.updateMany({
        where: {
            OR: [
                { userId: { not: 'ZettAI' } },
                { userId: null }
            ]
        },
        data: { userId: 'ZettAI' }
    });
    console.log(`Updated ${inpaintResult.count} inpaint histories`);

    // Update SectionImageHistory
    const sectionHistResult = await prisma.sectionImageHistory.updateMany({
        where: {
            OR: [
                { userId: { not: 'ZettAI' } },
                { userId: null }
            ]
        },
        data: { userId: 'ZettAI' }
    });
    console.log(`Updated ${sectionHistResult.count} section image histories`);

    // Update MediaVideo
    const videoResult = await prisma.mediaVideo.updateMany({
        where: {
            OR: [
                { userId: { not: 'ZettAI' } },
                { userId: null }
            ]
        },
        data: { userId: 'ZettAI' }
    });
    console.log(`Updated ${videoResult.count} media videos`);

    console.log('Migration completed!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
