'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import styles from './XTimeline.module.css';

const SCRIPT_SRC = 'https://platform.twitter.com/widgets.js';
const SCRIPT_ID = 'twitter-widgets-script';
// 埋め込みが生成されたか判定するまでの待機時間（X 側 429 などで空になるケースの保険）
const FALLBACK_TIMEOUT_MS = 4000;
// iframe の高さがこれ未満なら「中身が空」とみなす
const MIN_EMBED_HEIGHT = 80;

type WidgetTimelineOptions = {
  sourceType: 'profile';
  screenName: string;
};
type WidgetRenderOptions = {
  theme?: string;
  height?: number;
  chrome?: string;
  dnt?: boolean;
  lang?: string;
};

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void;
        createTimeline?: (
          options: WidgetTimelineOptions,
          target: HTMLElement,
          renderOptions?: WidgetRenderOptions,
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

type EmbedStatus = 'loading' | 'ready' | 'fallback';

function loadWidgetsScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.twttr?.widgets) {
      resolve();
      return;
    }
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      // 既に挿入済みだがまだ読み込み中の可能性。load イベントを待つ。
      if (window.twttr?.widgets) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        // onload を取り逃すケースの保険
        const poll = window.setInterval(() => {
          if (window.twttr?.widgets) {
            window.clearInterval(poll);
            resolve();
          }
        }, 200);
        window.setTimeout(() => {
          window.clearInterval(poll);
          resolve();
        }, FALLBACK_TIMEOUT_MS);
      }
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.async = true;
    s.src = SCRIPT_SRC;
    s.addEventListener('load', () => resolve(), { once: true });
    s.addEventListener('error', () => resolve(), { once: true });
    document.body.appendChild(s);
  });
}

/** 生成された iframe が実際に中身を持っているか（高さがあるか）を確認する。 */
function embedHasContent(container: HTMLElement): boolean {
  const iframe = container.querySelector<HTMLIFrameElement>('iframe[id^="twitter-widget"]');
  if (!iframe) return false;
  const rect = iframe.getBoundingClientRect();
  return rect.height >= MIN_EMBED_HEIGHT;
}

export function XTimeline() {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<EmbedStatus>('loading');

  useEffect(() => {
    // env から取得（クライアントで参照可能な NEXT_PUBLIC_ のみ）
    setUsername(process.env.NEXT_PUBLIC_X_USERNAME);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!username || !containerRef.current) return;

    const container = containerRef.current;
    // この実行が破棄されたかどうか（テーマ切替・アンマウントで切り替わる）
    let cancelled = false;
    let timeoutId: number | undefined;

    setStatus('loading');
    container.innerHTML = '';

    const finish = (next: EmbedStatus) => {
      if (cancelled) return;
      setStatus(next);
    };

    // タイムアウトによる保険判定：時間内に中身のある iframe が出来ていなければ失敗扱い
    const scheduleHeightCheck = () => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        finish(embedHasContent(container) ? 'ready' : 'fallback');
      }, FALLBACK_TIMEOUT_MS);
    };

    loadWidgetsScript().then(() => {
      if (cancelled) return;
      const widgets = window.twttr?.widgets;

      if (widgets?.createTimeline) {
        // 返り値 Promise で成否判定。解決値が falsy なら失敗扱い。
        scheduleHeightCheck();
        widgets
          .createTimeline(
            { sourceType: 'profile', screenName: username },
            container,
            { theme, height: 620, chrome: 'transparent noheader noborders', dnt: true, lang: 'ja' },
          )
          .then((el) => {
            if (cancelled) return;
            if (!el) {
              finish('fallback');
              return;
            }
            // 生成されても中身が空（429 で高さ0）のことがあるため、高さも確認。
            // 直後はレイアウト未確定なこともあるので少し待ってから判定する。
            window.setTimeout(() => {
              if (cancelled) return;
              finish(embedHasContent(container) ? 'ready' : 'fallback');
            }, 600);
          })
          .catch(() => finish('fallback'));
        return;
      }

      // createTimeline 非対応環境向けフォールバック：anchor + widgets.load()
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
      widgets?.load(container);
      scheduleHeightCheck();
    });

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [username, theme]);

  return (
    <div className={styles.panel} aria-labelledby="latest-x-heading">
      <div className={styles.head}>
        <h3 id="latest-x-heading" className={styles.heading}>
          <span className={styles.headingMark} aria-hidden="true" />
          最新のポスト
        </h3>
        <p className={styles.lead}>X アカウントから直近の投稿を埋め込み表示。</p>
      </div>

      <div className={styles.body}>
        <div className={styles.frame}>
          {!mounted ? (
            <div className={styles.skeleton} aria-hidden="true" />
          ) : !username ? (
            <div className={styles.placeholder} role="status">
              <p>X タイムラインを表示するには NEXT_PUBLIC_X_USERNAME を設定してください。</p>
              <p className={styles.placeholderHint}>
                {/* TODO: ユーザー名を埋めると埋め込みが有効化されます */}
                .env.local に NEXT_PUBLIC_X_USERNAME=hoshiorange のように設定してください。
              </p>
            </div>
          ) : (
            <>
              {/* 埋め込みコンテナは常にマウントしておき、失敗時のみ視覚的に隠す */}
              <div
                ref={containerRef}
                className={styles.embed}
                data-hidden={status === 'fallback' ? 'true' : undefined}
              />
              {status === 'loading' && (
                <div className={styles.skeleton} aria-hidden="true" />
              )}
              {status === 'fallback' && <XFallback username={username} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** X 埋め込みが空/失敗のときに表示するリンクカード。 */
function XFallback({ username }: { username: string }) {
  return (
    <a
      className={styles.fallback}
      href={`https://x.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      role="status"
    >
      <span className={styles.fallbackIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.683l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
        </svg>
      </span>
      <span className={styles.fallbackText}>@{username} の最新ポストを見る</span>
      <span className={styles.fallbackArrow} aria-hidden="true">
        →
      </span>
    </a>
  );
}
