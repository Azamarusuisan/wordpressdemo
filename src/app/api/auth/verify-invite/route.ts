import { NextRequest, NextResponse } from 'next/server';

// 招待パスワード（環境変数から取得、デフォルトは'Zettai'）
const INVITE_PASSWORD = process.env.INVITE_PASSWORD || 'Zettai';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ valid: false, error: '招待パスワードを入力してください' }, { status: 400 });
        }

        // 大文字小文字を区別しない比較
        const isValid = password.toLowerCase() === INVITE_PASSWORD.toLowerCase();

        if (!isValid) {
            return NextResponse.json({ valid: false, error: '招待パスワードが正しくありません' }, { status: 401 });
        }

        return NextResponse.json({ valid: true });
    } catch (error: any) {
        console.error('Invite password verification error:', error);
        return NextResponse.json({ valid: false, error: 'サーバーエラー' }, { status: 500 });
    }
}
