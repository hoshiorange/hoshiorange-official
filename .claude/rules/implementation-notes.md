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
    twitcasting.ts        ← API v2 配信状況取得。認証 3 段（Bearer ACCESS_TOKEN 優先 → Basic ClientID/Secret → 無ければ { ok: false }）。is_live / current_live / movies
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
  007_youtube-live-status.md
  008_lab-game-koori-and-section-reorder.md
  009_vercel-analytics.md
  010_koori-game-plan.md       ← こおりのぬけみち M0〜M2 計画（別エージェント作成）
  011_supabase-google-setup.md ← ユーザー向け Supabase/Google 手順（別エージェント作成）
  012_koori-game-m0.md         ← こおりのぬけみち M0 実装報告
  013_koori-game-m1.md         ← こおりのぬけみち M1 実装報告（DB＋認証＋エディタ）
  014_koori-m1-honban-yuukouka.md ← こおりのぬけみち M1 本番有効化・検証（schema適用/Google OAuth/admins登録）
supabase/schema.sql            ← こおりのぬけみち Supabase スキーマ＋RLS（M1）
src/games/koori-no-nukemichi/  ← ゲーム本体（core 純TS / data / auth / editor DOM / assets / player Pixi）
public/games/koori-no-nukemichi/placeholders/  ← 仮素材SVG
```

## こおりのぬけみち ゲーム M0（012 / 氷床スライドパズル）
- **目的**: Laboratory 配下のゲームを段階実装（M0 コア＋最小Pixi → M1 DB+エディタ → M2 完成+導線）。計画は `docs/010_koori-game-plan.md`、ユーザー手順は `docs/011_supabase-google-setup.md`、M0 報告は `docs/012`。
- **配置**: 自己完結ディレクトリ `src/games/koori-no-nukemichi/`。`core/`(純TS, FW非依存) `data/`(リポジトリIF＋ローカルアダプタ) `auth/`(IF＋devスタブ) `assets/`(マニフェスト) `player/`(Pixi v8, クライアント専用)。仮素材は `public/games/koori-no-nukemichi/placeholders/`。
- **コア（純TS）**: `types.ts`(タイル 0=氷/1=壁/2=床, Board, StageData) / `board.ts`(encode/decode "111,101,121"・盤外=壁扱い) / `slide.ts`(`computeSlide()`: 壁・縁・床で停止、ゴール停止のみクリア＝通過不可) / `game.ts`(`GameEngine`: move/undo(1手)/reset・手数(実移動のみ)・方向列)。決定的・Node/ブラウザ両対応。`selftest.ts` を `npx tsx` で実行（37 assert）。
- **データ/認証**: `createStageRepository()` / `createAuthProvider()` は env(`NEXT_PUBLIC_SUPABASE_URL`)で実装を選ぶ設計。現状は `LocalStageRepository`(シード3ステージ) と `DevAuthProvider`(isAdmin=true)。**env 無しでも全機能動作**。Supabase/Google 実体は M1。
- **プレイヤー（Pixi v8）**: `BoardRenderer.ts`(描画カプセル化, コア非依存) ＋ `GameApp.tsx`(読込→init→入力→状態) ＋ `KooriGame.tsx`(`next/dynamic ssr:false` ラッパー, Hero3D/ContactVisual と同方針)。キーボード(矢印/WASD)＋スワイプ＋D-pad、滑走 ease-out 補間、`animatingRef` で入力ロック、`prefers-reduced-motion` で即時移動、ミュートSFXフック(`useSfx`)。
- **ルート**: プレビューは `src/app/lab/koori-no-nukemichi/m0/page.tsx`（全画面・夜テーマ固定・`robots:noindex`）。**既存 Coming Soon `/lab/koori-no-nukemichi` は不変**。本番入口差し替えは M2。
- **依存**: `pixi.js@^8`(8.19.0) を追加。`@supabase/supabase-js` は M1。
- **アセットマニフェスト**: `assets/manifest.ts` が論理名(ice/wall/floor/mascot/goal/background/sfx_slide/sfx_stop/sfx_clear)→仮素材パス＋M0暫定カラーをマップ。実素材は同パスにドロップ差し替え。
- **検証**: `npx tsc --noEmit` / `npm run build`（env 無し, 全9ルート, /m0 は Pixi を dynamic 遅延ロードで First Load 約105kB）成功。Playwright で /m0 のクリア動作・コンソールエラー0件・Coming Soon 不変を確認。
- **注意（ブランチ運用）**: 本機能は **main 基点の `feature/koori-no-nukemichi`**（vercel-analytics からは切らない）。docs 010/011 は別エージェントが同ブランチに先行コミット済み（連番衝突回避のため M0 報告は 012 を採番）。

## こおりのぬけみち ゲーム M1（013 / DB＋認証＋エディタ）
- **目的**: M0 のローカル/devスタブ拡張点を実体（Supabase / Google OAuth）＋ステージ作成 UI（エディタ）に差し替える。報告は `docs/013`。コア（`core/`）は不変。
- **データ階層 2階層化**: **world（＝章）→ stage** で確定（中間 chapter は撤廃）。`core/types.ts` の `StageData` を `worldId` 化＋ published / authorMoves / createdBy / createdAt / updatedAt / order を追加。
- **Supabase スキーマ**（`supabase/schema.sql`・冪等）: `world(id,title,"order",published,...)` / `stage(id,world_id,order_in_world,title,width,height,startx,starty,goalx,goaly,data,author_moves,published,created_by,...)` / `admins(user_id)`。`is_admin()`（security definer）＋ RLS（公開行は anon 含め select 可、書き込みは admin のみ、admins は本人 select のみ・書き込み不可）。公開後ロック・published 一方向はアプリ運用で担保（DB 制約なし）。SQL Editor 貼り付け実行。
- **データ層拡張**: `repository.ts` の `StageRepository` を章 CRUD ＋ ステージ CRUD（create/update/**publish**/delete/**duplicate**）に拡張。`LocalStageRepository`（インメモリ全実装）/ `SupabaseStageRepository`（列名は schema 一致・author_moves は "RDLU" 直列化・公開後は盤面パッチ無視）の2実装。`seed.ts` は 1章＋3ステージに2階層化。
- **Supabase クライアント**（`supabaseClient.ts`）: `supabase-js` を**トップレベル import せず動的 import**（env 無しでは初期バンドルに含めない＝/m0 を太らせない）。env ガード＋ PKCE / persistSession / detectSessionInUrl のシングルトン。
- **アダプタ選択**: `createStageRepository()` / `createAuthProvider()` が `hasSupabaseEnv()`（`NEXT_PUBLIC_SUPABASE_URL` ＋ `NEXT_PUBLIC_SUPABASE_ANON_KEY`）で Local/Dev↔Supabase を切替。**env 無しでも全機能動作**。
- **認証**（`auth/supabaseAuth.ts`）: Google OAuth（`signInWithOAuth` PKCE・リダイレクト）。コールバックは `app/lab/koori-no-nukemichi/auth/callback/page.tsx` がクライアント側で `getSession()` を待って確定 → エディタへ `replace`（SPA 推奨フロー）。`isAdmin` は admins テーブルの本人 select で判定。
- **DOM エディタ**（`editor/`・Pixi 非依存・CSS Modules）: `KooriEditor`（`next/dynamic ssr:false`）→ `EditorApp`（admin ガード／章一覧＋章 CRUD）→ `StageEditor`（タイル塗り・S/G 配置・リサイズ全クリア・テストプレイ・下書き保存／公開・公開後ロック／複製・削除）。`EditorGrid`（編集・テスト兼用 DOM グリッド）／`TestPlay`（core の `GameEngine` で実プレイ）。**マリオメーカー方式**＝作成者がテストプレイで実クリアして初めて公開解放（その方向列＝author_moves を保存。盤面を変えたら再テスト必須）。
- **ルート**: エディタ `app/lab/koori-no-nukemichi/edit/page.tsx`（全画面・夜固定・noindex・一般導線からリンクしない）。**既存 Coming Soon `/lab/koori-no-nukemichi` と `/m0` は不変**。
- **依存**: `@supabase/supabase-js@^2.108.2` を追加（M0 で保留していたもの）。
- **統合**: 2 worktree（M1-code / M1-SQL, 782af53 基点）を ff-only マージ＋ cherry-pick で linear 統合。最終 HEAD `e2b7e79`。worktree・一時ブランチは後片付け済み。
- **検証**: `npx tsc --noEmit`（要 `npm install` で supabase-js 取得）／`npm run build`（env 無し・全11ルート、/edit ≈2.16kB・/auth/callback ≈995B）／コア自己テスト 37 passed。dev/ライブ Supabase 接続は本番スキーマ未適用のため未実施。
- **残課題**: 本番認証は Supabase 側で schema 適用＋自分の UID を admins 登録＋ Google プロバイダ設定＋ Vercel env（`NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY`）登録が揃って有効化。列名突き合わせの本番疎通は未検証。公開ステージをプレイヤーに繋ぐ導線・本番入口差し替えは M2。

## こおりのぬけみち M1 本番有効化・検証（014）
- **目的**: M1 残課題（本番認証の有効化／列名突き合わせの本番疎通確認）を解消。コードは無変更、env と Supabase/Google 設定のみで有効化。報告は `docs/014`。
- **対象 Supabase プロジェクト**: ref `ayohmfzssjhcziqsvoqn`（URL `https://ayohmfzssjhcziqsvoqn.supabase.co`）。`supabase/schema.sql`（冪等）をマイグレーション `koori_no_nukemichi_schema` として適用済み。world/stage/admins＋RLS 9本＋`is_admin()`/`set_updated_at()`＋updated_at トリガ2本＋index5本。`get_advisors` は ERROR 0 件（WARN は設計意図通り／空テーブル由来で軽微）。
- **env**: `.env.local` に `NEXT_PUBLIC_SUPABASE_URL`（ref ayohmfzssjhcziqsvoqn）＋ `NEXT_PUBLIC_SUPABASE_ANON_KEY`＝**新形式 publishable キー** `sb_publishable_...`（supabase-js ^2.108 で対応）。service_role は置かない。
- **管理人登録**: Google ログイン後の本人（email `kei21.orange@gmail.com` / provider google）UID = `6b27d4ed-27b7-4223-ac59-87b70f0866a5` を `admins` に登録済み（1行）。
- **本番疎通検証（合格部分）**: 本番アプリのエディタからの実通信で **列名突き合わせ OK**（world POST 201 / stage POST 201×2 / world PATCH 200 / GET 200）、**RLS 疎通 OK**（anon の公開行 select 可・未公開 stage/admins 不可視・anon 書き込みは 42501 拒否、すべて rollback 付き検証）、**章公開 OK**、**ステージ作成 OK**（created_by=管理人 UID / 座標 / FK 整合）。詳細は `docs/014`。
- **★公開ブロッカー（M1 未完）**: `stage.author_moves` 列がスキーマ上 **`integer`** なのに、コード（`supabaseRepository.ts` の `publishStage`/`serializeMoves`、`StageRow`、`parseMoves`）は**文字列**（方向列 "RDLU"）を扱う型不整合。→ ステージ公開の PATCH が必ず失敗（`22P02 invalid input syntax for type integer`）し、stage は published=false / author_moves=null のまま。**対処**: ①本番 DB `alter table public.stage alter column author_moves type text using author_moves::text;`（全 null＝非破壊・適用可否ユーザー確認中）②`supabase/schema.sql` の同列を `integer`→`text` に正本修正（コード/SQL 編集＋コミット案件・別タスク）＋公開を再検証。これが **M1 完了の最後の 1 ピース**。補足: `createStage` が `order_in_world` 未指定で 0（並び不定・軽微）。
- **ハマりどころ（要点）**: (A) Google プロバイダはトグル ON だけでなく **Client ID/Secret 両方入力＋Save 必須**（Auth ログの「設定リロード」で保存反映を判別）。(B) OAuth リダイレクトは `window.location.origin` 基準で、**`NEXT_PUBLIC_SITE_URL` は使われない** → Supabase の Redirect URLs に**実 origin/ポート**のコールバック（`.../lab/koori-no-nukemichi/auth/callback`）を登録。(C) admins 登録は**初回ログイン後**かつ登録後は**エディタをリロード**しないと admin 判定が更新されない。(D) dev は既定 3000、埋まっていると 3001 が自動選択されるので Redirect URLs は実ポートに合わせる。詳細は `docs/011` のトラブルシュート節にも追記。
- **Vercel 残作業**: Vercel に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 登録。Supabase の Redirect URLs / Site URL を本番ドメインに設定。公開ステージのプレイヤー導線・本番入口差し替えは M2。
- **M2 要件メモ（記録のみ・未実装）**: 認証ユーザの**表示名 display_name 保存**。用途は公開ステージの作者名表示（anon からも見せたい／現状 `stage.created_by` は UID のみ）。第一候補＝`profiles` テーブル新設（`user_id`→`display_name`、`auth.users` 作成時トリガで自動投入、anon は display_name select 可、プロフィール拡張も載せやすい＝Supabase 標準）。代替＝`stage.created_by_name` 非正規化（最小だが名前変更追従せず）。最終方式は M2 着手時に確定。詳細は `docs/014` の「M2 要件メモ」。

## こおりのぬけみち M2 P2（遊べる導線・章解放・30ステージ）
- **目的**: 公開ステージを一般ユーザーが遊べる `/play` ルートを新設。M1 の公開ブロッカー（author_moves 型不整合）を修正し、本番 DB に 3 章 30 ステージを投入。
- **新ルート**: `src/app/lab/koori-no-nukemichi/play/page.tsx`（全画面・夜固定・noindex）。`KooriPlay`（`next/dynamic ssr:false` ラッパー）→ `GameShell`（章選択→ステージ選択→プレイ遷移）。**既存 Coming Soon・/m0・/edit は不変**。本番入口差し替え（P7）はユーザー確認後。
- **GameShell** (`player/GameShell.tsx` + `GameShell.module.css`): worldSelect → stageSelect → play の 3 状態を内部 state で管理。公開データのみ取得（`listWorlds(false)` / `listStages(worldId, false)`）。プレイ中は `GameApp` に `stage` / `onExit` / `onCleared` / `onSelectNext` を渡して委譲。
- **WorldSelect** (`player/WorldSelect.tsx`): 章ボタン一覧。各章の `locked`・`clearedCount`・`total` を受け取りロック表示・進捗表示。
- **StageSelect** (`player/StageSelect.tsx`): ステージボタン一覧。クリア済みステージに ✓ 印。一覧内 index で選択を返す（次ステージ遷移に使用）。
- **progress.ts** (`player/progress.ts`): クリア済みステージ id を `localStorage`（キー `koori-no-nukemichi:cleared`）に永続化。`loadClearedIds()` / `markCleared(stageId)` の 2 API。SSR（window 不在）・プライベートモード（保存失敗）を安全にガード。
- **章解放判定**: 第 1 章は常時解放。直前章の公開ステージを全クリアで次章が解放（`GameShell` 内 useMemo で算出）。`WorldSelect` はロック中の章を `disabled` + くすみ表示。
- **GameApp 汎用化** (`player/GameApp.tsx`): `stage?: StageData`（直接渡し）/ `stageId?: string`（ID 指定・/m0 互換）のどちらでも動作する props に変更。`onExit` 未指定時は `/#lab` への Link にフォールバック（/m0 後方互換）。`onCleared(stageId)` / `onSelectNext` を追加し GameShell と連携。
- **/m0 の env 非依存化**: M1 前は `createStageRepository()`（env で分岐）を使っていたが、env 有時に Supabase リポジトリを呼び出し存在しないステージ ID `s1` への 400 エラーが発生していた。`/m0` の `GameApp` からは `createStageRepository` を外し `LocalStageRepository` 直接使用に変更（env の有無に関係なくシードの `s1` を常に参照）。
- **supabaseRepository の order 自動採番**: M1 の `createStage` は `order_in_world` 未指定で 0 固定になる問題があった。章内の既存最大 `order_in_world + 1` を採番するロジックを追加（`LocalStageRepository` との挙動統一）。
- **本番 DB（3章 30ステージ投入）**: 第1層「つららの回廊」（4×4〜5×5, 易〜中）/ 第2層「氷結の迷宮」（5×5〜6×6, 中〜難）/ 第3層「極氷の試練」（6×6〜7×7, 難）各 10 ステージ。第3層は開放盤・唯一解（最短一意＋近接別解なし・avgSlide ≈ 3.2〜5.1）。管理人 UID `6b27d4ed-...` で全ステージを公開済み。
- **ステージ生成スクリプト** (`scripts/koori-generate-stages.ts` / `koori-emit-sql.ts` / `koori-generate-chapter3.ts` / `koori-emit-chapter3-sql.ts`): 章 1・2 と章 3 で別ジェネレータ（難易度方針の違い）。`npx tsx` で実行、SQL を stdout に吐いて Supabase SQL Editor に貼り付け。`koori-calibrate.ts`（構文エラーの検証用使い捨て）は削除済み。
- **検証**: `npx tsc --noEmit` 0 エラー。
- **残課題**: アート差し込み（仮素材 SVG 使用中）、`?s=<stageId>` 直行受け口（ディープリンク）、Coming Soon 正式置換（P7・本番入口差し替え）、章解放の本番 3 章実機確認。
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
- `main`・`develop` への直接コミット・プッシュ禁止（feature ブランチは develop から切り、PR は develop 宛て）
- 作業のたびに worklog（`C:\git\note\worklog\hoshiorange-official\YYYY-MM-DD_作業名.md`）を作成・更新（旧 docs/NNN は廃止）
- 仕様変更・追加実装の都度このファイルを更新

## マージ後の定例フロー
- PR が develop にマージされたら、`develop` へ切替 → `git pull` で最新化 → マージ済み feature ブランチをローカル・リモートとも削除 → 次の作業は最新 develop から新しい feature ブランチを作成して開始する。リリース（develop → main の PR）はユーザーが判断・実施する。

## 残課題（コンテンツ／コンフィグ系）
- Hero / Contact の文面差し替え（コード内 `{/* TODO: 文面を差し替える */}` 参照。About は廃止済）
- `src/data/links.ts` の URL を埋めて `comingSoon: true` を外す
- （メール窓口を復活させる場合は `profile.contactEmail` を再追加。005 で未使用のため削除済）
- 環境変数を本番（Vercel）に登録：`YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` / `NEXT_PUBLIC_X_USERNAME` / `NEXT_PUBLIC_SITE_URL`
- 画像最適化したい場合は YouTube サムネを Next.js Image の最適化対象に戻す（現在 `unoptimized`）
