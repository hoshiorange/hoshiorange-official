import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'こおりのぬけみち',
  description:
    '氷の世界を進むミニゲーム「こおりのぬけみち」。現在準備中です。公開までもう少々お待ちください。',
  openGraph: {
    title: 'こおりのぬけみち · hoshiorange',
    description: '氷の世界を進むミニゲーム「こおりのぬけみち」。現在準備中です。',
  },
};

export default function KooriNoNukemichiPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="game-title">
        <span className={styles.aurora} aria-hidden="true" />

        <p className={styles.eyebrow}>Laboratory / Game</p>
        <h1 id="game-title" className={styles.title}>
          こおりのぬけみち
        </h1>

        <span className={styles.badge}>Coming Soon</span>

        <p className={styles.lead}>
          氷の世界を進むミニゲームを準備中です。
          <br />
          遊べるようになるまで、もう少しだけお待ちください。
        </p>

        <nav className={styles.actions} aria-label="ナビゲーション">
          <Link className={styles.primary} href="/">
            <span className={styles.arrowBack} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M15 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            ホームへ戻る
          </Link>
          <Link className={styles.secondary} href="/#lab">
            Laboratory を見る
          </Link>
        </nav>
      </section>
    </main>
  );
}
