import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP, Space_Grotesk } from 'next/font/google';
import { ThemeProvider, themeInitScript } from '@/components/ThemeProvider/ThemeProvider';
import { StarryBackground } from '@/components/StarryBackground/StarryBackground';
import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});

const body = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-body',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'ほし — hoshiorange official';
const SITE_DESCRIPTION =
  'ゲーム実況・配信、クリエイティブ制作、エンジニアリングを横断する「ほし」の公式ハブサイト。各 SNS への入口・最新動画・最新ポストをここに集約。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s · hoshiorange',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'hoshiorange',
  keywords: ['hoshiorange', 'ほし', 'ゲーム実況', '配信', 'クリエイター', 'エンジニア'],
  openGraph: {
    type: 'website',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'hoshiorange',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#060814' },
    { media: '(prefers-color-scheme: light)', color: '#f6f7fb' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <head>
        {/* FOUC 防止: localStorage と prefers-color-scheme から data-theme を同期適用 */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <StarryBackground />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
