import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Nexus — Collaborative Knowledge Base, Powered by AI",
    template: "%s | Nexus",
  },
  description:
    "Real-time collaborative docs with AI-powered insights, global edge publishing, and zero-setup deployment. Built on Zerops.",
  keywords: [
    "collaborative docs",
    "knowledge base",
    "AI writing",
    "real-time editing",
    "edge computing",
    "Zerops",
  ],
  authors: [{ name: "Nexus Team" }],
  creator: "Nexus",
  publisher: "Nexus",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nexus.zerops.app",
    siteName: "Nexus",
    title: "Nexus — Collaborative Knowledge Base, Powered by AI",
    description:
      "Real-time collaborative docs with AI-powered insights, global edge publishing, and zero-setup deployment.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexus - Collaborative Knowledge Base",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus — Collaborative Knowledge Base, Powered by AI",
    description:
      "Real-time collaborative docs with AI-powered insights, global edge publishing.",
    images: ["/og-image.png"],
    creator: "@nexus",
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" class={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.zerops.io" />
      </head>
      <body className="min-h-screen bg-white dark:bg-surface-950">
        {children}
      </body>
    </html>
  );
}