import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function duplicateDataToZettAI() {
    const sourceUserId = '17b4e0d7-f5fc-4561-aeb7-518a8d9b8427';
    const targetUserId = 'ZettAI';

    console.log('Starting data duplication to ZettAI...');

    // 1. Get all pages from source user
    const pages = await prisma.page.findMany({
        where: { userId: sourceUserId },
        include: { sections: true }
    });

    console.log(`Found ${pages.length} pages to duplicate`);

    for (const page of pages) {
        // Create new slug to avoid conflict
        const newSlug = `zettai-${page.slug}`;

        // Check if already exists
        const existing = await prisma.page.findUnique({ where: { slug: newSlug } });
        if (existing) {
            console.log(`Skipping ${page.title} - already exists`);
            continue;
        }

        // Create new page
        const newPage = await prisma.page.create({
            data: {
                userId: targetUserId,
                title: page.title,
                slug: newSlug,
                status: page.status,
                templateId: page.templateId,
                headerConfig: page.headerConfig,
                formConfig: page.formConfig,
                isFavorite: page.isFavorite,
                designDefinition: page.designDefinition,
            }
        });

        console.log(`Created page: ${newPage.title} (id: ${newPage.id})`);

        // Create sections for new page
        for (const section of page.sections) {
            await prisma.pageSection.create({
                data: {
                    pageId: newPage.id,
                    order: section.order,
                    role: section.role,
                    imageId: section.imageId,
                    mobileImageId: section.mobileImageId,
                    config: section.config,
                    boundaryOffsetTop: section.boundaryOffsetTop,
                    boundaryOffsetBottom: section.boundaryOffsetBottom,
                }
            });
        }

        console.log(`  - Created ${page.sections.length} sections`);
    }

    // 2. Duplicate MediaImage (just update userId, images are shared)
    // Actually, we need to create new records to avoid ownership issues
    // For simplicity, let's just update userId for images that aren't linked to sections

    // 3. Create UserSettings for ZettAI
    const existingSettings = await prisma.userSettings.findUnique({ where: { userId: targetUserId } });
    if (!existingSettings) {
        await prisma.userSettings.create({
            data: {
                userId: targetUserId,
                email: 'zettai@lpbuilder.app',
                plan: 'premium',
            }
        });
        console.log('Created UserSettings for ZettAI');
    }

    console.log('Done!');
}

duplicateDataToZettAI()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
