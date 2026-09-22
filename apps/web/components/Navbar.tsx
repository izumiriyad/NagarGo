"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { Wordmark } from "./Wordmark";

export function Navbar() {
  const { t } = useI18n();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(!!localStorage.getItem("nagargo_access_token"));
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/nagargo-mark.png" alt="" width={34} height={34} priority />
          <Wordmark size="md" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex">
          <a href="#services">{t("nav.services")}</a>
          <a href="#how-it-works">{t("nav.how")}</a>
          <Link href="/medicine">{t("nav.medicine")}</Link>
          <Link href="/rider/register">{t("nav.rider")}</Link>
          {signedIn && <Link href="/orders">My Orders</Link>}
          <Link href="/account">{t("nav.account")}</Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {signedIn ? (
            <>
              <NotificationBell />
              <Link href="/book" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft">
                {t("nav.send")}
              </Link>
            </>
          ) : (
            <Link href="/login" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft">
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
