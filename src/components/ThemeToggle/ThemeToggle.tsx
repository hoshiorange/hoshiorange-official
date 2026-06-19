'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = theme === 'dark' ? 'ライトモードに切り替える' : 'ダークモードに切り替える';

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      data-theme={mounted ? theme : 'dark'}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.sun}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="2.5" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="21.5" />
              <line x1="2.5" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="21.5" y2="12" />
              <line x1="5" y1="5" x2="6.8" y2="6.8" />
              <line x1="17.2" y1="17.2" x2="19" y2="19" />
              <line x1="5" y1="19" x2="6.8" y2="17.2" />
              <line x1="17.2" y1="6.8" x2="19" y2="5" />
            </g>
          </svg>
        </span>
        <span className={styles.moon}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path
              d="M19 14.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className={styles.knob} />
      </span>
    </button>
  );
}
