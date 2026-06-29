/**
 * 認証層の公開エントリ＋プロバイダ選択ファクトリ。
 *
 * createAuthProvider() は環境に応じて実装を選ぶ:
 *   - NEXT_PUBLIC_SUPABASE_URL 設定時（M1）… Supabase + Google OAuth プロバイダ
 *   - 未設定なら DevAuthProvider（ローカルでは isAdmin=true のスタブ）
 */

import type { AuthProvider } from './auth';
import { DevAuthProvider } from './devAuth';

export * from './auth';
export { DevAuthProvider } from './devAuth';

let cached: AuthProvider | null = null;

export function createAuthProvider(): AuthProvider {
  if (cached) return cached;
  // M1: process.env.NEXT_PUBLIC_SUPABASE_URL があれば Supabase 実装へ分岐する。
  cached = new DevAuthProvider();
  return cached;
}
