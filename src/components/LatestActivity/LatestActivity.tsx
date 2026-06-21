import { SectionHeading } from "@/components/Section/SectionHeading";
import { YouTubeLatest } from "@/components/YouTubeLatest/YouTubeLatest";
import { TwitCastingStatus } from "@/components/TwitCastingStatus/TwitCastingStatus";
import styles from "./LatestActivity.module.css";

// YouTube 最新動画とツイキャス配信状況を 1 セクションに統合するラッパー。
// 見出しはここで 1 つに集約し、各子コンポーネントは中身（パネル）だけを返す。
export function LatestActivity() {
  return (
    <section
      id="latest"
      className={styles.section}
      aria-labelledby="latest-title"
    >
      <div className={styles.container}>
        <SectionHeading
          eyebrow="Streaming"
          title="配信情報"
          description="YouTube の配信アーカイブとツイキャスの配信状況をまとめて表示しています。"
        />

        <div className={styles.grid}>
          {/* どちらもサーバーコンポーネントとして fetch し ISR で再検証 */}
          <YouTubeLatest />
          <TwitCastingStatus />
        </div>
      </div>
    </section>
  );
}
