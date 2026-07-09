import type { Metadata } from 'next';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { Contact } from '@/components/Contact/Contact';
import { profile } from '@/data/profile';
import styles from '../legal/legal.module.css';

const TITLE = 'お問い合わせ';
const DESCRIPTION = 'hoshiorange へのお問い合わせ方法。SNS 経由・メールでのご連絡を受け付けています。';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/contact' },
  openGraph: { title: `${TITLE} · hoshiorange`, description: DESCRIPTION, url: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <Contact />
        <div className={`${styles.container} ${styles.contactExtra}`}>
          <div className={styles.body}>
            <h2>メールでのご連絡</h2>
            <p>
              メール:{' '}
              <span className={styles.placeholder}>{profile.contactEmail}</span>
            </p>
            <p>お仕事のご依頼など込み入った内容は、メールでのご連絡もご利用いただけます。</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
