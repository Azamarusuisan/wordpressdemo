import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/pages (Create)
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { sections, headerConfig, ...rest } = body;

    const page = await prisma.page.create({
        data: {
            title: rest.title || 'New Page ' + new Date().toLocaleDateString(),
            slug: rest.slug || 'page-' + Date.now(),
            status: 'draft',
            headerConfig: headerConfig ? JSON.stringify(headerConfig) : '{}',
            formConfig: '{}',
            sections: {
                create: sections.map((sec: any, index: number) => ({
                    role: sec.role || 'other',
                    order: index,
                    imageId: sec.imageId,
                    config: sec.config ? JSON.stringify(sec.config) : null,
                })),
            },
        },
    });

    return NextResponse.json(page);
}
