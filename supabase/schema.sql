-- =============================================================================
-- こおりのぬけみち (koori-no-nukemichi) — Supabase スキーマ + RLS ポリシー
-- =============================================================================
-- 対象       : Supabase Postgres
-- 実行方法   : Supabase ダッシュボード > SQL Editor にこのファイル全文を貼り付けて実行
-- 冪等性     : 何度再実行しても壊れない構成
--              （create ... if not exists / create or replace / drop policy if exists → create policy）
--
-- -----------------------------------------------------------------------------
-- ★初回 admin（管理人）登録手順 — 重要
-- -----------------------------------------------------------------------------
-- admins テーブルへの書き込みはクライアント（anon / authenticated）からは一切できない
-- （RLS で遮断している）。管理人の登録は SQL Editor もしくは service_role から手動で行う。
--
--   1. まずアプリ側で Google ログインを 1 回実行し、auth.users に自分の行を作る。
--   2. 自分の UID（ユーザーID）を調べる（どちらでも可）:
--        - Supabase ダッシュボード > Authentication > Users で該当ユーザーの UID をコピー
--        - もしくは SQL Editor で次を実行:
--            select id, email from auth.users order by created_at desc;
--   3. その UID を admins に登録する（'<UID>' を実際の値に置き換える）:
--            insert into admins (user_id) values ('<UID>')
--            on conflict (user_id) do nothing;
--   4. 以降、その UID で is_admin() が true を返し、world / stage の作成・編集が可能になる。
-- =============================================================================


-- 拡張: gen_random_uuid() 用。Supabase では通常すでに有効だが、冪等に有効化しておく。
-- （PostgreSQL 13 以降は gen_random_uuid() が pg_catalog 内蔵のため、無くても既定値は解決される）
create extension if not exists pgcrypto;


-- =============================================================================
-- テーブル定義
-- =============================================================================

-- 章（ワールド）
create table if not exists public.world (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  "order"     integer not null default 0,        -- order は予約語のため必ずクォートする
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ステージ
create table if not exists public.stage (
  id             uuid primary key default gen_random_uuid(),
  world_id       uuid not null references public.world(id) on delete cascade,
  order_in_world integer not null default 0,
  title          text not null,
  width          integer not null,
  height         integer not null,
  startx         integer not null,
  starty         integer not null,
  goalx          integer not null,
  goaly          integer not null,
  data           text not null,                       -- "111,101,121" 形式（1マス1文字・カンマ=行区切り）
  author_moves   integer,                             -- 公開まで null（作成者がクリアした手数）
  published      boolean not null default false,      -- false→true 一方向（運用ルール。DB 制約は付けない）
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 管理人ホワイトリスト
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);


-- =============================================================================
-- index（参照・絞り込みでよく使う列に付与）
-- =============================================================================
create index if not exists idx_stage_world_id    on public.stage (world_id);
create index if not exists idx_stage_published   on public.stage (published);
create index if not exists idx_stage_world_order on public.stage (world_id, order_in_world);
create index if not exists idx_world_published   on public.world (published);
create index if not exists idx_world_order       on public.world ("order");


-- =============================================================================
-- updated_at 自動更新トリガ（運用補助）
--   update のたびに updated_at を now() で更新する。
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_world_updated_at on public.world;
create trigger trg_world_updated_at
  before update on public.world
  for each row execute function public.set_updated_at();

drop trigger if exists trg_stage_updated_at on public.stage;
create trigger trg_stage_updated_at
  before update on public.stage
  for each row execute function public.set_updated_at();


-- =============================================================================
-- admin 判定ヘルパ関数
--   security definer + 検索パス固定。auth.uid() が admins に存在すれば true を返す。
--   security definer のため admins の RLS をバイパスして判定できる
--   （anon はログインしていない＝auth.uid() が null なので必ず false になる）。
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_catalog
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- クライアントロールから RLS ポリシー内で呼べるよう実行権限を付与
grant execute on function public.is_admin() to anon, authenticated;


-- =============================================================================
-- RLS 有効化（全テーブル）
-- =============================================================================
alter table public.world  enable row level security;
alter table public.stage  enable row level security;
alter table public.admins enable row level security;


-- =============================================================================
-- world ポリシー
--   - 公開行 (published = true) は誰でも（anon 含む）select 可
--   - 未公開行の select、および insert / update / delete は admin (is_admin()) のみ
-- =============================================================================
drop policy if exists world_select_public on public.world;
create policy world_select_public on public.world
  for select
  to anon, authenticated
  using (published = true or public.is_admin());

drop policy if exists world_insert_admin on public.world;
create policy world_insert_admin on public.world
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists world_update_admin on public.world;
create policy world_update_admin on public.world
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists world_delete_admin on public.world;
create policy world_delete_admin on public.world
  for delete
  to authenticated
  using (public.is_admin());


-- =============================================================================
-- stage ポリシー（world と同方針）
--   - 公開行 (published = true) は誰でも（anon 含む）select 可
--   - 未公開行の select、および insert / update / delete は admin (is_admin()) のみ
-- =============================================================================
drop policy if exists stage_select_public on public.stage;
create policy stage_select_public on public.stage
  for select
  to anon, authenticated
  using (published = true or public.is_admin());

drop policy if exists stage_insert_admin on public.stage;
create policy stage_insert_admin on public.stage
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists stage_update_admin on public.stage;
create policy stage_update_admin on public.stage
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists stage_delete_admin on public.stage;
create policy stage_delete_admin on public.stage
  for delete
  to authenticated
  using (public.is_admin());


-- =============================================================================
-- admins ポリシー
--   - 各ユーザは自分の行のみ select 可 (user_id = auth.uid())
--   - insert / update / delete ポリシーは意図的に作らない
--     → クライアント (anon / authenticated) からは一切書き込めない。
--       service_role は RLS をバイパスするので、管理人登録は SQL Editor /
--       service_role 経由で行う（ファイル冒頭の「初回 admin 登録手順」を参照）。
-- =============================================================================
drop policy if exists admins_select_self on public.admins;
create policy admins_select_self on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());
