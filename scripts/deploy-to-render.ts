#!/usr/bin/env ts-node

/**
 * Render Deploy Script
 *
 * Renderへ手動デプロイするためのCLIツール
 *
 * 使用方法:
 *   npm run deploy:render
 *   または
 *   npx ts-node scripts/deploy-to-render.ts
 *
 * 必要な環境変数:
 *   RENDER_API_KEY - RenderのAPIキー
 *   RENDER_SERVICE_ID - デプロイ対象のサービスID
 */

import * as https from 'https';

interface DeployResponse {
  id: string;
  service: {
    id: string;
    name: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RenderError {
  message: string;
  code?: string;
}

const RENDER_API_KEY = process.env.RENDER_API_KEY;
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID;

if (!RENDER_API_KEY) {
  console.error('❌ Error: RENDER_API_KEY environment variable is not set');
  console.error('   Set it with: export RENDER_API_KEY=your_api_key');
  process.exit(1);
}

if (!RENDER_SERVICE_ID) {
  console.error('❌ Error: RENDER_SERVICE_ID environment variable is not set');
  console.error('   Set it with: export RENDER_SERVICE_ID=your_service_id');
  process.exit(1);
}

async function triggerDeploy(): Promise<void> {
  console.log('🚀 Triggering deployment to Render...');
  console.log(`   Service ID: ${RENDER_SERVICE_ID}`);

  const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${RENDER_SERVICE_ID}/deploys`,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${RENDER_API_KEY}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 201) {
            const deployData: DeployResponse = JSON.parse(data);
            console.log('\n✅ Deployment triggered successfully!');
            console.log(`   Deploy ID: ${deployData.id}`);
            console.log(`   Service: ${deployData.service.name}`);
            console.log(`   Status: ${deployData.status}`);
            console.log(`\n🔗 View deployment: https://dashboard.render.com/web/${RENDER_SERVICE_ID}`);
            resolve();
          } else {
            const errorData: RenderError = JSON.parse(data);
            console.error(`\n❌ Deployment failed with status ${res.statusCode}`);
            console.error(`   Message: ${errorData.message || 'Unknown error'}`);
            reject(new Error(errorData.message || 'Deployment failed'));
          }
        } catch (error) {
          console.error('\n❌ Failed to parse response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ Request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function getServiceInfo(): Promise<void> {
  console.log('\n📊 Fetching service information...');

  const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${RENDER_SERVICE_ID}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${RENDER_API_KEY}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const serviceInfo = JSON.parse(data);
            console.log(`   Name: ${serviceInfo.name}`);
            console.log(`   Type: ${serviceInfo.type}`);
            console.log(`   Region: ${serviceInfo.region}`);
            console.log(`   Branch: ${serviceInfo.autoDeploy ? serviceInfo.branch : 'Manual deploys only'}`);
            resolve();
          } else {
            console.error(`   Failed to fetch service info (${res.statusCode})`);
            resolve(); // Don't fail the whole process
          }
        } catch {
          resolve(); // Don't fail the whole process
        }
      });
    });

    req.on('error', () => {
      resolve(); // Don't fail the whole process
    });

    req.end();
  });
}

// Main execution
(async () => {
  try {
    await getServiceInfo();
    await triggerDeploy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Deployment process failed');
    process.exit(1);
  }
})();
