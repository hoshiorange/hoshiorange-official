import type {
  TwitCastingMovie,
  TwitCastingResult,
  TwitCastingUser,
} from '@/types/twitcasting';

/**
 * 配信者の screen_id（ユーザー名）。screen_id でも数値 ID でも API は受け付ける。
 * TWITCASTING_USER_ID が設定されていればそちらを優先。
 */
const DEFAULT_USER_ID = 'hoshiorange';

const API_BASE = 'https://apiv2.twitcasting.tv';

/**
 * TwitCasting API v2 から配信状況を取得する。
 * - 認証はアプリケーション単位の Basic 認証（base64(ClientID:ClientSecret)）。
 *   公開ユーザー情報の取得はこれで可能。
 * - 必須ヘッダ: Authorization / X-Api-Version: 2.0 / Accept: application/json
 * - 環境変数 TWITCASTING_CLIENT_ID / TWITCASTING_CLIENT_SECRET が未設定なら
 *   エラーで落とさず reason を返してフォールバックさせる。
 * - ライブ状況は変化が速いので revalidate は短め（既定 90 秒）。
 */
export async function fetchTwitCastingStatus(
  recentLimit = 4,
  liveRevalidateSeconds = 90,
): Promise<TwitCastingResult> {
  const clientId = process.env.TWITCASTING_CLIENT_ID;
  const clientSecret = process.env.TWITCASTING_CLIENT_SECRET;
  const userId = process.env.TWITCASTING_USER_ID || DEFAULT_USER_ID;

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      reason: 'missing-env',
      message:
        '配信状況が読み込めませんでした（環境変数 TWITCASTING_CLIENT_ID / TWITCASTING_CLIENT_SECRET を設定してください）。',
    };
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const headers: HeadersInit = {
    Authorization: `Basic ${basic}`,
    'X-Api-Version': '2.0',
    Accept: 'application/json',
  };

  const encodedUser = encodeURIComponent(userId);

  try {
    // ユーザー情報（is_live を含む）。ライブ判定の基準なので短め ISR。
    const userRes = await fetch(`${API_BASE}/users/${encodedUser}`, {
      headers,
      next: { revalidate: liveRevalidateSeconds },
    });

    if (!userRes.ok) {
      return {
        ok: false,
        reason: 'api-error',
        message: `ツイキャス API がエラーを返しました (status=${userRes.status})。`,
      };
    }

    const userData = (await userRes.json()) as TwitCastingUserResponse;
    const rawUser = userData.user;
    if (!rawUser) {
      return {
        ok: false,
        reason: 'api-error',
        message: 'ツイキャス API のレスポンスにユーザー情報が含まれていませんでした。',
      };
    }

    const user: TwitCastingUser = {
      id: rawUser.id ?? '',
      screenId: rawUser.screen_id ?? userId,
      name: rawUser.name ?? '',
      image: rawUser.image ?? '',
      profile: rawUser.profile ?? '',
      isLive: Boolean(rawUser.is_live),
      lastMovieId: rawUser.last_movie_id ?? null,
    };

    // ライブ中なら現在の配信を取得。
    let live: TwitCastingMovie | null = null;
    if (user.isLive) {
      const liveRes = await fetch(`${API_BASE}/users/${encodedUser}/current_live`, {
        headers,
        next: { revalidate: liveRevalidateSeconds },
      });
      if (liveRes.ok) {
        const liveData = (await liveRes.json()) as { movie?: RawMovie };
        if (liveData.movie) live = mapMovie(liveData.movie);
      }
    }

    // 過去配信一覧（最近数件）。変化が遅いので少し長めの ISR。
    let recent: TwitCastingMovie[] = [];
    const moviesUrl = new URL(`${API_BASE}/users/${encodedUser}/movies`);
    moviesUrl.searchParams.set('limit', String(Math.min(Math.max(recentLimit, 1), 50)));
    const moviesRes = await fetch(moviesUrl.toString(), {
      headers,
      next: { revalidate: 1800 },
    });
    if (moviesRes.ok) {
      const moviesData = (await moviesRes.json()) as { movies?: RawMovie[] };
      recent = (moviesData.movies ?? []).map(mapMovie);
    }

    return { ok: true, user, live, recent };
  } catch (err) {
    return {
      ok: false,
      reason: 'api-error',
      message: `ツイキャス API の取得中に例外が発生しました: ${(err as Error).message}`,
    };
  }
}

function mapMovie(m: RawMovie): TwitCastingMovie {
  return {
    id: m.id ?? '',
    title: m.title ?? '',
    subtitle: m.subtitle ?? null,
    link: m.link ?? '',
    isLive: Boolean(m.is_live),
    isRecorded: Boolean(m.is_recorded),
    thumbnail: m.large_thumbnail ?? m.small_thumbnail ?? '',
    created: typeof m.created === 'number' ? m.created : 0,
    currentViewCount: typeof m.current_view_count === 'number' ? m.current_view_count : 0,
    totalViewCount: typeof m.total_view_count === 'number' ? m.total_view_count : 0,
    duration: typeof m.duration === 'number' ? m.duration : 0,
  };
}

interface TwitCastingUserResponse {
  user?: {
    id?: string;
    screen_id?: string;
    name?: string;
    image?: string;
    profile?: string;
    is_live?: boolean;
    last_movie_id?: string | null;
  };
}

interface RawMovie {
  id?: string;
  title?: string;
  subtitle?: string | null;
  link?: string;
  is_live?: boolean;
  is_recorded?: boolean;
  large_thumbnail?: string;
  small_thumbnail?: string;
  created?: number;
  current_view_count?: number;
  total_view_count?: number;
  duration?: number;
}
