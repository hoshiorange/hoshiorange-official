# 014 こおりのぬけみち M1 本番有効化・検証

> 計画の全体像（M0〜M2＋フェーズ2）は `docs/010_koori-game-plan.md`、ユーザー向けの
> Supabase/Google セットアップ手順は `docs/011_supabase-google-setup.md`、
> M1 の実装・統合報告は `docs/013_koori-game-m1.md` を参照。
> 本ドキュメントは **M1 の「本番有効化（Supabase 本番プロジェクトへのスキーマ適用・Google OAuth 有効化・
> 管理人登録）と本番疎通検証」** の作業記録（実装担当）。コード（`core/` ほか）には変更を加えていない。

## 概要
M1 で実装した Supabase / Google OAuth / DOM エディタを、**実際の Supabase 本番プロジェクトに対して有効化**し、
本番アプリのエディタで「章 → ステージ作成 → テストプレイ → 公開」までの一連と RLS の動作を検証した。
M1 の残課題だった「本番認証の有効化」「列名突き合わせの本番疎通確認」のうち、**列名・RLS・認証・章公開・ステージ作成は合格**。
一方、**検証の過程でステージ「公開」を成立させられない重大バグ（`stage.author_moves` の型不整合）を検出**したため、
**M1 はまだ「完了」ではない**。本バグの修正（本番 DB の ALTER ＋ `supabase/schema.sql` の修正）＋再検証が M1 完了の最後の 1 ピースとなる。

要点:
- **対象 Supabase プロジェクト**: ref `ayohmfzssjhcziqsvoqn`（URL `https://ayohmfzssjhcziqsvoqn.supabase.co`）。
- `supabase/schema.sql`（冪等）をマイグレーション `koori_no_nukemichi_schema` として適用。
- Google OAuth プロバイダを有効化し、管理人（`kei21.orange@gmail.com`）の UID を `admins` に登録。
- 本番アプリ（ローカル dev から本番 Supabase に接続）で疎通検証を実施。
- **コードは無変更**（本記録時点）。env と Supabase / Google 側の設定のみで有効化作業を進めた。
- **公開ブロッカー**: `stage.author_moves` がスキーマ上 `integer` 型なのに、コードは文字列（方向列 "RDLU"）を読み書きするため、ステージ公開時の PATCH が必ず失敗する。型を `text` に直す対応が必要（対応中／別タスク）。

## 実施プラン（チェックリスト）
- [x] Supabase 本番プロジェクト（ref `ayohmfzssjhcziqsvoqn`）に `supabase/schema.sql` を適用（マイグレーション名 `koori_no_nukemichi_schema`）
  - [x] world / stage / admins テーブル作成（全 RLS 有効）
  - [x] RLS ポリシー 9 本（world 4・stage 4・admins 1）
  - [x] 関数 `is_admin()`（security definer）/ `set_updated_at()`、updated_at トリガ 2 本、インデックス 5 本
  - [x] `get_advisors` で ERROR 0 件を確認（WARN は設計意図通り／軽微であることを確認）
- [x] 環境変数（`.env.local`）を本番 Supabase 用に設定
  - [x] `NEXT_PUBLIC_SUPABASE_URL`（ref `ayohmfzssjhcziqsvoqn`）
  - [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`（新形式の publishable キー `sb_publishable_...`、supabase-js ^2.108 で対応）
  - [x] service_role キーは置かない（クライアント公開 env には載せない）
- [x] Google OAuth を有効化（Supabase Authentication → Providers → Google）
  - [x] Client ID / Client Secret を両方入力し **Save**（保存反映を Auth ログで確認）
  - [x] Supabase の Callback URL を Google Cloud の「承認済みリダイレクト URI」に登録
  - [x] Redirect URLs（Authentication → URL Configuration）に dev origin のコールバックを登録
- [x] 初回 Google ログインを実行し `auth.users` に本人行を作成
- [x] 管理人 UID を `admins` に登録（`insert ... on conflict do nothing`、1 行）
- [x] 本番疎通検証（合格部分）
  - [x] 列名突き合わせ（world / stage の POST・PATCH・GET が 200/201・列ミスマッチ無し）
  - [x] RLS 疎通（anon の公開行 select 可・未公開 stage / admins は不可視・anon の書き込みは 42501 で拒否）
  - [x] 章（world）の公開
  - [x] ステージ作成（stage 2 件・created_by / 座標 / FK 整合）
- [ ] **ステージ「公開」の疎通**（`stage.author_moves` の型不整合バグで未成立。型修正＋再検証待ち。下記「★検出した重大バグ」参照）
- [ ] **M1 完了**（ステージ公開ブロッカーの解消が最後の 1 ピース。`stage.author_moves` の型修正＋再検証で M1 完了とする）

## 実施内容

### 1. Supabase 本番プロジェクトへのスキーマ適用
- 対象プロジェクト ref: **`ayohmfzssjhcziqsvoqn`**（URL `https://ayohmfzssjhcziqsvoqn.supabase.co`）。
- `supabase/schema.sql`（冪等）をそのままマイグレーション **`koori_no_nukemichi_schema`** として適用。
- 作成物:
  - テーブル: `world` / `stage` / `admins`（いずれも RLS 有効）。
  - RLS ポリシー **9 本**（world 4・stage 4・admins 1）。
  - 関数: `is_admin()`（security definer）/ `set_updated_at()`。
  - トリガ: `updated_at` 自動更新を world / stage に 2 本。
  - インデックス 5 本。
  - 拡張 `pgcrypto` は既存で有効済みのため no-op。
- アドバイザー（`get_advisors`）: **ERROR は 0 件**。WARN は以下のいずれかで、いずれも放置可と判断:
  - `is_admin()` を anon / authenticated が実行可能 … RLS ポリシーから呼ぶための意図的な付与。
  - `set_updated_at()` の `search_path` 未固定 … トリガ専用関数で軽微。
  - `admins_select_self` が `auth.uid()` を行ごとに評価 … admins は極小テーブルで実害なし。
  - 未使用インデックス … 適用直後でテーブルが空のため（データ投入後は解消）。

### 2. 環境変数（`.env.local`）
| 変数名 | 値の種別 | 備考 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ayohmfzssjhcziqsvoqn.supabase.co` | ref `ayohmfzssjhcziqsvoqn` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 新形式 publishable キー `sb_publishable_...` | supabase-js ^2.108 で対応。従来の JWT 形式 anon key の後継 |
| `NEXT_PUBLIC_SITE_URL` | ローカル検証時は `http://localhost:3001`（最終的には 3000 を使用） | metadataBase / sitemap / robots 用。**OAuth リダイレクトには使われない**（後述 (B)） |

- `service_role` キーは `.env.local` に置かない（クライアント公開 env に秘密鍵を載せない。正しい運用）。
- `hasSupabaseEnv()` が `NEXT_PUBLIC_SUPABASE_URL` ＋ `NEXT_PUBLIC_SUPABASE_ANON_KEY` の両方を見て
  Supabase アダプタに切り替わる（env が揃ったので本番接続モードになる）。

### 3. Google OAuth 有効化 ＋ 管理人登録
- Supabase Authentication → Providers → Google を有効化（詳細・ハマりどころは下記「トラブルシュート」(A)）。
- Supabase の Callback URL `https://ayohmfzssjhcziqsvoqn.supabase.co/auth/v1/callback` を
  Google Cloud の OAuth クライアント「承認済みリダイレクト URI」に登録。
- アプリで初回 Google ログインを実行 → `auth.users` に本人行が作成されたことを確認:
  - email: `kei21.orange@gmail.com` / provider: google / 表示名: `K Nishida (hoshiorange)`
  - **UID = `6b27d4ed-27b7-4223-ac59-87b70f0866a5`**
- その UID を `admins` に登録（`insert into admins (user_id) values ('6b27d4ed-27b7-4223-ac59-87b70f0866a5') on conflict (user_id) do nothing;`、1 行）。
- 登録後、エディタ画面を**リロード**して `isAdmin` 判定が true になることを確認（下記 (C)）。

### 4. 本番疎通検証
本番アプリ（ローカル dev → 本番 Supabase 接続）のエディタで「章 → ステージ作成 → テストプレイ → 公開」を試行し、
Supabase 側でデータ保存・RLS・列名突き合わせを検証した。**合格した部分**と、**検出した重大バグ（公開ブロッカー）**は次のとおり。

#### 合格した部分
- **列名突き合わせ OK**: エディタからの API ログで world POST 201 / stage POST 201 ×2 / world PATCH 200 / 各 GET 200。
  `SupabaseStageRepository` とスキーマの列名ミスマッチは無し。
- **RLS 疎通 OK（anon 視点・すべて rollback 付きで検証）**:
  - anon の読み取り → world = 1（公開のみ可視）/ stage = 0（未公開は不可視）/ admins = 0（不可視）。
  - anon の書き込み（`insert into world`）→ **ERROR 42501 row-level security policy violation** で拒否。
  - いずれも期待どおり。
- **ground truth（service role で確認）**:
  - world 1 件（published=true「第1層」order 0、※world に `created_by` 列は無い＝設計どおり）。
  - stage 2 件（いずれも `created_by` = `6b27d4ed…` の UID 一致、`data_len` 55/59 で妥当、start/goal は盤内、`world_id` は FK 整合）。
  - admins 1 件。
- **認証ログ**: 書き込み時の RLS 拒否・4xx 無し（正規フローはクリーン）。

#### ★検出した重大バグ（M1 完了前に要修正・公開ブロッカー）
- **症状**: 作成した stage 2 件が両方 `published=false` / `author_moves=null` のまま＝**ステージ「公開」が成立していない**
  （公開できたのは章 world のみ）。API ログ上、stage への PATCH（公開更新）は **0 件**。
- **根本原因**: スキーマ `stage.author_moves` 列が **`integer` 型**なのに、コード
  （`supabaseRepository.ts` の `publishStage` / `serializeMoves`、`StageRow` 型、`parseMoves`）は
  **文字列**（方向列 `"RDLU"`）を読み書きする設計。**型不整合**。
- **実証**: `update stage set author_moves='RD'`（rollback 付き）→ **ERROR 22P02 invalid input syntax for type integer**。
  → ユーザーが「公開」を押すと PATCH が必ず失敗する。
- **対処方針（2 か所・本 014 では対応中／対応予定）**:
  1. **本番 DB**: `alter table public.stage alter column author_moves type text using author_moves::text;`
     （現在は全行 null ＝非破壊・安全）。※適用可否はユーザー確認中。
  2. **`supabase/schema.sql`（正本修正）**: 該当列を `integer` → `text` に修正し、コメントを
     「作成者のクリア手順を直列化した文字列（例 `"RDLU"`）」に。**コード/SQL 編集＋コミット案件**として別タスクで対応予定。
- **補足の軽微点**: `createStage` が `order_in_world` 未指定で stage 2 件とも 0（並び不定）。将来の軽微改善。

## トラブルシュート（本番有効化でハマった点）

### (A) Google プロバイダが「有効化したのに使えない」
- **症状**: ログイン時に `/authorize` 段階で `400 "Unsupported provider: provider is not enabled"`。
- **原因**: Supabase の Authentication → Providers → Google で**トグルを ON にしても Save が効いていなかった**。
  Client ID / Client Secret の**両方が未入力**だと「有効」として保存されないケースを含む。
- **判別方法**: Auth ログに「設定リロード（`reloading api with new configuration`）」イベントが出ているかで
  保存反映を判定できる（出ていなければ保存できていない）。
- **対処**:
  1. トグルを ON。
  2. Client ID / Client Secret を**両方**入力。
  3. Supabase 表示の Callback URL `https://ayohmfzssjhcziqsvoqn.supabase.co/auth/v1/callback` を
     Google Cloud の OAuth クライアントの「承認済みリダイレクト URI」に登録。
  4. **Save を押す**（ここを忘れがち）。
  - 保存後、OAuth フロー（authorize 302 → callback → token 200 → user 200）が成功するようになる。

### (B) ログイン後のリダイレクト先は origin 基準（`NEXT_PUBLIC_SITE_URL` ではない）
- `auth/supabaseAuth.ts` の `callbackUrl()` は
  `window.location.origin + '/lab/koori-no-nukemichi/auth/callback'` を返し、
  `signInWithOAuth({ redirectTo: callbackUrl() })` で使う。
- したがって **`NEXT_PUBLIC_SITE_URL` は OAuth リダイレクトに使われない**
  （この env は metadataBase / sitemap / robots 用のみ）。
- **dev を動かしたポートの origin に対応するコールバック URL を、Supabase の
  Authentication → URL Configuration → Redirect URLs に登録する**必要がある
  （例 `http://localhost:3000/lab/koori-no-nukemichi/auth/callback`）。本番ドメイン確定後は本番分も追加。
- コールバックページ（`app/lab/koori-no-nukemichi/auth/callback/page.tsx`）は
  `getSession()` 解決後に `router.replace('/lab/koori-no-nukemichi/edit')` でエディタへ戻す。

### (C) admins 登録は初回ログインの**後**＋登録後はリロードが必要
- `admins` に登録するには UID が必要で、UID は**初回 Google ログイン後**に `auth.users` に行ができて初めて取得できる。
  順番（ログイン → UID 取得 → admins 登録）を守る。
- admins に登録した後は、**エディタ画面をリロード**しないと `isAdmin` 判定が更新されない
  （ログイン時点では未登録＝非 admin と判定されているため）。

### (D) dev ポートの注意
- `next dev` の既定ポートは 3000。今回は 3000 がユーザー起動分で埋まっていたため、補助起動が 3001 を自動選択した。
- 最終的には 3000 を使用。Redirect URLs に登録する origin は**実際に使うポート**に合わせること（(B) 参照）。

## 残作業

### M1 完了の最後の 1 ピース（公開ブロッカー解消）
- [ ] **`stage.author_moves` の型修正**（`integer` → `text`）＝ステージ公開を成立させるための必須対応。
  - [ ] 本番 DB: `alter table public.stage alter column author_moves type text using author_moves::text;`（全 null＝非破壊。適用可否はユーザー確認中）。
  - [ ] `supabase/schema.sql`（正本）の該当列を `text` に修正＋コメント更新（コード/SQL 編集＋コミット案件・別タスク）。
  - [ ] 修正後にエディタからステージ「公開」を再検証（stage の PATCH 200・`published=true` / `author_moves` に方向列が保存されること）。

### 本番（Vercel）有効化に向けた残作業
- [ ] Vercel に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を登録
      （既存の YouTube / X / `NEXT_PUBLIC_SITE_URL` 系も併せて確認）。
- [ ] Supabase の Authentication → URL Configuration に**本番ドメイン**のコールバックを Redirect URLs へ追加し、
      Site URL も本番ドメインに設定。
- [ ] 公開ステージをプレイヤーに繋ぐ導線・本番入口（Coming Soon）の差し替え（**M2 範囲**）。

### 軽微（将来改善）
- [ ] `createStage` の `order_in_world` を明示採番（現状は未指定で 0・並び不定）。

### M2 要件メモ: 認証ユーザの表示名（display_name）保存
> ユーザー要望「認証後のユーザ名を格納するカラムが欲しい（今後生きてくる基盤）」について、本人判断で
> **今回は実装せず M2 で対応・要件メモのみ**とする。コード/スキーマは変更しない。

- [ ] **認証ユーザの表示名（display_name）を保存する仕組み**（M2 で実装予定）。
  - 用途: 公開ステージの作者名表示など（**anon からも作者名を見せたい**）。現状は `stage.created_by`（UID）のみで表示名は持たない。
  - **第一候補の方式**: `profiles` テーブル新設（`user_id` → `display_name` 等）。`auth.users` 作成時にトリガで自動投入し、
    **anon は `display_name` を select 可**（RLS）。将来プロフィール拡張（アイコン・自己紹介など）も載せやすい。Supabase 標準パターン。最終方式は M2 着手時に確定。
  - **代替案**: `stage` に `created_by_name` を非正規化（最小実装だが**名前変更に追従せず**・用途限定）。判断材料として併記。

## 完了報告（中間 — M1 は未完了）
M1 の**本番有効化作業を実施し、大部分が合格した**が、**ステージ「公開」を成立させられない重大バグを検出したため M1 は「完了」ではない**。

合格した内容:
- Supabase 本番プロジェクト（ref `ayohmfzssjhcziqsvoqn`）に `supabase/schema.sql` をマイグレーション `koori_no_nukemichi_schema`
  として適用し、world / stage / admins ＋ RLS（9 ポリシー）＋ `is_admin()` ほかを作成（アドバイザー ERROR 0 件）。
- `.env.local` に本番 Supabase の URL ＋ publishable キーを設定し、Google OAuth を有効化、管理人
  （`kei21.orange@gmail.com`、UID `6b27d4ed-27b7-4223-ac59-87b70f0866a5`）を `admins` に登録。
- 本番アプリのエディタからの実通信で **列名突き合わせ OK**、**RLS 疎通 OK**（anon の公開行 select 可・未公開/admins 不可視・anon 書き込みは 42501 拒否）、
  **章（world）の公開 OK**、**ステージ作成 OK**（created_by / 座標 / FK 整合）を確認。

未完（公開ブロッカー）:
- `stage.author_moves` 列がスキーマ上 `integer` 型なのにコードは文字列（方向列 `"RDLU"`）を扱うため、
  **ステージ公開時の PATCH が必ず失敗**（`22P02 invalid input syntax for type integer`）。stage は published=false / author_moves=null のまま。
- 対処は本番 DB の `ALTER`（`integer` → `text`、現在全 null で非破壊）＋ `supabase/schema.sql` の正本修正＋公開の再検証。
  これが **M1 完了の最後の 1 ピース**。スキーマ/コード修正は別タスクで対応予定（本 014 ではコミットしない）。

本番（Vercel）での有効化には、Vercel への Supabase env 登録と本番ドメインのコールバック登録（Redirect URLs / Site URL）も残る。
プレイヤー側の導線・本番入口の差し替えは M2 で対応する。

### ユーザーがやること
- `stage.author_moves` の型修正（本番 DB の `ALTER` 適用可否の確認 → 適用、`supabase/schema.sql` の正本修正）。修正後にステージ公開を再検証。
- Vercel の Settings → Environment Variables に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を登録。
- 本番ドメイン確定後、Supabase の Redirect URLs に本番コールバック（`https://<本番ドメイン>/lab/koori-no-nukemichi/auth/callback`）を追加、
  Site URL も本番ドメインへ。
- 本ブランチ（`feature/koori-no-nukemichi`）の PR マージ判断（マージは手動 squash）。
