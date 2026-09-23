"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";

function CheckoutContent() {
  const { t } = useI18n();
  const paramOrderId = useSearchParams().get("orderId") ?? "";
  const [cfg, setCfg] = useState<any>();
  const [order, setOrder] = useState<any>();
  const [orderId, setOrderId] = useState(paramOrderId);
  const [method, setMethod] = useState("COD_LIVE");
  const [tx, setTx] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<any>("/payments/config").then(setCfg).catch((e) => setMsg(e.message));
    if (paramOrderId) api<any>(`/orders/${paramOrderId}`).then((r) => setOrder(r.order)).catch((e) => setMsg(e.message));
  }, []);

  async function choose() {
    try {
      const r = await api<any>("/payments", { method: "POST", body: JSON.stringify({ orderId, method }) });
      setMsg(`Payment method selected. ${method === "COD_LIVE" ? "We're now finding you a rider." : "Please submit your transaction proof below."}`);
    } catch (e: any) { setMsg(e.message); }
  }
  async function submit() {
    try {
      const r = await api<any>(`/payments/${orderId}/submit-transaction`, { method: "POST", body: JSON.stringify({ transactionId: tx, amount: 0, paymentTime: new Date().toISOString() }) });
      setMsg(`Submitted for review — status: ${r.payment.status}. You'll be notified once it's verified.`);
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <main className="mx-auto max-w-xl animate-fade-up px-5 py-12">
      <h1 className="font-display text-3xl font-bold">{t("checkout.title")}</h1>
      <p className="mt-2 text-ink/60">{t("checkout.subtitle")}</p>

      <input className="mt-6 w-full rounded-xl border border-ink/15 p-3" placeholder={t("checkout.orderId")} value={orderId} onChange={(e) => setOrderId(e.target.value)} />

      {order?.pricing && (
        <div className="mt-5 rounded-2xl border border-route-green/20 bg-route-green/5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">NagarGo fare calculation</h2>
            <span className="rounded-full bg-route-green px-3 py-1 text-xs font-bold text-white">Backend verified</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/70">
            <span>Distance</span><b className="text-right text-ink">{order.pricing.distanceKm} km</b>
            <span>Estimated time</span><b className="text-right text-ink">{order.pricing.estimatedMinutes} min</b>
            <span>Base + distance</span><b className="text-right text-ink">৳{(order.pricing.baseFare + order.pricing.distanceFare).toFixed(2)}</b>
            <span>Service fee</span><b className="text-right text-ink">৳{order.pricing.serviceFee.toFixed(2)}</b>
            <span>Surcharges</span><b className="text-right text-ink">৳{order.pricing.surcharges.toFixed(2)}</b>
          </div>
          <div className="mt-4 flex justify-between border-t border-route-green/20 pt-3 text-lg font-bold"><span>Customer total</span><span>৳{order.pricing.total.toFixed(2)}</span></div>
        </div>
      )}

      <p className="mt-5 text-sm font-semibold text-ink/60">{t("checkout.selectMethod")}</p>
      <div className="mt-2 grid gap-2">
        {cfg && ([
          ["COD_LIVE", "Cash on Delivery / Live Payment", cfg.codEnabled],
          ["PAY_TO_RIDER", "Pay to Rider", cfg.payRiderEnabled],
          ["PAY_TO_ADMIN", "Pay to Admin", cfg.payAdminEnabled],
        ] as [string, string, boolean][])
          .filter((x) => x[2])
          .map((x) => (
            <label key={x[0]} className="flex items-center gap-2 rounded-xl border border-ink/15 p-4 transition hover:border-route-green/40">
              <input type="radio" checked={method === x[0]} onChange={() => setMethod(x[0])} /> {x[1]}
            </label>
          ))}
      </div>

      {method !== "COD_LIVE" && (
        <input className="mt-4 w-full rounded-xl border border-ink/15 p-3" placeholder={t("checkout.txId")} value={tx} onChange={(e) => setTx(e.target.value)} />
      )}

      <button onClick={choose} className="mt-4 w-full rounded-xl bg-ink p-3 font-semibold text-white transition hover:bg-ink-soft">Confirm payment method</button>
      {method !== "COD_LIVE" && (
        <button onClick={submit} className="mt-2 w-full rounded-xl border border-ink/15 p-3 font-semibold transition hover:bg-black/5">{t("checkout.submitProof")}</button>
      )}

      {cfg?.adminBkash?.number && <p className="mt-4 text-sm text-ink/60">Admin bKash: {cfg.adminBkash.number}</p>}
      {msg && <p className="mt-4 rounded-xl bg-route-green/10 p-3 text-sm text-route-green-dark">{msg}</p>}
      {orderId && <a href={`/orders/${orderId}/track`} className="mt-4 block text-center text-sm font-semibold text-route-green underline">Track this order →</a>}
    </main>
  );
}

export default function Checkout() {
  return <Suspense fallback={<main className="mx-auto max-w-xl px-5 py-12">Loading checkout…</main>}><CheckoutContent /></Suspense>;
}
