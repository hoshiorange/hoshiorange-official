import type { Metadata } from 'next';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { Contact } from '@/components/Contact/Contact';

const TITLE = 'お問い合わせ';
const DESCRIPTION = 'hoshiorange へのお問い合わせ方法。SNS 経由でのご連絡を受け付けています。';

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
      </main>
      <Footer />
    </>
  );
}
