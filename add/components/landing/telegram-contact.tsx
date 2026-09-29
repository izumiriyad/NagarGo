'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Send, MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function TelegramContact() {
  const { t } = useI18n();

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass rounded-2xl border border-border/60 p-8 sm:p-12 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Send className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display), system-ui' }}>
          Contact Us on Telegram
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Have questions? Need support? Reach out to us directly on Telegram for quick responses.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="https://t.me/SouraksPizzaPro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary-bright transition-all glow-primary"
          >
            <Send className="w-5 h-5" />
            @SouraksPizzaPro
          </a>
          <a
            href="https://wa.me/8801410348109"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 h-12 rounded-md border border-border/60 hover:border-primary/40 text-foreground font-semibold transition-all"
          >
            <MessageCircle className="w-5 h-5 text-primary" />
            WhatsApp
          </a>
        </div>
      </motion.div>
    </section>
  );
}
