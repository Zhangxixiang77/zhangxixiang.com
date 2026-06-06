import type { Metadata } from 'next';
import { Fraunces, Geist, Noto_Serif_SC, Noto_Sans_SC } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500'],
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Zhang Xixiang',
  description: 'Zhang Xixiang — personal site.',
  metadataBase: new URL('https://zhangxixiang.com'),
  openGraph: {
    title: 'Zhang Xixiang',
    description: 'Zhang Xixiang — personal site.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh"
      className={`${fraunces.variable} ${geist.variable} ${notoSerifSC.variable} ${notoSansSC.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
