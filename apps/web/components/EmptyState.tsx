import React from "react";

interface Props {
  /** Large emoji or icon to display */
  icon?: string;
  title: string;
  body?: string;
  /** Optional CTA button */
  cta?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

/**
 * Reusable empty-state card.
 * Used on orders list, disputes, notifications, address book — any list that can be empty.
 */
export function EmptyState({ icon = "📭", title, body, cta, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 px-8 py-16 text-center ${className}`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black/[0.04] text-4xl">
        {icon}
      </div>
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {body && <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/50">{body}</p>}
      {cta && (
        <div className="mt-6">
          {cta.href ? (
            <a
              href={cta.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-route-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-route-green-dark"
            >
              {cta.label}
            </a>
          ) : (
            <button
              onClick={cta.onClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-route-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-route-green-dark"
            >
              {cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
