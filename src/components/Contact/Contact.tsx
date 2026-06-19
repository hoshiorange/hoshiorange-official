import { SectionHeading } from '@/components/Section/SectionHeading';
import { profile } from '@/data/profile';
import styles from './Contact.module.css';

export function Contact() {
  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={styles.container}>
        <div className={styles.card}>
          <span className={styles.aurora} aria-hidden="true" />

          <SectionHeading
            eyebrow="Contact"
            title="お声がけ、お気軽に。"
            description={profile.contactBody}
            align="center"
          />

          <div className={styles.actions}>
            <a className={styles.primary} href={`mailto:${profile.contactEmail}`}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* TODO: 連絡先メールアドレスを差し替える */}
              {profile.contactEmail}
            </a>
            <span className={styles.divider}>or</span>
            <span className={styles.secondary}>
              X の DM でもお気軽にどうぞ
            </span>
          </div>

          <p className={styles.note}>
            返信は順次・できる範囲で行います。込み入った内容は要件をひとことそえていただけると助かります。
          </p>
        </div>
      </div>
    </section>
  );
}
