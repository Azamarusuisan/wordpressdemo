import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'secret';
const key = new TextEncoder().encode(SECRET_KEY);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch {
        return null; // Invalid token
    }
}

export async function login(formData: FormData) {
    // Verify credentials
    // For MVP, we check a hardcoded or DB admin. 
    // implementation_plan says "Simple hashed or plain for MVP".
    // Let's use a simple lookup or environment variable for admin password first, 
    // or verify against DB Admin table if we seeded it.

    // We'll implemented the logic in the route mostly, this lib handles token.

    // Create the session
    const user = { username: 'admin' };
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const session = await encrypt({ user, expires });

    // Save the session in a cookie
    const cookieStore = await cookies();
    cookieStore.set('session', session, { expires, httpOnly: true, path: '/' });
}

export async function logout() {
    // Destroy the session
    const cookieStore = await cookies();
    cookieStore.set('session', '', { expires: new Date(0), path: '/' });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    if (!session) return; // No session
    // Refresh logic if needed
    const parsed = await decrypt(session);
    if (!parsed) return;

    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
        name: 'session',
        value: await encrypt(parsed),
        httpOnly: true,
        expires: parsed.expires,
    });
    return res;
}
