'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { formatCurrency } from '@/lib/format';
import { Tag, Calculator } from 'lucide-react';

const plans = [
  { zone: 'Rajshahi', baseFare: 40, perKm: 12, minFare: 50, serviceFee: 5, includedKm: 2 },
  { zone: 'Dhaka / Chattogram', baseFare: 50, perKm: 15, minFare: 60, serviceFee: 10, includedKm: 2 },
  { zone: 'Other Major Cities', baseFare: 45, perKm: 13, minFare: 55, serviceFee: 5, includedKm: 2 },
];

export function TransparentPricing() {
  const { t } = useI18n();

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 mb-4"
        >
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">No hidden charges</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold"
          style={{ fontFamily: 'var(--font-display), system-ui' }}
        >
          {t('pricing.title')}
        </motion.h2>
        <p className="text-muted-foreground mt-2">{t('pricing.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p, i) => (
          <motion.div
            key={p.zone}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className={`glass rounded-xl p-6 border transition-colors ${
              i === 0 ? 'border-primary/40 glow-primary' : 'border-border/60 hover:border-primary/30'
            }`}
          >
            {i === 0 && (
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary mb-3">
                Starter
              </span>
            )}
            <h3 className="text-lg font-semibold mb-1">{p.zone}</h3>
            <p className="text-3xl font-bold text-primary mb-4">{formatCurrency(p.baseFare)}</p>
            <p className="text-xs text-muted-foreground mb-4">Starting base fare</p>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">{t('pricing.baseFare')}</span>
                <span className="font-medium">{formatCurrency(p.baseFare)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">{t('pricing.includedDistance')}</span>
                <span className="font-medium">{p.includedKm} km</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">{t('pricing.perKm')}</span>
                <span className="font-medium">{formatCurrency(p.perKm)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">{t('pricing.minimumFare')}</span>
                <span className="font-medium">{formatCurrency(p.minFare)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">{t('pricing.serviceFee')}</span>
                <span className="font-medium">{formatCurrency(p.serviceFee)}</span>
              </li>
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Calculator className="w-4 h-4" />
        <span>Starter configuration values. Actual fares may vary based on distance, time, and zone.</span>
      </div>
    </section>
  );
}
