import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// 管理者チェック
async function isAdmin(userId: string): Promise<boolean> {
    const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    });
    return userSettings?.role === 'admin';
}

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
    // 認証チェック
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者チェック
    if (!await isAdmin(user.id)) {
        return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    try {
        const config = await prisma.globalConfig.findUnique({
            where: { key: params.key }
        }).catch(() => null);
        return NextResponse.json(config ? JSON.parse(config.value) : null);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
    // 認証チェック
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者チェック
    if (!await isAdmin(user.id)) {
        return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const config = await prisma.globalConfig.upsert({
            where: { key: params.key },
            update: { value: JSON.stringify(body) },
            create: { key: params.key, value: JSON.stringify(body) }
        });
        return NextResponse.json({ success: true, config });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
