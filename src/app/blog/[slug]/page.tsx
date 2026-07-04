import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { BlogComments } from '@/components/Blog/BlogComments';
import { getAllPostMeta, getPost } from '@/lib/blog';
import { profile } from '@/data/profile';
import styles from './article.module.css';
import 'highlight.js/styles/github-dark.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPostMeta().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Person', name: profile.displayName, alternateName: profile.handle },
    keywords: post.tags.join(','),
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <article className={styles.article}>
          <header className={styles.head}>
            <div className={styles.meta}>
              <time dateTime={post.date}>{post.date}</time>
              {post.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <h1 className={styles.title}>{post.title}</h1>
            {post.sourceUrl && (
              <p className={styles.source}>
                この記事は{' '}
                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {post.sourceLabel ?? 'Zenn'} に掲載した記事
                </a>{' '}
                の転載です。
              </p>
            )}
          </header>

          <div className={styles.body} dangerouslySetInnerHTML={{ __html: post.html }} />

          <BlogComments slug={post.slug} />

          <footer className={styles.foot}>
            <Link href="/blog" className={styles.back}>
              ← 記事一覧へ
            </Link>
          </footer>
        </article>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
