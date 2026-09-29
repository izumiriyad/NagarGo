"use client";
import { useState } from "react";

/**
 * Interactive contact form on the /contact page.
 * Sends to the NagarGo support email via the mailto fallback,
 * or to POST /api/contact if the backend endpoint is present.
 */
export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? "Failed to send. Please try WhatsApp instead.");
      }
      setStatus("done");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="animate-fade-up rounded-3xl border border-route-green/20 bg-route-green/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-route-green/10 text-3xl">
          ✅
        </div>
        <h3 className="font-display text-xl font-bold text-route-green-dark">Message sent!</h3>
        <p className="mt-2 text-sm text-ink/60">
          We'll reply to <strong>{form.email || "you"}</strong> within 24 hours. For urgent issues,
          chat with us on{" "}
          <a href="https://wa.me/8801683772714" className="font-semibold text-route-green underline">
            WhatsApp
          </a>
          .
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-5 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/5"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 animate-fade-up">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/60">Your name *</label>
          <input
            required
            className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm transition focus:border-route-green focus:outline-none"
            placeholder="Arif Rahman"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/60">Email address *</label>
          <input
            required
            type="email"
            className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm transition focus:border-route-green focus:outline-none"
            placeholder="arif@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink/60">Subject *</label>
        <select
          required
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm transition focus:border-route-green focus:outline-none"
          value={form.subject}
          onChange={(e) => set("subject", e.target.value)}
        >
          <option value="">— Select a topic —</option>
          <option>Order issue / dispute</option>
          <option>Payment problem</option>
          <option>Rider behaviour</option>
          <option>Account / login help</option>
          <option>Become a rider</option>
          <option>Business / partnership</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink/60">Message *</label>
        <textarea
          required
          minLength={20}
          rows={5}
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm transition focus:border-route-green focus:outline-none"
          placeholder="Describe your issue or question in detail…"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </div>

      {status === "error" && errorMsg && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-route-green py-3.5 font-semibold text-white transition hover:bg-route-green-dark disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message →"}
      </button>

      <p className="text-center text-xs text-ink/40">
        Or reach us instantly on{" "}
        <a href="https://wa.me/8801683772714" className="font-semibold text-route-green underline">
          WhatsApp
        </a>
        . Response time: under 15 minutes.
      </p>
    </form>
  );
}
