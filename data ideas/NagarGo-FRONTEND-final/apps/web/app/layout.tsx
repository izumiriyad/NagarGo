import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { ClickSound } from "@/components/ClickSound";
import { DeviceSetupPrompt } from "@/components/DeviceSetupPrompt";
import { GlobalErrorNotice } from "@/components/GlobalErrorNotice";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NagarGo — Trusted Local Delivery in Rajshahi",
  description: "Send anything. Get anything. Delivered by someone you trust. Verified riders across Rajshahi, with real-time tracking and Medicine Express.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body className="font-body antialiased">
        <LocaleProvider>
          {children}
          <ServiceWorkerRegistrar />
          <ClickSound />
          <DeviceSetupPrompt />
          <GlobalErrorNotice />
        </LocaleProvider>
      </body>
    </html>
  );
}
