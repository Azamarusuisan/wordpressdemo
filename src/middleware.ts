import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;

    // Check if accessing admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!session) {
            // No session, redirect to login
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Verify session
        const payload = await decrypt(session);
        if (!payload) {
            // Invalid session, redirect to login
            const response = NextResponse.redirect(new URL('/', request.url));
            response.cookies.delete('session');
            return response;
        }
    }

    // If logged in and accessing login page, redirect to admin
    if (request.nextUrl.pathname === '/') {
        if (session) {
            const payload = await decrypt(session);
            if (payload) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/'],
};
