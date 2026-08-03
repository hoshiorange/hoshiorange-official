import type { Metadata } from 'next';
import { KooriEditor } from '@/games/koori-no-nukemichi/editor/KooriEditor';

/**
 * こおりのぬけみち ステージエディタ（管理者専用 / M1）。
 * - 全画面・夜テーマ固定。admin 判定はクライアント側（EditorApp）でガードする。
 * - 一般導線からはリンクしない。検索エンジンにも載せない（noindex）。
 */
export const metadata: Metadata = {
  title: 'こおりのぬけみち エディタ',
  description: 'こおりのぬけみち のステージ作成（管理者専用）。',
  robots: { index: false, follow: false },
};

export default function KooriEditPage() {
  return <KooriEditor />;
}
