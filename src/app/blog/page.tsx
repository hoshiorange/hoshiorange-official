import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { SectionHeading } from '@/components/Section/SectionHeading';
import { getAllPostMeta } from '@/lib/blog';
import styles from './blog.module.css';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'ほしのブログ。週末個人開発の記録、プロダクトのお知らせ、技術記事を掲載しています。',
  alternates: {
    canonical: '/blog',
    types: { 'application/rss+xml': '/feed.xml' },
  },
  openGraph: {
    title: 'Blog · hoshiorange',
    description: 'ほしのブログ。週末個人開発の記録、プロダクトのお知らせ、技術記事を掲載しています。',
    url: '/blog',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPostMeta();

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <SectionHeading
            eyebrow="Blog"
            title="ブログ"
            description="週末個人開発の記録・お知らせ・技術記事。"
          />

          {posts.length === 0 ? (
            <p className={styles.empty}>記事はまだありません。</p>
          ) : (
            <ul className={styles.list}>
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className={styles.card}>
                    <div className={styles.cardMeta}>
                      <time dateTime={post.date}>{post.date}</time>
                      {post.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                      {post.sourceUrl && <span className={styles.tag}>{post.sourceLabel ?? 'Zenn'} 転載</span>}
                    </div>
                    <h2 className={styles.cardTitle}>{post.title}</h2>
                    <p className={styles.cardDesc}>{post.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
