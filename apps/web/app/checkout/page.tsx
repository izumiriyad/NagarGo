"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";

function CheckoutForm() {
  const { t } = useI18n();
  const paramOrderId = useSearchParams().get("orderId") ?? "";
  const [cfg, setCfg] = useState<any>();
  const [orderId, setOrderId] = useState(paramOrderId);
  const [method, setMethod] = useState("COD_LIVE");
  const [tx, setTx] = useState("");
  const [msg, setMsg] = useState("");
  const [order, setOrder] = useState<any>();

  useEffect(() => {
    api<any>(`/payments/config${paramOrderId ? `?orderId=${encodeURIComponent(paramOrderId)}` : ""}`).then(setCfg).catch((e) => setMsg(e.message));
    if (paramOrderId) api<any>(`/orders/${paramOrderId}`).then((r) => setOrder(r.order)).catch((e) => setMsg(e.message));
  }, [paramOrderId]);

  async function choose() {
    try {
      await api<any>("/payments", { method: "POST", body: JSON.stringify({ orderId, method }) });
      setMsg(`Payment method selected. ${method === "COD_LIVE" ? "We're now finding you a rider." : "Please submit your transaction proof below."}`);
    } catch (e: any) { setMsg(e.message); }
  }

  async function submit() {
    try {
      const r = await api<any>(`/payments/${orderId}/submit-transaction`, { method: "POST", body: JSON.stringify({ transactionId: tx, amount: Number(order?.pricing?.total ?? 0), paymentTime: new Date().toISOString() }) });
      setMsg(`Submitted for review — status: ${r.payment.status}. You'll be notified once it's verified.`);
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <main className="mx-auto max-w-xl animate-fade-up px-5 py-12">
      <h1 className="font-display text-3xl font-bold">{t("checkout.title")}</h1>
      <p className="mt-2 text-ink/60">{t("checkout.subtitle")}</p>

      <input className="mt-6 w-full rounded-xl border border-ink/15 p-3" placeholder={t("checkout.orderId")} value={orderId} onChange={(e) => setOrderId(e.target.value)} />

      {order?.pricing && (
        <div className="mt-6 rounded-2xl border border-route-green/20 bg-route-green/5 p-5">
          <h2 className="font-display text-lg font-bold">Fare & Cost Breakdown</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Base Fare</span><b>৳{order.pricing.baseFare}</b></div>
            <div className="flex justify-between"><span>Distance ({order.pricing.distanceKm} km)</span><b>৳{order.pricing.distanceFare}</b></div>
            <div className="flex justify-between"><span>Service Fee</span><b>৳{order.pricing.serviceFee}</b></div>
            <div className="flex justify-between"><span>Surcharges</span><b>৳{order.pricing.surcharges}</b></div>
            <div className="mt-2 flex justify-between border-t border-route-green/20 pt-3 text-lg"><span className="font-bold">Total</span><b>৳{order.pricing.total}</b></div>
            <p className="text-xs text-ink/50">Estimated travel time: {order.pricing.estimatedMinutes} minutes · Traffic-aware route estimate</p>
          </div>
        </div>
      )}

      <p className="mt-5 text-sm font-semibold text-ink/60">{t("checkout.selectMethod")}</p>
      <div className="mt-2 grid gap-3 rounded-2xl bg-route-green/10 p-3">
        {cfg && ([
          ["COD_LIVE", "Cash on Delivery / Live Payment", cfg.codEnabled],
          ["PAY_TO_RIDER", "Pay to Rider", cfg.payRiderEnabled],
          ["PAY_TO_ADMIN", "Pay to Admin", cfg.payAdminEnabled],
        ] as [string, string, boolean][])
          .filter((x) => x[2])
          .map((x) => (
            <label key={x[0]} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 font-bold shadow-sm transition hover:-translate-y-0.5 ${method === x[0] ? "border-route-green bg-ink text-white" : "border-ink bg-black text-white"}`}>
              <input type="radio" checked={method === x[0]} onChange={() => setMethod(x[0])} /> {x[1]}
            </label>
          ))}
      </div>

      {method === "PAY_TO_RIDER" && cfg?.riderBkash?.number && <div className="mt-4 rounded-2xl border border-route-green/20 bg-route-green/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Verified Rider Payment Account</p><div className="mt-2 flex items-center justify-between gap-3"><div><p className="font-bold">{cfg.riderBkash.number}</p><p className="text-xs text-ink/60">{cfg.riderBkash.accountHolderName} · {cfg.riderBkash.accountType}</p></div><button type="button" onClick={() => navigator.clipboard?.writeText(cfg.riderBkash.number)} className="rounded-lg bg-black px-3 py-2 text-xs font-bold text-white">Copy</button></div></div>}
      {method === "PAY_TO_RIDER" && !cfg?.riderBkash?.number && <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm font-semibold">Rider payment account will appear here after a verified rider is assigned.</p>}

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
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl px-5 py-12"><div className="skeleton h-8 w-48 rounded-xl mb-4" /><div className="skeleton h-64 rounded-2xl" /></main>}>
      <CheckoutForm />
    </Suspense>
  );
}
