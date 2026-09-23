"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { messages, Locale, MessageKey } from "./messages";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "nagargo_locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Locale | null) : null;
    if (saved === "en" || saved === "bn") setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  }

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey) => messages[locale][key] ?? messages.en[key] ?? key,
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Access the active locale, a setter, and the t() translator. Must be used under LocaleProvider. */
export function useI18n() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
