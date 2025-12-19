import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const id = parseInt(params.id);
    const body = await request.json();
    const { sections, headerConfig, ...rest } = body;

    await prisma.$transaction([
        prisma.pageSection.deleteMany({ where: { pageId: id } }),
        prisma.page.update({
            where: { id },
            data: {
                updatedAt: new Date(),
                headerConfig: headerConfig ? JSON.stringify(headerConfig) : undefined,
                sections: {
                    create: sections.map((sec: any, index: number) => ({
                        role: sec.role,
                        order: index,
                        imageId: sec.imageId,
                        config: sec.config ? JSON.stringify(sec.config) : null,
                    }))
                }
            }
        })
    ]);

    return NextResponse.json({ success: true });
}
