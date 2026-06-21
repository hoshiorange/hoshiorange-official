/** TwitCasting API v2 で扱うユーザー／配信情報の型定義。 */

/** GET /users/:user_id のユーザー情報（必要な項目のみ抜粋）。 */
export interface TwitCastingUser {
  id: string;
  screenId: string;
  name: string;
  image: string;
  profile: string;
  isLive: boolean;
  lastMovieId: string | null;
}

/** ライブ配信（current_live）／過去配信（movies）共通の動画情報。 */
export interface TwitCastingMovie {
  id: string;
  title: string;
  subtitle: string | null;
  link: string;
  isLive: boolean;
  isRecorded: boolean;
  thumbnail: string;
  created: number;
  currentViewCount: number;
  totalViewCount: number;
  duration: number;
}

/**
 * ツイキャス配信状況の取得結果。
 * - authMode: どの認証で取得したか（'bearer' | 'basic'）。表示には影響しないが診断用。
 * - 認証情報が無い／API エラー時は { ok:false } を返し、表示側はリンクカードにフォールバック。
 */
export type TwitCastingResult =
  | {
      ok: true;
      authMode: 'bearer' | 'basic';
      user: TwitCastingUser;
      /** ライブ中なら現在の配信、そうでなければ null */
      live: TwitCastingMovie | null;
      /** 直近の過去配信（最大件数は呼び出し側指定） */
      recent: TwitCastingMovie[];
    }
  | { ok: false; reason: 'missing-env' | 'api-error'; message: string };
