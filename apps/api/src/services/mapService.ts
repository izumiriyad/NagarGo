import { env } from "../config/env";

interface LatLng { lat: number; lng: number; }
export interface RouteEstimate { distanceKm: number; estimatedMinutes: number; source: "GOOGLE_ROUTES" | "DEMO_HAVERSINE"; }

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; const dLat = ((b.lat-a.lat)*Math.PI)/180; const dLng=((b.lng-a.lng)*Math.PI)/180;
  const lat1=(a.lat*Math.PI)/180; const lat2=(b.lat*Math.PI)/180;
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return R*(2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)));
}

function durationSeconds(value: string | undefined): number {
  const m = value?.match(/([0-9.]+)s$/); return m ? Number(m[1]) : 0;
}

/** Uses Google Routes API with live traffic-aware routing when a Maps key is configured. */
export async function calculateRoute(pickup: LatLng, destination: LatLng): Promise<RouteEstimate> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    const km=Math.round(haversineKm(pickup,destination)*1.35*100)/100;
    return { distanceKm: km, estimatedMinutes: Math.max(1, Math.ceil((km/22)*60)), source: "DEMO_HAVERSINE" };
  }
  try {
    const res=await fetch("https://routes.googleapis.com/directions/v2:computeRoutes",{
      method:"POST", headers:{"Content-Type":"application/json","X-Goog-Api-Key":env.GOOGLE_MAPS_API_KEY,"X-Goog-FieldMask":"routes.distanceMeters,routes.duration"},
      body:JSON.stringify({origin:{location:{latLng:{latitude:pickup.lat,longitude:pickup.lng}}},destination:{location:{latLng:{latitude:destination.lat,longitude:destination.lng}}},travelMode:"DRIVE",routingPreference:"TRAFFIC_AWARE"})
    });
    if(!res.ok) throw new Error(`Google Routes HTTP ${res.status}`);
    const data=await res.json() as {routes?:{distanceMeters?:number;duration?:string}[]}; const route=data.routes?.[0];
    if(!route?.distanceMeters) throw new Error("Google Routes returned no route");
    return { distanceKm:Math.round((route.distanceMeters/1000)*100)/100, estimatedMinutes:Math.max(1,Math.ceil(durationSeconds(route.duration)/60)), source:"GOOGLE_ROUTES" };
  } catch(err) {
    console.warn("[mapService] Routes API failed; using demo estimate:",err instanceof Error?err.message:err);
    const km=Math.round(haversineKm(pickup,destination)*1.35*100)/100;
    return { distanceKm:km, estimatedMinutes:Math.max(1,Math.ceil((km/22)*60)), source:"DEMO_HAVERSINE" };
  }
}

export async function calculateRoadDistanceKm(pickup: LatLng, destination: LatLng) {
  const route=await calculateRoute(pickup,destination);
  return { distanceKm: route.distanceKm, source: route.source };
}
