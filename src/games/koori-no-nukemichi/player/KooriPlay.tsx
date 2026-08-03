'use client';

/**
 * プレイヤーシェルのクライアント専用ラッパー。
 * GameShell は Pixi（プレイ画面）・リポジトリをブラウザ側で使うため
 * next/dynamic ssr:false で遅延ロードし、ルートはサーバーコンポーネントのまま保つ
 * （KooriGame / KooriEditor と同方針）。
 */

import dynamic from 'next/dynamic';
import styles from './GameShell.module.css';

const GameShell = dynamic(() => import('./GameShell'), {
  ssr: false,
  loading: () => (
    <div className={styles.root}>
      <p className={styles.loading}>読み込み中…</p>
    </div>
  ),
});

export function KooriPlay() {
  return <GameShell />;
}
