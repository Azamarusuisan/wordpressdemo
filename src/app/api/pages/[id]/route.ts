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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const id = parseInt(params.id);

    try {
        await prisma.page.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete page:', error);
        return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const id = parseInt(params.id);
    const body = await request.json();

    try {
        const page = await prisma.page.update({
            where: { id },
            data: body
        });
        return NextResponse.json({ success: true, page });
    } catch (error) {
        console.error('Failed to update page:', error);
        return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }
}
