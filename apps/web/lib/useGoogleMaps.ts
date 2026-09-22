"use client";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __nagargoMapsCallback?: () => void;
  }
}

let loadingPromise: Promise<void> | null = null;

/**
 * Loads https://maps.googleapis.com/maps/api/js exactly once per
 * page, regardless of how many components call this hook. Requires
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to be set — see .env.example.
 */
export function useGoogleMaps() {
  const [ready, setReady] = useState(!!(typeof window !== "undefined" && window.google?.maps));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setError("Google Maps is not configured (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing).");
      return;
    }
    if (window.google?.maps) {
      setReady(true);
      return;
    }
    if (!loadingPromise) {
      loadingPromise = new Promise<void>((resolve, reject) => {
        window.__nagargoMapsCallback = () => resolve();
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=__nagargoMapsCallback`;
        script.async = true;
        script.onerror = () => reject(new Error("Failed to load Google Maps."));
        document.head.appendChild(script);
      });
    }
    loadingPromise.then(() => setReady(true)).catch((e) => setError(e.message));
  }, []);

  return { ready, error };
}
