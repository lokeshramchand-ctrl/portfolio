import type { Metadata } from "next";
import localFont from "next/font/local";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Cursor from "@/components/design/Cursor";
import Nav from "@/components/common/Nav";
import Footer from "@/components/design/Footer";
import ScrollProgress from "@/components/design/ScrollProgress";
import { siteConfig, socialLinks } from "@/lib/data";

const cabinet = localFont({
  src: "../assets/fonts/CabinetGrotesk-Variable.ttf",
  variable: "--font-cabinet",
  display: "swap",
});

const switzer = localFont({
  src: "../assets/fonts/Switzer-Variable.ttf",
  variable: "--font-switzer",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Portfolio`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  keywords: [
    "software engineer",
    "full-stack developer",
    "AI developer",
    "machine learning",
    "React",
    "Node.js",
    "portfolio",
    "Lokesh Ram Chand",
    "Lokesh Ram Chand B",
    "web development",
    "programming",
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: `${siteConfig.shortName} — Portfolio`,
    title: `${siteConfig.name} — Portfolio`,
    description:
      "Lokesh Ram Chand — Software Engineer building intelligent, scalable platforms with modern full-stack development and AI technologies.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Portfolio`,
    description: siteConfig.description,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteConfig.url}/#person`,
      name: siteConfig.name,
      url: siteConfig.url,
      image: `${siteConfig.url}/images/profile.webp`,
      jobTitle: "Software Engineer",
      email: `mailto:${siteConfig.email}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: siteConfig.locationCountry,
      },
      sameAs: socialLinks.map((link) => link.url),
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: `${siteConfig.shortName} — Portfolio`,
      description: siteConfig.description,
      publisher: { "@id": `${siteConfig.url}/#person` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cabinet.variable} ${switzer.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-void-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <a
          href="#main-content"
          className="fixed top-2 left-2 z-[100] -translate-y-24 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-void-950 transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <SmoothScroll>
          <Cursor />
          <ScrollProgress />
          <Nav />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
