import { NextResponse } from 'next/server';

// Legacy password-based login is deprecated.
// Use Supabase Auth instead (handled in the login page).
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please use Supabase Auth.' },
    { status: 410 } // Gone
  );
}
