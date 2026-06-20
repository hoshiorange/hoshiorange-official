'use client';

/**
 * Hero のビジュアル領域（案A：ロゴ＋軌道リング）をクライアント専用で読み込むラッパー。
 * three / r3f は SSR 不可のため next/dynamic ssr:false で遅延ロードする。
 * これにより呼び出し元の Hero 本体はサーバーコンポーネントのままにできる。
 *
 * 方針: 統合シーン（HeroScene3D）はやめ、Hero には案A（HeroLogo3D）単体を表示する。
 *       「ほし本人＝星」の案B（HeroStar3D）は Contact セクション側で表示する。
 *       HeroScene3D.tsx は後で戻せるよう削除せず残置（このファイルからは参照しない）。
 */

import dynamic from 'next/dynamic';

const HeroLogo3D = dynamic(() => import('./HeroLogo3D'), {
  ssr: false,
  loading: () => null,
});

export function HeroVisual() {
  return <HeroLogo3D />;
}
