# LP Builder - コマンド一覧

## 開発

### 開発サーバー起動
```bash
npm run dev
```
→ http://localhost:3002 でアクセス

### ビルド
```bash
npm run build
```

### 本番サーバー起動
```bash
npm start
```

### リント
```bash
npm run lint
```

## データベース (Prisma)

### マイグレーション実行 (開発)
```bash
npx prisma migrate dev --name <migration_name>
```

### マイグレーション適用 (本番)
```bash
npx prisma migrate deploy
```

### Prismaクライアント生成
```bash
npx prisma generate
```

### Prisma Studio (DBブラウザ)
```bash
npx prisma studio
```

### スキーマ同期 (DBからpull)
```bash
npx prisma db pull
```

## 本番デプロイ

### ビルドコマンド (Render/Vercel)
```bash
npm install && npx prisma migrate deploy && npm run build
```

### スタートコマンド
```bash
npm start
```

## ユーティリティスクリプト

### 赤枠修正スクリプト
```bash
npm run fix:red-border
```

## システムコマンド (macOS/Darwin)

### Git
```bash
git status
git add .
git commit -m "message"
git push
git pull
```

### ファイル操作
```bash
ls -la
find . -name "*.ts"
grep -r "pattern" src/
```
