import { SectionHeading } from '@/components/Section/SectionHeading';
import { links, type LinkItem } from '@/data/links';
import { LinkIcon } from './LinkIcon';
import styles from './LinkCards.module.css';

export function LinkCards() {
  return (
    <section id="links" className={styles.section} aria-labelledby="links-title">
      <div className={styles.container}>
        <SectionHeading
          eyebrow="Featured Links"
          title="主な活動拠点。"
          description="各 SNS・チャンネルへの入口です。「Coming Soon」は近日開設予定の枠を確保しています。"
        />

        <ul className={styles.grid}>
          {links.map((item) => (
            <li key={item.id}>
              <Card item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Card({ item }: { item: LinkItem }) {
  const isComing = item.comingSoon || !item.url;
  const className = `${styles.card} ${isComing ? styles.coming : ''} ${styles[`category_${item.category}`] ?? ''}`;

  const content = (
    <>
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.cardHeader}>
        <span className={styles.iconWrap}>
          <LinkIcon icon={item.icon} />
        </span>
        {isComing ? (
          <span className={styles.tagSoon}>Coming Soon</span>
        ) : (
          <span className={styles.tagOpen}>OPEN</span>
        )}
      </div>
      <h3 className={styles.cardTitle}>{item.label}</h3>
      {item.description && <p className={styles.cardDesc}>{item.description}</p>}
      <span className={styles.arrow} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path
            d="M7 17L17 7M17 7H9M17 7V15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );

  if (isComing) {
    return (
      <div className={className} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <a className={className} href={item.url} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}
