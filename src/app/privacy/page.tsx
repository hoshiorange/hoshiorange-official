import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { SectionHeading } from '@/components/Section/SectionHeading';
import { profile } from '@/data/profile';
import styles from '../legal/legal.module.css';

const TITLE = 'プライバシーポリシー';
const DESCRIPTION = '当サイトにおける個人情報の取り扱い、Cookie の利用、広告配信について説明します。';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: { title: `${TITLE} · hoshiorange`, description: DESCRIPTION, url: '/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <SectionHeading eyebrow="Privacy Policy" title={TITLE} description={DESCRIPTION} />
          <p className={styles.updated}>最終更新日: 2026-07-09</p>

          <div className={styles.body}>
            <h2>基本方針</h2>
            <p>
              当サイト（hoshiorange 公式サイト、以下「当サイト」）は、運営者「{profile.displayName}」（
              {profile.handle}）が個人で運営しています。当サイトでは、訪問者のプライバシーを尊重し、個人情報の保護に努めます。
            </p>

            <h2>アクセス解析ツールについて</h2>
            <p>
              当サイトでは、サイトの利用状況を把握するために Vercel Web Analytics
              を利用しています。このツールはトラフィックデータの収集にあたり Cookie
              を使用せず、個人を特定する情報を収集しません。取得したデータは匿名の統計情報として、コンテンツ改善の目的にのみ利用します。
            </p>

            <h2>広告の配信について</h2>
            <p>
              当サイトは、第三者配信の広告サービス（Google AdSense
              等）を利用する場合があります。このような広告配信事業者は、ユーザーの興味に応じた広告を表示するために、Cookie
              を使用して当サイトや他のサイトへのアクセス情報に基づき広告を配信することがあります。
            </p>
            <p>
              Cookie を無効にする方法や、Google
              が広告に使用する情報の管理については、Google の
              <Link href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer">
                広告ポリシー
              </Link>
              および
              <Link href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
                広告設定
              </Link>
              をご覧ください。
            </p>

            <h2>コメント機能について</h2>
            <p>
              ブログ記事にはコメント機能があります。投稿されたお名前（未入力の場合は「名無しさん」と表示）とコメント本文はデータベース（Supabase）に保存され、記事下に表示されます。コメントの削除依頼は
              <Link href="/contact">お問い合わせ</Link>
              からご連絡ください。
            </p>

            <h2>アクセスログ・Cookie について</h2>
            <p>
              当サイトはサーバーの技術的な仕様上、アクセスログ（IP アドレス、ブラウザの種類、参照元
              URL 等）を保持する場合があります。これらは個人を特定する目的では利用せず、不正アクセスの防止やサイト運営の改善のためにのみ利用します。
            </p>

            <h2>個人情報の第三者提供について</h2>
            <p>
              当サイトは、法令に基づく場合を除き、取得した情報を本人の同意なく第三者に提供することはありません。
            </p>

            <h2>免責事項</h2>
            <p>
              当サイトに掲載する情報については、可能な限り正確な情報を掲載するよう努めていますが、正確性や安全性を保証するものではありません。当サイトの利用によって生じた損害について、運営者は一切の責任を負いません。
            </p>

            <h2>プライバシーポリシーの変更について</h2>
            <p>
              当サイトは、法令の変更や運営方針の変更等に応じて、本ポリシーの内容を予告なく変更することがあります。変更後のプライバシーポリシーは、当ページに掲載した時点から効力を生じるものとします。
            </p>

            <h2>お問い合わせ</h2>
            <p>
              本ポリシーに関するお問い合わせは<Link href="/contact">お問い合わせページ</Link>
              からお願いします。
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
