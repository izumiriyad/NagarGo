"use client";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

/**
 * Thin banner that slides in when the browser goes offline.
 * Zero height when online — no layout shift.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
    >
      <span>📡</span>
      <span>You&apos;re offline — some features may be unavailable.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 transition"
      >
        Retry
      </button>
    </div>
  );
}
