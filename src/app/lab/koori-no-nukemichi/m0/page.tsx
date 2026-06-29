import type { Metadata } from 'next';
import { KooriGame } from '@/games/koori-no-nukemichi/player/KooriGame';

/**
 * こおりのぬけみち M0 プレビュールート。
 * - 全画面・夜テーマ固定の没入レイアウト（プレイヤー側で fixed 描画）。
 * - 既存の公開 Coming Soon ページ（../page.tsx）は変更しない。
 * - プロトタイプのため検索エンジンには載せない（noindex）。
 */
export const metadata: Metadata = {
  title: 'こおりのぬけみち (M0 プレビュー)',
  description: '氷床スライドパズル「こおりのぬけみち」の開発プレビュー（M0）。',
  robots: { index: false, follow: false },
};

export default function KooriM0PreviewPage() {
  return <KooriGame />;
}
