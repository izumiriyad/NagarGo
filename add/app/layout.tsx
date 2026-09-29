import './globals.css';
import type { Metadata } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n/context';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { AgreementGate } from '@/components/shared/agreement-gate';
import { FloatingContacts } from '@/components/shared/floating-contacts';
import { AIAssistant } from '@/components/shared/ai-assistant';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'NagarGo — Smartest Delivery and Riding Network of Bangladesh',
  description: 'NagarGo is Bangladesh\u2019s smartest and most trusted delivery and riding network. Send parcels, book rides, get medicine delivered, and track live.',
  keywords: ['NagarGo', 'Bangladesh delivery', 'ride service', 'parcel delivery', 'medicine delivery', 'Rajshahi', 'Dhaka'],
  authors: [{ name: 'Sourak Jain' }],
  openGraph: {
    title: 'NagarGo — Smartest Delivery and Riding Network of Bangladesh',
    description: 'Move Smarter. Live Easier. Send parcels, book rides, get medicine delivered across Bangladesh.',
    type: 'website',
    locale: 'en_US',
    siteName: 'NagarGo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NagarGo — Smartest Delivery and Riding Network of Bangladesh',
    description: 'Move Smarter. Live Easier. Send parcels, book rides, get medicine delivered across Bangladesh.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-mark.svg',
    apple: '/logo-mark.svg',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#050806',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background">
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <AgreementGate>
                <SonnerToaster position="top-center" richColors />
                {children}
                <FloatingContacts />
                <AIAssistant />
              </AgreementGate>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
