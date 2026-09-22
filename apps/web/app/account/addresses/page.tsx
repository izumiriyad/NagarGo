"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface SavedAddress {
  _id: string;
  label: string;
  customLabel?: string;
  address: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

const ADDRESS_LABEL_ICONS: Record<string, string> = {
  HOME: "🏠",
  WORK: "💼",
  OTHER: "📍",
};

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SavedAddress | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    label: "HOME",
    customLabel: "",
    address: "",
    landmark: "",
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nagargo_access_token") : null;
    if (!token) { router.replace("/login?next=/account/addresses"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await api<{ addresses: SavedAddress[] }>("/addresses");
      setAddresses(r.addresses ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load addresses.");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(addr: SavedAddress) {
    setEditTarget(addr);
    setForm({
      label: addr.label,
      customLabel: addr.customLabel ?? "",
      address: addr.address,
      landmark: addr.landmark ?? "",
    });
    setAddOpen(true);
  }

  function openAdd() {
    setEditTarget(null);
    setForm({ label: "HOME", customLabel: "", address: "", landmark: "" });
    setAddOpen(true);
  }

  async function save() {
    if (!form.address.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api<any>(`/addresses/${editTarget._id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await api<any>("/addresses", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      await load();
      setAddOpen(false);
    } catch (e: any) {
      setError(e.message ?? "Failed to save address.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this address?")) return;
    setDeleting(id);
    try {
      await api<any>(`/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a._id !== id));
    } catch (e: any) {
      setError(e.message ?? "Failed to delete address.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
              <p className="text-sm text-gray-500 mt-1">
                Save frequently used locations to speed up booking.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="px-4 py-2 rounded-lg bg-route-green text-white font-semibold text-sm hover:bg-route-green-dark transition-colors"
            >
              + Add Address
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <span className="animate-spin text-3xl mr-3">⏳</span> Loading addresses…
            </div>
          )}

          {/* Empty */}
          {!loading && addresses.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📍</div>
              <p className="text-gray-500 font-medium">No saved addresses yet.</p>
              <p className="text-gray-400 text-sm mt-1">Add your home and work address to book faster.</p>
              <button
                onClick={openAdd}
                className="mt-6 px-6 py-2.5 rounded-lg bg-route-green text-white font-semibold text-sm hover:bg-route-green-dark transition-colors"
              >
                Add First Address
              </button>
            </div>
          )}

          {/* Address list */}
          {!loading && addresses.length > 0 && (
            <ul className="space-y-3">
              {addresses.map((addr) => (
                <li
                  key={addr._id}
                  className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl mt-0.5">{ADDRESS_LABEL_ICONS[addr.label] ?? "📍"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {addr.customLabel || addr.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                        {addr.label}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 leading-snug truncate">{addr.address}</p>
                    {addr.landmark && (
                      <p className="text-gray-400 text-xs mt-0.5">Landmark: {addr.landmark}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(addr)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(addr._id)}
                      disabled={deleting === addr._id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                    >
                      {deleting === addr._id ? "…" : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Back link */}
          <div className="mt-10 text-center">
            <button
              onClick={() => router.push("/account")}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to account
            </button>
          </div>
        </div>

        {/* Add / Edit modal */}
        {addOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                {editTarget ? "Edit Address" : "Add New Address"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-route-green"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  >
                    <option value="HOME">🏠 Home</option>
                    <option value="WORK">💼 Work</option>
                    <option value="OTHER">📍 Other</option>
                  </select>
                </div>

                {form.label === "OTHER" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom label</label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-route-green"
                      placeholder="e.g. Gym, Parents' house…"
                      value={form.customLabel}
                      onChange={(e) => setForm((f) => ({ ...f, customLabel: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full address <span className="text-red-500">*</span></label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-route-green resize-none"
                    rows={3}
                    placeholder="House / road / area, Rajshahi"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (optional)</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-route-green"
                    placeholder="Near mosque, opposite to hospital…"
                    value={form.landmark}
                    onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAddOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving || !form.address.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-route-green text-white text-sm font-semibold hover:bg-route-green-dark transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Address"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
