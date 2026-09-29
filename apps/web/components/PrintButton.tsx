"use client";

interface Props {
  label?: string;
  className?: string;
}

/**
 * A button that triggers window.print() for the current page.
 * Shows only in screen view (hidden in print via CSS).
 * Used on the order receipt page.
 */
export function PrintButton({ label = "Print receipt", className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center gap-2 rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-black/5 hover:text-ink print:hidden ${className}`}
      aria-label="Print this page"
    >
      {/* Printer icon */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden>
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect width="12" height="8" x="6" y="14"/>
      </svg>
      {label}
    </button>
  );
}
