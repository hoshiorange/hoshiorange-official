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
