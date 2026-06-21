import { HoshiLogo } from '@/components/HoshiLogo/HoshiLogo';
import { profile } from '@/data/profile';
import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <HoshiLogo width={28} height={28} />
          <div>
            <p className={styles.name}>{profile.displayName}</p>
            <p className={styles.handle}>@{profile.handle}</p>
          </div>
        </div>

        <nav aria-label="フッターナビゲーション" className={styles.nav}>
          <a href="#links">Links</a>
          <a href="#lab">Laboratory</a>
          <a href="#latest">Streaming</a>
          <a href="#contact">Contact</a>
        </nav>

        <p className={styles.copy}>
          {profile.copyright} · {year}
        </p>
      </div>
    </footer>
  );
}
