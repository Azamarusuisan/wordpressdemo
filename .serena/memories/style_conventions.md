# LP Builder - コードスタイル・規約

## TypeScript

### 設定
- `strict: true` (厳格モード有効)
- `target: ES2017`
- `moduleResolution: bundler`
- パスエイリアス: `@/*` → `./src/*`

### 型定義
- 型定義は `src/types/index.ts` に集約
- インターフェースは `I` プレフィックスなし
- コンポーネントPropsは `ComponentNameProps` 形式

## React/Next.js

### ファイル命名
- コンポーネント: `PascalCase.tsx`
- ユーティリティ: `camelCase.ts`
- API Route: `route.ts`
- ページ: `page.tsx`
- レイアウト: `layout.tsx`

### コンポーネント構造
- App Router使用
- サーバーコンポーネントがデフォルト
- クライアントコンポーネントには `"use client"` ディレクティブ

### インポート順序
1. React/Next.js
2. 外部ライブラリ
3. 内部モジュール (`@/...`)
4. 型定義
5. スタイル

## スタイリング

### Tailwind CSS
- ユーティリティクラス優先
- カスタムクラスは最小限
- レスポンシブ: `sm:`, `md:`, `lg:`, `xl:`

### カラーパレット
- Primary: blue系 (`blue-500`, `blue-600`)
- Secondary: gray系
- Accent: 各テンプレートで異なる

## ESLint

### 設定
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`
- 厳格なTypeScript型チェック

## Prisma

### スキーマ規約
- モデル名: PascalCase単数形 (`Page`, `MediaImage`)
- フィールド名: camelCase
- リレーション: 明示的な命名 (`@relation("名前")`)

## フォーム

### React Hook Form + Zod
- スキーマ定義にZod使用
- バリデーションはスキーマレベルで実装
