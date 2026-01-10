import { Resend } from 'resend';

// Resendクライアントの初期化
export const resend = new Resend(process.env.RESEND_API_KEY);

// 送信元メールアドレス（Resendで認証したドメインを使用）
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';

// 管理者メールアドレス（通知送信先）
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'team@zettai.co.jp';
