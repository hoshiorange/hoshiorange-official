import { Header } from '@/components/Header/Header';
import { Hero } from '@/components/Hero/Hero';
import { LinkCards } from '@/components/LinkCards/LinkCards';
import { LatestActivity } from '@/components/LatestActivity/LatestActivity';
import { Laboratory } from '@/components/Laboratory/Laboratory';
import { Contact } from '@/components/Contact/Contact';
import { Footer } from '@/components/Footer/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LinkCards />
        {/* 制作物（サービス／サイト／ゲーム／コミュニティ等）。生配信情報より先に掲載。 */}
        <Laboratory />
        {/* YouTube 最新動画 + X タイムラインを 1 セクションに統合（生配信情報） */}
        <LatestActivity />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
