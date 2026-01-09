import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        // ユーザー認証
        const session = await getSession();

        // 未認証の場合は空配列を返す
        if (!session) {
            return NextResponse.json([]);
        }

        // userIdがnullのメディアを現在のユーザーに紐づける（自動マイグレーション）
        await prisma.mediaImage.updateMany({
            where: { userId: null },
            data: { userId: (session.user?.username || 'anonymous') }
        });

        // ログインユーザーの画像を取得
        const media = await prisma.mediaImage.findMany({
            where: { userId: (session.user?.username || 'anonymous') },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(media);
    } catch (error) {
        console.error('Media fetch error:', error);
        // エラー時も空配列を返す（フロントエンドの.filter()エラー防止）
        return NextResponse.json([]);
    }
}
