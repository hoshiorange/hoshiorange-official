/**
 * Supabase ブラウザクライアントの生成（env 不在ガード）。
 *
 * 重要:
 *  - 本モジュールは **トップレベルで @supabase/supabase-js を import しない**。
 *    実際の import は getSupabaseClient() 内の動的 import に遅延させる。
 *    これにより env 無し（Supabase 不使用）の環境では supabase-js が初期バンドルに含まれず、
 *    既存の /m0 プレイヤーの初期ロードを太らせない。
 *  - env が無いときは getSupabaseClient() が null を返す（throw しない）。
 *    呼び出し側（ファクトリ）は hasSupabaseEnv() を見て Local/Dev 実装を選ぶ。
 *
 * 認証セッションはブラウザの localStorage に保持し（persistSession）、
 * OAuth リダイレクト復帰時に URL から自動でセッションを取り込む（detectSessionInUrl）。
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** Supabase の公開 env（クライアントに露出する anon キー）。 */
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** Supabase 用 env が揃っているか（同期判定。ファクトリの分岐に使う）。 */
export function hasSupabaseEnv(): boolean {
  return getSupabaseEnv() !== null;
}

let cachedClient: SupabaseClient | null = null;
let creating: Promise<SupabaseClient | null> | null = null;

/**
 * Supabase クライアント（シングルトン）を返す。env 不在なら null。
 * supabase-js は動的 import で初回呼び出し時にのみ読み込む。
 */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;
  const env = getSupabaseEnv();
  if (!env) return null;
  if (creating) return creating;

  creating = (async () => {
    const { createClient } = await import('@supabase/supabase-js');
    cachedClient = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
    return cachedClient;
  })();
  return creating;
}
