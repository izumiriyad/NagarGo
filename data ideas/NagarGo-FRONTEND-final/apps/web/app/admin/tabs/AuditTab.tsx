"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Table } from "@/components/admin/AdminUI";

export function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { api<any>("/admin/audit-logs").then((r) => setLogs(r.logs)); }, []);

  return (
    <Table
      columns={["Action", "Actor", "Target", "Reason", "When"]}
      rows={logs.map((l) => [
        <span key="a" className="font-semibold">{l.action}</span>,
        `${l.actorType}${l.actorId ? ` (${String(l.actorId).slice(-6)})` : ""}`,
        l.targetType ? `${l.targetType} ${String(l.targetId ?? "").slice(-6)}` : "—",
        l.reason ?? "—",
        new Date(l.createdAt).toLocaleString(),
      ])}
    />
  );
}
