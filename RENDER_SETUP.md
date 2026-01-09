# Render デプロイ設定ガイド

このプロジェクトを [Render](https://render.com) にデプロイするための設定詳細です。

## 1. Web Service 設定

Render ダッシュボードで **New Web Service** を作成し、以下の設定を行ってください。

| 項目 | 設定値 |
|------|--------|
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start` |

> **重要**: `npx prisma generate` が Build Command に含まれていることを確認してください。これがないとデータベースクライアントが生成されません。

## 2. 環境変数 (Environment Variables)

Render の Environment タブで以下の変数を設定してください。

| 変数名 (Key) | 説明 / 設定値の例 |
|--------------|-------------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase "Transaction Pooler" 接続文字列 (ポート 6543) |
| `DIRECT_URL` | Supabase "Session" 接続文字列 (ポート 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project API Key (`anon` / `public`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (`service_role`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI Studio (Gemini) API Key |
| `JWT_SECRET` | 認証用シークレット (ランダムな長い文字列を設定推奨) |
| `NEXT_PUBLIC_BASE_URL` | デプロイ後のURL (例: `https://your-app.onrender.com`) |

### 補足
- `DATABASE_URL` と `DIRECT_URL` は Supabase ダッシュボードの `Project Settings > Database > Connection pooler` で確認できます。
- コード内では `GOOGLE_GENERATIVE_AI_API_KEY` が使用されています (`src/lib/apiKeys.ts`参照)。`render.yaml` に記載の `GOOGLE_AI_API_KEY` ではなくこちらを設定してください。

## 3. Render.yaml 自動検知について
リポジトリ直下に `render.yaml` が含まれているため、Render が自動的に Blueprint として検出する場合があります。Blueprint を使用しても問題ありませんが、環境変数のキー名は上記 (特に `GOOGLE_GENERATIVE_AI_API_KEY`) と一致しているか確認してください。
