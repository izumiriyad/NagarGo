'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { Package, Bike, Pill, UserPlus, ArrowRight } from 'lucide-react';

const services = [
  { href: '/delivery', icon: Package, key: 'services.parcel', descKey: 'services.parcelDesc', color: 'from-primary/20 to-primary/5' },
  { href: '/ride', icon: Bike, key: 'services.ride', descKey: 'services.rideDesc', color: 'from-info/20 to-info/5' },
  { href: '/medicine', icon: Pill, key: 'services.medicine', descKey: 'services.medicineDesc', color: 'from-warning/20 to-warning/5' },
  { href: '/rider', icon: UserPlus, key: 'services.becomeRider', descKey: 'services.becomeRiderDesc', color: 'from-primary/20 to-primary/5' },
];

export function QuickServices() {
  const { t } = useI18n();

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((s, i) => (
          <motion.div
            key={s.href}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Link
              href={s.href}
              className="group block glass rounded-xl p-6 border border-border/60 hover:border-primary/40 transition-all relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t(s.key)}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t(s.descKey)}</p>
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
