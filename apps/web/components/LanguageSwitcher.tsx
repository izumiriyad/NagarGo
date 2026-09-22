"use client";
import { useI18n } from "@/i18n/LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "bn" : "en")}
      className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-black/5"
      aria-label="Switch language"
    >
      {locale === "en" ? "বাংলা" : "English"}
    </button>
  );
}
