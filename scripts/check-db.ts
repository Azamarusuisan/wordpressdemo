import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.page.findMany({
        select: { id: true, title: true, userId: true },
        take: 10
    });
    console.log('Pages in DB (first 10):');
    pages.forEach(p => console.log(`  ID: ${p.id}, userId: "${p.userId}", title: ${p.title}`));

    const total = await prisma.page.count();
    console.log(`\nTotal: ${total} pages`);

    const zettaiCount = await prisma.page.count({ where: { userId: 'ZettAI' } });
    console.log(`Pages with userId='ZettAI': ${zettaiCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
