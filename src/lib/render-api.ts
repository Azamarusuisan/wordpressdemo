const RENDER_API_BASE = 'https://api.render.com/v1';

function getRenderHeaders(): HeadersInit {
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) {
    throw new Error('RENDER_API_KEY is not set');
  }
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export interface CreateStaticSiteParams {
  name: string;
  repoUrl: string;
  branch?: string;
}

export interface RenderService {
  id: string;
  name: string;
  status: string;
  serviceDetails?: {
    url?: string;
  };
}

// Fetch the Render account owner ID (required for service creation)
async function getOwnerId(): Promise<string> {
  const response = await fetch(`${RENDER_API_BASE}/owners?limit=1`, {
    method: 'GET',
    headers: getRenderHeaders(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch Render owner: ${response.status} - ${errorBody}`);
  }

  const owners = await response.json();
  if (!owners || owners.length === 0) {
    throw new Error('No Render owner found for this API key');
  }

  return owners[0].owner.id;
}

// Create a Static Site on Render (free tier)
export async function createStaticSite(params: CreateStaticSiteParams): Promise<RenderService> {
  const { name, repoUrl, branch = 'main' } = params;

  const ownerId = await getOwnerId();

  const response = await fetch(`${RENDER_API_BASE}/services`, {
    method: 'POST',
    headers: getRenderHeaders(),
    body: JSON.stringify({
      type: 'static_site',
      name,
      ownerId,
      repo: repoUrl,
      autoDeploy: 'yes',
      branch,
      serviceDetails: {
        publishPath: './public',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Render API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return {
    id: data.service.id,
    name: data.service.name,
    status: 'building',
    serviceDetails: data.service.serviceDetails,
  };
}

// Legacy alias for backward compatibility
export async function createWebService(params: CreateStaticSiteParams): Promise<RenderService> {
  return createStaticSite(params);
}

export async function getServiceStatus(serviceId: string): Promise<{ status: string; url?: string }> {
  const response = await fetch(`${RENDER_API_BASE}/services/${serviceId}`, {
    method: 'GET',
    headers: getRenderHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Render API error: ${response.status}`);
  }

  const data = await response.json();

  // Check latest deploy status
  const deploysResponse = await fetch(`${RENDER_API_BASE}/services/${serviceId}/deploys?limit=1`, {
    method: 'GET',
    headers: getRenderHeaders(),
  });

  let deployStatus = 'unknown';
  if (deploysResponse.ok) {
    const deploys = await deploysResponse.json();
    if (deploys.length > 0) {
      const latestDeploy = deploys[0].deploy;
      deployStatus = latestDeploy.status;
    }
  }

  // Static sites use serviceDetails.url for the URL
  const url = data.serviceDetails?.url
    ? (data.serviceDetails.url.startsWith('http') ? data.serviceDetails.url : `https://${data.serviceDetails.url}`)
    : undefined;

  let status: string;
  if (deployStatus === 'live') {
    status = 'live';
  } else if (deployStatus === 'build_failed' || deployStatus === 'update_failed' || deployStatus === 'pre_deploy_failed') {
    status = 'failed';
  } else if (deployStatus === 'build_in_progress' || deployStatus === 'update_in_progress' || deployStatus === 'pre_deploy_in_progress') {
    status = 'building';
  } else {
    status = 'pending';
  }

  return { status, url };
}

export async function triggerDeploy(serviceId: string): Promise<void> {
  const response = await fetch(`${RENDER_API_BASE}/services/${serviceId}/deploys`, {
    method: 'POST',
    headers: getRenderHeaders(),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Render API error: ${response.status}`);
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  const response = await fetch(`${RENDER_API_BASE}/services/${serviceId}`, {
    method: 'DELETE',
    headers: getRenderHeaders(),
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Render API error: ${response.status}`);
  }
}
