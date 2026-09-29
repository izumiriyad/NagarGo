const plans = [
  {
    zone: "Rajshahi",
    highlight: true,
    badge: "Our home city",
    baseFare: 40,
    perKm: 12,
    minFare: 50,
    serviceFee: 5,
    riderCut: 80,
  },
  {
    zone: "Other Major Cities",
    baseFare: 45,
    perKm: 13,
    minFare: 55,
    serviceFee: 5,
    riderCut: 80,
  },
  {
    zone: "Dhaka / Chattogram",
    baseFare: 50,
    perKm: 15,
    minFare: 60,
    serviceFee: 10,
    riderCut: 80,
  },
];

function tk(v: number) {
  return `৳${v}`;
}

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-ink/8 bg-white py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-route-green/30 bg-route-green/10 px-3 py-1 text-xs font-semibold text-route-green-dark">
          No hidden charges
        </div>
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Transparent pricing — always
        </h2>
        <p className="mt-3 max-w-xl text-ink/60">
          Fares are calculated server-side and shown in full before you confirm. Riders keep 80% of every delivery.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.zone}
              className={`relative rounded-3xl border p-7 transition hover:-translate-y-0.5 hover:shadow-lg ${
                p.highlight
                  ? "border-route-green/40 bg-route-green/5 shadow-sm shadow-route-green/10"
                  : "border-ink/10 bg-white"
              }`}
            >
              {p.badge && (
                <span className="mb-4 inline-block rounded-full bg-route-green/15 px-2.5 py-0.5 text-xs font-semibold text-route-green-dark">
                  {p.badge}
                </span>
              )}
              <h3 className="font-display text-lg font-bold text-ink">{p.zone}</h3>
              <p className="mt-1 text-3xl font-bold text-route-green">{tk(p.baseFare)}</p>
              <p className="text-xs text-ink/50">base fare</p>

              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  ["Per km", tk(p.perKm)],
                  ["Minimum fare", tk(p.minFare)],
                  ["Service fee", tk(p.serviceFee)],
                  ["Rider earns", `${p.riderCut}%`],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between border-t border-ink/8 pt-2.5">
                    <span className="text-ink/55">{label}</span>
                    <span className="font-semibold text-ink">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-2 text-center text-xs text-ink/40">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Starter configuration values. Actual fares may vary by zone, distance and peak hours. Full breakdown shown before booking.
        </p>
      </div>
    </section>
  );
}
