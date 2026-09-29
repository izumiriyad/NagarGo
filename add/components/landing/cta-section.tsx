'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { ArrowRight, Sparkles, Download } from 'lucide-react';

export function CtaSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background-3 to-background-2" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />

        <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 mb-4"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">{t('cta.downloadApp')}</span>
          </motion.div>

          <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display), system-ui' }}>
            {t('cta.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            {t('cta.subtitle')}
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/register"
              className="group flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all glow-primary"
            >
              {t('cta.getStarted')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/rider"
              className="flex items-center gap-2 px-6 h-12 rounded-md border border-border/60 hover:border-primary/40 glass text-foreground font-semibold transition-all"
            >
              {t('hero.becomeRider')}
            </Link>
            <a
              href="https://drive.google.com/file/d/1S4O7_cpz2k8OjZYOxpWRKsPPCQzMIr-x/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 h-12 rounded-md bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 transition-all"
            >
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              You Can Download Our App Too
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
