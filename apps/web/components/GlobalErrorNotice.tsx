"use client";

import { useEffect, useState } from "react";
import { clearSession } from "@/lib/api";

type ErrorDetail = { message: string; path?: string };

/**
 * Listens to the `nagargo:api-error` and `nagargo:session-expired`
 * custom events dispatched by lib/api.ts and shows a top-of-screen toast.
 */
export function GlobalErrorNotice() {
  const [error, setError] = useState<ErrorDetail | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const onError = (event: Event) => {
      const detail = (event as CustomEvent<ErrorDetail>).detail;
      setError(detail);
      window.setTimeout(() => setError(null), 12_000);
    };

    const onExpired = () => {
      clearSession();
      setSessionExpired(true);
    };

    window.addEventListener("nagargo:api-error", onError);
    window.addEventListener("nagargo:session-expired", onExpired);
    return () => {
      window.removeEventListener("nagargo:api-error", onError);
      window.removeEventListener("nagargo:session-expired", onExpired);
    };
  }, []);

  if (sessionExpired) {
    return (
      <div
        role="alert"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div className="animate-fade-up w-[min(90vw,380px)] rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl text-center">
          <p className="text-2xl">🔐</p>
          <p className="mt-3 font-display text-lg font-bold text-ink">Session expired</p>
          <p className="mt-2 text-sm text-ink/60">
            Your session has expired. Please sign in again to continue.
          </p>
          <a
            href="/login"
            onClick={() => setSessionExpired(false)}
            className="mt-5 block w-full rounded-xl bg-route-green py-3 font-semibold text-white transition hover:bg-route-green-dark"
          >
            Sign in →
          </a>
        </div>
      </div>
    );
  }

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed left-1/2 top-4 z-[100] w-[min(92vw,720px)] -translate-x-1/2 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-950 shadow-2xl animate-fade-up"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold">NagarGo needs your attention</p>
          <p className="mt-1 text-sm leading-6">{error.message}</p>
          <p className="mt-2 text-xs font-semibold text-red-700">
            Check the information on this page and try again. If the problem continues, contact
            support on WhatsApp: +8801683772714.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setError(null)}
          aria-label="Close error"
          className="shrink-0 border-0 bg-transparent px-2 text-xl leading-none text-red-700"
        >
          ×
        </button>
      </div>
    </div>
  );
}
