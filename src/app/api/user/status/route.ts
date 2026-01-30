import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/user/status
 * ユーザーのBAN状態とサブスクリプション状態を取得
 *
 * クライアント側でこのAPIを呼び出し、BAN/planに応じてリダイレクト処理を行う
 * これにより、Edge RuntimeでのSUPABASE_SERVICE_ROLE_KEY使用を回避
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Node.js Runtime (Prisma使用可能) でUserSettingsを取得
        const settings = await prisma.userSettings.findUnique({
            where: { userId: user.id },
            select: {
                isBanned: true,
                banReason: true,
                plan: true,
            },
        });

        const isBanned = settings?.isBanned === true;
        const plan = settings?.plan || 'free';
        const hasActiveSubscription = plan !== 'free';

        return NextResponse.json({
            userId: user.id,
            isBanned,
            banReason: isBanned ? settings?.banReason : null,
            plan,
            hasActiveSubscription,
        });
    } catch (error: any) {
        console.error('Failed to get user status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
