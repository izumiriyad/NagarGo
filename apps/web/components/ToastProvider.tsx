"use client";
import { useEffect, useRef, useState } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const COLORS = {
  success: "bg-route-green text-white",
  error: "bg-red-600 text-white",
  info: "bg-ink text-white",
  warning: "bg-amber-500 text-white",
};

let _add: ((msg: string, type?: Toast["type"]) => void) | null = null;

/** Call from anywhere in the app: toast("Saved!") or toast("Error", "error") */
export function toast(message: string, type: Toast["type"] = "info") {
  _add?.(message, type);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    _add = (message, type = "info") => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    };
    return () => { _add = null; };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl animate-fade-up ${COLORS[t.type]}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            {ICONS[t.type]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
