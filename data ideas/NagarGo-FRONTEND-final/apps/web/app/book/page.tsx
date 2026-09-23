"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PlacesAutocompleteInput, PlaceValue } from "@/components/maps/PlacesAutocompleteInput";
import { RoutePreviewMap } from "@/components/maps/RoutePreviewMap";

const RAJSHAHI = { lat: 24.3745, lng: 88.6042 };

export default function BookDelivery() {
  const router = useRouter();
  const [cityId, setCityId] = useState("");
  const [pickup, setPickup] = useState<PlaceValue>();
  const [destination, setDestination] = useState<PlaceValue>();
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("PARCEL");
  const [instructions, setInstructions] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("nagargo_access_token")) {
      router.replace("/login?next=/book");
      return;
    }
    api<any>("/cities").then((r) => setCityId(r.cities[0]?._id ?? "")).catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !destination) { setError("Please choose both a pickup and a destination from the suggestions."); return; }
    if (!cityId) { setError("No active city is configured yet."); return; }
    setLoading(true);
    setError("");
    try {
      const r = await api<any>("/orders", {
        method: "POST",
        body: JSON.stringify({
          cityId,
          pickup: { fullAddress: pickup.fullAddress, lat: pickup.lat, lng: pickup.lng },
          destination: { fullAddress: destination.fullAddress, lat: destination.lat, lng: destination.lng },
          item: { category, name: itemName || category, specialInstructions: instructions || undefined },
          isEmergency,
        }),
      });
      router.push(`/checkout?orderId=${r.order._id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold">Send something</h1>
      <p className="mt-2 text-ink/60">Tell us what's moving and where — pricing is calculated automatically.</p>

      <div className="mt-6">
        <RoutePreviewMap
          pickup={pickup ?? RAJSHAHI}
          destination={destination}
        />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <PlacesAutocompleteInput placeholder="Pickup address" onSelect={setPickup} cityBias={RAJSHAHI} />
        <PlacesAutocompleteInput placeholder="Destination address" onSelect={setDestination} cityBias={RAJSHAHI} />

        <div className="grid gap-3 sm:grid-cols-2">
          <select className="rounded-xl border border-ink/15 p-3" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="DOCUMENT">Document</option>
            <option value="PARCEL">Parcel</option>
            <option value="GIFT">Gift</option>
            <option value="ELECTRONICS">Electronics</option>
            <option value="KEYS">Keys</option>
            <option value="OTHER">Other</option>
          </select>
          <input className="rounded-xl border border-ink/15 p-3" placeholder="Item name (optional)" value={itemName} onChange={(e) => setItemName(e.target.value)} />
        </div>

        <textarea className="w-full rounded-xl border border-ink/15 p-3" placeholder="Special instructions (optional)" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} />

        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} /> This is urgent (emergency pricing applies)
        </label>

        <button disabled={loading} className="w-full rounded-xl bg-route-green p-3 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-50">
          {loading ? "Creating your order…" : "Continue to payment"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}
