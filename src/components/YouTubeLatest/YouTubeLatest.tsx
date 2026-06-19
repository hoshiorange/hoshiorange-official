import Image from 'next/image';
import { SectionHeading } from '@/components/Section/SectionHeading';
import { fetchLatestYouTubeVideos } from '@/lib/youtube';
import styles from './YouTubeLatest.module.css';

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

export async function YouTubeLatest() {
  const result = await fetchLatestYouTubeVideos(6);

  return (
    <section id="youtube" className={styles.section} aria-labelledby="youtube-title">
      <div className={styles.container}>
        <SectionHeading
          eyebrow="YouTube"
          title="最新の動画。"
          description="YouTube チャンネルから直近の投稿を自動で取得しています。"
        />

        {result.ok ? (
          result.videos.length === 0 ? (
            <p className={styles.empty}>まだ動画がありません。最初の投稿をお楽しみに。</p>
          ) : (
            <ul className={styles.grid}>
              {result.videos.map((v) => (
                <li key={v.id}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.card}
                  >
                    <div className={styles.thumb}>
                      {v.thumbnail ? (
                        <Image
                          src={v.thumbnail}
                          alt=""
                          width={480}
                          height={270}
                          className={styles.thumbImg}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder} aria-hidden="true" />
                      )}
                      <span className={styles.play} aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                          <path d="M8 5v14l11-7L8 5z" />
                        </svg>
                      </span>
                    </div>
                    <div className={styles.meta}>
                      <h3 className={styles.title}>{v.title}</h3>
                      <p className={styles.subline}>
                        <span>{v.channelTitle}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={v.publishedAt}>{formatDate(v.publishedAt)}</time>
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className={styles.placeholder} role="status">
            <p>{result.message}</p>
            <p className={styles.placeholderHint}>
              {result.reason === 'missing-env'
                ? '.env.local に YOUTUBE_API_KEY と YOUTUBE_CHANNEL_ID を設定するとここに動画が並びます。'
                : '時間をおいて再度アクセスしてください。'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
