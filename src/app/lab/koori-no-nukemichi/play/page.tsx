import type { Metadata } from 'next';
import { KooriPlay } from '@/games/koori-no-nukemichi/player/KooriPlay';

/**
 * こおりのぬけみち プレイルート（公開ステージを遊ぶ導線 / M2 P2）。
 * - 章選択 → ステージ選択 → プレイ の全画面・夜テーマ固定レイアウト。
 * - 公開済みデータのみ表示。env 無しでもローカルシードで動作する。
 * - 既存の Coming Soon（../page.tsx）・/m0・/edit は変更しない。
 * - 本番入口の差し替え（P7）はユーザー確認後に行うため、当面は検索非掲載（noindex）。
 */
export const metadata: Metadata = {
  title: 'こおりのぬけみち',
  description: '氷床スライドパズル「こおりのぬけみち」をあそぶ。',
  robots: { index: false, follow: false },
};

export default function KooriPlayPage() {
  return <KooriPlay />;
}
