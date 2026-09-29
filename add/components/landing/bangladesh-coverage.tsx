'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { MapPin } from 'lucide-react';

const divisions = [
  { key: 'coverage.dhaka', x: 52, y: 38 },
  { key: 'coverage.chattogram', x: 70, y: 52 },
  { key: 'coverage.rajshahi', x: 28, y: 35 },
  { key: 'coverage.khulna', x: 35, y: 55 },
  { key: 'coverage.barishal', x: 52, y: 60 },
  { key: 'coverage.sylhet', x: 68, y: 28 },
  { key: 'coverage.rangpur', x: 38, y: 18 },
  { key: 'coverage.mymensingh', x: 58, y: 28 },
];

export function BangladeshCoverage() {
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
          {t('coverage.title')}
        </motion.h2>
        <p className="text-muted-foreground mt-2">{t('coverage.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Stylized Bangladesh SVG with division markers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative aspect-square max-w-lg mx-auto"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            {/* Simplified Bangladesh silhouette */}
            <path
              d="M30,15 Q45,10 55,15 Q70,12 75,25 Q78,35 72,45 Q75,55 68,62 Q60,68 52,65 Q45,70 38,62 Q30,58 25,48 Q22,38 25,28 Q28,20 30,15Z"
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary) / 0.3)"
              strokeWidth="0.5"
            />
            {/* Route lines between cities */}
            <line x1="28" y1="35" x2="52" y2="38" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.3" strokeDasharray="2 2"/>
            <line x1="52" y1="38" x2="70" y2="52" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.3" strokeDasharray="2 2"/>
            <line x1="52" y1="38" x2="58" y2="28" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.3" strokeDasharray="2 2"/>
            <line x1="52" y1="38" x2="35" y2="55" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.3" strokeDasharray="2 2"/>
            <line x1="52" y1="38" x2="52" y2="60" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.3" strokeDasharray="2 2"/>
          </svg>

          {divisions.map((d, i) => (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              className="absolute"
              style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                <span className="absolute inset-0 w-3 h-3 rounded-full bg-primary animate-ping opacity-40" />
                <span className="relative flex w-3 h-3 rounded-full bg-primary-bright glow-primary" />
              </div>
              <span className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground font-medium">
                {t(d.key)}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Division cards */}
        <div className="grid grid-cols-2 gap-3">
          {divisions.map((d, i) => (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-lg p-4 border border-border/60 hover:border-primary/30 transition-colors flex items-center gap-3"
            >
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium text-sm">{t(d.key)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
