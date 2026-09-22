"use client";
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/lib/useGoogleMaps";
import { getSocket } from "@/lib/socket";

export function LiveTrackingMap({
  orderId,
  pickup,
  destination,
}: {
  orderId: string;
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  const { ready, error } = useGoogleMaps();
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (!ready || !divRef.current) return;
    const map = new window.google.maps.Map(divRef.current, {
      center: pickup,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
    });
    mapRef.current = map;

    new window.google.maps.Marker({ position: pickup, map, label: "A", animation: window.google.maps.Animation.DROP });
    new window.google.maps.Marker({ position: destination, map, label: "B", animation: window.google.maps.Animation.DROP });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pickup); bounds.extend(destination);
    map.fitBounds(bounds, 60);

    riderMarkerRef.current = new window.google.maps.Marker({
      map,
      icon: {
        path: "M0,-8 L6,8 L0,4 L-6,8 Z", // simple arrow glyph, rotates to face travel direction
        scale: 2,
        fillColor: "#1FA24A",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 1.5,
        rotation: 0,
      },
      visible: false,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("order:join", orderId);

    let lastPos: { lat: number; lng: number } | null = null;

    const onLocation = (data: { orderId: string; lat: number; lng: number }) => {
      if (data.orderId !== orderId || !riderMarkerRef.current) return;
      const next = { lat: data.lat, lng: data.lng };

      // Bearing-based rotation gives the arrow a sense of direction
      // instead of just teleporting between points.
      if (lastPos && window.google?.maps?.geometry) {
        const heading = window.google.maps.geometry.spherical.computeHeading(
          new window.google.maps.LatLng(lastPos),
          new window.google.maps.LatLng(next)
        );
        const icon = riderMarkerRef.current.getIcon();
        riderMarkerRef.current.setIcon({ ...icon, rotation: heading });
      }
      lastPos = next;

      riderMarkerRef.current.setVisible(true);
      riderMarkerRef.current.setPosition(next);
      mapRef.current?.panTo(next);
    };

    socket.on("order:rider-location", onLocation);
    return () => {
      socket.emit("order:stop-tracking", orderId);
      socket.off("order:rider-location", onLocation);
    };
  }, [orderId]);

  if (error) return <div className="flex h-72 items-center justify-center rounded-2xl bg-black/5 text-sm text-ink/50">{error}</div>;
  return <div ref={divRef} className="h-72 w-full animate-fade-up overflow-hidden rounded-2xl sm:h-96" />;
}
