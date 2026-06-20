import type { YouTubeResult, YouTubeVideo } from '@/types/youtube';

/**
 * YouTube Data API v3 から最新動画を取得する。
 * - 環境変数 YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID が未設定ならエラーで落とさず reason を返す
 * - fetch は 1 時間 ISR で再検証
 */
export async function fetchLatestYouTubeVideos(maxResults = 6): Promise<YouTubeResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return {
      ok: false,
      reason: 'missing-env',
      message:
        '動画情報が読み込めませんでした（環境変数 YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID を設定してください）。',
    };
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('order', 'date');
  url.searchParams.set('type', 'video');
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        ok: false,
        reason: 'api-error',
        message: `YouTube API がエラーを返しました (status=${res.status})。`,
      };
    }

    const data: unknown = await res.json();
    const items = (data as { items?: YouTubeRawItem[] }).items ?? [];

    const videos: YouTubeVideo[] = items
      .filter((item) => item?.id?.videoId)
      .map((item) => {
        const id = item.id.videoId as string;
        const snippet = item.snippet ?? {};
        const thumb =
          snippet.thumbnails?.maxres?.url ??
          snippet.thumbnails?.high?.url ??
          snippet.thumbnails?.medium?.url ??
          snippet.thumbnails?.default?.url ??
          '';
        return {
          id,
          title: snippet.title ?? '',
          publishedAt: snippet.publishedAt ?? '',
          thumbnail: thumb,
          channelTitle: snippet.channelTitle ?? '',
          url: `https://www.youtube.com/watch?v=${id}`,
        };
      });

    return { ok: true, videos };
  } catch (err) {
    return {
      ok: false,
      reason: 'api-error',
      message: `YouTube API の取得中に例外が発生しました: ${(err as Error).message}`,
    };
  }
}

interface YouTubeRawItem {
  id: { videoId?: string };
  snippet?: {
    title?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
      maxres?: { url?: string };
    };
  };
}
