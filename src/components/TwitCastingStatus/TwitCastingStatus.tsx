import { fetchTwitCastingStatus } from '@/lib/twitcasting';
import type { TwitCastingMovie } from '@/types/twitcasting';
import styles from './TwitCastingStatus.module.css';

const PROFILE_URL = 'https://twitcasting.tv/hoshiorange';

function formatDateTime(unixSec: number): string {
  if (!unixSec) return '';
  try {
    const d = new Date(unixSec * 1000);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

export async function TwitCastingStatus() {
  const result = await fetchTwitCastingStatus(4);

  const isLive = result.ok && result.live !== null;
  const live = result.ok ? result.live : null;
  const recent: TwitCastingMovie[] =
    result.ok && !isLive ? result.recent.filter((m) => m.isRecorded || !m.isLive) : [];

  return (
    <div className={styles.panel} aria-labelledby="latest-twitcasting-heading">
      <div className={styles.head}>
        <h3 id="latest-twitcasting-heading" className={styles.heading}>
          <span
            className={`${styles.headingMark} ${isLive ? styles.headingMarkLive : ''}`}
            aria-hidden="true"
          />
          ツイキャス配信
        </h3>
        <p className={styles.lead}>
          {isLive ? 'ただいまライブ配信中です。' : 'ツイキャスでのライブ配信状況を表示。'}
        </p>
      </div>

      <div className={styles.body}>
        {isLive && live ? (
          /* ---- 配信中 ---- */
          <a
            href={live.link || PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card} ${styles.liveCard}`}
          >
            <div className={styles.thumb}>
              {live.thumbnail ? (
                // ツイキャスのサムネは動的 IP ホスト名のため next/image 非対応。通常 img を使用。
                // eslint-disable-next-line @next/next/no-img-element
                <img src={live.thumbnail} alt="" className={styles.thumbImg} />
              ) : (
                <div className={styles.thumbPlaceholder} aria-hidden="true" />
              )}
              <span className={styles.liveBadge}>
                <span className={styles.liveDot} aria-hidden="true" />
                LIVE
              </span>
            </div>
            <div className={styles.meta}>
              <p className={styles.liveLabel}>ただいま配信中</p>
              <h4 className={styles.title}>{live.title || 'ライブ配信中'}</h4>
              {live.subtitle ? <p className={styles.subtitle}>{live.subtitle}</p> : null}
              <span className={styles.watchCta}>
                視聴する
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
            </div>
          </a>
        ) : result.ok && recent.length > 0 ? (
          /* ---- 配信していない: 最近の配信一覧 ---- */
          <div className={styles.offlineWrap}>
            <p className={styles.offlineNote}>現在オフラインです。最近の配信:</p>
            <ul className={styles.recentList}>
              {recent.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.link || PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.recentItem}
                  >
                    <div className={styles.recentThumb}>
                      {m.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.thumbnail} alt="" className={styles.thumbImg} />
                      ) : (
                        <div className={styles.thumbPlaceholder} aria-hidden="true" />
                      )}
                    </div>
                    <div className={styles.recentMeta}>
                      <p className={styles.recentTitle}>{m.title || 'アーカイブ配信'}</p>
                      <time className={styles.recentDate} dateTime={String(m.created)}>
                        {formatDateTime(m.created)}
                      </time>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.profileLink}
            >
              ツイキャスをすべて見る →
            </a>
          </div>
        ) : (
          /* ---- 取得失敗 / env 未設定 / 配信履歴なし: フォールバックリンクカード ---- */
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card} ${styles.fallbackCard}`}
          >
            <div className={styles.fallbackInner}>
              <span className={styles.fallbackIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M10 8.5v7l6-3.5-6-3.5z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <div>
                <p className={styles.fallbackTitle}>ツイキャスを見る</p>
                <p className={styles.fallbackHint}>
                  {result.ok
                    ? '配信状況はこちらから確認できます。'
                    : result.reason === 'missing-env'
                      ? '.env.local に TWITCASTING_ACCESS_TOKEN（または TWITCASTING_CLIENT_ID / TWITCASTING_CLIENT_SECRET）を設定すると配信状況が表示されます。'
                      : '配信状況の取得に失敗しました。プロフィールから直接ご確認ください。'}
                </p>
              </div>
              <span className={styles.fallbackArrow} aria-hidden="true">
                →
              </span>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
