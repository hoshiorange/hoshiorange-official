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
        {/* YouTube 最新動画 + X タイムラインを 1 セクションに統合 */}
        <LatestActivity />
        {/* 制作物（サービス／サイト／ゲーム／コミュニティ等）。現状は Coming Soon */}
        <Laboratory />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
