"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface SavedAddress {
  _id: string;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface Props {
  onSelect: (v: { fullAddress: string; lat: number; lng: number }) => void;
  label?: string;
}

/**
 * Dropdown of the customer's saved addresses.
 * Shows a compact pill-list above the main Places input.
 * If the user has no saved addresses the component renders nothing.
 */
export function SavedAddressQuickPick({ onSelect, label = "Saved" }: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Only load for authenticated users
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) return;
    api<any>("/addresses")
      .then((r) => setAddresses(r.addresses ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || addresses.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-ink/40">{label}:</span>
      {addresses.map((addr) => (
        <button
          key={addr._id}
          type="button"
          onClick={() =>
            onSelect({
              fullAddress: addr.address,
              lat: addr.lat ?? 24.3745,
              lng: addr.lng ?? 88.6042,
            })
          }
          className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-route-green/40 hover:bg-route-green/5 hover:text-route-green-dark"
        >
          {addr.label === "HOME"
            ? "🏠 Home"
            : addr.label === "WORK"
            ? "💼 Work"
            : `📍 ${addr.label}`}
        </button>
      ))}
    </div>
  );
}
