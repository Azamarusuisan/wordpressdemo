import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth';

// Fixed credentials
const FIXED_ID = 'ZettAI';
const FIXED_PASSWORD = 'Zettai20250722';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    // Verify fixed credentials
    if (userId !== FIXED_ID || password !== FIXED_PASSWORD) {
      return NextResponse.json(
        { error: 'IDまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // Create session
    const user = { username: userId };
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ user, expires });

    // Set session cookie
    cookies().set('session', session, {
      expires,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '認証に失敗しました' },
      { status: 500 }
    );
  }
}
