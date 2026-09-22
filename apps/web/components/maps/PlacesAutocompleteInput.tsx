"use client";
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/lib/useGoogleMaps";

export interface PlaceValue {
  fullAddress: string;
  lat: number;
  lng: number;
}

export function PlacesAutocompleteInput({
  placeholder,
  value,
  onSelect,
  cityBias,
}: {
  placeholder: string;
  value?: string;
  onSelect: (place: PlaceValue) => void;
  cityBias?: { lat: number; lng: number; radiusMeters?: number };
}) {
  const { ready } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready || !inputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
    });

    if (cityBias) {
      const circle = new window.google.maps.Circle({
        center: { lat: cityBias.lat, lng: cityBias.lng },
        radius: cityBias.radiusMeters ?? 25000,
      });
      autocomplete.setBounds(circle.getBounds());
    }

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      onSelect({
        fullAddress: place.formatted_address ?? place.name ?? inputRef.current!.value,
        lat: loc.lat(),
        lng: loc.lng(),
      });
    });

    return () => window.google.maps.event.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <input
      ref={inputRef}
      defaultValue={value}
      placeholder={ready ? placeholder : `${placeholder} (loading map…)`}
      className="w-full rounded-xl border border-ink/15 p-3 transition focus:border-route-green focus:outline-none focus:ring-2 focus:ring-route-green/20"
    />
  );
}
