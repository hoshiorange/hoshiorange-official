import styles from './OfflineNotice.module.css';

interface Props {
  /** 親しみのある一言（例: 「普段は YouTube で配信してます。よかったら遊びに来てね！」）。 */
  copy: string;
  /** CTA の文言（例: 「YouTube チャンネルへ」「ツイキャスへ」）。 */
  ctaLabel: string;
  /** CTA のリンク先（各サービスのページ）。新規タブで開く。 */
  href: string;
}

/**
 * 配信していないときに「いまは配信していません＋遊びに来てね＋サービスへ誘導」を
 * 主役表示する共通カード。YouTube / ツイキャス両枠のオフライン表示で見た目・トーンを揃える。
 * CTA 先（href）と文言（copy / ctaLabel）だけ各サービスで差し替える。
 */
export function OfflineNotice({ copy, ctaLabel, href }: Props) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.offlineCard}>
      <span className={styles.offlineBadge}>
        <span className={styles.offlineDot} aria-hidden="true" />
        OFFLINE
      </span>
      <p className={styles.offlineTitle}>いまは配信していません</p>
      <p className={styles.offlineCopy}>{copy}</p>
      <span className={styles.cta}>
        {ctaLabel}
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
  );
}
