"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlacesAutocompleteInput, PlaceValue } from "@/components/maps/PlacesAutocompleteInput";
import { RoutePreviewMap } from "@/components/maps/RoutePreviewMap";
import { FareEstimator } from "@/components/FareEstimator";
import { SavedAddressQuickPick } from "@/components/SavedAddressQuickPick";

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

function BookForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

    // Pre-fill from re-order URL params
    const pickupAddress = searchParams.get("pickupAddress");
    const pickupLat = searchParams.get("pickupLat");
    const pickupLng = searchParams.get("pickupLng");
    const destAddress = searchParams.get("destAddress");
    const destLat = searchParams.get("destLat");
    const destLng = searchParams.get("destLng");
    const cat = searchParams.get("category");

    if (pickupAddress && pickupLat && pickupLng) {
      setPickup({ fullAddress: pickupAddress, lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) });
    }
    if (destAddress && destLat && destLng) {
      setDestination({ fullAddress: destAddress, lat: parseFloat(destLat), lng: parseFloat(destLng) });
    }
    if (cat) setCategory(cat);
  }, [router, searchParams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !destination) {
      setError("Please choose both a pickup and a destination from the suggestions.");
      return;
    }
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
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">
            Book a delivery
          </div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Send something</h1>
          <p className="mt-2 text-ink/60">
            Tell us what&apos;s moving and where — pricing calculates automatically.
          </p>
        </div>

        <div className="mt-4">
          <RoutePreviewMap pickup={pickup ?? RAJSHAHI} destination={destination} />
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {/* Route card */}
          <div className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-ink">Route</h2>

            {/* Pickup */}
            <div className="space-y-2">
              <SavedAddressQuickPick label="Pickup from" onSelect={setPickup} />
              <PlacesAutocompleteInput
                placeholder="📍 Pickup address"
                onSelect={setPickup}
                cityBias={RAJSHAHI}
              />
              {pickup && (
                <p className="text-xs text-route-green-dark font-medium">✓ {pickup.fullAddress}</p>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <SavedAddressQuickPick label="Deliver to" onSelect={setDestination} />
              <PlacesAutocompleteInput
                placeholder="🏁 Destination address"
                onSelect={setDestination}
                cityBias={RAJSHAHI}
              />
              {destination && (
                <p className="text-xs text-route-green-dark font-medium">✓ {destination.fullAddress}</p>
              )}
            </div>
          </div>

          {/* Package details */}
          <div className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-ink">Package details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="rounded-xl border border-ink/15 p-3 text-sm focus:border-route-green focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                className="rounded-xl border border-ink/15 p-3 text-sm focus:border-route-green focus:outline-none"
                placeholder="Item name (optional)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <textarea
              className="w-full rounded-xl border border-ink/15 p-3 text-sm focus:border-route-green focus:outline-none"
              placeholder="Special instructions (optional)"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Live fare */}
          <FareEstimator pickup={pickup} destination={destination} isEmergency={isEmergency} />

          {/* Emergency */}
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
            />
            <div>
              <span className="text-sm font-semibold text-red-700">🚨 Urgent / Emergency delivery</span>
              <p className="mt-0.5 text-xs text-red-600/70">Emergency pricing applies — priority dispatch</p>
            </div>
          </label>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-route-green p-3.5 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-50"
          >
            {loading ? "Creating your order…" : "Continue to payment →"}
          </button>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}
        </form>
      </main>
      <Footer />
    </>
  );
}

export default function BookDelivery() {
  return (
    <Suspense fallback={
      <><Navbar /><main className="mx-auto max-w-2xl px-5 py-12"><div className="skeleton h-96 rounded-2xl" /></main><Footer /></>
    }>
      <BookForm />
    </Suspense>
  );
}
