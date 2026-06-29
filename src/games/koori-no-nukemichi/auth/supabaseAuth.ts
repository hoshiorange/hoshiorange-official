/**
 * Supabase + Google OAuth による認証プロバイダ（AuthProvider 実装）。
 *
 * - signIn(): Google OAuth でサインイン（PKCE・リダイレクト方式）。
 * - signOut(): サインアウト。
 * - getSession(): 現在のユーザーと admin 判定（admins テーブル参照）を返す。
 *
 * admin 判定は admins テーブルに自分の user_id 行が存在するかで行う
 * （RPC is_admin があればそちらでも良いが、ここでは素朴なテーブル参照）。
 * env 不在時はファクトリがこのクラスを生成しない（DevAuthProvider が使われる）。
 */

import { getSupabaseClient } from '../data/supabaseClient';
import type { AuthProvider, AuthSession, AuthUser } from './auth';

/** OAuth から戻ってくるコールバックのパス。 */
const CALLBACK_PATH = '/lab/koori-no-nukemichi/auth/callback';

const EMPTY_SESSION: AuthSession = { user: null, isAdmin: false };

function callbackUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${CALLBACK_PATH}`;
}

export class SupabaseAuthProvider implements AuthProvider {
  private async client() {
    const c = await getSupabaseClient();
    if (!c) throw new Error('Supabase クライアントを初期化できません（env 未設定）');
    return c;
  }

  async getSession(): Promise<AuthSession> {
    const c = await getSupabaseClient();
    if (!c) return EMPTY_SESSION;

    const { data: userData } = await c.auth.getUser();
    const u = userData.user;
    if (!u) return EMPTY_SESSION;

    const user: AuthUser = {
      id: u.id,
      displayName:
        (u.user_metadata?.full_name as string | undefined) ??
        (u.user_metadata?.name as string | undefined) ??
        u.email ??
        'user',
      email: u.email ?? undefined,
    };

    return { user, isAdmin: await this.isAdmin(u.id) };
  }

  /** admins テーブルに user_id 行が存在すれば管理者。 */
  private async isAdmin(userId: string): Promise<boolean> {
    const c = await getSupabaseClient();
    if (!c) return false;
    const { data, error } = await c.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
    if (error) return false;
    return !!data;
  }

  async signIn(): Promise<AuthSession> {
    const c = await this.client();
    // OAuth はリダイレクト方式。成功時はページ遷移するため戻り値は実質使われない。
    await c.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    return EMPTY_SESSION;
  }

  async signOut(): Promise<void> {
    const c = await getSupabaseClient();
    if (!c) return;
    await c.auth.signOut();
  }
}
