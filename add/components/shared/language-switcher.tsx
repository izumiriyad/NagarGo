'use client';

import { useI18n } from '@/lib/i18n/context';
import { Languages, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 h-10 rounded-md border border-border/60 hover:border-primary/40 hover:bg-secondary/40 transition-all text-sm font-medium"
        aria-label="Switch language"
      >
        <Languages className="w-4 h-4 text-muted-foreground" />
        <span>{locale === 'en' ? 'EN' : 'বাংলা'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-40 glass-strong rounded-lg border border-border overflow-hidden z-50"
          >
            <button
              onClick={() => { setLocale('en'); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary/40 transition-colors"
            >
              <span>English</span>
              {locale === 'en' && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button
              onClick={() => { setLocale('bn'); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary/40 transition-colors"
            >
              <span>বাংলা</span>
              {locale === 'bn' && <Check className="w-4 h-4 text-primary" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
