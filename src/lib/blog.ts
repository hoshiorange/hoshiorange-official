/**
 * ブログ記事の読み込み・Markdown レンダリング（サーバー専用）。
 *
 * - 記事は `content/blog/*.md`。ファイル名は `YYYY-MM-DD-slug.md` を推奨
 *   （日付プレフィックスは slug から除去される。frontmatter の slug 指定が最優先）。
 * - frontmatter: title / description / date は必須。published: false で下書き（一覧・ビルド対象外）。
 *   Zenn 等からの転載は sourceUrl / sourceLabel を指定すると記事側に転載元が表示される。
 * - SSG 前提。fs を使うためクライアントから import しないこと。
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  tags: string[];
  /** 転載元 URL（Zenn 等）。指定時は記事に転載元リンクを表示 */
  sourceUrl?: string;
  /** 転載元の表示名（既定: "Zenn"） */
  sourceLabel?: string;
}

export interface BlogPost extends BlogPostMeta {
  /** レンダリング済み HTML（信頼できるリポジトリ内 Markdown のみが入力） */
  html: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');

function fileToSlug(filename: string): string {
  return filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return null;
}

interface ParsedFile {
  meta: BlogPostMeta;
  content: string;
}

/** 1 ファイルを frontmatter 検証込みでパースする。published: false / 不正は null。 */
function parseFile(filename: string): ParsedFile | null {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8');
  const { data, content } = matter(raw);

  if (data.published === false) return null;

  const date = normalizeDate(data.date);
  if (typeof data.title !== 'string' || typeof data.description !== 'string' || !date) {
    console.warn(`[blog] frontmatter が不正なためスキップ: ${filename}（title/description/date は必須）`);
    return null;
  }

  return {
    meta: {
      slug: typeof data.slug === 'string' && data.slug ? data.slug : fileToSlug(filename),
      title: data.title,
      description: data.description,
      date,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      sourceUrl: typeof data.sourceUrl === 'string' && data.sourceUrl ? data.sourceUrl : undefined,
      sourceLabel: typeof data.sourceLabel === 'string' && data.sourceLabel ? data.sourceLabel : undefined,
    },
    content,
  };
}

function listMarkdownFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
}

/** 公開記事のメタ一覧（新しい順）。 */
export function getAllPostMeta(): BlogPostMeta[] {
  return listMarkdownFiles()
    .map((f) => parseFile(f)?.meta)
    .filter((m): m is BlogPostMeta => m != null)
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeHighlight)
  .use(rehypeStringify);

/** slug から記事本体（HTML 込み）を取得。無ければ null。 */
export async function getPost(slug: string): Promise<BlogPost | null> {
  const filename = listMarkdownFiles().find((f) => {
    const parsed = parseFile(f);
    return parsed?.meta.slug === slug;
  });
  if (!filename) return null;

  const parsed = parseFile(filename);
  if (!parsed) return null;

  const html = String(await processor.process(parsed.content));
  return { ...parsed.meta, html };
}
