"use client";

import { useEffect, useState } from "react";

type ErrorDetail = { message: string; path?: string };

export function GlobalErrorNotice() {
  const [error, setError] = useState<ErrorDetail | null>(null);

  useEffect(() => {
    const onError = (event: Event) => {
      const detail = (event as CustomEvent<ErrorDetail>).detail;
      setError(detail);
      window.setTimeout(() => setError(null), 12_000);
    };
    window.addEventListener("nagargo:api-error", onError);
    return () => window.removeEventListener("nagargo:api-error", onError);
  }, []);

  if (!error) return null;

  return (
    <div role="alert" className="fixed left-1/2 top-4 z-[100] w-[min(92vw,720px)] -translate-x-1/2 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-950 shadow-2xl animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold">NagarGo needs your attention</p>
          <p className="mt-1 text-sm leading-6">{error.message}</p>
          <p className="mt-2 text-xs font-semibold text-red-700">Check the information on this page and try again. If the problem continues, contact support on WhatsApp: +8801683772714.</p>
        </div>
        <button type="button" onClick={() => setError(null)} aria-label="Close error" className="shrink-0 border-0 bg-transparent px-2 text-xl leading-none text-red-700">×</button>
      </div>
    </div>
  );
}
