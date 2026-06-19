# 実装担当メモ

## 担当範囲
- コーディング全般（フロントエンド／バックエンド分けず一手に引き受ける）
- ページ追加・コンポーネント実装・スタイリング
- ビルド設定・依存関係管理
- git 操作・PR 作成

## 技術スタック（採用済）
- Next.js 15.5（App Router）
- React 19
- TypeScript 5.7（strict: true）
- **CSS Modules**（`*.module.css`）でスタイリング
- next/font/google で Space Grotesk（見出し）/ Noto Sans JP（本文）
- パッケージマネージャ: **npm**（v11、Node v24 LTS で動作確認）
- デプロイ: Vercel

Tailwind / ESLint / Prettier は導入していない（CSS Modules 方針 + 時間優先）。

## ディレクトリ構成（実装済）
```
package.json / tsconfig.json / next.config.ts / .gitignore / .env.local.example
src/
  app/
    layout.tsx           ← フォント・テーマ初期化スクリプト・StarryBackground を全画面に敷く
    page.tsx             ← トップページ（全セクションを縦に並べる）
    globals.css          ← リセット + CSS 変数（:root と [data-theme='light']）
    icon.svg             ← favicon（Next.js が自動認識）
    sitemap.ts / robots.ts / opengraph-image.tsx (next/og, edge runtime)
  components/
    Header/              ← ロゴ + アンカーナビ + ThemeToggle、スクロールで半透明化、モバイルメニュー
    Hero/                ← キャッチコピー + リード文(旧Aboutの役割を統合) + 軌道リング + ロゴ + CTA + スクロールヒント
    LinkCards/           ← データ駆動カード（Coming Soon 対応）
    YouTubeLatest/       ← Server Component、ISR 1h、env 未設定でもフォールバック
    XTimeline/           ← クライアントで widgets.js 動的読み込み、テーマ切替で再描画
    Contact/             ← メール CTA + X DM 誘導
    Footer/              ← ブランド + ナビ + 著作権
    StarryBackground/    ← CSS のみで星空（3レイヤー＋流れ星＋オーロラ）
    ThemeProvider/       ← Context + themeInitScript（FOUC 防止）
    ThemeToggle/         ← 月／太陽トグル
    HoshiLogo/           ← SVG 直書き
    Section/             ← SectionHeading（共通見出し）
  data/
    profile.ts / links.ts  ← 文面・リンク一覧を一箇所で管理
  lib/
    youtube.ts            ← Data API v3 呼び出し（環境変数不在時は { ok: false } を返す）
  types/
    youtube.ts
docs/
  001_initial-setup.md
  002_about-into-hero.md
```

## About セクション廃止（002）
- About を独立セクションとして廃止し、その役割（「ほしの活動拠点であることを示す」）を Hero のリード文 1 文に統合した。
- 採用文面: 「ほしの活動拠点です。X や YouTube など、いろんな場所での活動をここにまとめています。」
- 文面は `profile.heroLead` としてデータ駆動で管理（旧 `aboutBody` は削除）。Hero では subTagline の下に `.lead` で表示。
- pillars（🎮🎨💻 の 3 カード）は About.tsx 内ローカル定数で他に再利用が無かったため、About と共に削除。将来は別タスクで別の見せ方を検討。
- `#about` 参照を解消: Header / Footer ナビから About 項目を削除。Hero の ghost CTA は `#contact`（お仕事のご相談）、scrollHint は `#links` に変更。

## スタイリング方針
- CSS 変数で配色・シャドウを定義（ダーク基準 `:root` / ライト `[data-theme='light']`）
- アクセントは `--accent (#ff8c2a 系)`、夜空背景は `--bg (#060814)`、ライトはオフホワイト + 淡空色
- 大きな見出しは clamp() による流体タイポ
- アニメーションは `prefers-reduced-motion: reduce` で停止

## テーマ切替
- `<html data-theme="dark|light">` 属性方式
- `<head>` 内のインライン同期スクリプト（`themeInitScript`）で初期テーマを即時適用 → FOUC なし
- ユーザートグルは localStorage の `hoshiorange-theme` に保存
- カスタムイベント `hoshiorange:theme-change` を発火し、X 埋め込みなどの再描画に利用

## 外部サービス連携

### YouTube
- `src/lib/youtube.ts` で API v3 `search` を呼ぶ
- `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID`（**サーバー専用、NEXT_PUBLIC_ なし**）
- ISR: `fetch(url, { next: { revalidate: 3600 } })`
- 取得 6 件、最新順
- 環境変数不足や API エラーは `{ ok: false, reason, message }` を返してフォールバック表示
- Next.js Image の最適化は `unoptimized` でスキップ（remotePatterns で `i.ytimg.com` を許可済み）

### X (Twitter)
- 公式 `https://platform.twitter.com/widgets.js` を動的 load
- `<a class="twitter-timeline" data-theme>` をクライアントで生成、テーマ変化で innerHTML を作り直して `widgets.load()` 再走
- `NEXT_PUBLIC_X_USERNAME` 未設定はプレースホルダーを表示

## 環境変数
| 変数名 | スコープ | 用途 |
|---|---|---|
| `YOUTUBE_API_KEY` | サーバー | YouTube Data API v3 |
| `YOUTUBE_CHANNEL_ID` | サーバー | 取得対象チャンネル |
| `NEXT_PUBLIC_X_USERNAME` | クライアント | X 埋め込みのユーザー名（@ 抜き） |
| `NEXT_PUBLIC_SITE_URL` | 両方 | metadataBase / sitemap / robots |

`.env.local.example` をコピーして `.env.local` を作成。`.env*` は `.gitignore` 済み（`.env*.example` だけは追跡）。

## ビルド／開発
- `npm install` → `npm run dev`（http://localhost:3000）
- `npm run build` 動作確認済み（環境変数なしでも成功）

## 作業ルール
- `main` への直接コミット・プッシュ禁止
- 作業のたびに `docs/NNN_作業名.md` を作成
- 仕様変更・追加実装の都度このファイルを更新

## 残課題（コンテンツ／コンフィグ系）
- Hero / Contact の文面差し替え（コード内 `{/* TODO: 文面を差し替える */}` 参照。About は廃止済）
- `src/data/links.ts` の URL を埋めて `comingSoon: true` を外す
- `src/data/profile.ts` の `contactEmail` を実アドレスに
- 環境変数を本番（Vercel）に登録：`YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` / `NEXT_PUBLIC_X_USERNAME` / `NEXT_PUBLIC_SITE_URL`
- 画像最適化したい場合は YouTube サムネを Next.js Image の最適化対象に戻す（現在 `unoptimized`）
