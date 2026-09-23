"use client";
import { useState } from "react";
import { api, saveSession } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DashboardTab } from "./tabs/DashboardTab";
import { RidersTab } from "./tabs/RidersTab";
import { OrdersTab } from "./tabs/OrdersTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { MedicineTab } from "./tabs/MedicineTab";
import { DisputesTab } from "./tabs/DisputesTab";
import { UsersTab } from "./tabs/UsersTab";
import { PricingTab } from "./tabs/PricingTab";
import { ContentTab } from "./tabs/ContentTab";
import { FlagsTab } from "./tabs/FlagsTab";
import { AuditTab } from "./tabs/AuditTab";
import { Wordmark } from "@/components/Wordmark";

type Tab = "dashboard" | "riders" | "orders" | "payments" | "medicine" | "disputes" | "users" | "pricing" | "content" | "flags" | "audit";

export default function Admin() {
  const { t } = useI18n();
  const [logged, setLogged] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await api<any>("/admin/auth/login", { method: "POST", body: JSON.stringify({ pin }) });
      saveSession(r.accessToken);
      setLogged(true);
      if (r.mustChangePin) setNotice("Security: change the bootstrap PIN from Admin → account settings before production.");
    } catch (e: any) { setErr(e.message); }
  }

  if (!logged) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-20">
        <div className="mb-6 flex justify-between">
          <Wordmark size="md" />
          <LanguageSwitcher />
        </div>
        <h1 className="font-display text-3xl font-bold">{t("admin.title")}</h1>
        <p className="mt-2 text-ink/60">{t("admin.signIn")}</p>
        <form onSubmit={login} className="mt-8 space-y-4">
          <input className="w-full rounded-xl border border-ink/15 p-4" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder={t("admin.pin")} />
          <button className="w-full rounded-xl bg-ink px-5 py-4 font-semibold text-white">{t("nav.signIn")}</button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      </main>
    );
  }

  const nav: [Tab, string][] = [
    ["dashboard", t("admin.tab.dashboard")], ["riders", t("admin.tab.riders")], ["orders", t("admin.tab.orders")],
    ["payments", t("admin.tab.payments")], ["medicine", t("admin.tab.medicine")], ["disputes", "Disputes"],
    ["users", t("admin.tab.users")], ["pricing", t("admin.tab.pricing")], ["content", t("admin.tab.content")],
    ["flags", t("admin.tab.flags")], ["audit", t("admin.tab.audit")],
  ];

  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <Wordmark size="sm" />
            <h1 className="mt-1 font-display text-2xl font-bold">{t("admin.title")}</h1>
            <p className="text-xs text-ink/50">{t("admin.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => { localStorage.removeItem("nagargo_access_token"); setLogged(false); }}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm"
            >
              {t("admin.signOut")}
            </button>
          </div>
        </div>
      </header>

      {notice && <div className="mx-auto mt-4 max-w-7xl rounded-xl bg-amber-50 px-5 py-3 text-sm text-amber-800">{notice}</div>}

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[210px_1fr]">
        <aside className="h-fit rounded-2xl bg-white p-3">
          {nav.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm ${tab === k ? "bg-ink text-white" : "hover:bg-black/5"}`}
            >
              {label}
            </button>
          ))}
        </aside>
        <section className="rounded-2xl bg-white p-6">
          <h2 className="mb-5 font-display text-xl font-bold">{nav.find((x) => x[0] === tab)?.[1]}</h2>
          {tab === "dashboard" && <DashboardTab />}
          {tab === "riders" && <RidersTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "payments" && <PaymentsTab />}
          {tab === "medicine" && <MedicineTab />}
          {tab === "disputes" && <DisputesTab />}
          {tab === "users" && <UsersTab />}
          {tab === "pricing" && <PricingTab />}
          {tab === "content" && <ContentTab />}
          {tab === "flags" && <FlagsTab />}
          {tab === "audit" && <AuditTab />}
        </section>
      </div>
    </main>
  );
}
