import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    // Mock AI response
    // Input: { images: [{filename: '...', width: ...}] }
    const body = await request.json();

    // Simple heuristic or random for MVP demo
    const structure = body.images.map((img: any, index: number) => {
        let role = 'solution';
        const lower = img.filename?.toLowerCase() || '';
        if (index === 0) role = 'hero';
        else if (lower.includes('problem')) role = 'problem';
        else if (lower.includes('price')) role = 'pricing';
        else if (lower.includes('faq')) role = 'faq';

        return { ...img, role };
    });

    return NextResponse.json({ structure });
}
