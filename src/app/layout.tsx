import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/layout/nav";
import { BottomNav } from "@/components/layout/bottom-nav";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "济和 DAO",
  description: "协作 · 信用 · 社交 · 数据主权 的去中心化实验场",
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
        </Providers>
      </body>
    </html>
  );
}
