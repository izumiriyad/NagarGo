'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { Package, Bike, Pill, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    icon: Package,
    title: 'Parcel Delivery',
    titleKey: 'services.parcel',
    desc: 'Send packages anywhere in the city with verified riders. Track live, verify with OTP, and pay your way.',
    href: '/delivery',
    features: ['Real-time tracking', 'OTP verification', 'Fragile handling', 'Multiple payment options'],
  },
  {
    icon: Bike,
    title: 'Ride Service',
    titleKey: 'services.ride',
    desc: 'Book a motorcycle ride in minutes. Transparent fares, verified riders, and live tracking on every trip.',
    href: '/ride',
    features: ['Instant booking', 'Transparent fares', 'Live tracking', 'Verified riders'],
  },
  {
    icon: Pill,
    title: 'Medicine Express',
    titleKey: 'services.medicine',
    desc: 'Upload your prescription and get medicines delivered from your pharmacy. Secure, legal, and fast.',
    href: '/medicine',
    features: ['Prescription upload', 'Pharmacy selection', 'Secure storage', 'Fast delivery'],
  },
  {
    icon: UserPlus,
    title: 'Become a Rider',
    titleKey: 'services.becomeRider',
    desc: 'Join NagarGo as a rider and earn money delivering in your city. Flexible hours, reliable earnings.',
    href: '/rider',
    features: ['80% rider earnings', 'Flexible schedule', 'Weekly payouts', 'Verified platform'],
  },
];

export function ServiceSections() {
  const { t } = useI18n();

  return (
    <div className="space-y-20 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {sections.map((s, i) => (
        <div
          key={s.href}
          className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}
        >
          <motion.div
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`space-y-4 ${i % 2 === 1 ? 'lg:col-start-2' : ''}`}
          >
            <div className="w-14 h-14 rounded-lg bg-primary/15 flex items-center justify-center">
              <s.icon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display), system-ui' }}>
              {t(s.titleKey)}
            </h2>
            <p className="text-muted-foreground text-lg">{s.desc}</p>
            <ul className="space-y-2 pt-2">
              {s.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={s.href}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 transition-all mt-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`relative ${i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}
          >
            <div className="aspect-[4/3] rounded-xl glass border border-border/60 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <div className="absolute inset-0 bg-grid opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-24 h-24 rounded-2xl bg-primary/15 flex items-center justify-center"
                >
                  <s.icon className="w-12 h-12 text-primary" />
                </motion.div>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30">
                <span className="w-2 h-2 rounded-full bg-primary-bright animate-pulse" />
                <span className="text-xs font-medium text-primary">Active</span>
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
