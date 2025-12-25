import { prisma } from '@/lib/db';
import { PagesHeader } from '@/components/admin/PagesHeader';
import { PagesContainer } from '@/components/admin/PagesContainer';

export default async function PagesPage() {
    let pages: any[] = [];
    try {
        pages = await prisma.page.findMany({
            orderBy: [
                { isFavorite: 'desc' },
                { updatedAt: 'desc' }
            ],
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    take: 1,
                    include: {
                        image: true
                    }
                }
            }
        });
    } catch (e) {
        console.error("DB connection failed", e);
    }

    // Transform data for client component
    const pagesData = pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        isFavorite: page.isFavorite ?? false,
        updatedAt: page.updatedAt.toISOString(),
        sections: page.sections?.map((section: any) => ({
            image: section.image ? { filePath: section.image.filePath } : null
        }))
    }));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PagesContainer
                initialPages={pagesData}
                headerContent={<PagesHeader />}
            />
        </div>
    );
}
