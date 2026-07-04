import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HoshiLogo } from '@/components/HoshiLogo/HoshiLogo';
import { LpAnalytics } from '@/components/Lp/LpAnalytics';
import { LpCtaButton } from '@/components/Lp/LpCtaButton';
import { LpSignupForm } from '@/components/Lp/LpSignupForm';
import { getLpCandidate, lpCandidates } from '@/data/lp';
import { profile } from '@/data/profile';
import styles from './lp.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return lpCandidates.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lp = getLpCandidate(slug);
  if (!lp) return {};
  return {
    title: `${lp.name} — ${lp.tagline}`,
    description: lp.lead,
    alternates: { canonical: `/lp/${lp.slug}` },
    openGraph: {
      title: `${lp.name} — ${lp.tagline}`,
      description: lp.lead,
      url: `/lp/${lp.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${lp.name} — ${lp.tagline}`,
      description: lp.lead,
    },
  };
}

export default async function LpPage({ params }: Props) {
  const { slug } = await params;
  const lp = getLpCandidate(slug);
  if (!lp) notFound();

  return (
    <div className={styles.page}>
      <LpAnalytics product={lp.slug} />

      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <HoshiLogo width={26} height={26} />
          <span>{profile.handle}</span>
        </Link>
      </header>

      <main className={styles.main}>
        {/* ヒーロー */}
        <section className={styles.hero}>
          <span className={styles.status}>{lp.status}</span>
          <p className={styles.name}>{lp.name}</p>
          <h1 className={styles.tagline}>{lp.tagline}</h1>
          <p className={styles.lead}>{lp.lead}</p>
          {lp.price && <p className={styles.price}>{lp.price}</p>}
          <LpCtaButton product={lp.slug} className={styles.cta}>
            事前登録して先行案内を受け取る
          </LpCtaButton>
        </section>

        {/* 困りごと */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>こんな悩み、ありませんか？</h2>
          <ul className={styles.problems}>
            {lp.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </section>

        {/* 機能 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{lp.name.replace('（仮称）', '')} ができること</h2>
          <div className={styles.features}>
            {lp.features.map((feature) => (
              <div key={feature.title} className={styles.feature}>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 事前登録 */}
        <section className={styles.signup} id="signup">
          <h2 className={styles.sectionTitle}>事前登録</h2>
          <p className={styles.signupLead}>
            公開時に先行案内をお送りします。登録はメールアドレスだけ、30秒で終わります。
          </p>
          <LpSignupForm product={lp.slug} productName={lp.name.replace('（仮称）', '')} />
        </section>
      </main>

      <footer className={styles.footer}>
        <p>
          企画・開発:{' '}
          <a href={`https://x.com/${profile.handle}`} target="_blank" rel="noopener noreferrer">
            ほし（@{profile.handle}）
          </a>
          {' · '}
          <Link href="/">公式サイト</Link>
        </p>
      </footer>
    </div>
  );
}
