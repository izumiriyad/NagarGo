'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from '@/lib/i18n/en.json';
import bn from '@/lib/i18n/bn.json';

export type Locale = 'en' | 'bn';

const dictionaries: Record<Locale, any> = { en, bn };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (p: string) => p,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('nagargo-locale') : null;
    if (saved === 'en' || saved === 'bn') setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem('nagargo-locale', l);
  }, []);

  const t = useCallback(
    (path: string): string => {
      const parts = path.split('.');
      let val: any = dictionaries[locale];
      for (const p of parts) {
        val = val?.[p];
        if (val === undefined) break;
      }
      return typeof val === 'string' ? val : path;
    },
    [locale]
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
