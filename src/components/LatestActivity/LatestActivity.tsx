import { SectionHeading } from '@/components/Section/SectionHeading';
import { YouTubeLatest } from '@/components/YouTubeLatest/YouTubeLatest';
import { XTimeline } from '@/components/XTimeline/XTimeline';
import styles from './LatestActivity.module.css';

// YouTube 最新動画と X タイムラインを 1 セクションに統合するラッパー。
// 見出しはここで 1 つに集約し、各子コンポーネントは中身（パネル）だけを返す。
export function LatestActivity() {
  return (
    <section id="latest" className={styles.section} aria-labelledby="latest-title">
      <div className={styles.container}>
        <SectionHeading
          eyebrow="Latest"
          title="最新の動き。"
          description="YouTube と X から直近の活動をまとめて表示しています。"
        />

        <div className={styles.grid}>
          {/* YouTubeLatest はサーバーコンポーネントとして fetch して ISR で再検証 */}
          <YouTubeLatest />
          <XTimeline />
        </div>
      </div>
    </section>
  );
}
