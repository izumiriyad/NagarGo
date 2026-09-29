'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import {
  ShieldCheck,
  MapPin,
  KeyRound,
  Tag,
  Zap,
  Globe,
  CreditCard,
  Headphones,
} from 'lucide-react';

const features = [
  { icon: ShieldCheck, key: 'why.verified', desc: 'why.verifiedDesc' },
  { icon: MapPin, key: 'why.liveTracking', desc: 'why.liveTrackingDesc' },
  { icon: KeyRound, key: 'why.otp', desc: 'why.otpDesc' },
  { icon: Tag, key: 'why.pricing', desc: 'why.pricingDesc' },
  { icon: Zap, key: 'why.fast', desc: 'why.fastDesc' },
  { icon: Globe, key: 'why.coverage', desc: 'why.coverageDesc' },
  { icon: CreditCard, key: 'why.payments', desc: 'why.paymentsDesc' },
  { icon: Headphones, key: 'why.support', desc: 'why.supportDesc' },
];

export function WhyNagarGo() {
  const { t } = useI18n();

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold"
          style={{ fontFamily: 'var(--font-display), system-ui' }}
        >
          {t('why.title')}
        </motion.h2>
        <p className="text-muted-foreground mt-2">Built for trust, speed, and security</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="glass rounded-xl p-6 border border-border/60 hover:border-primary/30 transition-colors text-center"
          >
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
              >
                <f.icon className="w-7 h-7 text-primary" />
              </motion.div>
            </div>
            <h3 className="font-semibold text-foreground mb-2">{t(f.key)}</h3>
            <p className="text-sm text-muted-foreground">{t(f.desc)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
