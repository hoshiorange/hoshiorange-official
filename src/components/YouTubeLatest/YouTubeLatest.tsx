import Image from 'next/image';
import { fetchLatestYouTubeVideos, getChannelUrl, getLiveStatus } from '@/lib/youtube';
import { YouTubeLiveCard } from './YouTubeLiveCard';
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
  // ライブ判定（短い ISR）を先に確認。配信中なら最新動画一覧の取得は不要。
  const liveResult = await getLiveStatus();
  const isLive = liveResult.ok && liveResult.isLive;

  // 配信中のときは動画グリッドを出さないので、無駄な API 呼び出しを避ける。
  const result = isLive ? null : await fetchLatestYouTubeVideos(6);
  const channelUrl = getChannelUrl();

  return (
    <div className={styles.panel} aria-labelledby="latest-youtube-heading">
      <div className={styles.head}>
        <h3 id="latest-youtube-heading" className={styles.heading}>
          <span
            className={`${styles.headingMark} ${isLive ? styles.headingMarkLive : ''}`}
            aria-hidden="true"
          />
          {isLive ? 'ライブ配信中' : 'YouTube'}
        </h3>
        <p className={styles.lead}>
          {isLive
            ? 'ただいま YouTube でライブ配信中です。'
            : 'YouTube での配信・動画はこちらから。'}
        </p>
      </div>

      <div className={styles.body}>
        {isLive && liveResult.ok && liveResult.isLive ? (
          /* ---- 配信中: LIVE 配信カードを主役表示（動画グリッドは出さない） ---- */
          <YouTubeLiveCard live={liveResult.live} />
        ) : (
          /* ---- 非配信 / 取得失敗: 「今はオフライン・遊びに来てね」を主役にチャンネル誘導 ---- */
          <div className={styles.offlineWrap}>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.offlineCard}
            >
              <span className={styles.offlineBadge}>
                <span className={styles.offlineDot} aria-hidden="true" />
                OFFLINE
              </span>
              <p className={styles.offlineTitle}>いまは配信していません</p>
              <p className={styles.offlineCopy}>
                普段は YouTube で配信してます。よかったら遊びに来てね！
              </p>
              <span className={styles.channelCta}>
                YouTube チャンネルへ
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>

            {result && result.ok && result.videos.length > 0 ? (
              /* 過去の動画は控えめに副次表示（主役はあくまでチャンネル誘導） */
              <div className={styles.pastWrap}>
                <p className={styles.pastNote}>過去の動画</p>
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
                          <h4 className={styles.title}>{v.title}</h4>
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
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
