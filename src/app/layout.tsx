import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import SmoothScroll from '@/components/providers/SmoothScroll';
import Cursor from '@/components/design/Cursor';
import Nav from '@/components/common/Nav';
import Footer from '@/components/design/Footer';
import { siteConfig } from '@/lib/data';

const cabinet = localFont({
  src: '../assets/fonts/CabinetGrotesk-Variable.ttf',
  variable: '--font-cabinet',
  display: 'swap',
});

const switzer = localFont({
  src: '../assets/fonts/Switzer-Variable.ttf',
  variable: '--font-switzer',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Portfolio`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'software engineer',
    'full-stack developer',
    'AI developer',
    'machine learning',
    'React',
    'Node.js',
    'portfolio',
    'Lokesh Ram Chand',
    'Lokesh Ram Chand B',
    'web development',
    'programming',
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    siteName: `${siteConfig.shortName} — Portfolio`,
    title: `${siteConfig.name} — Portfolio`,
    description:
      'Lokesh Ram Chand — Software Engineer building intelligent, scalable platforms with modern full-stack development and AI technologies.',
    images: [{ url: '/images/og-image.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — Portfolio`,
    description: siteConfig.description,
    images: ['/images/og-image.webp'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cabinet.variable} ${switzer.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-void-950">
        <SmoothScroll>
          <Cursor />
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
