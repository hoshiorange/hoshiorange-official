import { HoshiLogo } from '@/components/HoshiLogo/HoshiLogo';
import { profile } from '@/data/profile';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-label="ヒーロー">
      <div className={styles.atmosphere} aria-hidden="true" />
      <div className={styles.orbit} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className={styles.inner}>
        <div className={styles.badge}>
          <span className={styles.dot} />
          <span>Official Hub</span>
        </div>

        <h1 className={styles.title}>
          <span className={styles.titleName}>{profile.displayName}</span>
          <span className={styles.titleSub}>
            {profile.handle} <span className={styles.titleDash}>—</span> Official Hub
          </span>
        </h1>

        <p className={styles.lead}>{profile.heroLead}</p>

        <div className={styles.ctas}>
          <a href="#links" className={styles.ctaPrimary}>
            リンクを見る
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a href="#contact" className={styles.ctaGhost}>
            お仕事のご相談
          </a>
        </div>

        <div className={styles.logoFrame} aria-hidden="true">
          <div className={styles.logoGlow} />
          <HoshiLogo width={148} height={148} className={styles.logo} />
        </div>
      </div>

      <a href="#links" className={styles.scrollHint} aria-label="スクロールして下へ">
        <span>SCROLL</span>
        <span className={styles.scrollLine} />
      </a>
    </section>
  );
}
