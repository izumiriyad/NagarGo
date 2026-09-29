"use client";
import { useEffect, useState } from "react";

interface CookieBannerProps {
  /** Storage key to persist dismissal. */
  storageKey?: string;
}

/**
 * GDPR/cookie consent banner — appears at first visit, persists dismissal
 * in localStorage. Accepts or declines analytics cookies.
 */
export function CookieBanner({ storageKey = "nagargo_cookie_consent" }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      // Small delay so it doesn't flash instantly on first render
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  function accept() {
    localStorage.setItem(storageKey, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(storageKey, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-ink/10 bg-white/95 px-5 py-4 shadow-2xl backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl">🍪</span>
          <p className="text-sm text-ink/70">
            We use cookies to improve your experience and remember your preferences. We never share
            your data. See our{" "}
            <a href="/legal#privacy" className="font-semibold text-route-green underline underline-offset-2">
              Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={decline}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-black/5"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-full bg-route-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-route-green-dark"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
