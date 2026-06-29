/**
 * 認証の抽象。将来 Google OAuth ＋ admins ホワイトリストで実装する（M1）。
 * 今回は IF 定義のみ。実体はローカル開発用スタブ（devAuth）。
 */

export interface AuthUser {
  id: string;
  displayName: string;
  email?: string;
}

export interface AuthSession {
  /** 未ログインなら null。 */
  user: AuthUser | null;
  /** admins ホワイトリストに含まれる管理者か（エディタ等の権限判定に使う）。 */
  isAdmin: boolean;
}

export interface AuthProvider {
  /** 現在のセッションを取得する。 */
  getSession(): Promise<AuthSession>;
  /** サインイン（M1: Google OAuth）。 */
  signIn(): Promise<AuthSession>;
  /** サインアウト。 */
  signOut(): Promise<void>;
}
