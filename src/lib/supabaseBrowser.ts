/**
 * サイト共通の Supabase ブラウザクライアント（LP 計測・事前登録用）。
 *
 * - こおりのぬけみち側（games/koori-no-nukemichi/data/supabaseClient.ts）と同じ方針:
 *   supabase-js はトップレベルで import せず動的 import に遅延し、
 *   env 無しの環境では初期バンドルに含めない・null を返す（throw しない）。
 * - 認証は使わないためセッション永続化は無効（匿名 anon キーでの insert のみ）。
 */

import type { SupabaseClient } from '@supabase/supabase-js';

function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

let cachedClient: SupabaseClient | null = null;
let creating: Promise<SupabaseClient | null> | null = null;

/** Supabase クライアント（シングルトン）。env 不在なら null。 */
export async function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;
  const env = getSupabaseEnv();
  if (!env) return null;
  if (creating) return creating;

  creating = (async () => {
    const { createClient } = await import('@supabase/supabase-js');
    cachedClient = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    return cachedClient;
  })();
  return creating;
}
