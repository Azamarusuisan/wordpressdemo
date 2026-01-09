import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'secret';
const key = new TextEncoder().encode(SECRET_KEY);

async function verifySession(sessionToken: string) {
  try {
    const { payload } = await jwtVerify(sessionToken, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const isAuthenticated = session ? await verifySession(session) : null;

  // /admin ルートへのアクセスをチェック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      // 未認証の場合、ログインページへリダイレクト
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ログインページにアクセスしている場合、認証済みなら /admin へリダイレクト
  if (request.nextUrl.pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/'],
};
