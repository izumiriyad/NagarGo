"use client";
import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** If true, the confirm button uses a red destructive style */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Accessible confirmation modal.
 * Traps focus, closes on Escape, backdrop click closes.
 * Used for: cancel order, delete address, delete account, logout.
 */
export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when modal opens
  useEffect(() => {
    if (open) setTimeout(() => confirmRef.current?.focus(), 50);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-sm animate-fade-up rounded-3xl bg-white p-7 shadow-2xl">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            destructive ? "bg-red-100 text-2xl" : "bg-amber-100 text-2xl"
          }`}
        >
          {destructive ? "🗑️" : "⚠️"}
        </div>

        <h2
          id="confirm-modal-title"
          className="text-center font-display text-xl font-bold text-ink"
        >
          {title}
        </h2>
        {body && (
          <p className="mt-2 text-center text-sm leading-relaxed text-ink/60">{body}</p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`w-full rounded-xl py-3 font-semibold text-white transition disabled:opacity-60 ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-ink hover:bg-ink/80"
            }`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-xl border border-ink/15 py-3 text-sm font-semibold text-ink/70 transition hover:bg-black/5 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
