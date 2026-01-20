# LP Automatic Builder - Project Overview

## プロジェクト概要
AI駆動のランディングページ(LP)自動生成ツール。ビジネス情報を入力するだけで、プロフェッショナルなLPを自動生成できるSaaSアプリケーション。

## 主な機能
- **AI LP自動生成**: ワンクリックでLP全体を生成
- **セクション別画像生成**: Hero, Features, Pricing, Testimonials, FAQ, CTA等の各セクションに最適な画像をAIが生成
- **AIインペインティング**: 画像の部分編集
- **AIコピーライティング**: チャット形式でテキストを自動修正
- **ドラッグ&ドロップエディター**: dnd-kitによるセクション並び替え
- **クリッカブルエリア設定**: 画像上にボタンを配置

## 技術スタック

### フロントエンド
- Next.js 14 (App Router)
- React 18
- TypeScript (strict mode)
- Tailwind CSS 3
- Framer Motion (アニメーション)
- dnd-kit (ドラッグ&ドロップ)
- Recharts (チャート)
- Lucide React (アイコン)
- React Hook Form + Zod (フォーム・バリデーション)
- SWR (データフェッチング)

### バックエンド
- Prisma ORM (PostgreSQL)
- Supabase Auth (認証)
- Supabase Storage (画像ストレージ)

### AI/ML
- Google Gemini 3 Pro Image (画像生成メイン)
- Google Gemini 2.5 Flash (画像生成フォールバック)
- Google Gemini 1.5/2.0 Flash (テキスト生成)

## ディレクトリ構成
```
src/
├── app/           # Next.js App Router ページ・API
│   ├── admin/     # 管理画面
│   ├── api/       # APIエンドポイント
│   ├── p/[slug]/  # 公開ページ
│   └── lp-builder/# LPビルダー画面
├── components/    # Reactコンポーネント
│   ├── lp-builder/# LPビルダー用
│   ├── admin/     # 管理画面用
│   └── public/    # 公開ページ用
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ・設定
│   ├── supabase/  # Supabaseクライアント
│   ├── db.ts      # Prismaクライアント
│   └── auth.ts    # 認証ユーティリティ
└── types/         # TypeScript型定義
```

## データベース主要テーブル
- **Page**: LPページ情報
- **PageSection**: セクション情報
- **MediaImage**: 画像メタデータ
- **GenerationRun**: AI API呼び出しログ
- **UserSettings**: ユーザー設定
