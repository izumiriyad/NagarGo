"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface FareEstimate {
  total: number;
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  serviceFee: number;
  riderEarnings: number;
  estimatedMinutes: number;
}

interface Props {
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  isEmergency?: boolean;
}

/**
 * Live fare estimator widget — calls /api/pricing/estimate and shows the
 * full breakdown as the user selects pickup/destination on the booking form.
 *
 * Display-only: zero user interaction needed.
 */
export function FareEstimator({ pickup, destination, isEmergency = false }: Props) {
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!pickup || !destination) {
      setEstimate(null);
      return;
    }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const r = await api<any>("/pricing/estimate", {
          method: "POST",
          body: JSON.stringify({
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            destinationLat: destination.lat,
            destinationLng: destination.lng,
            isEmergency,
          }),
        });
        setEstimate(r.estimate ?? r.pricing ?? r);
      } catch (e: any) {
        setError(e.message ?? "Could not estimate fare");
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(debounce.current);
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, isEmergency]);

  if (!pickup || !destination) return null;

  return (
    <div className="animate-fade-up rounded-2xl border border-route-green/20 bg-route-green/5 p-4">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-ink/50">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-route-green border-t-transparent" />
          Calculating fare…
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && estimate && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-route-green">
              Estimated fare
            </span>
            <span className="font-display text-2xl font-bold text-ink">
              ৳{estimate.total}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink/55 sm:grid-cols-4">
            {[
              ["Distance", `${estimate.distanceKm} km`],
              ["ETA", `~${estimate.estimatedMinutes} min`],
              ["Service fee", `৳${estimate.serviceFee}`],
              ["Rider earns", `৳${estimate.riderEarnings}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/70 px-2.5 py-1.5">
                <p className="text-[10px] text-ink/40">{label}</p>
                <p className="font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
          {isEmergency && (
            <p className="mt-2 text-[11px] text-red-500">
              🚨 Emergency surcharge applied
            </p>
          )}
        </>
      )}
    </div>
  );
}
