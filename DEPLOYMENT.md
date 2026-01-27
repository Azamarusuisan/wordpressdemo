# Deployment Guide - Render & GitHub Actions

Renderへの自動デプロイ設定ガイド

## 📋 目次

1. [Renderの初期設定](#renderの初期設定)
2. [GitHub Actionsの設定](#github-actionsの設定)
3. [手動デプロイ方法](#手動デプロイ方法)
4. [トラブルシューティング](#トラブルシューティング)

---

## 🚀 Renderの初期設定

### 1. Renderアカウント作成

1. [Render.com](https://render.com) でアカウント作成
2. GitHubアカウントと連携

### 2. 新規Webサービス作成

#### ダッシュボードから:
1. **New +** → **Web Service** をクリック
2. GitHubリポジトリ `kazujp225/wordpressdemo` を選択
3. 以下の設定を入力:

```yaml
Name: lp-builder (または任意の名前)
Region: Singapore (推奨) または Tokyo
Branch: main
Runtime: Node
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm run start
Plan: Free (または Starter)
```

### 3. 環境変数の設定

Render Dashboard → Environment で以下を設定:

#### 必須の環境変数

```bash
# Node環境
NODE_ENV=production

# データベース (Supabase Postgres)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# アプリURL
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXT_PUBLIC_BASE_URL=https://your-app.onrender.com

# 認証
INVITE_PASSWORD=your_secure_password

# Render API (デプロイ用)
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=your_service_id

# GitHub (オプション)
GITHUB_TOKEN=your_github_token
GITHUB_DEPLOY_OWNER=kazujp225
```

#### 環境変数の取得方法

**Render API Key:**
1. Render Dashboard → Account Settings → API Keys
2. "Create API Key" をクリック
3. `RENDER_API_KEY` として保存

**Render Service ID:**
1. デプロイしたサービスのダッシュボードを開く
2. URLから Service ID を取得: `https://dashboard.render.com/web/srv-xxxxxxxxx`
3. `srv-xxxxxxxxx` 部分が Service ID

### 4. 自動デプロイ設定

Render Dashboard → Settings → Build & Deploy:

- **Auto-Deploy**: `Yes` (推奨)
- **Branch**: `main`

これで `main` ブランチへのpush時に自動デプロイされます。

---

## 🤖 GitHub Actionsの設定

より高度な制御が必要な場合、GitHub Actionsを使用します。

### 1. GitHub Secretsの設定

1. GitHubリポジトリ → Settings → Secrets and variables → Actions
2. **New repository secret** で以下を追加:

```
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RENDER_API_KEY
RENDER_SERVICE_ID
```

### 2. GitHub Actionsワークフローの有効化

ワークフローファイルは既に作成済み: `.github/workflows/deploy-to-render.yml`

**自動トリガー:**
- `main` ブランチへのpushで自動実行

**手動トリガー:**
1. GitHub → Actions タブ
2. "Deploy to Render" を選択
3. "Run workflow" をクリック

### 3. デプロイフロー

```
git push origin main
    ↓
GitHub Actions実行
    ↓
ビルド検証 (npm ci, prisma generate, npm run build)
    ↓
Render API呼び出し
    ↓
Renderでデプロイ開始
    ↓
完了通知
```

---

## 🛠️ 手動デプロイ方法

### ローカルからの手動デプロイ

#### 前提条件
環境変数を設定:
```bash
export RENDER_API_KEY=your_api_key
export RENDER_SERVICE_ID=srv-xxxxxxxxx
```

#### デプロイコマンド
```bash
npm run deploy:render
```

#### 出力例
```
🚀 Triggering deployment to Render...
   Service ID: srv-xxxxxxxxx

📊 Fetching service information...
   Name: lp-builder
   Type: web
   Region: singapore
   Branch: main

✅ Deployment triggered successfully!
   Deploy ID: dep-xxxxxxxxx
   Service: lp-builder
   Status: pending

🔗 View deployment: https://dashboard.render.com/web/srv-xxxxxxxxx
```

### Render Dashboardからの手動デプロイ

1. Render Dashboard → サービス選択
2. **Manual Deploy** → **Deploy latest commit**
3. デプロイログをリアルタイムで確認

---

## 🐛 トラブルシューティング

### デプロイが失敗する

#### 1. ビルドエラー
```bash
# ローカルでビルドをテスト
npm ci
npx prisma generate
npm run build
```

エラーが出る場合:
- `prisma/schema.prisma` の確認
- 環境変数の確認
- `package.json` の依存関係を確認

#### 2. データベース接続エラー
```
Error: Can't reach database server
```

対処法:
- `DATABASE_URL` と `DIRECT_URL` が正しいか確認
- Supabaseのデータベースが起動しているか確認
- Renderの IP アドレスがSupabase側で許可されているか確認

#### 3. API Key エラー
```
Error: GOOGLE_GENERATIVE_AI_API_KEY not configured
```

対処法:
- Render Dashboard → Environment で環境変数を確認
- 値にスペースや改行が入っていないか確認
- API Keyが有効か確認

### GitHub Actionsが失敗する

#### Secretsの確認
```bash
# GitHub Secrets が正しく設定されているか確認
cat .github/workflows/deploy-to-render.yml
```

以下のSecretsが必要:
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### ワークフローログの確認
1. GitHub → Actions タブ
2. 失敗したワークフローをクリック
3. エラーメッセージを確認

### デプロイは成功するがアプリが動かない

#### ヘルスチェック失敗
```
Service health check failed
```

対処法:
1. Renderの Logs タブでエラーを確認
2. `healthCheckPath: /` が正常に応答するか確認
3. `npm run start` がローカルで動作するか確認

#### ランタイムエラー
```bash
# Renderのログを確認
# Render Dashboard → Logs タブ
```

よくある原因:
- 環境変数の不足
- データベース接続の問題
- 外部APIの認証エラー

---

## 📊 デプロイ方式の比較

| 方式 | 自動化 | ビルド検証 | 使用ケース |
|------|--------|------------|------------|
| **Render Auto-Deploy** | ✅ 完全自動 | ❌ なし | 本番環境・最もシンプル |
| **GitHub Actions** | ✅ 完全自動 | ✅ あり | 品質管理が必要な場合 |
| **手動デプロイ** | ❌ 手動 | ❌ なし | 緊急時・テスト環境 |

### 推奨構成

**本番環境:**
- Render Auto-Deploy (main ブランチ)
- GitHub Actions でビルド検証

**開発環境:**
- 手動デプロイ
- または develop ブランチでの Auto-Deploy

---

## 🔒 セキュリティのベストプラクティス

1. **API Keyの管理**
   - 絶対にコードにハードコードしない
   - 環境変数またはSecrets Managerを使用
   - 定期的にローテーション

2. **Render API Key**
   - Read/Write権限を最小限に
   - チームメンバーごとに個別のKeyを発行

3. **環境変数**
   - 本番とステージングで異なる値を使用
   - `.env` ファイルは `.gitignore` に追加

4. **GitHub Secrets**
   - Organization Secretsの利用を検討
   - 不要なSecretは削除

---

## 🎯 まとめ

### クイックスタート手順

1. ✅ Renderでサービス作成
2. ✅ 環境変数を設定
3. ✅ Auto-Deployを有効化
4. ✅ GitHub Secretsを設定（オプション）
5. ✅ `main` ブランチにpush → 自動デプロイ

### サポート

問題が解決しない場合:
- [Render Docs](https://render.com/docs)
- [GitHub Actions Docs](https://docs.github.com/actions)
- プロジェクトのREADME.mdを参照
