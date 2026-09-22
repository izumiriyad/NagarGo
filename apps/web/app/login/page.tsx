"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, saveSession } from "@/lib/api";
import { Wordmark } from "@/components/Wordmark";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/account";
  const [mode, setMode] = useState<"password" | "otp">("password");

  // Password mode
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // OTP mode
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await api<any>("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) });
      saveSession(r.accessToken);
      router.push(next);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function requestCode() {
    setError(""); setLoading(true);
    try {
      const r = await api<any>("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone, role: "CUSTOMER" }) });
      setSent(true);
      setCooldown(r.expiresInSeconds ?? 60);
      if (r.devDisplayCode) setCode(r.devDisplayCode);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await api<any>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, code, role: "CUSTOMER", name: name || undefined }) });
      saveSession(r.accessToken);
      router.push(next);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-md animate-fade-up px-5 py-16">
      <Wordmark size="lg" />
      <h1 className="mt-4 font-display text-2xl font-bold text-ink/80">Sign in</h1>

      <div className="mt-6 flex rounded-full border border-ink/15 p-1 text-sm font-semibold">
        <button onClick={() => setMode("password")} className={`flex-1 rounded-full py-2 transition ${mode === "password" ? "bg-ink text-white" : "text-ink/60"}`}>Password</button>
        <button onClick={() => setMode("otp")} className={`flex-1 rounded-full py-2 transition ${mode === "otp" ? "bg-ink text-white" : "text-ink/60"}`}>Phone code</button>
      </div>

      {mode === "password" ? (
        <form onSubmit={loginPassword} className="mt-8 space-y-3">
          <input required className="w-full rounded-xl border border-ink/15 p-3" placeholder="Phone, email, or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <input required type="password" className="w-full rounded-xl border border-ink/15 p-3" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full rounded-xl bg-ink p-3 font-semibold text-white disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
      ) : (
        <form onSubmit={sent ? verifyCode : (e) => { e.preventDefault(); requestCode(); }} className="mt-8 space-y-3">
          <input className="w-full rounded-xl border border-ink/15 p-3" placeholder="Name (new customers only)" value={name} onChange={(e) => setName(e.target.value)} />
          <input required className="w-full rounded-xl border border-ink/15 p-3" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={sent} />
          {sent && (
            <div>
              <input required className="w-full rounded-xl border border-ink/15 p-3 tracking-widest" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
              <button type="button" disabled={cooldown > 0} onClick={requestCode} className="mt-1 text-xs font-semibold text-route-green disabled:text-ink/30">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          )}
          <button disabled={loading} className="w-full rounded-xl bg-route-green p-3 font-semibold text-white disabled:opacity-50">
            {loading ? "Please wait…" : sent ? "Verify & continue" : "Send code"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-center text-sm text-ink/60">
        New to NagarGo? <a href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-route-green underline">Create an account</a>
      </p>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-5 py-16"><div className="skeleton h-8 w-32 rounded-xl mb-4" /><div className="skeleton h-64 rounded-2xl" /></main>}>
      <LoginForm />
    </Suspense>
  );
}
