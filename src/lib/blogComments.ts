/**
 * ブログコメントの取得・投稿（クライアント専用）。
 *
 * - 記事は SSG のため、コメントはクライアントで Supabase から都度取得する。
 * - 匿名可: 名前が空なら null で保存し、表示側で「名無しさん」にする。
 * - env（Supabase）不在時は { ok: false } を返し、コメント欄は準備中表示にする。
 */

import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export interface BlogComment {
  id: string;
  name: string | null;
  body: string;
  createdAt: string;
}

export const COMMENT_NAME_MAX = 40;
export const COMMENT_BODY_MAX = 1000;

export type FetchCommentsResult =
  | { ok: true; comments: BlogComment[] }
  | { ok: false };

/** 記事のコメント一覧（古い順）。 */
export async function fetchComments(slug: string): Promise<FetchCommentsResult> {
  const client = await getSupabaseBrowserClient();
  if (!client) return { ok: false };

  const { data, error } = await client
    .from('blog_comment')
    .select('id, name, body, created_at')
    .eq('slug', slug)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error || !data) return { ok: false };
  return {
    ok: true,
    comments: data.map((row) => ({
      id: String(row.id),
      name: row.name ?? null,
      body: String(row.body),
      createdAt: String(row.created_at),
    })),
  };
}

export type PostCommentResult = { ok: true } | { ok: false; message: string };

/** コメントを投稿する。name は空で匿名扱い。 */
export async function postComment(
  slug: string,
  name: string,
  body: string,
): Promise<PostCommentResult> {
  const trimmedBody = body.trim();
  const trimmedName = name.trim();

  if (!trimmedBody) {
    return { ok: false, message: 'コメントを入力してください。' };
  }
  if (trimmedBody.length > COMMENT_BODY_MAX) {
    return { ok: false, message: `コメントは ${COMMENT_BODY_MAX} 文字以内でお願いします。` };
  }
  if (trimmedName.length > COMMENT_NAME_MAX) {
    return { ok: false, message: `お名前は ${COMMENT_NAME_MAX} 文字以内でお願いします。` };
  }

  const client = await getSupabaseBrowserClient();
  if (!client) {
    return { ok: false, message: '現在コメント機能を準備中です。時間をおいてお試しください。' };
  }

  const { error } = await client.from('blog_comment').insert({
    slug,
    name: trimmedName || null,
    body: trimmedBody,
  });

  if (error) {
    return { ok: false, message: '送信に失敗しました。時間をおいてお試しください。' };
  }
  return { ok: true };
}
