# LP Builder - タスク完了時チェックリスト

## コード変更後の必須確認

### 1. TypeScript型チェック
ビルドでTypeScriptエラーがないか確認:
```bash
npm run build
```

### 2. ESLintチェック
リントエラーがないか確認:
```bash
npm run lint
```

### 3. 開発サーバーで動作確認
```bash
npm run dev
```
→ http://localhost:3002 で該当機能をテスト

## DBスキーマ変更時

### 1. マイグレーション作成
```bash
npx prisma migrate dev --name <変更内容を説明する名前>
```

### 2. Prismaクライアント再生成
```bash
npx prisma generate
```

### 3. 型定義の更新確認
`src/types/index.ts` の型が新しいスキーマと整合しているか確認

## API変更時

### 確認ポイント
- エンドポイントのレスポンス形式
- エラーハンドリング
- 認証・認可の確認
- API使用量ログ (`GenerationRun`) の記録

## コンポーネント変更時

### 確認ポイント
- デスクトップ・モバイル両方でのレスポンシブ確認
- アクセシビリティ (キーボード操作、フォーカス管理)
- エラー状態・ローディング状態の表示

## コミット前チェック

```bash
# 1. リント
npm run lint

# 2. ビルド確認
npm run build

# 3. 変更内容確認
git status
git diff
```
