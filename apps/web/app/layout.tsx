import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { ClickSound } from "@/components/ClickSound";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#0B1220",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents auto-zoom on iOS inputs
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nagargo.com"),
  title: "NagarGo — Trusted Local Delivery in Rajshahi",
  description: "Send anything. Get anything. Delivered by someone you trust. Verified riders across Rajshahi, with real-time tracking and Medicine Express.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://maps.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      </head>
      <body className="font-body antialiased">
        <LocaleProvider>
          {children}
          <ServiceWorkerRegistrar />
          <ClickSound />
        </LocaleProvider>
      </body>
    </html>
  );
}
