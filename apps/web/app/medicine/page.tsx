"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlacesAutocompleteInput, PlaceValue } from "@/components/maps/PlacesAutocompleteInput";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const RAJSHAHI = { lat: 24.3745, lng: 88.6042 };

interface MedItem {
  name: string;
  quantity: number;
  notes: string;
}

export default function Medicine() {
  const { t } = useI18n();
  const router = useRouter();

  const [cityId, setCityId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyAddress, setPharmacyAddress] = useState("");
  const [destination, setDestination] = useState<PlaceValue>();
  const [items, setItems] = useState<MedItem[]>([{ name: "", quantity: 1, notes: "" }]);
  const [medicineSubtotal, setMedicineSubtotal] = useState(0);
  const [deliveryFee] = useState(40);
  const [prescriptionUrl, setPrescriptionUrl] = useState("");
  const [uploadingRx, setUploadingRx] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/medicine"); return; }
    api<any>("/cities").then((r) => setCityId(r.cities[0]?._id ?? "")).catch(() => {});
  }, [router]);

  async function uploadRx(file: File) {
    setUploadingRx(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Upload failed.");
      setPrescriptionUrl(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingRx(false);
    }
  }

  function addItem() {
    setItems([...items, { name: "", quantity: 1, notes: "" }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof MedItem, value: string | number) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination) { setError("Please choose a delivery address from the suggestions."); return; }
    if (!cityId) { setError("No active city found. Contact support."); return; }
    if (items.some((i) => !i.name.trim())) { setError("Please fill in all medicine names."); return; }

    setLoading(true);
    setError("");
    try {
      const r = await api<any>("/medicine-orders", {
        method: "POST",
        body: JSON.stringify({
          cityId,
          pharmacyName,
          pharmacyAddress,
          destination: {
            fullAddress: destination.fullAddress,
            lat: destination.lat,
            lng: destination.lng,
          },
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, notes: i.notes || undefined })),
          prescriptionUrl: prescriptionUrl || undefined,
          medicineSubtotal,
          deliveryFee,
        }),
      });
      setResult(r.order);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-xl animate-fade-up px-5 py-16">
          <div className="rounded-3xl border border-route-green/20 bg-route-green/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-route-green/10 text-3xl">
              💊
            </div>
            <h1 className="font-display text-2xl font-bold text-route-green-dark">Order Submitted!</h1>
            <p className="mt-2 text-ink/60">Your medicine order is under admin review.</p>
            <div className="mt-6 rounded-2xl bg-white p-5 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-ink/50">Order ID</span>
                <b className="font-mono">{result.publicId}</b>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-ink/50">Status</span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {result.status}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-ink/50">Total</span>
                <b>৳{result.pricing?.total}</b>
              </div>
            </div>
            <p className="mt-4 text-sm text-ink/50">
              You&apos;ll receive an in-app notification once the admin approves and assigns a rider.
            </p>
            <a
              href="/account"
              className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              View my account →
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl animate-fade-up px-5 py-12">
        <h1 className="font-display text-3xl font-bold text-ink">{t("medicine.title")}</h1>
        <p className="mt-2 text-ink/60">{t("medicine.subtitle")}</p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {/* Pharmacy details */}
          <div className="rounded-2xl border border-ink/10 p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Pharmacy Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                className="rounded-xl border border-ink/15 p-3"
                placeholder={t("medicine.pharmacyName")}
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
              />
              <input
                required
                className="rounded-xl border border-ink/15 p-3"
                placeholder={t("medicine.pharmacyAddress")}
                value={pharmacyAddress}
                onChange={(e) => setPharmacyAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Medicine items */}
          <div className="rounded-2xl border border-ink/10 p-5">
            <h2 className="mb-4 font-display text-lg font-bold">{t("medicine.items")}</h2>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid items-center gap-2 sm:grid-cols-[1fr_80px_auto]">
                  <input
                    required
                    className="rounded-xl border border-ink/15 p-3 text-sm"
                    placeholder={t("medicine.itemName")}
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                  />
                  <input
                    type="number"
                    min={1}
                    required
                    className="rounded-xl border border-ink/15 p-3 text-sm"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-3 text-sm font-semibold text-route-green underline"
            >
              + {t("medicine.addItem")}
            </button>
          </div>

          {/* Pricing */}
          <div className="rounded-2xl border border-ink/10 p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Cost</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50 uppercase tracking-wide">
                  {t("medicine.subtotal")}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  className="w-full rounded-xl border border-ink/15 p-3"
                  value={medicineSubtotal}
                  onChange={(e) => setMedicineSubtotal(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50 uppercase tracking-wide">
                  {t("medicine.deliveryFee")}
                </label>
                <input
                  type="number"
                  readOnly
                  className="w-full rounded-xl border border-ink/15 bg-black/[0.02] p-3 text-ink/50"
                  value={deliveryFee}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-between rounded-xl bg-route-green/5 px-4 py-3">
              <span className="font-semibold">Total</span>
              <b className="text-route-green-dark">৳{medicineSubtotal + deliveryFee}</b>
            </div>
          </div>

          {/* Delivery address */}
          <div className="rounded-2xl border border-ink/10 p-5">
            <h2 className="mb-4 font-display text-lg font-bold">{t("medicine.destination")}</h2>
            <PlacesAutocompleteInput
              placeholder={t("medicine.destination")}
              onSelect={setDestination}
              cityBias={RAJSHAHI}
            />
            {destination && (
              <p className="mt-2 text-xs text-route-green-dark">✓ {destination.fullAddress}</p>
            )}
          </div>

          {/* Prescription */}
          <div className="rounded-2xl border border-ink/10 p-5">
            <h2 className="mb-4 font-display text-lg font-bold">{t("medicine.prescriptionUpload")}</h2>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => e.target.files?.[0] && uploadRx(e.target.files[0])}
              className="w-full rounded-xl border border-ink/15 p-3 text-sm"
            />
            {uploadingRx && (
              <p className="mt-2 text-xs text-ink/50">{t("medicine.uploading")}</p>
            )}
            {prescriptionUrl && !uploadingRx && (
              <p className="mt-2 text-xs text-route-green-dark">
                ✓ Prescription uploaded —{" "}
                <a href={prescriptionUrl} target="_blank" rel="noreferrer" className="underline">
                  preview
                </a>
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || uploadingRx}
            className="w-full rounded-xl bg-route-green py-3.5 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-50"
          >
            {loading ? "Submitting…" : t("medicine.submit")}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
