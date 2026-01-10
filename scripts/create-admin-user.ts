/**
 * Supabaseに管理者ユーザーを作成するスクリプト
 *
 * 使用方法:
 * npx ts-node scripts/create-admin-user.ts
 *
 * 環境変数が必要:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// .env.local を手動で読み込む
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('環境変数が設定されていません:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'team@ettai.co.jp';
  const password = 'Zettai20250722';

  console.log(`\n管理者ユーザーを作成中...`);
  console.log(`Email: ${email}`);

  try {
    // ユーザーを作成（メール確認をスキップ）
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認済みとして作成
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log('\nこのメールアドレスは既に登録されています。');
        console.log('パスワードを更新します...');

        // 既存ユーザーのパスワードを更新
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === email);

        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password }
          );

          if (updateError) {
            console.error('パスワード更新エラー:', updateError.message);
            process.exit(1);
          }

          console.log('\nパスワードを更新しました。');
          console.log(`User ID: ${existingUser.id}`);
        }
      } else {
        console.error('エラー:', error.message);
        process.exit(1);
      }
    } else {
      console.log('\n管理者ユーザーを作成しました:');
      console.log(`User ID: ${data.user?.id}`);
    }

    console.log('\n========================================');
    console.log('ログイン情報:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  ID: ZettAI (または zettai)`);
    console.log('========================================\n');

  } catch (err) {
    console.error('予期しないエラー:', err);
    process.exit(1);
  }
}

createAdminUser();
