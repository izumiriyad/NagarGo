"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/admin/AdminUI";

const LABELS: Record<string, string> = {
  users: "Customers", riders: "Riders", pendingRiders: "Pending riders",
  orders: "Total orders", activeOrders: "Active orders", payments: "Payments",
  pendingPayments: "Pending payments", delivered: "Delivered",
};

export function DashboardTab() {
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
  useEffect(() => { api<any>("/admin/dashboard").then((r) => setMetrics(r.metrics)); }, []);
  if (!metrics) return <p className="text-sm text-ink/50">Loading…</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(metrics).map(([k, v]) => (
        <Card key={k}>
          <p className="text-xs uppercase tracking-wide text-ink/50">{LABELS[k] ?? k}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{v}</p>
        </Card>
      ))}
    </div>
  );
}
