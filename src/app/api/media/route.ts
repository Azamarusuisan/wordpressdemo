import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const media = await prisma.mediaImage.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(media);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }
}
