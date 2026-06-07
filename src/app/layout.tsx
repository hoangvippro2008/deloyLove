import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Dancing_Script } from "next/font/google";
import type { ReactNode } from "react";
import { CosmicBackground } from "@/components/layout/CosmicBackground";
import { PWARegister } from "@/components/layout/PWARegister";
import { Providers } from "./providers";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"]
});

const dancing = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-hand",
  weight: ["400", "600", "700"]
});

export const metadata: Metadata = {
  applicationName: "Cosmic Love",
  title: "Cặp đôi đa vũ trụ",
  description: "Căn phòng riêng tư cho hai người lưu kỷ niệm, bài hát, lời nhắn và những điều muốn làm cùng nhau",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cosmic Love",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0a0c1f"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${dancing.variable}`}>
        <CosmicBackground />
        <Providers>{children}</Providers>
        <PWARegister />
      </body>
    </html>
  );
}
