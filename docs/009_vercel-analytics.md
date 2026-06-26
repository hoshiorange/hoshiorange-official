# 009 Vercel Web Analytics 導入

## 概要
Vercel Web Analytics をサイトに組み込む。公式の `@vercel/analytics` を導入し、App Router の RootLayout に `<Analytics />` を1つ配置する。本番（Vercel）デプロイ後にページビュー等の計測を開始できる状態にする。

## 実施プラン
- [x] `feature/vercel-analytics` ブランチを作成（最新 main から）
- [x] `npm i @vercel/analytics` で導入（v2.0.1）
- [x] 正しい import パスを確認（`@vercel/analytics/next`）
- [x] `src/app/layout.tsx` の `<body>` 内に `<Analytics />` を追加（RootLayout はサーバーコンポーネントのまま）
- [x] `npx tsc --noEmit` 成功
- [x] `npm run build` 成功
- [x] dev でトップが正常表示・コンソールエラー/ハイドレーション崩れなしを確認
- [x] 一時ファイル削除
- [x] コミット・push・PR 作成（マージはしない）

## 実装内容

### import パスの選定
インストールした `@vercel/analytics@2.0.1` の `package.json` の `exports` に `./next` が存在し、`require('@vercel/analytics/next')` で `Analytics` がエクスポートされることを確認した。Next.js App Router 向けの公式推奨は `@vercel/analytics/next` であり、この版では内部でクライアント境界を持つため、**RootLayout（サーバーコンポーネント）のまま** `<Analytics />` を配置できる（`'use client'` 不要）。

```ts
import { Analytics } from '@vercel/analytics/next';
```

### 配置
`src/app/layout.tsx` の `<body>` 内、`ThemeProvider`（`StarryBackground` + `children`）の**後ろ**に `<Analytics />` を1つ追加。既存コンテンツや背景演出の妨げにならない位置。

```tsx
<body>
  <ThemeProvider>
    <StarryBackground />
    {children}
  </ThemeProvider>
  <Analytics />
</body>
```

## 確認結果
- `npx tsc --noEmit`: 成功（exit 0）
- `npm run build`: 成功（全 8 ページ生成、ルート `/` 117 kB First Load JS）
  - ※ dev サーバの `.next` と競合しないよう、検証時のみ一時的に `distDir` を分離してビルドし、検証後に `next.config.ts` を元へ戻した。Next.js が自動整形した `tsconfig.json` の差分も元へ戻している。
- dev（`npm run dev`）: トップ `/` が HTTP 200 で正常表示。Playwright で確認しコンソールエラー 0 件、ハイドレーション崩れなし（残る警告は既存の THREE.Clock deprecation のみで本変更とは無関係）。
- Analytics は本番（Vercel）でのみ計測されるため、dev の HTML にトラッキングスクリプトは注入されない（想定どおり）。

## 変更ファイル
- `src/app/layout.tsx`（import 追加 + `<Analytics />` 配置）
- `package.json` / `package-lock.json`（`@vercel/analytics@^2.0.1` 追加）

## 完了報告
Vercel Web Analytics のコード組み込みを完了。`@vercel/analytics/next` の `<Analytics />` を RootLayout に追加した。tsc / build / dev いずれも問題なし。`feature/vercel-analytics` ブランチで PR を作成（マージはユーザー承認後）。

### ユーザーがやること
1. Vercel ダッシュボードで対象プロジェクトの **Web Analytics を Enable**
2. この PR を手動で（squash）マージ
3. マージ＝デプロイ後、計測が開始される
