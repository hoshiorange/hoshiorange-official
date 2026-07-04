import { getAllPostMeta } from '@/lib/blog';

/** ブログの RSS 2.0 フィード（SSG・ビルド時生成）。 */
export const dynamic = 'force-static';

function resolveSiteUrl(): string {
  const fallback = 'http://localhost:3000';
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return fallback;
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return fallback;
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const base = resolveSiteUrl();
  const posts = getAllPostMeta();

  const items = posts
    .map((post) => {
      const url = `${base}/blog/${post.slug}`;
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(post.description)}</description>`,
        `      <pubDate>${new Date(`${post.date}T00:00:00+09:00`).toUTCString()}</pubDate>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    '    <title>hoshiorange Blog</title>',
    `    <link>${base}/blog</link>`,
    '    <description>ほしのブログ。週末個人開発の記録・お知らせ・技術記事。</description>',
    '    <language>ja</language>',
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
