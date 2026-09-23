import Image from "next/image";

/**
 * Lightweight, dependency-free hero graphic: a single curved route
 * with flowing dashes (mirrors the road motif in the NagarGo mark),
 * two pulsing location nodes, and the mark itself riding the curve
 * via CSS `offset-path` — no video, no heavy animation library.
 * All motion is disabled under prefers-reduced-motion (see globals.css).
 */
export function RouteAnimation() {
  return (
    <div className="relative aspect-[4/3] w-full max-w-md mx-auto lg:mx-0">
      <svg viewBox="0 0 400 300" className="h-full w-full" fill="none" aria-hidden="true">
        <path
          id="delivery-route"
          d="M 30 240 C 110 240, 90 100, 190 90 C 280 82, 260 40, 360 40"
          stroke="#1FA24A"
          strokeWidth="4"
          strokeLinecap="round"
          className="route-path"
        />
        <circle cx="30" cy="240" r="7" fill="#0B1220" />
        <circle cx="360" cy="40" r="9" fill="#1FA24A" className="route-node" />
        <circle cx="190" cy="90" r="5" fill="#1FA24A" opacity="0.6" className="route-node" />
      </svg>

      <div
        className="absolute h-9 w-9 [offset-path:path('M_30_240_C_110_240,_90_100,_190_90_C_280_82,_260_40,_360_40')] [offset-rotate:0deg] motion-safe:animate-[ride_6s_linear_infinite]"
        style={{ left: 0, top: 0 }}
      >
        <Image
          src="/nagargo-mark.png"
          alt=""
          width={36}
          height={36}
          className="drop-shadow-md"
        />
      </div>

      <style>{`
        @keyframes ride {
          from { offset-distance: 0%; }
          to { offset-distance: 100%; }
        }
      `}</style>
    </div>
  );
}
