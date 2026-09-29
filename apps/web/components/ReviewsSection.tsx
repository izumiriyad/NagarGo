const reviews = [
  {
    name: "Arif Rahman",
    location: "Rajshahi",
    avatar: "🧑‍💼",
    rating: 5,
    text: "Ordered medicine for my father at midnight — arrived in 28 minutes. The OTP system made me feel completely safe. Absolutely outstanding service.",
    date: "Sep 2026",
  },
  {
    name: "Fatima Begum",
    location: "Rajshahi",
    avatar: "👩",
    rating: 5,
    text: "I sent important documents across the city. Tracked every second on the live map. The rider called me on arrival. Will never use another service.",
    date: "Sep 2026",
  },
  {
    name: "Rakibul Islam",
    location: "Rajshahi",
    avatar: "👨‍🎓",
    rating: 5,
    text: "Became a rider last month. The earnings are transparent, Telegram alerts are instant, and the team responds within minutes. Best decision I made.",
    date: "Aug 2026",
  },
  {
    name: "Sadia Khanam",
    location: "Rajshahi",
    avatar: "👩‍⚕️",
    rating: 5,
    text: "Medicine Express is a lifesaver. Uploaded my prescription, got a callback from admin in 5 minutes, medicine at my door in under an hour. Incredible.",
    date: "Sep 2026",
  },
  {
    name: "Touhid Hossain",
    location: "Rajshahi",
    avatar: "🧔",
    rating: 5,
    text: "Sent a gift to my wife's office. She got an SMS when the rider left, and tracked him live. The look on her face when it arrived was priceless!",
    date: "Aug 2026",
  },
  {
    name: "Nusrat Jahan",
    location: "Rajshahi",
    avatar: "👩‍💼",
    rating: 5,
    text: "I've used NagarGo 20+ times. Every single rider has been polite and verified. Pricing is exactly what's shown — no surprises at all. 10/10.",
    date: "Sep 2026",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < count ? "text-amber-400" : "text-ink/15"}>★</span>
      ))}
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section id="reviews" className="border-t border-ink/8 bg-[#F6F7F5] py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-route-green">
          Reviews
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Trusted by Rajshahi every day
          </h2>
          <div className="flex items-center gap-3 rounded-2xl bg-white border border-ink/10 px-5 py-3">
            <div>
              <p className="font-display text-3xl font-bold text-ink">4.9</p>
              <Stars count={5} />
            </div>
            <div className="h-10 w-px bg-ink/10" />
            <p className="text-xs text-ink/50">Average<br />customer rating</p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="animate-fade-up rounded-2xl border border-ink/10 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Stars count={r.rating} />
              <p className="mt-3 text-sm leading-relaxed text-ink/70">&ldquo;{r.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3 border-t border-ink/8 pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-route-green/10 text-lg">
                  {r.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{r.name}</p>
                  <p className="text-xs text-ink/40">{r.location} · {r.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
