# Mantine UI 移行仕様書

## 概要

本プロジェクトのUIを **Mantine UI v7** に全面移行する。
現在のTailwind CSS + Radix UIベースの実装を、Mantineコンポーネントに置き換える。

---

## 現状の技術スタック

```json
{
  "styling": {
    "tailwindcss": "3.4.19",
    "class-variance-authority": "0.7.1"
  },
  "ui-primitives": {
    "@radix-ui/react-accordion": "使用中",
    "@radix-ui/react-dialog": "使用中",
    "@radix-ui/react-select": "使用中",
    "@radix-ui/react-tabs": "使用中",
    "@radix-ui/react-tooltip": "使用中"
  },
  "icons": {
    "lucide-react": "0.460.0"
  },
  "forms": {
    "react-hook-form": "7.53.0",
    "zod": "4.2.1"
  },
  "notifications": {
    "react-hot-toast": "2.6.0"
  },
  "animation": {
    "framer-motion": "12.29.0"
  }
}
```

---

## 移行後の技術スタック

```json
{
  "mantine": {
    "@mantine/core": "^7.x",
    "@mantine/hooks": "^7.x",
    "@mantine/form": "^7.x",
    "@mantine/notifications": "^7.x",
    "@mantine/modals": "^7.x",
    "@mantine/dropzone": "^7.x",
    "@mantine/charts": "^7.x"
  },
  "icons": {
    "@tabler/icons-react": "推奨（Mantineと相性◎）",
    "lucide-react": "継続利用可"
  },
  "styling": {
    "postcss": "必須",
    "postcss-preset-mantine": "必須"
  }
}
```

---

## Phase 0: セットアップ

### 1. パッケージインストール

```bash
# Mantine本体
npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications @mantine/modals @mantine/dropzone @mantine/charts

# PostCSS設定（Mantine v7必須）
npm install postcss postcss-preset-mantine postcss-simple-vars

# アイコン（オプション）
npm install @tabler/icons-react
```

### 2. PostCSS設定

```javascript
// postcss.config.mjs
export default {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

### 3. CSSインポート

```typescript
// app/layout.tsx
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/charts/styles.css';
```

### 4. Provider設定

```tsx
// app/layout.tsx
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

const theme = createTheme({
  // カスタムテーマ設定
  primaryColor: 'blue',
  fontFamily: 'var(--font-noto-sans-jp), sans-serif',
  headings: {
    fontFamily: 'var(--font-manrope), sans-serif',
  },
  colors: {
    // 現在のamberカラーをカスタム定義
    amber: [
      '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24',
      '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'
    ],
  },
});

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <MantineProvider theme={theme}>
          <ModalsProvider>
            <Notifications position="top-right" />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
```

---

## Phase 1: 基本UIコンポーネント移行

### 対象ファイル

| 現在のファイル | 行数 | Mantine対応 |
|--------------|------|-------------|
| `ui/button.tsx` | 61 | `@mantine/core` Button |
| `ui/input.tsx` | 23 | `@mantine/core` TextInput |
| `ui/textarea.tsx` | 22 | `@mantine/core` Textarea |
| `ui/card.tsx` | 75 | `@mantine/core` Card |
| `ui/badge.tsx` | 39 | `@mantine/core` Badge |
| `ui/accordion.tsx` | 56 | `@mantine/core` Accordion |
| `ui/label.tsx` | 21 | `@mantine/core` Input.Label |

### 移行例: Button

**現在の実装:**
```tsx
// src/components/ui/button.tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground...",
        destructive: "bg-destructive...",
        // ...
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
  }
);
```

**Mantine移行後:**
```tsx
// src/components/ui/button.tsx
import { Button as MantineButton, ButtonProps } from '@mantine/core';

// 既存のvariantをMantineに対応
const variantMap = {
  default: 'filled',
  destructive: 'filled', // color="red"
  outline: 'outline',
  secondary: 'light',
  ghost: 'subtle',
  link: 'transparent',
};

export function Button({ variant = 'default', size = 'md', ...props }) {
  return (
    <MantineButton
      variant={variantMap[variant]}
      size={size}
      {...props}
    />
  );
}
```

### 移行例: Input

**現在の実装:**
```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border...",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**Mantine移行後:**
```tsx
import { TextInput } from '@mantine/core';

export function Input(props) {
  return <TextInput {...props} />;
}
```

---

## Phase 2: モーダル・フォーム移行

### 対象ファイル

```
src/components/admin/
├── ClaudeCodeGeneratorModal.tsx (1,192行)
├── TutorialModal.tsx (670行)
├── VideoInsertModal.tsx (665行)
├── BackgroundUnifyModal.tsx (569行)
├── CTAManagementModal.tsx (565行)
├── PageDeployModal.tsx (538行)
├── OverlayEditorModal.tsx (495行)
├── DesignUnifyModal.tsx (466行)
├── BoundaryDesignModal.tsx (433行)
├── CopyEditModal.tsx (432行)
├── RestoreModal.tsx (398行)
└── ... (その他10個以上)
```

### Mantine Modal パターン

```tsx
import { Modal, Button, TextInput, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';

function ExampleModal() {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : '無効なメール'),
    },
  });

  return (
    <>
      <Modal opened={opened} onClose={close} title="タイトル" size="lg">
        <form onSubmit={form.onSubmit((values) => console.log(values))}>
          <Stack>
            <TextInput
              label="名前"
              placeholder="名前を入力"
              {...form.getInputProps('name')}
            />
            <TextInput
              label="メール"
              placeholder="email@example.com"
              {...form.getInputProps('email')}
            />
            <Button type="submit">送信</Button>
          </Stack>
        </form>
      </Modal>

      <Button onClick={open}>モーダルを開く</Button>
    </>
  );
}
```

### react-hook-form → @mantine/form 移行

**現在:**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState } = useForm({
  resolver: zodResolver(schema),
});
```

**Mantine:**
```tsx
import { useForm, zodResolver } from '@mantine/form';

const form = useForm({
  validate: zodResolver(schema),
  initialValues: { ... },
});

// フォームフィールドに直接バインド
<TextInput {...form.getInputProps('fieldName')} />
```

### react-hot-toast → @mantine/notifications 移行

**現在:**
```tsx
import toast from 'react-hot-toast';

toast.success('保存しました');
toast.error('エラーが発生しました');
```

**Mantine:**
```tsx
import { notifications } from '@mantine/notifications';

notifications.show({
  title: '成功',
  message: '保存しました',
  color: 'green',
});

notifications.show({
  title: 'エラー',
  message: 'エラーが発生しました',
  color: 'red',
});
```

---

## Phase 3: 中規模コンポーネント移行

### LP Builder コンポーネント

| ファイル | 行数 | 注意点 |
|---------|------|-------|
| `ImageInpaintEditor.tsx` | 2,376 | 分割推奨 |
| `PropertiesPanel.tsx` | 746 | フォーム多い |
| `SEOLLMOOptimizer.tsx` | 627 | モーダル構造 |
| `GeminiGeneratorModal.tsx` | 331 | 標準的なモーダル |

### ダッシュボードチャート

**現在（Recharts）:**
```tsx
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
```

**Mantine（@mantine/charts）:**
```tsx
import { BarChart } from '@mantine/charts';

<BarChart
  h={300}
  data={data}
  dataKey="date"
  series={[
    { name: 'usage', color: 'blue.6' },
  ]}
/>
```

---

## Phase 4: 大規模コンポーネント分割・移行

### Editor.tsx (5,771行) 分割案

```
src/components/admin/editor/
├── index.tsx              # メインコンポーネント（状態管理）
├── EditorToolbar.tsx      # ツールバー
├── EditorSidebar.tsx      # サイドバー
├── EditorCanvas.tsx       # キャンバス部分
├── EditorProperties.tsx   # プロパティパネル
├── modals/
│   ├── ImageModal.tsx
│   ├── VideoModal.tsx
│   ├── CopyEditModal.tsx
│   └── ...
└── hooks/
    ├── useEditorState.ts
    ├── useEditorActions.ts
    └── useDragDrop.ts
```

### ImageInpaintEditor.tsx (2,376行) 分割案

```
src/components/lp-builder/inpaint-editor/
├── index.tsx              # メインエディタ
├── Canvas.tsx             # キャンバス描画
├── Toolbar.tsx            # ツール選択
├── MaskLayer.tsx          # マスク処理
├── HistoryPanel.tsx       # 履歴表示
└── hooks/
    ├── useCanvas.ts
    ├── useMask.ts
    └── useHistory.ts
```

---

## 注意点・ベストプラクティス

### 1. Tailwind CSSとの併用判断

**完全移行（推奨）:**
- Tailwindを削除
- すべてMantineのスタイリングシステムを使用
- `sx` prop または `styles` prop でカスタマイズ

```tsx
// Mantineのスタイリング例
<Button
  styles={{
    root: {
      backgroundColor: 'var(--mantine-color-amber-5)',
    },
  }}
>
  ボタン
</Button>
```

**併用する場合:**
- Mantineコンポーネント + Tailwindでレイアウト
- 複雑さが増すため非推奨

### 2. アイコンの統一

**選択肢A: @tabler/icons-react に統一（推奨）**
```tsx
import { IconPlus, IconTrash } from '@tabler/icons-react';
```
- Mantineと同じ作者
- 5000+アイコン
- 統一感あり

**選択肢B: lucide-react を継続**
```tsx
import { Plus, Trash } from 'lucide-react';
```
- 現在44ファイルで使用中
- 移行コスト低
- Mantineとも互換性あり

### 3. framer-motion との併用

Mantineは内部でCSS transitionsを使用。
framer-motionは以下の場合に継続利用：

- 複雑なアニメーション（ページ遷移など）
- ドラッグ&ドロップ（@dnd-kit使用中）
- 物理ベースアニメーション

```tsx
// 共存例
import { motion } from 'framer-motion';
import { Card } from '@mantine/core';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <Card>コンテンツ</Card>
</motion.div>
```

### 4. ダークモード対応

```tsx
// テーマ設定
const theme = createTheme({
  primaryColor: 'blue',
});

// ColorScheme管理
import { useLocalStorage } from '@mantine/hooks';

function App() {
  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'color-scheme',
    defaultValue: 'light',
  });

  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme={colorScheme}
    >
      {children}
    </MantineProvider>
  );
}
```

### 5. パフォーマンス考慮

- Mantineはツリーシェイキング対応
- 使用するコンポーネントのみインポート
- 大規模モーダルは `React.lazy` で遅延読み込み

```tsx
const HeavyModal = React.lazy(() => import('./HeavyModal'));

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <HeavyModal />
    </Suspense>
  );
}
```

---

## 移行チェックリスト

### Phase 0
- [ ] Mantineパッケージインストール
- [ ] PostCSS設定
- [ ] MantineProvider設定
- [ ] テーマカスタマイズ

### Phase 1
- [ ] Button移行
- [ ] Input/Textarea移行
- [ ] Card移行
- [ ] Badge移行
- [ ] Accordion移行
- [ ] Label移行

### Phase 2
- [ ] react-hook-form → @mantine/form
- [ ] react-hot-toast → @mantine/notifications
- [ ] 小規模モーダル移行（15個）
- [ ] フォームバリデーション移行

### Phase 3
- [ ] LP Builderコンポーネント移行
- [ ] ダッシュボードチャート移行
- [ ] 管理画面コンポーネント移行

### Phase 4
- [ ] Editor.tsx分割・移行
- [ ] ImageInpaintEditor.tsx分割・移行
- [ ] ページレベル移行
- [ ] Tailwind CSS削除

### 最終確認
- [ ] 全ページ動作確認
- [ ] レスポンシブ確認
- [ ] ダークモード確認
- [ ] パフォーマンステスト
- [ ] アクセシビリティ確認

---

## 参考リンク

- [Mantine公式ドキュメント](https://mantine.dev/)
- [Mantine v7 Migration Guide](https://mantine.dev/changelog/7-0-0/)
- [Tabler Icons](https://tabler-icons.io/)
- [@mantine/form ドキュメント](https://mantine.dev/form/use-form/)

---

## 連絡事項

質問や不明点があれば、以下を確認：
1. 各フェーズ完了時にレビュー実施
2. 大規模ファイル（1000行以上）は分割案を事前相談
3. 既存機能が壊れないよう、移行前後でテスト必須
