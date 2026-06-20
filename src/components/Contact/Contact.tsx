import { SectionHeading } from '@/components/Section/SectionHeading';
import { profile } from '@/data/profile';
import { ContactVisual } from './ContactVisual';
import styles from './Contact.module.css';

/** 連絡手段ごとのアイコン（X / Discord）。装飾なので aria-hidden。 */
function ContactIcon({ kind }: { kind: 'X' | 'Discord' }) {
  if (kind === 'Discord') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.07.07 0 0 0-.074.035c-.32.57-.677 1.314-.926 1.898a18.27 18.27 0 0 0-5.117 0 11.6 11.6 0 0 0-.94-1.898.073.073 0 0 0-.075-.035A19.74 19.74 0 0 0 5.683 4.37a.066.066 0 0 0-.03.027C2.96 8.39 2.244 12.31 2.595 16.18a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.892a.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-4.475-.838-8.364-3.549-11.785a.06.06 0 0 0-.03-.028ZM8.02 13.83c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.683l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function Contact() {
  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={styles.container}>
        {/* PC: 左カード / 右星 の2カラム。モバイル: カード→星 の縦積み（grid で切替）。 */}
        <div className={styles.grid}>
          {/* 左カラム：連絡先カード（見出し・案内・ユーザー名・X / Discord リンク） */}
          <div className={styles.card}>
            <span className={styles.aurora} aria-hidden="true" />

            <SectionHeading
              eyebrow="Contact"
              title="お声がけ、お気軽に。"
              description={profile.contactBody}
              align="left"
            />

            {/* 各 SNS 共通のユーザー名を主役として大きく提示。
                「hoshiorange で見つけて連絡してね」というニュアンスを伝える。 */}
            <p className={styles.handle}>
              <span className={styles.handleAt} aria-hidden="true">
                @
              </span>
              {profile.contactHandle}
            </p>

            <div className={styles.actions}>
              {profile.contactLinks.map((link) => (
                <div key={link.kind} className={styles.action}>
                  {/* X＝プロフィールへ直リンク／Discord＝フレンド画面(@me)を開くだけ。
                      UI 上はどちらも「hoshiorange で連絡できる導線」として揃える。 */}
                  <a
                    className={link.primary ? styles.primary : styles.secondaryLink}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ContactIcon kind={link.kind} />
                    {link.label}
                  </a>
                  {/* Discord はワンボタン検索を避け、開いた先で自分で検索→申請する案内を添える。 */}
                  {link.hint && <span className={styles.actionHint}>{link.hint}</span>}
                </div>
              ))}
            </div>

            <p className={styles.note}>
              返信は順次・できる範囲で行います。込み入った内容は要件をひとことそえていただけると助かります。
            </p>
          </div>

          {/* 右カラム：ほし本人＝光る星（案B）の3D。
              独立領域に置き、カードとは重ねない。Canvas は透過で背景の星空に溶け込む。
              ドラッグ回転あり。装飾なので aria-hidden。 */}
          <div className={styles.visual} aria-hidden="true">
            <ContactVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
