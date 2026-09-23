import { env } from "../config/env";

interface LatLng {
  lat: number;
  lng: number;
}

interface DistanceResult {
  distanceKm: number;
  source: "GOOGLE_MAPS" | "DEMO_HAVERSINE";
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * Distance/ETA abstraction. In DEMO mode (no GOOGLE_MAPS_API_KEY
 * configured) this falls back to straight-line haversine distance
 * with a road-distance fudge factor, clearly logged as a demo
 * value — never presented to a real customer as billing-accurate
 * without a configured Maps key.
 */
export async function calculateRoadDistanceKm(pickup: LatLng, destination: LatLng): Promise<DistanceResult> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    const straightLineKm = haversineKm(pickup, destination);
    const ROAD_FACTOR = 1.35; // rough urban road-vs-straight-line adjustment
    return { distanceKm: Math.round(straightLineKm * ROAD_FACTOR * 100) / 100, source: "DEMO_HAVERSINE" };
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", `${pickup.lat},${pickup.lng}`);
    url.searchParams.set("destinations", `${destination.lat},${destination.lng}`);
    url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Google Distance Matrix HTTP ${res.status}`);
    const data = (await res.json()) as {
      status: string;
      rows: { elements: { status: string; distance?: { value: number } }[] }[];
    };

    const element = data.rows?.[0]?.elements?.[0];
    if (data.status !== "OK" || !element || element.status !== "OK" || !element.distance) {
      throw new Error(`Distance Matrix returned status=${data.status ?? "?"} element=${element?.status ?? "?"}`);
    }

    return { distanceKm: Math.round((element.distance.value / 1000) * 100) / 100, source: "GOOGLE_MAPS" };
  } catch (err) {
    // Never let a Maps API hiccup (quota, unconfigured Distance
    // Matrix API on this key, transient network error) break order
    // creation — fall back to the demo estimate and keep going.
    console.warn("[mapService] Distance Matrix failed, falling back to haversine:", err instanceof Error ? err.message : err);
    const straightLineKm = haversineKm(pickup, destination);
    const ROAD_FACTOR = 1.35;
    return { distanceKm: Math.round(straightLineKm * ROAD_FACTOR * 100) / 100, source: "DEMO_HAVERSINE" };
  }
}
