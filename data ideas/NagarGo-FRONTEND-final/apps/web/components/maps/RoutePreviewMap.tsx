"use client";
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/lib/useGoogleMaps";

export function RoutePreviewMap({
  pickup,
  destination,
}: {
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}) {
  const { ready, error } = useGoogleMaps();
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);

  useEffect(() => {
    if (!ready || !divRef.current || mapRef.current) return;
    mapRef.current = new window.google.maps.Map(divRef.current, {
      center: pickup ?? { lat: 24.3745, lng: 88.6042 }, // Rajshahi
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
    });
    rendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapRef.current,
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#1FA24A", strokeWeight: 5 },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || !pickup || !destination) return;
    const markers: any[] = [];

    [
      { pos: pickup, color: "#0B1220", label: "A" },
      { pos: destination, color: "#1FA24A", label: "B" },
    ].forEach(({ pos, color, label }, i) => {
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        label: { text: label, color: "#fff", fontWeight: "bold" },
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: color, fillOpacity: 1, strokeWeight: 2, strokeColor: "#fff" },
        animation: window.google.maps.Animation.DROP,
        // Staggered drop so B lands just after A — a small, deliberate touch.
        zIndex: i,
      });
      markers.push(marker);
    });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pickup); bounds.extend(destination);
    mapRef.current.fitBounds(bounds, 60);

    new window.google.maps.DirectionsService().route(
      { origin: pickup, destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (result: any, status: string) => {
        if (status === "OK") rendererRef.current.setDirections(result);
      }
    );

    return () => markers.forEach((m) => m.setMap(null));
  }, [ready, pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  if (error) return <div className="flex h-64 items-center justify-center rounded-2xl bg-black/5 text-sm text-ink/50">{error}</div>;
  return <div ref={divRef} className="h-64 w-full animate-fade-up overflow-hidden rounded-2xl sm:h-80" />;
}
