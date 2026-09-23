"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, Table } from "@/components/admin/AdminUI";

export function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { api<any>("/admin/orders").then((r) => setOrders(r.orders)); }, []);

  return (
    <Table
      columns={["Order", "Route", "Fare", "Status", "Created"]}
      rows={orders.map((o) => [
        <span key="id" className="font-semibold">{o.publicId}</span>,
        <span key="route" className="text-ink/70">{o.pickup?.fullAddress} → {o.destination?.fullAddress}</span>,
        `৳${o.pricing?.total ?? "-"}`,
        <StatusBadge key="s" status={o.status} />,
        new Date(o.createdAt).toLocaleString(),
      ])}
    />
  );
}
