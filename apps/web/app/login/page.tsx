"use client";
import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, saveSession } from "@/lib/api";
import { Wordmark } from "@/components/Wordmark";
import { OtpCountdown } from "@/components/OtpCountdown";

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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSeconds, setOtpSeconds] = useState(60);

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await api<any>("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) });
      saveSession(r.accessToken, r.refreshToken);
      router.push(next);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function requestCode() {
    setError(""); setLoading(true);
    try {
      const r = await api<any>("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone, role: "CUSTOMER" }) });
      setSent(true);
      setOtpSeconds(r.expiresInSeconds ?? 60);
      if (r.devDisplayCode) setCode(r.devDisplayCode);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await api<any>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, code, role: "CUSTOMER", name: name || undefined }) });
      saveSession(r.accessToken, r.refreshToken);
      router.push(next);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-md animate-fade-up px-5 py-16">
      <Wordmark size="lg" />
      <h1 className="mt-4 font-display text-2xl font-bold text-ink/80">Sign in</h1>

      {/* Mode toggle */}
      <div className="mt-6 flex rounded-full border border-ink/15 p-1 text-sm font-semibold">
        <button
          onClick={() => setMode("password")}
          className={`flex-1 rounded-full py-2 transition ${mode === "password" ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
        >
          Password
        </button>
        <button
          onClick={() => setMode("otp")}
          className={`flex-1 rounded-full py-2 transition ${mode === "otp" ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
        >
          Phone code
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={loginPassword} className="mt-8 space-y-3">
          <input
            required
            className="w-full rounded-xl border border-ink/15 p-3 focus:border-route-green focus:outline-none"
            placeholder="Phone, email, or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <input
            required
            type="password"
            className="w-full rounded-xl border border-ink/15 p-3 focus:border-route-green focus:outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-ink p-3 font-semibold text-white transition hover:bg-ink/80 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-xs text-ink/50">
            <a href="/contact" className="underline">Forgot password?</a>{" "}
            Contact support to reset it.
          </p>
        </form>
      ) : (
        <form
          onSubmit={sent ? verifyCode : (e) => { e.preventDefault(); requestCode(); }}
          className="mt-8 space-y-3"
        >
          <input
            className="w-full rounded-xl border border-ink/15 p-3 focus:border-route-green focus:outline-none"
            placeholder="Name (new customers only)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <input
              required
              type="tel"
              inputMode="tel"
              className="w-full rounded-xl border border-ink/15 p-3 focus:border-route-green focus:outline-none"
              placeholder="Phone — e.g. 01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={sent}
            />
            {!sent && (
              <p className="mt-1 text-xs text-ink/40">Bangladesh number — starts with 01</p>
            )}
          </div>

          {sent && (
            <div>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="w-full rounded-xl border border-ink/15 p-3 text-center tracking-[0.5em] font-mono text-xl focus:border-route-green focus:outline-none"
                placeholder="······"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <OtpCountdown
                key={otpSeconds}
                seconds={otpSeconds}
                onResend={requestCode}
                className="mt-2"
              />
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-route-green p-3 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-50"
          >
            {loading ? "Please wait…" : sent ? "Verify & continue" : "Send code"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-center text-sm text-ink/60">
        New to NagarGo?{" "}
        <a href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-route-green underline">
          Create an account
        </a>
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
