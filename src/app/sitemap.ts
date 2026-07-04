import type { MetadataRoute } from 'next';
import { getAllPostMeta } from '@/lib/blog';
import { lpCandidates } from '@/data/lp';

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

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveSiteUrl();
  const posts = getAllPostMeta();

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/blog`,
      lastModified: posts[0] ? new Date(posts[0].date) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...lpCandidates.map((lp) => ({
      url: `${base}/lp/${lp.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
