"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, AdminButton, Table } from "@/components/admin/AdminUI";

export function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() { const r = await api<any>("/admin/users"); setUsers(r.users); }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyId(id);
    try { await api<any>(`/admin/users/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }); await load(); }
    finally { setBusyId(null); }
  }

  return (
    <Table
      columns={["Name", "Phone", "Status", "Actions"]}
      rows={users.map((u) => [
        u.name ?? "—",
        u.phone,
        <StatusBadge key="s" status={u.status ?? "ACTIVE"} />,
        <AdminButton key="a" tone={u.status === "SUSPENDED" ? "primary" : "danger"} disabled={busyId === u._id} onClick={() => setStatus(u._id, u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")}>
          {u.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
        </AdminButton>,
      ])}
    />
  );
}
