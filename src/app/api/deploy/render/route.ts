import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { createDeployRepo } from '@/lib/github-deploy';
import { createStaticSite } from '@/lib/render-api';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check required environment variables
  if (!process.env.RENDER_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error', message: 'RENDER_API_KEY is not configured' },
      { status: 500 }
    );
  }
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_DEPLOY_OWNER) {
    return NextResponse.json(
      { error: 'Server configuration error', message: 'GitHub deploy credentials are not configured' },
      { status: 500 }
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
      { error: 'Service name must be at least 3 characters' },
      { status: 400 }
    );
  }

  // Create unique repo name with timestamp
  const repoName = `lp-${sanitizedName}-${Date.now()}`;

  try {
    // 1. Create GitHub repository with the generated HTML (public/index.html)
    const { repoUrl, htmlUrl } = await createDeployRepo(repoName, html);

    // 2. Create Render Static Site pointing to the GitHub repo
    // Use htmlUrl (https://github.com/owner/repo) format for Render
    const renderService = await createStaticSite({
      name: sanitizedName,
      repoUrl: repoUrl,
    });

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
      { error: 'Deployment failed', message: error.message },
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
