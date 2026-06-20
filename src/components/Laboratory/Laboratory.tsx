import { SectionHeading } from '@/components/Section/SectionHeading';
import { labs, type LabItem } from '@/data/labs';
import styles from './Laboratory.module.css';

// 制作物（サービス・サイト・ゲーム・コミュニティ等）を紹介するセクション。
// labs が空のあいだは Coming Soon プレースホルダーを 1 枚表示する。
// labs にアイテムを足すと自動でカードが並ぶデータ駆動構造。
export function Laboratory() {
  const hasItems = labs.length > 0;

  return (
    <section id="lab" className={styles.section} aria-labelledby="lab-title">
      <div className={styles.container}>
        <SectionHeading
          eyebrow="Laboratory"
          title="つくったもの。"
          description="開発したサービス・サイト・ゲーム・コミュニティなどを掲載予定です。"
        />

        {hasItems ? (
          <ul className={styles.grid}>
            {labs.map((item) => (
              <li key={item.id}>
                <Card item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.grid}>
            <li>
              <PlaceholderCard />
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}

// アイテム未登録時のプレースホルダー（LinkCards の Coming Soon カードのトーンに合わせる）
function PlaceholderCard() {
  return (
    <div className={`${styles.card} ${styles.coming}`} aria-disabled="true">
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.cardHeader}>
        <span className={styles.iconWrap} aria-hidden="true">
          <FlaskIcon />
        </span>
        <span className={styles.tagSoon}>Coming Soon</span>
      </div>
      <h3 className={styles.cardTitle}>準備中。</h3>
      <p className={styles.cardDesc}>
        制作したものをここに並べていく予定です。お楽しみに。
      </p>
    </div>
  );
}

function Card({ item }: { item: LabItem }) {
  const isComing = item.comingSoon || !item.url;
  const className = `${styles.card} ${isComing ? styles.coming : ''} ${
    styles[`category_${item.category}`] ?? ''
  }`;

  const content = (
    <>
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.cardHeader}>
        <span className={styles.iconWrap} aria-hidden="true">
          <FlaskIcon />
        </span>
        {isComing ? (
          <span className={styles.tagSoon}>Coming Soon</span>
        ) : (
          <span className={styles.tagOpen}>OPEN</span>
        )}
      </div>
      <h3 className={styles.cardTitle}>{item.title}</h3>
      <p className={styles.cardDesc}>{item.description}</p>
      {item.tags && item.tags.length > 0 && (
        <ul className={styles.tags}>
          {item.tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      )}
      {!isComing && (
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
      )}
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

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M9 3h6M10 3v6.5L5.2 17.4A2 2 0 0 0 6.9 20.5h10.2a2 2 0 0 0 1.7-3.1L14 9.5V3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 14h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
