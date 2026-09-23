"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { Wordmark } from "./Wordmark";

const navLinks: { href: string; label: "nav.services" | "nav.how" | "nav.medicine" | "nav.rider" }[] = [
  { href: "/#services", label: "nav.services" },
  { href: "/#how-it-works", label: "nav.how" },
  { href: "/medicine", label: "nav.medicine" },
  { href: "/rider/register", label: "nav.rider" },
];

export function Navbar() {
  const { t } = useI18n();
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSignedIn(!!localStorage.getItem("nagargo_access_token"));
  }, []);

  // Close menu on route change (click)
  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
          <Image src="/nagargo-mark.png" alt="" width={34} height={34} priority />
          <Wordmark size="md" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-ink">
              {t(l.label)}
            </a>
          ))}
          {signedIn && (
            <Link href="/orders" className="transition hover:text-ink">
              My Orders
            </Link>
          )}
          <Link href="/account" className="transition hover:text-ink">
            {t("nav.account")}
          </Link>
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {signedIn ? (
            <>
              <NotificationBell />
              <Link
                href="/book"
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
              >
                {t("nav.send")}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </div>

        {/* Mobile right: bell + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {signedIn && <NotificationBell />}
          <button
            id="nav-hamburger"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-xl border border-ink/15 transition hover:bg-black/5"
          >
            <span
              className={`block h-0.5 w-5 bg-ink transition-all duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-ink transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-ink transition-all duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="border-t border-ink/10 bg-paper px-5 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
              >
                {t(l.label)}
              </a>
            ))}
            {signedIn && (
              <Link
                href="/orders"
                onClick={closeMenu}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
              >
                My Orders
              </Link>
            )}
            <Link
              href="/account"
              onClick={closeMenu}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
            >
              {t("nav.account")}
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/8 pt-3">
              <LanguageSwitcher />
              {signedIn ? (
                <Link
                  href="/book"
                  onClick={closeMenu}
                  className="flex-1 rounded-full bg-ink py-2.5 text-center text-sm font-semibold text-white transition hover:bg-ink-soft"
                >
                  {t("nav.send")}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex-1 rounded-full bg-ink py-2.5 text-center text-sm font-semibold text-white transition hover:bg-ink-soft"
                >
                  {t("nav.signIn")}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
