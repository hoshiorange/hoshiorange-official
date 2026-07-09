import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { SectionHeading } from '@/components/Section/SectionHeading';
import { profile } from '@/data/profile';
import styles from '../legal/legal.module.css';

const TITLE = '運営者情報';
const DESCRIPTION = '当サイトの運営者・サイトの目的・連絡先について。';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: { title: `${TITLE} · hoshiorange`, description: DESCRIPTION, url: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <SectionHeading eyebrow="About" title={TITLE} description={DESCRIPTION} />

          <div className={styles.body}>
            <h2>運営者</h2>
            <p>
              {profile.displayName}（{profile.handle}）
            </p>
            <p>{profile.operatorBio}</p>

            <h2>サイトについて</h2>
            <p>
              当サイトは、{profile.displayName}
              の各種活動（SNS・配信・制作物など）への入口を集約する公式ハブサイトです。あわせて週末個人開発の記録やお知らせを発信する
              <Link href="/blog">ブログ</Link>
              も運営しています。
            </p>

            <h2>連絡先</h2>
            <p>
              メール:{' '}
              <span className={styles.placeholder}>{profile.contactEmail}</span>
            </p>
            <p>
              SNS 経由でのご連絡も受け付けています。詳しくは
              <Link href="/contact">お問い合わせページ</Link>
              をご覧ください。
            </p>

            <h2>免責事項</h2>
            <p>
              当サイトに掲載する情報については、可能な限り正確な情報を掲載するよう努めていますが、正確性や安全性を保証するものではありません。当サイトの利用によって生じた損害について、運営者は一切の責任を負いません。詳細は
              <Link href="/privacy">プライバシーポリシー</Link>
              をご覧ください。
            </p>
          </div>

          <footer className={styles.foot}>
            <Link href="/" className={styles.back}>
              ← トップへ戻る
            </Link>
          </footer>
        </div>
      </main>
      <Footer />
    </>
  );
}
