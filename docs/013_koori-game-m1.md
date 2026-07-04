# 013 こおりのぬけみち Milestone 1（DB＋認証＋エディタ）実装報告

> 計画の全体像（M0〜M2＋フェーズ2）は `docs/010_koori-game-plan.md`、ユーザー向けの
> Supabase/Google セットアップ手順は `docs/011_supabase-google-setup.md`、
> M0（コア＋最小Pixiプレイヤー）の報告は `docs/012_koori-game-m0.md` を参照。
> 本ドキュメントは **M1 の実装・統合・検証・完了報告**（実装担当）。

## 概要
「こおりのぬけみち」の **M1** を実装した。M0 のローカル/devスタブで用意した拡張点を、
実体（Supabase / Google OAuth）とステージ作成 UI（エディタ）に差し替える。範囲は次の4つ:

1. **データ階層の2階層化** … `world`（＝章）→ `stage` の2段に確定（中間の chapter 階層は撤廃）。
2. **Supabase スキーマ＋RLS**（`supabase/schema.sql`）… `world` / `stage` / `admins` の3テーブル、RLS、`is_admin()`。
3. **Supabase アダプタ＋ Google OAuth 認証** … env でローカル↔Supabase を切替。`supabase-js` は遅延ロード。
4. **管理者向け DOM エディタ**（`/lab/koori-no-nukemichi/edit`）… 章・ステージの CRUD、盤面編集、テストプレイ、マリオメーカー方式の公開。

設計の核（010 計画 / M0 の方針を継承）:
- コア（`core/`）は純TSのまま不変。エディタもテストプレイも core の `encode/decode` と `GameEngine` を再利用（描画は DOM、Pixi 非依存）。
- データ層・認証は M0 と同じ IF を保ち、**env の有無で実装だけ差し替え**。**env 無しでもビルド＆全機能動作**（ローカルはインメモリ）。
- `supabase-js` は **トップレベル import せず動的 import**。env 無しの環境では初期バンドルに含まれず、既存 `/m0` プレイヤーの初期ロードを太らせない。
- 公開導線（`/lab/koori-no-nukemichi` の Coming Soon、`/m0` プレビュー）は **M1 でも変更しない**。エディタは noindex の専用ルート。

## M1 実施チェックリスト（実行ログ）
- [x] 2つの worktree ブランチ（M1-code / M1-SQL、いずれも 782af53 基点）を `feature/koori-no-nukemichi` へ統合
  - [x] `git merge --ff-only`（M1-code, 3e3fb99）で fast-forward
  - [x] `git cherry-pick`（M1-SQL, supabase/schema.sql 1ファイル）— 衝突なし
- [x] データ階層を **2階層（world=章 → stage）** に確定。`core/types.ts` の `StageData` を `worldId` 化（旧 chapter 参照を撤廃）＋公開系フィールド（published / authorMoves / createdBy / createdAt / updatedAt）を追加
- [x] `supabase/schema.sql`: world / stage / admins ＋ index ＋ `updated_at` トリガ ＋ `is_admin()` ＋ RLS ポリシー（公開行は anon 含め select 可、書き込みは admin のみ、admins は本人 select のみ・書き込み不可）
- [x] データ層 IF（`repository.ts`）を章 CRUD ＋ ステージ CRUD（create/update/publish/delete/duplicate）に拡張。`LocalStageRepository` / `SupabaseStageRepository` 両実装
- [x] `supabaseClient.ts`: env ガード＋ `supabase-js` 動的 import のシングルトンクライアント（PKCE / persistSession / detectSessionInUrl）
- [x] 認証: `SupabaseAuthProvider`（Google OAuth リダイレクト＋ admins 判定）。`createAuthProvider()` が env で Dev↔Supabase を選択
- [x] OAuth コールバック受け口 `app/lab/koori-no-nukemichi/auth/callback/page.tsx`（クライアント側でセッション確定 → エディタへ戻す）
- [x] DOM エディタ（`editor/`）: タイル塗り（クリック＋ドラッグ）/ スタート・ゴール配置 / リサイズ（全クリア）/ テストプレイ / 作成者クリアで公開解放（author_moves 保存）/ 下書き保存・公開 / 公開後の盤面ロック・複製 / 章 CRUD
- [x] エディタルート `app/lab/koori-no-nukemichi/edit/page.tsx`（全画面・夜固定・noindex、admin はクライアント側でガード）
- [x] `@supabase/supabase-js@^2.108.2` を依存に追加（`npm install` で取得）
- [x] `npx tsc --noEmit` 成功 / `npm run build` 成功（env 無し・全11ルート） / コア自己テスト 37 passed
- [x] worktree / 一時ブランチを後片付け（remove --force → prune → branch -D）

## ディレクトリ / 主要ファイル（M1 追加・変更）
```
supabase/
  schema.sql          ★新規  world/stage/admins ＋ RLS ＋ is_admin()（Supabase SQL Editor 用）
src/games/koori-no-nukemichi/
  core/
    types.ts          変更  StageData を worldId 化（chapter 撤廃）＋ published/authorMoves/createdBy/createdAt/updatedAt 追加
  data/
    repository.ts     変更  World/StageSummary/各 Input・Patch 型 ＋ StageRepository を章CRUD＋ステージCRUD（publish/duplicate 含む）に拡張
    localRepository.ts 変更  上記 IF をインメモリで全実装（公開ロック・配下削除・複製を含む）
    seed.ts           変更  2階層化（seedWorlds 1章 ＋ seedStages 3ステージに published/authorMoves 付与）
    supabaseClient.ts ★新規  env ガード＋ supabase-js 動的 import のシングルトン（PKCE）
    supabaseRepository.ts ★新規  StageRepository の Supabase 実装（列名は schema.sql と一致、author_moves は "RDLU" 直列化）
    index.ts          変更  createStageRepository() が hasSupabaseEnv() で Local↔Supabase を選択
  auth/
    supabaseAuth.ts   ★新規  Google OAuth（リダイレクト）＋ admins テーブル参照で isAdmin 判定
    index.ts          変更  createAuthProvider() が env で Dev↔Supabase を選択
  editor/             ★新規ディレクトリ（DOM / CSS Modules・Pixi 非依存）
    KooriEditor.tsx   next/dynamic ssr:false ラッパー（ルートはサーバーコンポーネントのまま）
    EditorApp.tsx     取りまとめ。admin ガード／章一覧＋章 CRUD／ステージ編集の切替
    StageEditor.tsx   盤面編集・テストプレイ・下書き保存／公開・公開後ロック・複製・削除
    EditorGrid.tsx    編集／テスト兼用の DOM グリッド（色タイル＋S/G／マスコット、塗り）
    TestPlay.tsx      core の GameEngine で実プレイ。クリアで方向列を親へ返す（公開解放）
    editor.module.css エディタUIスタイル
src/app/lab/koori-no-nukemichi/
  edit/page.tsx          ★新規  エディタルート（noindex・admin はクライアントガード）
  auth/callback/page.tsx ★新規  Google OAuth コールバック受け口（クライアント側でセッション確定）
```

## 実装メモ
### データ階層の2階層化（`core/types.ts` / `repository.ts`）
- 階層は **world（＝章）→ stage** の2段で確定。中間の chapter は持たない。`StageData.worldId` で章に紐づく。
- `StageData` に公開系を追加: `published`（true=公開 / false・undefined=下書き）、`authorMoves`（作成者の実クリア手順＝公開根拠）、`createdBy` / `createdAt` / `updatedAt`、章内並び順 `order`。
- IF（`repository.ts`）に `World` / `StageSummary` / `WorldInput` / `WorldPatch` / `CreateStageInput` / `StagePatch` を定義。`StageRepository` は章 CRUD（list/get/create/update/delete）＋ステージ CRUD（list/get/create/update/**publish**/delete/**duplicate**）。

### Supabase スキーマ＋RLS（`supabase/schema.sql`）
- 冪等（`create ... if not exists` / `create or replace` / `drop policy if exists → create policy`）。Supabase ダッシュボード > SQL Editor に全文貼り付けて実行する想定。
- `world(id, title, "order", published, ...)` / `stage(id, world_id, order_in_world, title, width, height, startx, starty, goalx, goaly, data, author_moves, published, created_by, ...)` / `admins(user_id)`。`order` は予約語のためクォート。
- `is_admin()`（security definer・search_path 固定・stable）が `auth.uid()` の admins 在籍を返す。anon/authenticated に execute 付与。
- RLS: world / stage は **公開行（published=true）は誰でも select 可**、未公開 select と insert/update/delete は `is_admin()` のみ。admins は **本人行のみ select 可・書き込みポリシー無し**（管理人登録は SQL Editor / service_role から手動）。
- **公開後の盤面ロック・published の一方向**はアプリ運用ルールとして実装側で守る（DB 制約は付けない）。

### Supabase アダプタ＋遅延ロード（`supabaseClient.ts` / `supabaseRepository.ts` / `index.ts`）
- `createStageRepository()` / `createAuthProvider()` は `hasSupabaseEnv()`（`NEXT_PUBLIC_SUPABASE_URL` ＋ `NEXT_PUBLIC_SUPABASE_ANON_KEY`）で実装を選ぶ。env 無し＝Local/Dev、有り＝Supabase。
- `supabase-js` は `getSupabaseClient()` 内の **動的 import** に遅延（トップレベル import しない）。env 無しの環境ではロードされず初期バンドルに含まれない。
- 列名は schema.sql と突き合わせ（`startx`/`goalx` 等の小文字列・`order_in_world`・`author_moves`）。`author_moves` は方向列を `"RDLU"` のコンパクト文字列に直列化して保存・復元。
- `updateStage` は現在の `published` を見て**公開後は盤面系パッチを無視**（メタ＝title/order のみ反映）。`publishStage` は authorMoves 空ならエラー。`deleteStage` は公開済みを拒否。`duplicateStage` は下書きとして複製。

### Google OAuth ＋ admins 判定（`supabaseAuth.ts` / `auth/callback`）
- `signIn()` は `signInWithOAuth({ provider: 'google', redirectTo: <origin>/lab/koori-no-nukemichi/auth/callback })`（PKCE・リダイレクト方式）。
- コールバックページはクライアント側で `getSession()` を待ってセッションを確定（`detectSessionInUrl` が URL のコードを交換）→ エディタへ `replace`。Supabase の SPA 推奨フロー（サーバー Route Handler を使わない）。
- `getSession()` は `auth.getUser()` のユーザー＋`isAdmin`（admins テーブルに自分の user_id 行があるか＝RLS の本人 select で取得）を返す。

### DOM エディタ（`editor/`）
- `EditorApp` がクライアント側で admin 判定（`createAuthProvider().getSession().isAdmin`）。非 admin はログイン誘導、dev スタブでは常に admin。`next/dynamic ssr:false`（`KooriEditor`）で遅延ロードし、ルートはサーバーコンポーネントのまま。
- 章一覧＋章 CRUD（作成／改名／公開トグル／削除＝配下ステージごと）。ステージは章内に下書き／公開の別で一覧。
- `StageEditor`: タイルパレット（こおり/かべ/ゆか）をクリック＋ドラッグで塗り、スタート(S)/ゴール(G) を各1配置。サイズ変更（2〜15、確認の上で全クリア）。core の `encode/decode` で `"111,101,121"` と相互変換。
- **マリオメーカー方式の公開**: `TestPlay`（core の `GameEngine`）で作成者が実クリア → その時の方向列と盤面シグネチャを記録。`canPublish` は「未ロック かつ クリア済み かつ 盤面が当時と同一」。盤面を変えると再テストが必要。公開時に `author_moves` を保存し published=true。
- **公開後ロック**: `published` のステージは盤面編集不可（メタのみ）。盤面を変えたい場合は「複製して作り直す」で新規下書き化。下書きのみ削除可。
- `EditorGrid` は編集・テスト兼用の DOM グリッド（色タイル＋S/G＋マスコット、pointer で塗り）。`TestPlay` は矢印/WASD/D-pad ＋ Esc で閉じる。

## 統合・確認結果
- 統合: `feature/koori-no-nukemichi`（782af53）→ M1-code を **ff-only マージ**（3e3fb99）→ M1-SQL を **cherry-pick**（schema.sql）。衝突なし。最終 HEAD = `e2b7e79`。
- `@supabase/supabase-js` が node_modules 未取得だったため `npm install`（8パッケージ追加。package.json/lock は M1-code 由来で既にコミット済み）。
- `npx tsc --noEmit`: 成功（exit 0）。
- `npm run build`: 成功（env=.env.local 検出・接続は無し / 全11ルート）。新規 `/lab/koori-no-nukemichi/edit` ≈ 2.16 kB（First Load ≈ 105 kB）、`/auth/callback` ≈ 995 B（≈ 104 kB）。既存 `/lab/koori-no-nukemichi`（Coming Soon）と `/m0` は不変。
- コア自己テスト（`npx tsx src/games/koori-no-nukemichi/selftest.ts`）: **37 passed / 0 failed**。
- dev サーバ起動／ライブ Supabase 接続テストは未実施（本番スキーマ未適用のため不要。tsc / build / selftest のグリーンのみ確認）。

## env 有無の挙動
| 状況 | リポジトリ | 認証 | 備考 |
|---|---|---|---|
| env 無し | `LocalStageRepository`（シード3ステージ・インメモリ） | `DevAuthProvider`（isAdmin=true） | 全機能動作。変更はリロードで消える。`supabase-js` は読み込まれない |
| env 有り（`NEXT_PUBLIC_SUPABASE_URL` ＋ `NEXT_PUBLIC_SUPABASE_ANON_KEY`） | `SupabaseStageRepository` | `SupabaseAuthProvider`（Google OAuth ＋ admins 判定） | 書き込みは RLS で admin のみ。スキーマ適用＋admins 登録が前提 |

## 残課題
- **本番認証の有効化**: Supabase 側で `supabase/schema.sql` を適用し、Google ログイン後に自分の UID を `admins` へ登録（手順は schema.sql 冒頭 / `docs/011`）。これが済むまで本番では非 admin 扱い。
- **env 登録**: Vercel に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を登録。Supabase の Auth に Google プロバイダ設定＋コールバック URL 許可。
- **列名突き合わせの本番疎通確認**: コード上は schema.sql と一致させているが、実テーブルに対する読み書き（公開フィルタ・author_moves 直列化など）はライブで未検証。
- **プレイヤー側の導線（M2）**: 公開ステージを Supabase から読んで `/m0`（または本番入口）で遊ぶ導線、Coming Soon の本番入口差し替え、ランキング等はフェーズ2。

## 完了報告
M1 を完了。2つの worktree ブランチ（TSコード一式 / SQL）を `feature/koori-no-nukemichi` に linear（ff-only ＋ cherry-pick）で統合し、最終 HEAD `e2b7e79`。
データ階層を2階層（world→stage）に確定し、Supabase スキーマ＋RLS、env 切替の Supabase アダプタ（supabase-js 遅延ロード）、Google OAuth＋admins 判定、マリオメーカー方式の DOM エディタ（公開後ロック・複製・章 CRUD）を実装。
`tsc` / `build`（env 無し全11ルート）/ コア自己テスト（37 passed）いずれもグリーン。worktree・一時ブランチは後片付け済み。
本番での認証・永続化は Supabase スキーマ適用＋admins 登録＋ Vercel env 登録が揃えば有効になる（M2 でプレイヤー側の導線を接続）。

### ユーザーがやること
- `docs/011_supabase-google-setup.md` と `supabase/schema.sql` 冒頭の手順で Supabase / Google OAuth を準備（スキーマ適用＋自分の UID を admins 登録）。
- Vercel に Supabase の公開 env を登録。
- 本ブランチ（`feature/koori-no-nukemichi`）の PR マージ判断（マージは手動 squash）。
