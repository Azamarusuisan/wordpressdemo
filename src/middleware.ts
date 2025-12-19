import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    // Authentication disabled as per user request
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
