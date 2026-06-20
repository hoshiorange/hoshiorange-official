'use client';

/**
 * ============================================================
 * これは「触れる3Dヒーロー演出」案A / 案B の比較用 一時プレビューページです。
 * ルート: /hero3d-preview
 * 本番 Hero（src/components/Hero/）や src/app/page.tsx とは独立しており、
 * ここで方向性が固まったら本番ヒーローへ差し込む想定。比較が終わったら削除可。
 * ============================================================
 */

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import styles from './preview.module.css';

// three / r3f は SSR で動かないため ssr:false でクライアント専用ロード
const HeroLogo3D = dynamic(() => import('@/components/Hero3D/HeroLogo3D'), {
  ssr: false,
  loading: () => <div className={styles.loading}>読み込み中…</div>,
});
const HeroStar3D = dynamic(() => import('@/components/Hero3D/HeroStar3D'), {
  ssr: false,
  loading: () => <div className={styles.loading}>読み込み中…</div>,
});

type Variant = 'logo' | 'star';

export default function Hero3DPreviewPage() {
  const [variant, setVariant] = useState<Variant>('logo');

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <span className={styles.title}>Hero 3D プレビュー（比較用）</span>
        <ThemeToggle />
      </div>

      <p className={styles.note}>
        ※ このページは案A / 案B の比較用の一時ページです（本番 Hero とは別物）。
        下のボタンで切り替え、3Dオブジェクトをドラッグして回転・ホバー/クリックで反応を確認できます。
      </p>

      <div className={styles.toggleRow}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${variant === 'logo' ? styles.toggleBtnActive : ''}`}
          onClick={() => setVariant('logo')}
          aria-pressed={variant === 'logo'}
        >
          案A：ロゴの3D化
        </button>
        <button
          type="button"
          className={`${styles.toggleBtn} ${variant === 'star' ? styles.toggleBtnActive : ''}`}
          onClick={() => setVariant('star')}
          aria-pressed={variant === 'star'}
        >
          案B：光る星の3D化
        </button>
      </div>

      <div className={styles.stage}>
        {variant === 'logo' ? <HeroLogo3D /> : <HeroStar3D />}
      </div>

      <p className={styles.hint}>
        ドラッグで回転 / ホバーで発光強化 / クリックで反応
        {variant === 'star' ? '（弾む＋明滅）' : '（拡大＋発光）'}
      </p>
    </main>
  );
}
