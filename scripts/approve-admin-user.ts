/**
 * 管理者ユーザーを承認済みにするスクリプト
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filePath: string) {
  try {
    const envPath = path.resolve(process.cwd(), filePath);
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (e) {
    // ファイルがない場合は無視
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function approveAdminUser() {
  const userId = 'b71211ce-9f6c-4462-8ef0-2d2127692f12';
  const email = 'team@ettai.co.jp';

  console.log(`\nユーザーを承認済みにしています...`);
  console.log(`User ID: ${userId}`);

  // UserSettingsを作成または更新
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('UserSettings')
    .upsert({
      userId,
      email,
      plan: 'pro',
      isApproved: true,
      approvedAt: now,
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    }, {
      onConflict: 'userId'
    })
    .select();

  if (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }

  console.log('\n管理者ユーザーを承認しました:');
  console.log(data);
}

approveAdminUser();
