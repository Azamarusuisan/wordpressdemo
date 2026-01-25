import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/pages/[id]/seo
 * ページのSEO/LLMOデータを取得
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const pageId = parseInt(params.id);
        if (isNaN(pageId)) {
            return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
        }

        const page = await prisma.page.findUnique({
            where: { id: pageId },
            select: { id: true, title: true, slug: true, seoData: true }
        });

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        let seoData = null;
        try {
            if (page.seoData) {
                seoData = JSON.parse(page.seoData);
            }
        } catch { }

        return NextResponse.json({
            success: true,
            pageId: page.id,
            title: page.title,
            slug: page.slug,
            seoData
        });

    } catch (error) {
        console.error('Get SEO data error:', error);
        return NextResponse.json(
            { error: 'Failed to get SEO data' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/pages/[id]/seo
 * ページのSEO/LLMOデータを更新（ステルス対策）
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const pageId = parseInt(params.id);
        if (isNaN(pageId)) {
            return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
        }

        const body = await request.json();
        const { seoData } = body;

        if (!seoData) {
            return NextResponse.json({ error: 'SEO data is required' }, { status: 400 });
        }

        // SEOデータを保存
        const updatedPage = await prisma.page.update({
            where: { id: pageId },
            data: {
                seoData: JSON.stringify(seoData)
            },
            select: { id: true, slug: true }
        });

        return NextResponse.json({
            success: true,
            message: 'SEO data saved successfully',
            pageId: updatedPage.id,
            slug: updatedPage.slug
        });

    } catch (error) {
        console.error('Save SEO data error:', error);
        return NextResponse.json(
            { error: 'Failed to save SEO data' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/pages/[id]/seo
 * ページのSEO/LLMOデータをクリア
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const pageId = parseInt(params.id);
        if (isNaN(pageId)) {
            return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
        }

        await prisma.page.update({
            where: { id: pageId },
            data: { seoData: null }
        });

        return NextResponse.json({
            success: true,
            message: 'SEO data cleared'
        });

    } catch (error) {
        console.error('Clear SEO data error:', error);
        return NextResponse.json(
            { error: 'Failed to clear SEO data' },
            { status: 500 }
        );
    }
}
