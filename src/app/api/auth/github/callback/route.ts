import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

// Handle GitHub OAuth callback
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/admin/settings?error=unauthorized`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/admin/settings?error=no_code`);
  }

  // Verify CSRF state from cookie
  const stateCookie = request.cookies.get('github_oauth_state')?.value;
  if (!stateCookie) {
    return NextResponse.redirect(`${baseUrl}/admin/settings?error=invalid_state`);
  }

  let storedState: { state: string; userId: string };
  try {
    storedState = JSON.parse(stateCookie);
  } catch {
    return NextResponse.redirect(`${baseUrl}/admin/settings?error=invalid_state`);
  }

  // Verify state token matches and user ID matches
  if (!state || state !== storedState.state || storedState.userId !== user.id) {
    return NextResponse.redirect(`${baseUrl}/admin/settings?error=invalid_state`);
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/admin/settings?error=not_configured`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('GitHub OAuth error:', tokenData);
      return NextResponse.redirect(`${baseUrl}/admin/settings?error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Fetch GitHub user info to get username
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/admin/settings?error=user_fetch_failed`);
    }

    const githubUser = await userResponse.json();

    // Encrypt token before saving
    const encryptedToken = encrypt(accessToken);

    // Save token and username to user settings
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        githubToken: encryptedToken,
        githubDeployOwner: githubUser.login,
      },
      create: {
        userId: user.id,
        email: user.email || null,
        plan: 'free',
        githubToken: encryptedToken,
        githubDeployOwner: githubUser.login,
      },
    });

    // Clear the state cookie
    const response = NextResponse.redirect(`${baseUrl}/admin/settings?github=connected`);
    response.cookies.delete('github_oauth_state');
    return response;
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(`${baseUrl}/admin/settings?error=callback_failed`);
  }
}
