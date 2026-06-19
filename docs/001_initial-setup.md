# 001 初期セットアップ — hoshiorange-official

ハブサイトの初期構築。Next.js (App Router) + TypeScript + CSS Modules で実装し、Vercel デプロイ前提。Tailwind は不使用。

## 実施プラン
- [x] `package.json` / `tsconfig.json` / `next.config.ts` / `.gitignore` / `.env.local.example` を作成
- [x] グローバル CSS（テーマ変数・リセット）を整備
- [x] ThemeProvider（手動トグル + システム追従 + FOUC 防止インラインスクリプト）
- [x] HoshiLogo（SVG コンポーネント） + `app/icon.svg`（favicon）
- [x] StarryBackground（CSS のみの星空背景・流れ星・オーロラグラデ）
- [x] Header（ロゴ + アンカーナビ + テーマトグル、スクロール時の半透明化、モバイルメニュー）
- [x] Hero（キャッチコピー + ロゴ + 軌道リング + スクロールヒント）
- [x] About（自己紹介 + 3 つの活動軸ピラー）
- [x] LinkCards（X / YouTube / GitHub。データ駆動。URL 未設定は Coming Soon）
- [x] YouTubeLatest（サーバーコンポーネント、YouTube Data API v3、ISR 1h、env 未設定時のフォールバック）
- [x] XTimeline（公式 widgets.js、テーマ切替時に再描画、env 未設定時のフォールバック）
- [x] Contact（メール + X DM + お仕事募集の一文）
- [x] Footer
- [x] SEO（layout の metadata、`sitemap.ts`、`robots.ts`、`opengraph-image.tsx`）
- [x] README に開発手順を追記
- [x] `.claude/rules/implementation-notes.md` の更新

## 完了報告
- 構成: `src/app/`（`layout.tsx` / `page.tsx` / `globals.css` / `icon.svg` / `sitemap.ts` / `robots.ts` / `opengraph-image.tsx`）、`src/components/`（Header, Hero, About, LinkCards, YouTubeLatest, XTimeline, Contact, Footer, ThemeProvider, ThemeToggle, HoshiLogo, StarryBackground, Section）、`src/data/`（profile, links）、`src/lib/`（youtube）、`src/types/`（youtube）
- スタイリング: CSS Modules（`*.module.css`）。CSS 変数で dark/light を切替。Tailwind は導入していない。
- テーマ: 手動トグル＋システム追従。`<html data-theme>` をインラインスクリプトで即時適用しチカつきを防止。`hoshiorange:theme-change` カスタムイベントで X タイムラインの再描画も連動。
- 外部 API: `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` / `NEXT_PUBLIC_X_USERNAME` / `NEXT_PUBLIC_SITE_URL` を `.env.local.example` に明記。未設定でもビルドが落ちないよう全てフォールバック表示を用意。
- 検証: `npm install` / `npm run build` で動作確認済み。
- 残課題: コピーや SNS の正式 URL、メールアドレスなどコンテンツの差し替え（TODO コメント付き）。Coming Soon のリンク 3 枠の URL 設定。
