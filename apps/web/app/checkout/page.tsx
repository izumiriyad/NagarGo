"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/i18n/LocaleProvider";

const PAYMENT_METHODS = [
  { value: "COD_LIVE", label: "💵 Cash on Delivery / Live Payment", key: "codEnabled" },
  { value: "PAY_TO_RIDER", label: "📱 Pay to Rider (bKash)", key: "payRiderEnabled" },
  { value: "PAY_TO_ADMIN", label: "🏦 Pay to Admin (bKash)", key: "payAdminEnabled" },
];

function CheckoutForm() {
  const { t } = useI18n();
  const router = useRouter();
  const paramOrderId = useSearchParams().get("orderId") ?? "";
  const [cfg, setCfg] = useState<any>();
  const [orderId, setOrderId] = useState(paramOrderId);
  const [method, setMethod] = useState("COD_LIVE");
  const [tx, setTx] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [order, setOrder] = useState<any>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<any>(`/payments/config${paramOrderId ? `?orderId=${encodeURIComponent(paramOrderId)}` : ""}`)
      .then(setCfg)
      .catch((e) => { setMsg(e.message); setMsgType("error"); });
    if (paramOrderId) {
      api<any>(`/orders/${paramOrderId}`)
        .then((r) => setOrder(r.order))
        .catch((e) => { setMsg(e.message); setMsgType("error"); });
    }
  }, [paramOrderId]);

  async function choose() {
    setLoading(true);
    try {
      await api<any>("/payments", { method: "POST", body: JSON.stringify({ orderId, method }) });
      setMsgType("success");
      setMsg(method === "COD_LIVE"
        ? "✅ Payment method saved. We're now searching for a rider."
        : "✅ Payment method saved. Please complete the transfer and submit your transaction ID below.");
    } catch (e: any) {
      setMsgType("error");
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setLoading(true);
    try {
      const r = await api<any>(`/payments/${orderId}/submit-transaction`, {
        method: "POST",
        body: JSON.stringify({
          transactionId: tx,
          amount: Number(order?.pricing?.total ?? 0),
          paymentTime: new Date().toISOString(),
        }),
      });
      setMsgType("success");
      setMsg(`✅ Transaction submitted — status: ${r.payment.status}. You'll be notified once verified.`);
    } catch (e: any) {
      setMsgType("error");
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  const availableMethods = cfg
    ? PAYMENT_METHODS.filter((m) => cfg[m.key])
    : [];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl animate-fade-up px-5 py-12">
        <div className="mb-6">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">Checkout</div>
          <h1 className="font-display text-3xl font-bold text-ink">{t("checkout.title")}</h1>
          <p className="mt-2 text-ink/60">{t("checkout.subtitle")}</p>
        </div>

        {!paramOrderId && (
          <input
            className="mb-5 w-full rounded-xl border border-ink/15 p-3"
            placeholder={t("checkout.orderId")}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        )}

        {/* Fare breakdown */}
        {order?.pricing && (
          <div className="mb-6 rounded-2xl border border-route-green/20 bg-route-green/5 p-5">
            <h2 className="font-display text-lg font-bold text-ink">Fare breakdown</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              {[
                ["Base fare", `৳${order.pricing.baseFare}`],
                [`Distance (${order.pricing.distanceKm} km)`, `৳${order.pricing.distanceFare}`],
                ["Service fee", `৳${order.pricing.serviceFee}`],
                ...(order.pricing.surcharges > 0 ? [["Surcharges", `৳${order.pricing.surcharges}`]] : []),
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between">
                  <dt className="text-ink/60">{label}</dt>
                  <dd className="font-medium text-ink">{val}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-route-green/20 pt-2.5">
                <dt className="text-base font-bold text-ink">Total</dt>
                <dd className="text-base font-bold text-route-green-dark">৳{order.pricing.total}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-ink/40">
              Est. travel: {order.pricing.estimatedMinutes} min · {order.pricing.distanceKm} km
            </p>
          </div>
        )}

        {/* Payment method selection */}
        <div className="mb-4">
          <p className="mb-3 text-sm font-semibold text-ink/60">{t("checkout.selectMethod")}</p>
          <div className="space-y-2">
            {availableMethods.length === 0 && !cfg && (
              <div className="skeleton h-14 rounded-xl" />
            )}
            {availableMethods.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition ${
                  method === m.value
                    ? "border-route-green bg-route-green/5"
                    : "border-ink/15 bg-white hover:border-ink/30"
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-ink">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rider bKash details */}
        {method === "PAY_TO_RIDER" && cfg?.riderBkash?.number && (
          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-500">Verified Rider bKash</p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-ink">{cfg.riderBkash.number}</p>
                <p className="text-xs text-ink/60">{cfg.riderBkash.accountHolderName} · {cfg.riderBkash.accountType}</p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(cfg.riderBkash.number)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}
        {method === "PAY_TO_RIDER" && !cfg?.riderBkash?.number && (
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">
            Rider payment account will appear here after a verified rider is assigned.
          </p>
        )}

        {/* Admin bKash */}
        {method === "PAY_TO_ADMIN" && cfg?.adminBkash?.number && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">NagarGo Admin bKash</p>
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-ink">{cfg.adminBkash.number}</p>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(cfg.adminBkash.number)}
                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Transaction ID input */}
        {method !== "COD_LIVE" && (
          <input
            className="mb-4 w-full rounded-xl border border-ink/15 p-3"
            placeholder={t("checkout.txId")}
            value={tx}
            onChange={(e) => setTx(e.target.value)}
          />
        )}

        <button
          onClick={choose}
          disabled={loading}
          className="w-full rounded-xl bg-ink p-3.5 font-semibold text-white transition hover:bg-ink-soft disabled:opacity-50"
        >
          {loading ? "Saving…" : "Confirm payment method"}
        </button>

        {method !== "COD_LIVE" && (
          <button
            onClick={submit}
            disabled={loading || !tx.trim()}
            className="mt-2 w-full rounded-xl border border-ink/15 p-3.5 font-semibold transition hover:bg-black/5 disabled:opacity-40"
          >
            {t("checkout.submitProof")}
          </button>
        )}

        {msg && (
          <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${msgType === "success" ? "bg-route-green/10 text-route-green-dark" : "bg-red-50 text-red-600"}`}>
            {msg}
          </p>
        )}

        {orderId && (
          <a
            href={`/orders/${orderId}/track`}
            className="mt-5 block text-center text-sm font-semibold text-route-green underline"
          >
            Track this order →
          </a>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl px-5 py-12"><div className="skeleton h-8 w-48 rounded-xl mb-4" /><div className="skeleton h-64 rounded-2xl" /></main>}>
      <CheckoutForm />
    </Suspense>
  );
}
