'use client';

/**
 * Contact のビジュアル領域（案B：光る星＝ほし本人）をクライアント専用で読み込むラッパー。
 * three / r3f は SSR 不可のため next/dynamic ssr:false で遅延ロードする。
 * これにより呼び出し元の Contact 本体はサーバーコンポーネントのままにできる。
 *
 * Hero には案A（ロゴ＋軌道）を、Contact には案B（光る星）を置く分離方針。
 * Contact では背景レイヤーとして透過表示するため subtle モードで読み込む。
 */

import dynamic from 'next/dynamic';

const HeroStar3D = dynamic(() => import('@/components/Hero3D/HeroStar3D'), {
  ssr: false,
  loading: () => null,
});

export function ContactVisual() {
  // subtle: 背景レイヤー用の控えめモード（Bloom/Sparkles 抑制・操作無効・透過）
  return <HeroStar3D subtle />;
}
