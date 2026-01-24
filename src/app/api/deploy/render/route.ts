import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { createDeployRepo, deleteGithubRepo } from '@/lib/github-deploy';
import { createStaticSite } from '@/lib/render-api';
import { decrypt } from '@/lib/encryption';

// Simple in-memory rate limiter: max 5 deploys per user per 10 minutes
const deployRateMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = deployRateMap.get(userId) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  deployRateMap.set(userId, recent);
  return true;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'レート制限', message: 'デプロイ頻度が高すぎます。10分間に最大5回までです。' },
      { status: 429 }
    );
  }

  // Fetch user's deploy credentials from DB
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { renderApiKey: true, githubToken: true, githubDeployOwner: true },
  });

  if (!userSettings?.renderApiKey) {
    return NextResponse.json(
      { error: 'デプロイ設定が未完了です', message: 'Render APIキーが設定されていません。設定画面から設定してください。' },
      { status: 400 }
    );
  }
  if (!userSettings?.githubToken || !userSettings?.githubDeployOwner) {
    return NextResponse.json(
      { error: 'デプロイ設定が未完了です', message: 'GitHub設定が完了していません。設定画面から設定してください。' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { html, serviceName, templateType, prompt, pageId } = body;

  if (!html || !serviceName) {
    return NextResponse.json(
      { error: 'html and serviceName are required' },
      { status: 400 }
    );
  }

  // Validate service name format
  const sanitizedName = serviceName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  if (sanitizedName.length < 3) {
    return NextResponse.json(
      { error: 'サイト名は3文字以上にしてください' },
      { status: 400 }
    );
  }

  // Create unique repo name with timestamp
  const repoName = `lp-${sanitizedName}-${Date.now()}`;

  // Decrypt credentials
  const githubToken = decrypt(userSettings.githubToken);
  const githubOwner = userSettings.githubDeployOwner;
  const renderApiKey = decrypt(userSettings.renderApiKey);

  try {
    // 1. Create GitHub repository with the generated HTML (public/index.html)
    const { repoUrl, htmlUrl } = await createDeployRepo(repoName, html, {
      githubToken,
      githubOwner,
    });

    // 2. Create Render Static Site pointing to the GitHub repo
    let renderService;
    try {
      renderService = await createStaticSite({
        name: sanitizedName,
        repoUrl: repoUrl,
        apiKey: renderApiKey,
      });
    } catch (renderError: any) {
      // Cleanup: delete the orphaned GitHub repo
      try {
        await deleteGithubRepo(repoName, { githubToken, githubOwner });
      } catch (cleanupError) {
        console.error('Failed to cleanup orphaned GitHub repo:', cleanupError);
      }
      throw renderError;
    }

    // 3. Save deployment record
    const deployment = await prisma.deployment.create({
      data: {
        userId: user.id,
        pageId: pageId || null,
        serviceName: sanitizedName,
        renderServiceId: renderService.id,
        status: 'building',
        generatedHtml: html,
        templateType: templateType || null,
        prompt: prompt || null,
        githubRepoUrl: htmlUrl,
      },
    });

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        serviceName: deployment.serviceName,
        status: deployment.status,
        githubRepoUrl: htmlUrl,
        renderServiceId: renderService.id,
      },
    });
  } catch (error: any) {
    console.error('Deployment error:', error);

    // Save failed deployment record
    try {
      await prisma.deployment.create({
        data: {
          userId: user.id,
          pageId: pageId || null,
          serviceName: sanitizedName,
          status: 'failed',
          generatedHtml: html,
          templateType: templateType || null,
          prompt: prompt || null,
          errorMessage: error.message?.substring(0, 500),
        },
      });
    } catch (dbError) {
      console.error('Failed to save deployment error record:', dbError);
    }

    return NextResponse.json(
      { error: 'デプロイに失敗しました', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deployments = await prisma.deployment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      serviceName: true,
      status: true,
      siteUrl: true,
      templateType: true,
      githubRepoUrl: true,
      createdAt: true,
      errorMessage: true,
    },
  });

  return NextResponse.json({ deployments });
}
