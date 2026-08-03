'use client';

/**
 * こおりのぬけみち プレイヤーのクライアント専用ラッパー。
 * Pixi.js は SSR 不可のため next/dynamic ssr:false で遅延ロードする
 * （Hero3D / ContactVisual と同じ方針）。これによりページ側はサーバーコンポーネントのまま。
 */

import dynamic from 'next/dynamic';
import styles from './GameApp.module.css';

const GameApp = dynamic(() => import('./GameApp'), {
  ssr: false,
  loading: () => (
    <div className={styles.root}>
      <p className={styles.srOnly}>読み込み中</p>
    </div>
  ),
});

export function KooriGame({ stageId }: { stageId?: string }) {
  return <GameApp stageId={stageId} />;
}
