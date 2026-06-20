'use client';

/**
 * Hero のビジュアル領域（案A：ロゴ＋軌道リング）をクライアント専用で読み込むラッパー。
 * three / r3f は SSR 不可のため next/dynamic ssr:false で遅延ロードする。
 * これにより呼び出し元の Hero 本体はサーバーコンポーネントのままにできる。
 *
 * 方針: Hero には案A（HeroLogo3D：ロゴ＋軌道）を表示する。
 *       「ほし本人＝星」の案B（HeroStar3D）は Contact セクション側（ContactVisual）で表示する。
 */

import dynamic from 'next/dynamic';

const HeroLogo3D = dynamic(() => import('@/components/Hero3D/HeroLogo3D'), {
  ssr: false,
  loading: () => null,
});

export function HeroVisual() {
  return <HeroLogo3D />;
}
