"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, saveSession } from "@/lib/api";
import { Wordmark } from "@/components/Wordmark";
import { PlacesAutocompleteInput, PlaceValue } from "@/components/maps/PlacesAutocompleteInput";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function SignupContent() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/account";
  const [form, setForm] = useState({ name: "", phone: "", email: "", username: "", password: "" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [location, setLocation] = useState<PlaceValue>();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API}/auth/signup-upload`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Photo upload failed.");
      setPhotoUrl(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setError("Your browser doesn't support location detection — search for your address instead."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
          const data = await res.json();
          const address = data.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setLocation({ fullAddress: address, lat, lng });
        } catch {
          setLocation({ fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
        } finally {
          setLocating(false);
        }
      },
      () => { setError("Couldn't get your location — please search for your address instead."); setLocating(false); }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!photoUrl) { setError("Please upload a profile photo."); return; }
    if (!location) { setError("Please set your location."); return; }
    setLoading(true);
    try {
      const r = await api<any>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          username: form.username,
          password: form.password,
          photoUrl,
          location: { address: location.fullAddress, lat: location.lat, lng: location.lng },
        }),
      });
      saveSession(r.accessToken);
      router.push(next);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md animate-fade-up px-5 py-16">
      <Wordmark size="lg" />
      <h1 className="mt-4 font-display text-2xl font-bold text-ink/80">Create your account</h1>
      <p className="mt-2 text-ink/60">Name, username, phone, email, a password, a photo, and your location.</p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <input required className="w-full rounded-xl border border-ink/15 p-3" placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <input required className="w-full rounded-xl border border-ink/15 p-3" placeholder="Username" value={form.username} onChange={(e) => set("username", e.target.value)} />
        <input required className="w-full rounded-xl border border-ink/15 p-3" placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <input required type="email" className="w-full rounded-xl border border-ink/15 p-3" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        <input required type="password" minLength={8} className="w-full rounded-xl border border-ink/15 p-3" placeholder="Password (min 8 characters)" value={form.password} onChange={(e) => set("password", e.target.value)} />

        <div>
          <label className="mb-1 block text-sm text-ink/60">Profile photo</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} className="w-full rounded-xl border border-ink/15 p-3 text-sm" />
          {uploadingPhoto && <p className="mt-1 text-xs text-ink/50">Uploading…</p>}
          {photoUrl && !uploadingPhoto && (
            <div className="mt-2 flex items-center gap-2">
              <img src={photoUrl} alt="" className="h-12 w-12 animate-fade-up rounded-full border border-ink/10 object-cover" />
              <span className="text-xs text-route-green-dark">✓ Uploaded</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink/60">Your location</label>
          <div className="flex gap-2">
            <div className="flex-1"><PlacesAutocompleteInput placeholder="Search your address" onSelect={setLocation} /></div>
            <button type="button" onClick={useMyLocation} disabled={locating} className="whitespace-nowrap rounded-xl border border-ink/15 px-3 text-sm font-semibold transition hover:bg-black/5 disabled:opacity-50">
              {locating ? "Locating…" : "Use my location"}
            </button>
          </div>
          {location && <p className="mt-1 text-xs text-route-green-dark">✓ {location.fullAddress}</p>}
        </div>

        <button disabled={loading || uploadingPhoto} className="w-full rounded-xl bg-route-green p-3 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-50">
          {loading ? "Creating account…" : "Sign up"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account? <a href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-route-green underline">Sign in</a>
      </p>
    </main>
  );
}

export default function Signup() {
  return <Suspense fallback={<main className="mx-auto max-w-md px-5 py-16">Loading sign up…</main>}><SignupContent /></Suspense>;
}
