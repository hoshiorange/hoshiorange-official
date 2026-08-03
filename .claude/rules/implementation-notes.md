# 実装担当メモ

過去の詳細実装ログ（こおりのぬけみち M0〜M2 の逐次経緯、サイト構成変更002〜005 等）は
Obsidian Vault `C:\git\note\projects\hoshiorange-official\logs\2026-07-07_implementation-notes移設アーカイブ.md`
に全文移設済み。個別の作業ログは同フォルダの日付ファイル（`docs/NNN` 相当）も参照。
このファイルには今後の実装で常に必要なルール・仕様・制約・未解決の残課題のみを残す。

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
    blog/                ← ブログ一覧 + [slug] 記事（SSG、content/blog/*.md が入力）
    lp/[slug]/           ← プロダクト候補 LP（SSG、src/data/lp.ts が入力）
    feed.xml/route.ts    ← ブログ RSS 2.0（force-static）
  components/
    Header/              ← ロゴ + アンカーナビ + ThemeToggle、スクロールで半透明化、モバイルメニュー
    Hero/                ← タイトル「hoshiorange-official」(シック) + リード文 + CTA(SNS=#links / 制作物=#lab) + 左右2カラム + HeroVisual(案A 3D)
    LatestActivity/      ← YouTube 最新動画 + ツイキャス配信状況を統合した 1 セクション（Links より先）
    LinkCards/           ← データ駆動カード（バッジ撤去。X/YouTube/ツイキャス/GitHub の URL 設定済）
    Laboratory/          ← 制作物セクション。labs.ts が空のあいだは Coming Soon プレースホルダー
    YouTubeLatest/       ← Server Component、ISR 1h、env 未設定でもフォールバック
    TwitCastingStatus/   ← Server Component、ツイキャス配信状況（配信中ライブ/最近の配信/リンクのフォールバック）
    Contact/             ← @hoshiorange 提示（X リンク + Discord テキスト）、左右2カラム + ContactVisual(案B 3D)
    Hero3D/              ← HeroLogo3D / HeroStar3D / HeroVisual / useReducedMotion
    Footer/              ← ブランド + ナビ + 著作権
    StarryBackground/    ← CSS のみで星空（3レイヤー＋流れ星＋オーロラ）
    ThemeProvider/       ← Context + themeInitScript（FOUC 防止）
    ThemeToggle/         ← MUI アイコン化
    HoshiLogo/           ← SVG 直書き
    Section/             ← SectionHeading（共通見出し）+ Section.module.css（.sectionFrame 共通枠）
    Lp/                  ← LP 用クライアント部品（LpAnalytics=view計測 / LpCtaButton / LpSignupForm）
  data/
    profile.ts / links.ts / labs.ts / lp.ts  ← 文面・リンク・制作物・LP候補を一箇所で管理
  lib/
    youtube.ts            ← Data API v3 呼び出し（環境変数不在時は { ok: false } を返す）
    twitcasting.ts        ← API v2 配信状況取得。認証 3 段（Bearer ACCESS_TOKEN 優先 → Basic ClientID/Secret → 無ければ { ok: false }）
    blog.ts               ← content/blog の読込・frontmatter検証・Markdown→HTML（unified/remark/rehype、サーバー専用）
    supabaseBrowser.ts    ← サイト共通 Supabase クライアント（動的import・env無しはnull、認証なし）
    lpTracking.ts         ← LP 3段ファネル計測＋事前登録送信（クライアント専用）
  types/
    youtube.ts
    twitcasting.ts
content/blog/*.md              ← ブログ記事（frontmatter: title/description/date/tags/published/sourceUrl）
supabase/schema.sql            ← こおりのぬけみち Supabase スキーマ＋RLS（M1）
supabase/lp-schema.sql         ← LP 計測・事前登録スキーマ＋RLS（適用済み）
supabase/blog-comments.sql     ← ブログコメントスキーマ＋RLS（適用済み）
src/games/koori-no-nukemichi/  ← ゲーム本体（core 純TS / data / auth / editor DOM / assets / player Pixi）
public/games/koori-no-nukemichi/placeholders/  ← 仮素材SVG
```

## こおりのぬけみち ゲーム（現状の仕様・制約）
- 段階実装で M0（コア＋Pixi）→ M1（DB＋Google認証＋エディタ）→ M2（`/play` 導線・章解放・3章30ステージ）まで実装済み。詳細経緯はアーカイブ参照。
- 自己完結ディレクトリ `src/games/koori-no-nukemichi/`（core 純TS / data / auth / editor / assets / player）。core は FW 非依存・決定的。
- ルート: `/lab/koori-no-nukemichi`（Coming Soon・本番入口・**不変**）/ `.../m0`（プレビュー、noindex）/ `.../edit`（エディタ、admin限定、noindex）/ `.../play`（遊べる導線、noindex）。本番入口の Coming Soon 差し替えは未実施（要ユーザー確認）。
- Supabase 本番プロジェクト: ref `ayohmfzssjhcziqsvoqn`。スキーマは `supabase/schema.sql`（world/stage/admins＋RLS）/ `supabase/lp-schema.sql` / `supabase/blog-comments.sql`。
- **マイグレーション適用フロー**: `scripts/koori-generate-*.ts` 等で生成した SQL は、Supabase MCP（`mcp__supabase__apply_migration`）で直接適用する。**SQL Editor への手動貼り付けは廃止**。ただし破壊的な migration（列型変更・削除等）は事前にユーザー確認のうえ適用する。
- **★未解決ブロッカー**: `stage.author_moves` 列がDBスキーマ上 `integer` なのに、コード（`supabaseRepository.ts` の `publishStage`/`serializeMoves`/`parseMoves`、`StageRow`）は文字列（方向列 "RDLU"）を扱う型不整合がある。ステージ公開の PATCH が `22P02 invalid input syntax for type integer` で必ず失敗し、published=false のまま。対処: ①本番DB `alter table public.stage alter column author_moves type text using author_moves::text;`（全 null のため非破壊。適用はユーザー確認後）②`supabase/schema.sql` の同列定義も `integer`→`text` に修正。
- **残課題（未完了）**:
  - Vercel に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を登録し、Supabase の Redirect URLs / Site URL を本番ドメインに設定する
  - アート差し込み（現在は仮素材SVG）
  - `?s=<stageId>` 直行受け口（ディープリンク）
  - Coming Soon の正式置換（本番入口差し替え）
  - 章解放の本番3章での実機確認
  - 認証ユーザーの表示名（display_name）保存（第一候補: `profiles` テーブル新設。代替: `stage.created_by_name` 非正規化。方式は着手時に確定）
- **ハマりどころ**: Google OAuth は Client ID/Secret 両方入力＋Save が必須。OAuth リダイレクトは `window.location.origin` 基準（`NEXT_PUBLIC_SITE_URL` は不使用）でSupabase の Redirect URLs に実 origin/ポートのコールバックを登録する必要がある。admins 登録は初回ログイン後、登録後はエディタをリロードしないと admin 判定が更新されない。

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

## ブログ＋LP＋計測基盤
- **ブログ**: `content/blog/*.md`（frontmatter 必須: title/description/date。published:false で下書き、sourceUrl で Zenn 転載表記）→ `/blog` 一覧・`/blog/[slug]`（SSG・dynamicParams=false）。GFM＋シンタックスハイライト（rehype-highlight, github-dark）。SEO: 記事別 OGP／JSON-LD（BlogPosting）／sitemap／RSS `/feed.xml`。記事公開は `post/` ブランチ → main 直接 PR のファストレーン（CLAUDE.md 参照）
- **LP**: `src/data/lp.ts` の配列に足すと `/lp/[slug]` が増える（SSG）。index 許可・sitemap 掲載
- **計測**: 3段ファネル view / cta_click / signup ＋ UTM（sessionStorage 引き継ぎ）＋匿名訪問者ID（localStorage `hoshiorange-lp-visitor`）→ Supabase `lp_event`。事前登録は `lp_signup`（product+email ユニーク、重複は 23505 を「登録済み」表示に変換）。env 無しでは計測 no-op・LP 表示は正常
- **Supabase**: `supabase/lp-schema.sql`（冪等）を本番 ref ayohmfzssjhcziqsvoqn に適用済み。RLS: anon/authenticated insert のみ・select は is_admin() のみ・update/delete 不可
- **ブログコメント**: 記事下に `BlogComments`（クライアント取得、SSG と両立）。名前任意（空=「名無しさん」）＋本文（≤1000字）＋日時表示・即時公開（承認制なし）。`supabase/blog-comments.sql` 適用済み。RLS: select 全員可・insert 開放・delete は is_admin() のみ（スパム削除用）。env 無しは「準備中」表示
- **依存追加**: gray-matter / unified / remark-parse / remark-gfm / remark-rehype / rehype-stringify / rehype-slug / rehype-highlight

## 作業ルール
- `main`・`develop` への直接コミット・プッシュ禁止（feature ブランチは develop から切り、PR は develop 宛て）
- 作業のたびに worklog（`C:\git\note\projects\hoshiorange-official\logs\YYYY-MM-DD_作業名.md`）を作成・更新
- 仕様変更・追加実装の都度このファイルを更新

## マージ後の定例フロー
- PR が develop にマージされたら、`develop` へ切替 → `git pull` で最新化 → マージ済み feature ブランチをローカル・リモートとも削除 → 次の作業は最新 develop から新しい feature ブランチを作成して開始する。リリース（develop → main の PR）はユーザーが判断・実施する。

## 残課題（コンテンツ／コンフィグ系）
- Hero / Contact の文面差し替え（コード内 `{/* TODO: 文面を差し替える */}` 参照。About は廃止済）
- `src/data/links.ts` の URL を埋めて `comingSoon: true` を外す
- 環境変数を本番（Vercel）に登録：`YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` / `NEXT_PUBLIC_X_USERNAME` / `NEXT_PUBLIC_SITE_URL`
- 画像最適化したい場合は YouTube サムネを Next.js Image の最適化対象に戻す（現在 `unoptimized`）
