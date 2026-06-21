import Image from 'next/image';
import type { YouTubeLiveVideo } from '@/types/youtube';
import styles from './YouTubeLiveCard.module.css';

// ライブ配信中に YouTube 枠の上部へ表示する強調カード。
// ツイキャスの LIVE 表示とトーン（赤系 LIVE バッジ・脈動ドット）を揃えている。
export function YouTubeLiveCard({ live }: { live: YouTubeLiveVideo }) {
  return (
    <a
      href={live.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.liveCard}
    >
      <div className={styles.thumb}>
        {live.thumbnail ? (
          <Image
            src={live.thumbnail}
            alt=""
            width={480}
            height={270}
            className={styles.thumbImg}
            unoptimized
          />
        ) : (
          <div className={styles.thumbPlaceholder} aria-hidden="true" />
        )}
        <span className={styles.liveBadge}>
          <span className={styles.liveDot} aria-hidden="true" />
          LIVE
        </span>
      </div>
      <div className={styles.meta}>
        <p className={styles.liveLabel}>YouTube でライブ配信中！</p>
        <h4 className={styles.title}>{live.title || 'ライブ配信中'}</h4>
        <span className={styles.watchCta}>
          見る
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
  );
}
