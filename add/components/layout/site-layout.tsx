'use client';

import { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';

export function SiteLayout({ children, showFooter = true }: { children: ReactNode; showFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 pb-20 lg:pb-0">{children}</main>
      {showFooter && <Footer />}
      <MobileNav />
    </div>
  );
}
