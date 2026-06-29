/**
 * 認証層の公開エントリ＋プロバイダ選択ファクトリ。
 *
 * createAuthProvider() は環境に応じて実装を選ぶ:
 *   - NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY 設定時 … Supabase + Google OAuth
 *   - 未設定なら DevAuthProvider（ローカルでは isAdmin=true のスタブ）
 *
 * 注: SupabaseAuthProvider は supabase-js を動的 import するため、env 無しでは
 *     supabase-js がロードされず、ビルド・既存プレイヤーに影響しない。
 */

import type { AuthProvider } from './auth';
import { DevAuthProvider } from './devAuth';
import { SupabaseAuthProvider } from './supabaseAuth';
import { hasSupabaseEnv } from '../data/supabaseClient';

export * from './auth';
export { DevAuthProvider } from './devAuth';
export { SupabaseAuthProvider } from './supabaseAuth';

let cached: AuthProvider | null = null;

export function createAuthProvider(): AuthProvider {
  if (cached) return cached;
  cached = hasSupabaseEnv() ? new SupabaseAuthProvider() : new DevAuthProvider();
  return cached;
}
