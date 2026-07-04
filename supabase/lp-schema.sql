-- ============================================================
-- LP 事前登録・ファネル計測スキーマ（冪等）
--
-- 対象: /lp/[slug]（プロダクト候補 LP）の 3 段ファネル計測と事前登録。
--   lp_event  … view / cta_click / signup イベント（匿名訪問者 ID・UTM 付き）
--   lp_signup … 事前登録メール（product + email でユニーク）
--
-- RLS 方針:
--   - anon / authenticated は insert のみ可（値の妥当性は check 制約で担保）
--   - select は admin（既存 koori スキーマの public.is_admin()）のみ
--   - update / delete はポリシー無し（= 全ロール不可。管理は service_role / SQL Editor から）
--
-- 適用: Supabase SQL Editor に貼り付け実行、または MCP の apply_migration。
-- 前提: supabase/schema.sql（koori）適用済み（public.is_admin() を再利用するため）。
-- ============================================================

-- ---------- テーブル ----------

create table if not exists public.lp_event (
  id uuid primary key default gen_random_uuid(),
  product text not null check (char_length(product) between 1 and 64),
  event text not null check (event in ('view', 'cta_click', 'signup')),
  visitor text check (visitor is null or char_length(visitor) <= 64),
  utm_source text check (utm_source is null or char_length(utm_source) <= 128),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 128),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 128),
  referrer text check (referrer is null or char_length(referrer) <= 512),
  path text check (path is null or char_length(path) <= 256),
  created_at timestamptz not null default now()
);

create table if not exists public.lp_signup (
  id uuid primary key default gen_random_uuid(),
  product text not null check (char_length(product) between 1 and 64),
  email text not null check (char_length(email) <= 320 and position('@' in email) > 1),
  visitor text check (visitor is null or char_length(visitor) <= 64),
  utm_source text check (utm_source is null or char_length(utm_source) <= 128),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 128),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 128),
  created_at timestamptz not null default now(),
  unique (product, email)
);

-- ---------- インデックス ----------

create index if not exists lp_event_product_event_idx on public.lp_event (product, event);
create index if not exists lp_event_created_at_idx on public.lp_event (created_at);
create index if not exists lp_signup_product_idx on public.lp_signup (product);

-- ---------- RLS ----------

alter table public.lp_event enable row level security;
alter table public.lp_signup enable row level security;

-- 匿名からの計測イベント挿入を許可（select 不可なので書き逃げ専用）
drop policy if exists lp_event_insert on public.lp_event;
create policy lp_event_insert on public.lp_event
  for insert to anon, authenticated
  with check (true);

-- admin のみ集計参照可
drop policy if exists lp_event_admin_select on public.lp_event;
create policy lp_event_admin_select on public.lp_event
  for select to authenticated
  using (public.is_admin());

-- 事前登録の挿入を許可（unique 制約違反 = 登録済みはクライアントでハンドリング）
drop policy if exists lp_signup_insert on public.lp_signup;
create policy lp_signup_insert on public.lp_signup
  for insert to anon, authenticated
  with check (true);

-- admin のみ登録一覧参照可（メールアドレスを含むため厳格に）
drop policy if exists lp_signup_admin_select on public.lp_signup;
create policy lp_signup_admin_select on public.lp_signup
  for select to authenticated
  using (public.is_admin());
