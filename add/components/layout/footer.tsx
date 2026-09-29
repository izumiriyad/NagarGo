'use client';

import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { useI18n } from '@/lib/i18n/context';
import { Send, MessageCircle, Phone, Mail, Facebook } from 'lucide-react';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/ride', label: 'Ride' },
  { href: '/delivery', label: 'Parcel Delivery' },
  { href: '/medicine', label: 'Medicine Express' },
  { href: '/rider', label: 'Become a Rider' },
  { href: '/track', label: 'Track Order' },
  { href: '/support', label: 'Support' },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/rider-terms', label: 'Rider Terms' },
  { href: '/location-policy', label: 'Location & GPS Privacy Policy' },
];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/50 bg-background-2 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t('brand.tagline')}
            </p>
            <p className="text-sm text-primary font-medium">{t('brand.secondary')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <a
                href="https://t.me/SouraksPizzaPro"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>@SouraksPizzaPro</span>
              </a>
              <a
                href="https://wa.me/8801345639783"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Official WhatsApp: +8801345639783</span>
              </a>
              <a
                href="https://wa.me/8801683772714"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: +8801683772714</span>
              </a>
              <a
                href="https://www.facebook.com/nagargo000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook Page</span>
              </a>
              <a
                href="https://www.facebook.com/sourakpart3"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook Profile</span>
              </a>
              <Link href="/support" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                <span>Support Center</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-8 text-center sm:text-left">
              <p className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-display), system-ui', textShadow: '0 1px 8px rgba(255,255,255,0.15)' }}>
                Founder — Sourak Jain
              </p>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />
              <p className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-display), system-ui', textShadow: '0 1px 8px rgba(255,255,255,0.15)' }}>
                Co-Founder — Abdullahil Kafi
              </p>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />
              <p className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-display), system-ui', textShadow: '0 1px 8px rgba(255,255,255,0.15)' }}>
                CEO — Aftab Ahomod Riyad
              </p>
            </div>
            <p className="text-center text-sm text-muted-foreground font-medium">
              All Copyrights of This Website are Reserved to Sourak Jain
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
