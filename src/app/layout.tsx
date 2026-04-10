import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowlead.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FlowLead — 問卷收單平台',
    template: '%s | FlowLead',
  },
  description: '快速建立問卷、收集名單、AI 分析報告，一站式問卷收單工具。',
  openGraph: {
    type: 'website',
    siteName: 'FlowLead',
    title: 'FlowLead — 問卷收單平台',
    description: '快速建立問卷、收集名單、AI 分析報告，一站式問卷收單工具。',
    images: [
      {
        url: '/Gemini_Generated_Image_btjuxqbtjuxqbtju.png',
        width: 1200,
        height: 630,
        alt: 'FlowLead 問卷收單平台',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowLead — 問卷收單平台',
    description: '快速建立問卷、收集名單、AI 分析報告，一站式問卷收單工具。',
    images: ['/Gemini_Generated_Image_btjuxqbtjuxqbtju.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
