import { HeroVisual } from '@/components/Hero3D/HeroVisual';
import { profile } from '@/data/profile';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-label="ヒーロー">
      <div className={styles.atmosphere} aria-hidden="true" />

      <div className={styles.inner}>
        {/* 左カラム：テキスト群（タイトル・lead）。PC では左寄せ、モバイルでは中央寄せ。 */}
        <div className={styles.copy}>
          <h1 className={styles.title}>{`${profile.handle}-official`}</h1>

          <p className={styles.lead}>{profile.heroLead}</p>
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
