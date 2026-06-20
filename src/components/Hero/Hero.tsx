import { HeroVisual } from '@/components/Hero3D/HeroVisual';
import { profile } from '@/data/profile';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-label="ヒーロー">
      <div className={styles.atmosphere} aria-hidden="true" />

      <div className={styles.inner}>
        {/* 左カラム：テキスト群（タイトル・lead・CTA）。PC では左寄せ、モバイルでは中央寄せ。 */}
        <div className={styles.copy}>
          <h1 className={styles.title}>{`${profile.handle}-official`}</h1>

          <p className={styles.lead}>{profile.heroLead}</p>

          <div className={styles.ctas}>
            <a href="#links" className={styles.ctaPrimary}>
              SNS
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#lab" className={styles.ctaGhost}>
              制作物
            </a>
          </div>
        </div>

        {/* 右カラム：サイトのロゴ（四芒星）＋オレンジ軌道リングの3D（案A）。
            ドラッグ回転・ホバー/クリックで発光。装飾なので aria-hidden。
            ほし本人＝星の演出（案B）は Contact セクション側に置く。 */}
        <div className={styles.visual} aria-hidden="true">
          <HeroVisual />
        </div>
      </div>

      <a href="#links" className={styles.scrollHint} aria-label="スクロールして下へ">
        <span>SCROLL</span>
        <span className={styles.scrollLine} />
      </a>
    </section>
  );
}
