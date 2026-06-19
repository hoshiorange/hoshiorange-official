import { Header } from '@/components/Header/Header';
import { Hero } from '@/components/Hero/Hero';
import { LinkCards } from '@/components/LinkCards/LinkCards';
import { YouTubeLatest } from '@/components/YouTubeLatest/YouTubeLatest';
import { XTimeline } from '@/components/XTimeline/XTimeline';
import { Contact } from '@/components/Contact/Contact';
import { Footer } from '@/components/Footer/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LinkCards />
        {/* YouTubeLatest はサーバーコンポーネントとして fetch して ISR で再検証 */}
        <YouTubeLatest />
        <XTimeline />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
