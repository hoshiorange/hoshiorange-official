# 011 Supabase ＆ Google OAuth セットアップ手順（ユーザー向け）

## 概要
こおりのぬけみち（Laboratory ゲーム）の **M1 以降**で必要になる、Supabase（DB ＋ 認証）と
Google OAuth の準備手順書です。**ユーザー（管理人）が実装と並行して進める**ことを想定しています。

- DB スキーマや RLS の **SQL 実体は実装側で用意**します。この手順書では「ユーザーが何を準備し、
  どの値を私（実装担当）に渡すか」を説明します。
- M0 段階（最小プレイ）は env 無しのローカルアダプタで動くため、本セットアップは **M1 着手までに**
  揃っていれば大丈夫です。早めに着手できると M1 がスムーズです。
- 進め方: 各ステップで取得した値は、指示どおり **私（実装担当）に共有** するか **`.env` に記入** してください。
  どちらにするかは各ステップ末尾に明記しています。

> セキュリティ注意: `anon key` は公開前提（`NEXT_PUBLIC_`）なので共有 OK ですが、
> 将来登場する **`service_role` キーは絶対に共有・コミットしない**でください（フェーズ2で別途扱います）。

---

## ステップ 1: Supabase プロジェクト作成（無料枠）

1. [https://supabase.com](https://supabase.com) にアクセスし、GitHub などでサインイン。
2. ダッシュボードで **「New project」** をクリック。
3. 入力項目:
   - **Organization**: 個人用のものを選択（無ければ作成）。
   - **Name**: 例 `hoshiorange-koori`（分かりやすい名前で OK）。
   - **Database Password**: 強力なパスワードを生成し、**手元に安全に保管**（DB 直接接続時に使用）。
   - **Region**: `Northeast Asia (Tokyo)` を推奨（日本からのレイテンシ）。
   - **Plan**: **Free**（無料枠）。
4. 「Create new project」を押し、プロビジョニング完了まで待つ（数分）。
5. 作成後、**Project URL と anon key を取得**:
   - 左メニュー **Settings（歯車）→ API**（または「API Keys」）を開く。
   - **Project URL**（`https://xxxx.supabase.co` の形）をコピー。
   - **Project API keys** の **`anon` `public`** キーをコピー。

   → **取得した 2 つの値（Project URL / anon key）を私に共有**してください。
     （後でステップ 6 の `.env.local` / Vercel に設定します。anon key は公開前提なので共有 OK）

---

## ステップ 2: DB スキーマ適用の段取り

実際の **SQL（テーブル定義・RLS ポリシー）は実装側で用意**し、Supabase の **SQL Editor** に貼り付けて
実行する流れになります。ユーザー側で何が作られるかの概要は以下です（中身の理解用。手で書く必要はありません）。

### 作成されるテーブル（概要）
- **`world`（章）**: 章 ID / タイトル / 並び順 / 公開フラグ など。
- **`stage`（ステージ）**: ステージ ID / 所属 `world` / タイトル / 並び順 /
  盤面メタ（`width`, `height`, `start_x/y`, `goal_x/y`）/ `data` テキスト（`"111,101,121"` 形式）/
  公開フラグ（下書き⇔公開）/ `author_moves`（作成者がクリアした操作手順）/ 作成者・日時 など。
- **`admins`（管理人ホワイトリスト）**: 管理人の `user_id`（＝ Supabase Auth のユーザー ID）。

### RLS（行レベルセキュリティ）の方針
- **公開ステージ（および公開章）は誰でも `select` 可能**（ログイン不要で遊べる）。
- **`insert` / `update` / `delete`（書き込み）は admin のみ**（`admins` に登録された `user_id` だけ）。
- 下書き（未公開）ステージは admin のみ閲覧可。

### ユーザーがやること
- ステップ 1 でプロジェクトが作成できていれば、SQL の実行自体は私が用意した SQL を案内します。
- **SQL Editor の場所だけ確認**しておいてください: 左メニュー **SQL Editor** → 「New query」。
- （SQL を渡したら）貼り付けて **Run**。エラーが出たら内容を私に共有してください。

→ このステップでユーザーから渡すものは特にありません（SQL 受領後に一緒に実行します）。

---

## ステップ 3: Google Cloud で OAuth 2.0 クライアント作成

Google ログインを使うため、Google 側で OAuth クライアントを作ります。

1. [https://console.cloud.google.com](https://console.cloud.google.com) にアクセス。
2. 上部のプロジェクト選択 → **新しいプロジェクトを作成**（例: `hoshiorange-koori`）。作成後そのプロジェクトを選択。
3. 左メニュー **「API とサービス」→「OAuth 同意画面」** を設定:
   - User Type: **外部（External）** を選択。
   - アプリ名（例: `こおりのぬけみち`）・ユーザーサポートメール・デベロッパー連絡先メールを入力。
   - スコープは既定（email / profile）でOK。テストユーザーに自分のメール
     `kei21.orange@gmail.com` を追加しておくと、公開申請前でもログインできます。
4. 左メニュー **「API とサービス」→「認証情報」→「＋認証情報を作成」→「OAuth クライアント ID」**:
   - アプリケーションの種類: **ウェブ アプリケーション**。
   - 名前: 任意（例 `supabase-auth`）。
   - **承認済みのリダイレクト URI** に、Supabase のコールバック URL を追加:
     ```
     https://<あなたのプロジェクトID>.supabase.co/auth/v1/callback
     ```
     （`<あなたのプロジェクトID>` はステップ 1 の Project URL のサブドメイン部分。
     正確な URL は **ステップ 4 の Supabase の Google プロバイダ設定画面にも表示**されるので、そこからコピーが確実です）
5. 作成すると **クライアント ID** と **クライアント シークレット** が表示されるのでコピー。

   → **クライアント ID / クライアント シークレットはステップ 4 で Supabase に登録**します。
     私への共有は不要ですが、共有する場合は **シークレットの取り扱いに注意**してください
     （DM など非公開の経路で。リポジトリには絶対に置かない）。

---

## ステップ 4: Supabase で Google プロバイダを有効化

ステップ 3 で取得した値を Supabase に登録します。

1. Supabase ダッシュボードで対象プロジェクトを開く。
2. 左メニュー **Authentication → Sign In / Providers**（または「Providers」）→ **Google** を選択。
3. **Enable Sign in with Google** を ON。
4. **Client ID** / **Client Secret**（ステップ 3 で取得した値）を貼り付けて **Save**。
   - この画面に表示される **Callback URL（`.../auth/v1/callback`）** を確認し、
     ステップ 3-4 の「承認済みリダイレクト URI」と**一致**していることを確認（不一致だとログイン失敗）。
5. 左メニュー **Authentication → URL Configuration** で:
   - **Site URL**: 本番サイトの URL（例 `https://<本番ドメイン>`）。ローカル確認時は一時的に
     `http://localhost:3000` でも可。
   - **Redirect URLs**: ローカルと本番の両方を許可リストに追加
     （例 `http://localhost:3000/**` と `https://<本番ドメイン>/**`）。

   → この設定はユーザー側で完結します（私への共有は不要）。完了したら「Google 有効化済み」と一言ください。

---

## ステップ 5: admins テーブルに管理人アカウントを登録

管理人だけがエディタ／書き込みを使えるよう、`admins` にあなたの `user_id` を登録します。
`user_id` は **初回 Google ログイン後**に Supabase 側で発行されるため、順番が大事です。

1. （スキーマ適用後・Google 有効化後）アプリで **一度 Google ログイン**してください
   （ログイン導線は実装側で一時的に用意 or 私が案内します）。
   - 使用アカウントは管理人のメール **`kei21.orange@gmail.com`**。
2. Supabase ダッシュボード **Authentication → Users** を開き、ログインしたユーザー行の
   **`kei21.orange@gmail.com`** を探し、その **User UID（`user_id`）をコピー**。
3. その `user_id` を **`admins` テーブルに 1 行追加**:
   - Supabase **Table Editor → `admins` → Insert row** で `user_id` に貼り付けて保存、
     または私が用意する INSERT 文を SQL Editor で実行。

   → 登録した **メールと user_id を私に共有**してもらえれば、admin 判定が効いているか一緒に確認します。
     （メールが `kei21.orange@gmail.com` であることを確認します）

---

## ステップ 6: 環境変数の設定（ローカル ＋ Vercel）

ステップ 1 で取得した値を、ローカルと本番の両方に設定します。

### 6-1. ローカル（`.env.local`）
1. プロジェクト直下の `.env.local`（無ければ `.env.local.example` をコピーして作成）に追記:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=（anon key）
   ```
   - `.env.local` は `.gitignore` 済みなのでコミットされません（安全）。
2. dev サーバを再起動して反映。

### 6-2. 本番（Vercel）
1. [https://vercel.com](https://vercel.com) で対象プロジェクトを開く → **Settings → Environment Variables**。
2. 同じ 2 変数を追加（**Production / Preview / Development** すべてにチェック推奨）:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 保存後、次回デプロイから反映されます（既存デプロイに効かせるには再デプロイ）。

   → `.env.local` への記入はユーザー側で OK。値を私に共有いただければ、こちらでも設定・確認できます。
     （`anon key` は公開前提なので共有可。`service_role` キーはフェーズ2で扱うため今回は不要・共有しない）

---

## 手順チェックリスト
- [ ] ステップ 1: Supabase プロジェクト作成 → **Project URL / anon key** を取得（→ 私に共有）
- [ ] ステップ 2: SQL Editor の場所を確認（SQL 実体は実装側から受領して実行）
- [ ] ステップ 3: Google Cloud で OAuth クライアント作成 → **client ID / secret** 取得・リダイレクト URI 設定
- [ ] ステップ 4: Supabase で Google プロバイダ有効化（client id/secret 登録・Site/Redirect URL 設定）
- [ ] ステップ 5: 初回 Google ログイン → `admins` に `user_id` 登録（メール `kei21.orange@gmail.com` を確認）
- [ ] ステップ 6: `.env.local`（ローカル）と Vercel（本番）に 2 変数を設定

---

## 完了後の連絡について
**全部そろってから一括で連絡する必要はありません。** 準備できた項目から順に、その都度
**実装担当（私）に連絡**してください。特に以下が揃うと M1 を本格的に進められます。

1. Project URL / anon key（ステップ 1）
2. Google プロバイダ有効化済みの合図（ステップ 4）
3. 管理人の user_id 登録（ステップ 5）

詰まった箇所（エラーメッセージ等）があれば、画面の文言ごと共有してください。一緒に解決します。

---

## 関連ドキュメント
- `docs/010_koori-game-plan.md`（こおりのぬけみち M0〜M2 実装計画）
