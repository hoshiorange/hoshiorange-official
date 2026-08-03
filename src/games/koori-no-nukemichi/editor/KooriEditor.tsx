'use client';

/**
 * エディタのクライアント専用ラッパー。
 * 認証・リポジトリはブラウザ側で動くため next/dynamic ssr:false で遅延ロードし、
 * ルートページはサーバーコンポーネントのまま保つ。
 */

import dynamic from 'next/dynamic';
import styles from './editor.module.css';

const EditorApp = dynamic(() => import('./EditorApp'), {
  ssr: false,
  loading: () => (
    <div className={styles.root}>
      <div className={styles.center}>
        <p>読み込み中…</p>
      </div>
    </div>
  ),
});

export function KooriEditor() {
  return <EditorApp />;
}
