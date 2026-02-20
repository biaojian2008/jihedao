import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/layout/nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HomeSearchButton } from "@/components/home/home-search-button";
import { HomePublishButton } from "@/components/home/home-publish-button";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "高尔特峡谷——超级个体的交流协作平台",
  description: "欢迎来到高尔特峡谷——超级个体的交流协作平台",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "高尔特峡谷" },
  openGraph: {
    title: "欢迎来到高尔特峡谷——超级个体的交流协作平台",
    description: "超级个体的交流协作平台",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00ff00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body
        className={`${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <Nav />
          {children}
          <BottomNav />
          <HomeSearchButton />
          <HomePublishButton />
        </Providers>
      </body>
    </html>
  );
}
