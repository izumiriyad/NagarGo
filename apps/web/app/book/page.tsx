"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlacesAutocompleteInput, PlaceValue } from "@/components/maps/PlacesAutocompleteInput";
import { RoutePreviewMap } from "@/components/maps/RoutePreviewMap";

const RAJSHAHI = { lat: 24.3745, lng: 88.6042 };

const ITEM_CATEGORIES = [
  { value: "DOCUMENT", label: "📄 Document" },
  { value: "PARCEL", label: "📦 Parcel" },
  { value: "GIFT", label: "🎁 Gift" },
  { value: "ELECTRONICS", label: "💻 Electronics" },
  { value: "KEYS", label: "🔑 Keys" },
  { value: "FOOD", label: "🍱 Food" },
  { value: "OTHER", label: "🗂️ Other" },
];

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
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl animate-fade-up px-5 py-12">
        <div className="mb-6">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">Book a delivery</div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Send something</h1>
          <p className="mt-2 text-ink/60">Tell us what&apos;s moving and where — pricing calculates automatically.</p>
        </div>

        <div className="mt-4">
          <RoutePreviewMap pickup={pickup ?? RAJSHAHI} destination={destination} />
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-ink">Route</h2>
            <PlacesAutocompleteInput placeholder="📍 Pickup address" onSelect={setPickup} cityBias={RAJSHAHI} />
            <PlacesAutocompleteInput placeholder="🏁 Destination address" onSelect={setDestination} cityBias={RAJSHAHI} />
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-ink">Package details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="rounded-xl border border-ink/15 p-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                className="rounded-xl border border-ink/15 p-3 text-sm"
                placeholder="Item name (optional)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <textarea
              className="w-full rounded-xl border border-ink/15 p-3 text-sm"
              placeholder="Special instructions (optional)"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3">
            <input type="checkbox" className="h-4 w-4" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
            <div>
              <span className="text-sm font-semibold text-red-700">🚨 Urgent / Emergency delivery</span>
              <p className="text-xs text-red-600/70 mt-0.5">Emergency pricing applies — priority dispatch</p>
            </div>
          </label>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-route-green p-3.5 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-50"
          >
            {loading ? "Creating your order…" : "Continue to payment →"}
          </button>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        </form>
      </main>
      <Footer />
    </>
  );
}
