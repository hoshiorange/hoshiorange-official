'use client';

import { useEffect, useRef, useState } from 'react';
import { SectionHeading } from '@/components/Section/SectionHeading';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import styles from './XTimeline.module.css';

const SCRIPT_SRC = 'https://platform.twitter.com/widgets.js';
const SCRIPT_ID = 'twitter-widgets-script';

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

export function XTimeline() {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // env から取得（クライアントで参照可能な NEXT_PUBLIC_ のみ）
    setUsername(process.env.NEXT_PUBLIC_X_USERNAME);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!username || !containerRef.current) return;

    // 既存内容をクリアして anchor を作り直す
    const container = containerRef.current;
    container.innerHTML = '';

    const anchor = document.createElement('a');
    anchor.className = 'twitter-timeline';
    anchor.setAttribute('data-theme', theme);
    anchor.setAttribute('data-height', '620');
    anchor.setAttribute('data-chrome', 'transparent noheader noborders');
    anchor.setAttribute('data-dnt', 'true');
    anchor.setAttribute('data-lang', 'ja');
    anchor.href = `https://twitter.com/${username}`;
    anchor.textContent = `Posts by @${username}`;
    container.appendChild(anchor);

    // スクリプトを 1 回だけ挿入。あとは widgets.load() で再描画
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!existing) {
      const s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.async = true;
      s.src = SCRIPT_SRC;
      s.onload = () => {
        window.twttr?.widgets.load(container);
      };
      document.body.appendChild(s);
    } else {
      window.twttr?.widgets.load(container);
    }
  }, [username, theme]);

  return (
    <section id="x" className={styles.section} aria-labelledby="x-title">
      <div className={styles.container}>
        <SectionHeading
          eyebrow="X / Twitter"
          title="最新のポスト。"
          description="X アカウントから直近の投稿を埋め込みで表示します。"
        />

        <div className={styles.frame}>
          {!mounted ? (
            <div className={styles.skeleton} aria-hidden="true" />
          ) : username ? (
            <div ref={containerRef} className={styles.embed} />
          ) : (
            <div className={styles.placeholder} role="status">
              <p>X タイムラインを表示するには NEXT_PUBLIC_X_USERNAME を設定してください。</p>
              <p className={styles.placeholderHint}>
                {/* TODO: ユーザー名を埋めると埋め込みが有効化されます */}
                .env.local に NEXT_PUBLIC_X_USERNAME=hoshiorange のように設定してください。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
