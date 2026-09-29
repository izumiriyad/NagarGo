"use client";
import { useRouter } from "next/navigation";

interface OrderSummary {
  pickup?: { fullAddress?: string; lat?: number; lng?: number };
  destination?: { fullAddress?: string; lat?: number; lng?: number };
  item?: { name?: string; category?: string };
}

interface Props {
  order: OrderSummary;
  className?: string;
}

/**
 * "Book again" shortcut button for delivered or cancelled orders.
 * Pre-fills pickup + destination in the booking page via URL query params.
 */
export function BookAgainButton({ order, className = "" }: Props) {
  const router = useRouter();

  function handleBookAgain() {
    const params = new URLSearchParams();
    if (order.pickup?.fullAddress)      params.set("from", order.pickup.fullAddress);
    if (order.destination?.fullAddress) params.set("to", order.destination.fullAddress);
    if (order.item?.category)           params.set("category", order.item.category);
    router.push(`/book?${params.toString()}`);
  }

  return (
    <button
      type="button"
      id="book-again-btn"
      onClick={handleBookAgain}
      className={`inline-flex items-center gap-1.5 rounded-full border border-route-green/30 px-3 py-1.5 text-xs font-semibold text-route-green-dark transition hover:bg-route-green/5 ${className}`}
      title="Rebook this delivery"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden>
        <path d="M1 4v6h6" />
        <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
      </svg>
      Book again
    </button>
  );
}
