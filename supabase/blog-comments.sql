-- ============================================================
-- ブログコメントスキーマ（冪等）
--
-- 対象: /blog/[slug] のコメント欄。
--   blog_comment … 記事 slug ごとのコメント（名前は任意＝匿名可）
--
-- RLS 方針:
--   - select は誰でも可（コメントは公開情報）
--   - insert は anon / authenticated 可（内容の妥当性は check 制約で担保）
--   - update は不可、delete は admin（public.is_admin()）のみ（スパム削除用）
--
-- 適用: Supabase SQL Editor に貼り付け実行、または MCP の apply_migration。
-- 前提: supabase/schema.sql（koori）適用済み（public.is_admin() を再利用）。
-- ============================================================

create table if not exists public.blog_comment (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (char_length(slug) between 1 and 128),
  -- 匿名可: null / 空は表示側で「名無しさん」にする
  name text check (name is null or char_length(name) <= 40),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists blog_comment_slug_idx on public.blog_comment (slug, created_at);

alter table public.blog_comment enable row level security;

drop policy if exists blog_comment_select on public.blog_comment;
create policy blog_comment_select on public.blog_comment
  for select to anon, authenticated
  using (true);

drop policy if exists blog_comment_insert on public.blog_comment;
create policy blog_comment_insert on public.blog_comment
  for insert to anon, authenticated
  with check (true);

drop policy if exists blog_comment_admin_delete on public.blog_comment;
create policy blog_comment_admin_delete on public.blog_comment
  for delete to authenticated
  using (public.is_admin());
