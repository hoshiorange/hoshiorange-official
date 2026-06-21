/**
 * Featured Links セクションで表示するリンク一覧。
 * - `url` 未設定なら自動的に Coming Soon 表示（クリック無効）
 * - 配列に追記すれば自動的にカードが増える
 */
export type LinkCategory = "sns" | "creative" | "tech" | "other";
export type LinkIcon =
  | "x"
  | "youtube"
  | "twitcasting"
  | "github"
  | "note"
  | "blog"
  | "mail";

export interface LinkItem {
  id: string;
  label: string;
  /** 未設定なら Coming Soon カードになる */
  url?: string;
  category: LinkCategory;
  icon: LinkIcon;
  /** カード下部の補足文 */
  description?: string;
  /** 明示的に Coming Soon にしたい場合 true */
  comingSoon?: boolean;
}

export const links: LinkItem[] = [
  {
    id: "x",
    label: "X (Twitter)",
    category: "sns",
    icon: "x",
    description: "日々のつぶやき・告知・雑感を投下する基地。",
    url: "https://x.com/hoshiorange",
  },
  {
    id: "youtube",
    label: "YouTube",
    category: "creative",
    icon: "youtube",
    description: "ゲームの生配信してます",
    url: "https://www.youtube.com/@hoshiorange4847",
  },
  {
    id: "twitcasting",
    label: "ツイキャス",
    category: "sns",
    icon: "twitcasting",
    description: "主にカラオケの生配信してます",
    url: "https://twitcasting.tv/hoshiorange",
  },
  {
    id: "github",
    label: "GitHub",
    category: "tech",
    icon: "github",
    description: "個人開発・OSS・実験のコード置き場。",
    url: "https://github.com/hoshiorange/",
  },
];

export const linksByCategory = (cat: LinkCategory) =>
  links.filter((l) => l.category === cat);
