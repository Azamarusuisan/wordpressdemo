# 📚 デプロイガイド - 中学生でもできる！

このアプリをインターネット上に公開する手順を、初心者向けに説明します。

---

## 🎯 このガイドでできること

- ✅ あなたのアプリをインターネットで公開する
- ✅ 世界中の人がアクセスできるようにする
- ✅ コードを更新したら自動で反映されるようにする

**所要時間**: 約30分～1時間

---

## 📖 目次

1. [準備するもの](#準備するもの)
2. [言葉の説明](#言葉の説明)
3. [ステップ1: Renderに登録する](#ステップ1-renderに登録する)
4. [ステップ2: アプリを作る](#ステップ2-アプリを作る)
5. [ステップ3: 設定を入力する](#ステップ3-設定を入力する)
6. [ステップ4: 公開する](#ステップ4-公開する)
7. [ステップ5: 自動更新を設定する](#ステップ5-自動更新を設定する)
8. [困った時は](#困った時は)

---

## 準備するもの

始める前に、以下を用意してください：

- [ ] GitHubアカウント（このコードが保存されている場所）
- [ ] Supabaseアカウント（データベース＝データを保存する場所）
- [ ] Google AI APIキー（AI機能を使うためのパスワードのようなもの）
- [ ] メールアドレス（Render登録用）
- [ ] パソコンまたはスマホ（ブラウザが使えれば OK）

---

## 言葉の説明

このガイドで出てくる専門用語を説明します。

| 言葉 | 意味 |
|------|------|
| **デプロイ** | アプリをインターネット上に公開すること |
| **Render** | アプリを無料で公開できるサービス（家を借りるようなイメージ） |
| **環境変数** | アプリが動くために必要な設定（パスワードや接続先など） |
| **ビルド** | コードを実行できる形に変換すること |
| **サービス** | Render上で動いているあなたのアプリのこと |
| **Dashboard** | 管理画面（色々な設定ができる場所） |
| **API Key** | サービスを使うためのパスワードのようなもの |

---

## ステップ1: Renderに登録する

### 1-1. Render.comにアクセス

1. ブラウザで https://render.com を開く
2. 右上の **Sign Up**（登録）ボタンをクリック

### 1-2. GitHubで登録

1. **Sign up with GitHub** を選択
2. GitHubのログイン画面が出たらログイン
3. 「Renderに権限を与えますか？」と聞かれたら **Authorize Render** をクリック

✅ **確認**: Renderのダッシュボード（管理画面）が表示されればOK！

---

## ステップ2: アプリを作る

### 2-1. 新しいサービスを作成

1. Renderダッシュボードで **New +** ボタンをクリック
2. **Web Service** を選択

### 2-2. GitHubリポジトリを選択

1. リポジトリ一覧から `kazujp225/wordpressdemo` を探す
2. 見つからない場合は **Configure account** をクリックして、Renderにアクセス権限を与える
3. `wordpressdemo` の横にある **Connect** をクリック

### 2-3. 基本設定を入力

以下のように入力してください：

| 項目 | 入力する内容 | 説明 |
|------|------------|------|
| **Name** | `my-lp-builder`（好きな名前でOK） | あなたのアプリの名前 |
| **Region** | `Singapore` | サーバーの場所（日本に近い方が速い） |
| **Branch** | `main` | コードのどのバージョンを使うか |
| **Runtime** | `Node` | 自動で選ばれているはず |
| **Build Command** | `npm install && npx prisma generate && npm run build` | 既に入力されているはず |
| **Start Command** | `npm start` | 既に入力されているはず |

✅ **確認**: 全部入力できたら下にスクロール

⚠️ **注意**: まだ「Create Web Service」ボタンは押さないで！次のステップへ

---

## ステップ3: 設定を入力する

この部分が**一番重要**です。ゆっくり進めましょう。

### 3-1. 環境変数セクションを開く

1. 下にスクロールして **Environment Variables**（環境変数）という場所を探す
2. そこに色々な設定を入力していきます

### 3-2. 必須の設定を入力

以下の設定を**一つずつ**追加していきます。

#### ① NODE_ENV

```
Key:   NODE_ENV
Value: production
```

**意味**: 「本番環境で動かす」という設定

---

#### ② DATABASE_URL と DIRECT_URL

Supabaseから取得します。

**Supabaseでの取得方法:**
1. https://supabase.com にログイン
2. プロジェクトを選択
3. 左サイドバーの **Settings**（設定）→ **Database** をクリック
4. **Connection string** セクションを探す
5. 「URI」の右にある **Copy** をクリック

```
Key:   DATABASE_URL
Value: postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres?pgbouncer=true
```

もう一度コピーして：

```
Key:   DIRECT_URL
Value: postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres
```

⚠️ **注意**: `[YOUR-PASSWORD]` は実際のパスワードに置き換わっているはず

**意味**: データベース（データ保存場所）への接続情報

---

#### ③ Supabase URL と Key

**Supabaseでの取得方法:**
1. Supabaseプロジェクトで **Settings** → **API** をクリック
2. **Project URL** をコピー
3. **anon public** のキーをコピー

```
Key:   NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co
```

```
Key:   NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...（長い文字列）
```

**Supabase Service Role Keyも取得:**
1. 同じ画面で **service_role** の **secret** をコピー
2. ⚠️ これは絶対に他人に見せないでください！

```
Key:   SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...（別の長い文字列）
```

```
Key:   SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co（上と同じ）
```

**意味**: Supabaseに接続するための情報

---

#### ④ Google AI APIキー

**Google AI Studioでの取得方法:**
1. https://aistudio.google.com/app/apikey にアクセス
2. **Create API Key** をクリック
3. プロジェクトを選択（新規作成でもOK）
4. 生成されたキーをコピー

```
Key:   GOOGLE_GENERATIVE_AI_API_KEY
Value: AIzaSy...（あなたのAPIキー）
```

**意味**: Google AIを使うためのパスワード

---

#### ⑤ Anthropic API Key（Claude用）

**Anthropicでの取得方法:**
1. https://console.anthropic.com/ にアクセス
2. **API Keys** をクリック
3. **Create Key** をクリック
4. キーをコピー

```
Key:   ANTHROPIC_API_KEY
Value: sk-ant-...（あなたのAPIキー）
```

**意味**: Claude AI を使うためのパスワード

---

#### ⑥ アプリのURL

⚠️ **注意**: これはまだ正確な値がわかりません。仮の値を入れておきます。

```
Key:   NEXT_PUBLIC_APP_URL
Value: https://my-lp-builder.onrender.com
```

```
Key:   NEXT_PUBLIC_BASE_URL
Value: https://my-lp-builder.onrender.com
```

💡 **ヒント**: `my-lp-builder` は「ステップ2-3」で入力した **Name** と同じにしてください

**意味**: あなたのアプリのインターネット上の住所

---

#### ⑦ パスワード

アプリにログインするためのパスワードを決めます。

```
Key:   INVITE_PASSWORD
Value: your-secure-password-here
```

💡 **ヒント**: 覚えやすくて、でも推測されにくいパスワードにしてください

**意味**: 管理画面に入るためのパスワード

---

#### ⑧ 暗号化キー（超重要！）

APIキーを安全に保存するための暗号化キーです。

**生成方法（パソコンの場合）:**

1. ターミナル（Macの場合）またはコマンドプロンプト（Windowsの場合）を開く
2. 以下のコマンドを入力してEnterキーを押す：

```bash
openssl rand -hex 32
```

3. 出てきた長い文字列（64文字）をコピー

**生成方法（スマホ・Windowsで openssl がない場合）:**

オンラインツールを使います：
1. https://www.browserling.com/tools/random-hex にアクセス
2. 「Length」に `64` と入力
3. 「Generate Hex」をクリック
4. 生成された文字列をコピー

```
Key:   ENCRYPTION_KEY
Value: abc123def456...（64文字の文字列）
```

⚠️ **超重要**: この値は絶対に無くさないでください！また、他人に見せないでください！

**意味**: APIキーを暗号化して保存するための鍵

---

### 3-3. 入力内容の確認

以下の項目が全て入力されているか確認してください：

- [ ] NODE_ENV
- [ ] DATABASE_URL
- [ ] DIRECT_URL
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] GOOGLE_GENERATIVE_AI_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NEXT_PUBLIC_BASE_URL
- [ ] INVITE_PASSWORD
- [ ] ENCRYPTION_KEY

✅ **全部入力できましたか？** 次のステップへ！

---

## ステップ4: 公開する

### 4-1. サービスを作成

1. ページの一番下までスクロール
2. **Create Web Service** ボタンをクリック
3. 待ちます（5～10分くらい）

### 4-2. デプロイの進行状況を確認

画面に色々なログ（記録）が流れます。

**正常な場合:**
```
Building...
Installing dependencies...
Running build...
Build succeeded!
Starting service...
Your service is live!
```

✅ **確認**: 「Your service is live!」と表示されればデプロイ成功！

❌ **エラーが出た場合**: [困った時は](#困った時は) を見てください

### 4-3. アプリにアクセスしてみる

1. 画面の上の方に `.onrender.com` で終わるURLがあります
2. そのURLをクリック
3. あなたのアプリが開きます！

✅ **確認**: アプリのログイン画面が表示されればOK！

### 4-4. ログインしてみる

1. 「ステップ3-2 ⑦」で設定した `INVITE_PASSWORD` を入力
2. ログインできるか確認

✅ **確認**: 管理画面が表示されれば完璧！

🎉 **おめでとうございます！** あなたのアプリがインターネット上で公開されました！

---

## ステップ5: 自動更新を設定する

コードを変更したら、自動的にアプリも更新されるようにします。

### 選択肢1: シンプルな方法（初心者向け）

**Render Auto-Deploy を使う**

1. Renderダッシュボードであなたのサービスを開く
2. 左サイドバーの **Settings** をクリック
3. **Build & Deploy** セクションを探す
4. **Auto-Deploy** を **Yes** に変更
5. 一番下の **Save Changes** をクリック

✅ **これで完了！** 次から `git push` するだけで自動更新されます

---

### 選択肢2: 高度な方法（チェック機能付き）

**GitHub Actions を使う**

💡 **こんな人におすすめ:**
- コードにミスがないか確認してから公開したい
- プログラミングにもっと慣れてきた

#### 5-2-1. Render API Key を取得

1. Renderダッシュボードの右上のアイコンをクリック
2. **Account Settings** を選択
3. 左サイドバーの **API Keys** をクリック
4. **Create API Key** をクリック
5. 名前を入力（例: `GitHub Actions`）
6. 生成されたキー（`rnd_` で始まる）をコピー
7. ⚠️ **重要**: このキーは一度しか表示されないので、メモ帳にコピーしておく

#### 5-2-2. Service ID を取得

1. Renderダッシュボードであなたのサービスを開く
2. ブラウザのアドレスバー（URL）を見る
3. `https://dashboard.render.com/web/srv-xxxxxxxxxxxxx` の `srv-xxxxxxxxxxxxx` 部分をコピー
4. これが **Service ID** です

#### 5-2-3. GitHub Secrets に保存

1. GitHubで `kazujp225/wordpressdemo` リポジトリを開く
2. 上部メニューの **Settings** をクリック
3. 左サイドバーの **Secrets and variables** → **Actions** をクリック
4. **New repository secret** をクリック

以下を一つずつ追加していきます：

**① RENDER_API_KEY**
```
Name:  RENDER_API_KEY
Secret: rnd_xxxxxxxxxxxxx（コピーしたAPIキー）
```

**② RENDER_SERVICE_ID**
```
Name:  RENDER_SERVICE_ID
Secret: srv-xxxxxxxxxxxxx（コピーしたServiceID）
```

**③ その他の環境変数**

「ステップ3-2」で入力した値をそのままコピーして追加します：

- DATABASE_URL
- DIRECT_URL
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

#### 5-2-4. Render Auto-Deploy を無効化

二重に更新されないようにするため、Render側の自動更新を切ります：

1. Renderダッシュボード → あなたのサービス → **Settings**
2. **Auto-Deploy** を **No** に変更
3. **Save Changes**

✅ **これで完了！** 次から `git push` すると：
1. GitHub Actionsがコードをチェック
2. ミスがなければRenderに自動デプロイ
3. ミスがあればデプロイされない（安全！）

---

## 困った時は

### Q1. デプロイが失敗する

**エラーメッセージに「DATABASE_URL」と出ている場合:**
- Supabaseの接続文字列が間違っている可能性があります
- 「ステップ3-2 ②」をもう一度確認してください

**エラーメッセージに「Build failed」と出ている場合:**
- 環境変数が足りない可能性があります
- 「ステップ3-3」のチェックリストを確認してください

**エラーメッセージに「ENCRYPTION_KEY」と出ている場合:**
- 暗号化キーが設定されていないか、短すぎます
- 「ステップ3-2 ⑧」で64文字の文字列を生成して設定してください

### Q2. アプリが真っ白で何も表示されない

1. Renderダッシュボードで **Logs** タブを開く
2. 赤い文字でエラーが出ていないか確認
3. 「Environment variable ... is not set」と出ている場合は、その環境変数を追加

### Q3. ログインできない

- `INVITE_PASSWORD` を正しく入力していますか？
- Renderの **Environment** タブで `INVITE_PASSWORD` が設定されているか確認

### Q4. URLが長くて覚えられない

独自ドメイン（`example.com`のような）を使うこともできますが、それは別のガイドが必要です。
今は `.onrender.com` のURLをブックマークしておきましょう。

### Q5. もっと詳しく知りたい

- [Render公式ドキュメント](https://render.com/docs)（英語）
- [Supabase公式ドキュメント](https://supabase.com/docs)（英語あり、一部日本語）

---

## 🎓 用語集

より詳しく知りたい人のための説明です。

### デプロイとは？

プログラムを書いただけでは、自分のパソコンでしか動きません。
「デプロイ」とは、そのプログラムをインターネット上のサーバー（常に動いているパソコン）にアップロードして、世界中の人がアクセスできるようにすることです。

### Renderとは？

サーバーを貸してくれるサービスです。自分でサーバーを用意すると大変ですが、Renderを使えば簡単に公開できます。
無料プランもあるので、練習に最適です。

### 環境変数とは？

プログラムを動かすために必要な「設定」のことです。
例えば：
- データベースのパスワード
- APIキー（他のサービスを使うためのパスワード）
- アプリのURL

これらをコードに直接書くと危険なので、環境変数として別で管理します。

### ビルドとは？

プログラムのコード（人間が読みやすい形）を、コンピューターが実行できる形に変換することです。
Next.jsでは、HTML/CSS/JavaScriptを最適化して、速く動くようにします。

---

## ✅ 完了チェックリスト

全部できたか確認しましょう！

- [ ] Renderアカウントを作成した
- [ ] GitHubリポジトリと連携した
- [ ] 環境変数を全て入力した（13個）
- [ ] 初回デプロイが成功した
- [ ] アプリのURLにアクセスできた
- [ ] ログインできた
- [ ] 自動更新を設定した（選択肢1または2）

全部にチェックが付いたら、あなたは立派なエンジニアです！🎉

---

## 📞 サポート

このガイドでわからないことがあれば：

1. まず「困った時は」セクションを確認
2. Google で「Render デプロイ エラー」などで検索
3. GitHubのIssuesで質問（英語推奨）

頑張ってください！👍
