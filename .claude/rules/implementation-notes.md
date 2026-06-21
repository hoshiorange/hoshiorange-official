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
    Hero/                ← タイトル「hoshiorange-official」(シック) + リード文 + CTA(SNS=#links / 制作物=#lab) + 左右2カラム + HeroVisual(案A 3D)
    LatestActivity/      ← YouTube 最新動画 + ツイキャス配信状況を統合した 1 セクション（Links より先）
    LinkCards/           ← データ駆動カード（バッジ撤去。X/YouTube/ツイキャス/GitHub の URL 設定済）
    Laboratory/          ← 制作物セクション。labs.ts が空のあいだは Coming Soon プレースホルダー
    YouTubeLatest/       ← Server Component、ISR 1h、env 未設定でもフォールバック
    TwitCastingStatus/   ← Server Component、ツイキャス配信状況（配信中ライブ/最近の配信/リンクのフォールバック）。旧 XTimeline は 006 で廃止
    Contact/             ← @hoshiorange 提示（X リンク + Discord テキスト）、左右2カラム + ContactVisual(案B 3D)
    Contact/ContactVisual.tsx ← 案B（光る星）の 3D を透過配置
    Hero3D/              ← HeroLogo3D / HeroStar3D / HeroVisual / useReducedMotion（HeroScene3D は 005 で削除）
    Footer/              ← ブランド + ナビ + 著作権
    StarryBackground/    ← CSS のみで星空（3レイヤー＋流れ星＋オーロラ）
    ThemeProvider/       ← Context + themeInitScript（FOUC 防止）
    ThemeToggle/         ← MUI アイコン化、選択中表現を改善
    HoshiLogo/           ← SVG 直書き
    Section/             ← SectionHeading（共通見出し）+ Section.module.css（.sectionFrame 共通枠）
  data/
    profile.ts / links.ts / labs.ts  ← 文面・リンク一覧・制作物一覧を一箇所で管理
  lib/
    youtube.ts            ← Data API v3 呼び出し（環境変数不在時は { ok: false } を返す）
    twitcasting.ts        ← API v2 Basic 認証で配信状況取得（is_live / current_live / movies、env 不在時は { ok: false }）
  types/
    youtube.ts
    twitcasting.ts
docs/
  001_initial-setup.md
  002_about-into-hero.md
  003_hero-official-hub.md
  004_session-redesign.md
  005_refactor-structure.md
  006_twitcasting-status.md
```

## 3D / レイアウト再構成（004）
- ページ構成を `Header → Hero → LatestActivity → LinkCards → Laboratory → Contact → Footer` に再整理。
- React Three Fiber 基盤を導入（three / @react-three/fiber / @react-three/drei / @react-three/postprocessing / @types/three）。`useReducedMotion` で動きを抑制可能。
- Hero に案A（ロゴ＋軌道）の `HeroVisual` を、Contact に案B（光る星）の `ContactVisual` を配置。（比較用 `/hero3d-preview` ページと統合シーン `HeroScene3D` は 005 で削除。）
- Latest（YouTube + X）と Links を再整理し、Latest を先に。各セクションは `min-height: 100svh`。
- LinkCards は OPEN/COMING SOON バッジを撤去し各 SNS の URL を設定。ThemeToggle は MUI アイコン化。
- Contact はメール廃止 → `@hoshiorange`（X リンク＋ Discord テキスト）。
- layout / sitemap / robots に SITE_URL フォールバックを追加。

## 構造リファクタリング（005 / 挙動・見た目不変）
- **デッドコード削除**: `HeroScene3D.tsx`（どこからも未参照の統合シーン）/ `src/app/hero3d-preview/`（比較用一時ページ）/ `Contact.module.css` の未使用 `.secondary`・`.divider` / `profile.ts` の未使用 `contactEmail` を削除。
- **セクション枠の共通化**: 4 セクション（LinkCards / LatestActivity / Laboratory / Contact）にコピーされていた `.section`（min-height:100svh / flex column / justify-center / scroll-margin-top / padding）を `Section/Section.module.css` の `.sectionFrame` へ集約し、各 module から `composes: sectionFrame from '@/components/Section/Section.module.css'` で取り込む。Contact のみ position/overflow/isolation を自身に残す。`composes` は計算後スタイル不変（出力クラスが増えるだけ）なので**見た目は完全に同一**（dev で全セクションの computed style 一致を確認）。
- **3D dynamic ラッパー統一**: `HeroVisual` の import を相対パス → `@/` エイリアスに揃え `ContactVisual` と表記統一。挙動同一。
- 検証: `npx tsc --noEmit` / `npm run build` 成功。PC・モバイル × dark・light の全 4 パターンでリグレッション無しを確認。

## About セクション廃止（002）
- About を独立セクションとして廃止し、その役割（「ほしの活動拠点であることを示す」）を Hero のリード文 1 文に統合した。
- 採用文面: 「ほしの活動拠点です。X や YouTube など、いろんな場所での活動をここにまとめています。」
- 文面は `profile.heroLead` としてデータ駆動で管理（旧 `aboutBody` は削除）。Hero では subTagline の下に `.lead` で表示。
- pillars（🎮🎨💻 の 3 カード）は About.tsx 内ローカル定数で他に再利用が無かったため、About と共に削除。将来は別タスクで別の見せ方を検討。
- `#about` 参照を解消: Header / Footer ナビから About 項目を削除。Hero の ghost CTA は `#contact`（お仕事のご相談）、scrollHint は `#links` に変更。

## Hero「Official Hub」構成（003 / 案B → 案A 寄りに微修正）
- h1 のポエム調キャッチ（`tagline`）と星比喩サブコピー（`subTagline`）を廃止し、`profile.tagline` / `profile.subTagline` は `src/data/profile.ts` から削除（全コード・metadata で未参照を確認済）。
- **現状（最新）**: h1 = **「hoshiorange」単独**の大見出し（`profile.handle`／`.titleName`：オレンジグラデ＋下線グロウ、`clamp(2.8rem, 9vw, 6rem)` + `letter-spacing: -0.01em`）。大「ほし」(`displayName`) は削除。
- "Official Hub" は **上部 badge のみ**が担当（重複解消のため h1 サブラベルを撤去）。`heroLead`（`.lead`）は維持。
- CSS: `.title` は縦フレックス（1 要素）。`.titleName` のみ使用し、旧 `.titleSub` / `.titleDash` / `.titleLine1/2` / `.titleAccent` / `.sub` は削除済。`clamp` 流体タイポ・`prefers-reduced-motion` 停止の整合を維持。

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
- （メール窓口を復活させる場合は `profile.contactEmail` を再追加。005 で未使用のため削除済）
- 環境変数を本番（Vercel）に登録：`YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` / `NEXT_PUBLIC_X_USERNAME` / `NEXT_PUBLIC_SITE_URL`
- 画像最適化したい場合は YouTube サムネを Next.js Image の最適化対象に戻す（現在 `unoptimized`）
