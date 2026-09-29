import React from "react";

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-ink/8 text-ink/70",
  PAYMENT_PENDING: "bg-amber-50 text-amber-700",
  PAYMENT_CONFIRMED: "bg-blue-50 text-blue-700",
  SEARCHING_RIDER: "bg-yellow-50 text-yellow-700",
  RIDER_ASSIGNED: "bg-blue-50 text-blue-700",
  RIDER_ACCEPTED: "bg-blue-50 text-blue-700",
  RIDER_ARRIVING: "bg-indigo-50 text-indigo-700",
  PICKUP_OTP_PENDING: "bg-amber-50 text-amber-700",
  PICKED_UP: "bg-indigo-50 text-indigo-700",
  IN_TRANSIT: "bg-indigo-50 text-indigo-700",
  RIDER_AT_DESTINATION: "bg-purple-50 text-purple-700",
  DELIVERY_OTP_PENDING: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-route-green/10 text-route-green-dark",
  CANCELLED: "bg-red-50 text-red-600",
  FAILED: "bg-red-50 text-red-600",
  DISPUTED: "bg-amber-50 text-amber-700",
};

const STATUS_DOTS: Record<string, string> = {
  DELIVERED: "bg-route-green",
  IN_TRANSIT: "bg-indigo-500",
  PICKED_UP: "bg-indigo-500",
  RIDER_ASSIGNED: "bg-blue-500",
  SEARCHING_RIDER: "bg-yellow-500",
  CANCELLED: "bg-red-500",
  FAILED: "bg-red-500",
  DISPUTED: "bg-amber-500",
};

export function statusLabel(s: string): string {
  const MAP: Record<string, string> = {
    CREATED: "Created",
    PAYMENT_PENDING: "Awaiting payment",
    PAYMENT_CONFIRMED: "Payment confirmed",
    SEARCHING_RIDER: "Finding rider…",
    RIDER_ASSIGNED: "Rider assigned",
    RIDER_ACCEPTED: "Rider accepted",
    RIDER_ARRIVING: "Rider on the way",
    PICKUP_OTP_PENDING: "Ready for pickup",
    PICKED_UP: "Item picked up",
    IN_TRANSIT: "In transit",
    RIDER_AT_DESTINATION: "Rider arrived",
    DELIVERY_OTP_PENDING: "Ready to deliver",
    DELIVERED: "Delivered ✓",
    CANCELLED: "Cancelled",
    FAILED: "Failed",
    DISPUTED: "Under dispute",
  };
  return MAP[s] ?? s.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}

interface Props {
  status: string;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Reusable status badge. Used on orders list, account page, track page, admin panel, etc.
 * Eliminates the per-page copy-paste of STATUS_COLORS maps.
 */
export function OrderStatusBadge({ status, showDot = false, size = "md", className = "" }: Props) {
  const colorClass = STATUS_COLORS[status] ?? "bg-ink/8 text-ink/70";
  const dotColor = STATUS_DOTS[status] ?? "bg-ink/30";
  const sizeClass = size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${colorClass} ${sizeClass} ${className}`}>
      {showDot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />}
      {statusLabel(status)}
    </span>
  );
}
