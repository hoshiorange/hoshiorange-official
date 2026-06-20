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

  // マウント前は SSR と一致させるためダーク固定（FOUC 防止スクリプトと揃える）
  const current = mounted ? theme : 'dark';
  const isDark = current === 'dark';

  // ラベルは「次にどうなるか」を伝える（押下後のアクション）
  const label = isDark ? 'ライトモードに切り替える' : 'ダークモードに切り替える';

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      data-theme={current}
      // 「ダークが押された（=有効）」状態を支援技術に伝える
      aria-pressed={isDark}
    >
      <span className={styles.iconStack} aria-hidden="true">
        {/* 太陽（ライトモード適用中に前面・アクセント色で点灯） */}
        <span className={`${styles.icon} ${styles.sun}`}>
          {/* MUI LightMode アイコン（MIT, 24x24） */}
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
          </svg>
        </span>
        {/* 月（ダークモード適用中に前面・アクセント色で点灯） */}
        <span className={`${styles.icon} ${styles.moon}`}>
          {/* MUI DarkMode アイコン（MIT, 24x24） */}
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
