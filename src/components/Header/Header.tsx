'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HoshiLogo } from '@/components/HoshiLogo/HoshiLogo';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { profile } from '@/data/profile';
import styles from './Header.module.css';

const nav = [
  { href: '#links', label: 'Links' },
  { href: '#lab', label: 'Laboratory' },
  { href: '#latest', label: 'Streaming' },
  { href: '#contact', label: 'Contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href="#top" className={styles.brand} aria-label={`${profile.displayName} ホーム`}>
          <HoshiLogo width={32} height={32} />
          <span className={styles.brandText}>
            <span className={styles.brandName}>{profile.displayName}</span>
            <span className={styles.brandHandle}>{profile.handle}</span>
          </span>
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} aria-label="メインナビゲーション">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={menuOpen ? styles.barsOpen : styles.bars} />
          </button>
        </div>
      </div>
    </header>
  );
}
