export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

export type YouTubeResult =
  | { ok: true; videos: YouTubeVideo[] }
  | { ok: false; reason: 'missing-env' | 'api-error'; message: string };

/** ライブ配信中の動画情報（最小限）。 */
export interface YouTubeLiveVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

/**
 * ライブ配信状況の取得結果。
 * - ok:false        … env 未設定 / API エラー（フォールバック）
 * - ok:true,isLive:false … 正常取得、ただし配信していない
 * - ok:true,isLive:true  … 配信中（live に詳細）
 */
export type YouTubeLiveResult =
  | { ok: false; reason: 'missing-env' | 'api-error'; message: string }
  | { ok: true; isLive: false }
  | { ok: true; isLive: true; live: YouTubeLiveVideo };
