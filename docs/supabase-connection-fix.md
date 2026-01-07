# Supabase データベース接続エラー修正記録

## 発生日
2026年1月7日

## エラー内容
```
Error: P1001: Can't reach database server at `db.jqpavdhxvmvuhwrbnosd.supabase.co:5432`
```

Prisma db push実行時にデータベースに接続できないエラーが発生。

## 原因
**IPv4互換性の問題**

Supabaseは現在、デフォルトでIPv6接続を使用しています。Direct Connection（直接接続）はIPv6ネットワークからのみ接続可能で、IPv4ネットワークからは接続できません。

Supabaseダッシュボードに「Not IPv4 compatible」という警告が表示されていました。

## 解決方法

### Direct Connection（動かなかった）
```
postgresql://postgres:[PASSWORD]@db.jqpavdhxvmvuhwrbnosd.supabase.co:5432/postgres
```

### Session Pooler接続（解決策）
```
postgresql://postgres.jqpavdhxvmvuhwrbnosd:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

## 変更点
`.env`ファイルの`DATABASE_URL`と`DIRECT_URL`を、Direct ConnectionからSession Pooler接続に変更。

## Session Poolerの特徴
- IPv4ネットワークから無料で接続可能
- Supabaseが提供するプロキシ経由で接続
- 接続ホストが `db.xxx.supabase.co` から `aws-1-ap-south-1.pooler.supabase.com` に変わる
- ユーザー名が `postgres` から `postgres.jqpavdhxvmvuhwrbnosd` に変わる

## 確認方法
Supabaseダッシュボード → Connect → Method で「Session pooler」を選択すると、IPv4互換の接続文字列が表示される。

## 参考
- Supabase公式ドキュメント: https://supabase.com/docs/guides/database/connecting-to-postgres
