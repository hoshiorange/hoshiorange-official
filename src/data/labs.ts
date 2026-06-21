/**
 * Laboratory セクションで表示する制作物（サービス・サイト・ゲーム・コミュニティ等）の一覧。
 * - 現時点では中身が無いため空配列。`items` が空のあいだは Coming Soon プレースホルダーを表示する。
 * - 配列に追記すれば自動的にカードが並ぶデータ駆動構造。
 * - `url` 未設定 or `comingSoon: true` なら個別カードも Coming Soon 表示（クリック無効）。
 */
export type LabCategory = 'service' | 'site' | 'game' | 'community' | 'other';

/**
 * `url` がスラッシュ始まり（`/lab/...` 等）の場合はサイト内ページとみなし、
 * next/link で同一タブ遷移する。`http(s)://` 等の外部 URL は別タブで開く。
 */
export function isInternalUrl(url?: string): boolean {
  return typeof url === 'string' && url.startsWith('/');
}

export interface LabItem {
  id: string;
  /** 制作物名 */
  title: string;
  /** カード本文の説明 */
  description: string;
  /** 公開 URL。未設定なら Coming Soon カードになる */
  url?: string;
  /** 種別（カードの差し色に使用） */
  category: LabCategory;
  /** 任意のタグ（使用技術・ジャンル等）。カード下部に並べる */
  tags?: string[];
  /** 明示的に Coming Soon にしたい場合 true */
  comingSoon?: boolean;
}

/**
 * 制作物リスト。
 * 例として足すなら以下のような形:
 *   {
 *     id: 'my-app',
 *     title: 'なにかのアプリ',
 *     description: '〇〇できる Web アプリ。',
 *     url: 'https://example.com',
 *     category: 'service',
 *     tags: ['Next.js', 'TypeScript'],
 *   }
 */
export const labs: LabItem[] = [
  {
    id: 'koori-no-nukemichi',
    title: 'こおりのぬけみち',
    description: '氷の世界を進むミニゲーム。',
    url: '/lab/koori-no-nukemichi',
    category: 'game',
    tags: ['Game'],
  },
];
