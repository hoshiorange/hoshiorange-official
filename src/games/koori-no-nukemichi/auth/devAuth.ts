/**
 * 開発用の認証スタブ。
 * ローカルでは常に管理者（isAdmin=true）として振る舞い、エディタ等を素通しで触れるようにする。
 * 本番相当の Google OAuth ＋ admins 照合は M1 の Supabase アダプタで実装する。
 */

import type { AuthProvider, AuthSession } from './auth';

const DEV_SESSION: AuthSession = {
  user: { id: 'dev', displayName: 'dev (local)' },
  isAdmin: true,
};

export class DevAuthProvider implements AuthProvider {
  async getSession(): Promise<AuthSession> {
    return DEV_SESSION;
  }

  async signIn(): Promise<AuthSession> {
    return DEV_SESSION;
  }

  async signOut(): Promise<void> {
    // スタブのため何もしない。
  }
}
