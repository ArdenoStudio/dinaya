"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Download, Search } from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  stage: "lead" | "prospect" | "active" | "churned";
  source: string | null;
  createdAt: string;
};

const STAGES = [
  { key: "", label: "All" },
  { key: "lead", label: "Lead" },
  { key: "prospect", label: "Prospect" },
  { key: "active", label: "Active" },
  { key: "churned", label: "Churned" },
];

const STAGE_STYLES: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700",
  prospect: "bg-purple-100 text-purple-700",
  active: "bg-green-100 text-green-700",
  churned: "bg-gray-100 text-gray-500",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stage, setStage] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  function exportCsv() {
    const headers = ["Name", "Phone", "Email", "Stage", "Source", "Created"];
    const rows = clients.map((c) => [
      c.name, c.phone, c.email ?? "", c.stage, c.source ?? "",
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "clients.csv";
    a.click();
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (q) params.set("q", q);
    fetch(`/api/dashboard/clients?${params}`)
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); });
  }, [stage, q]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cal text-2xl">Clients</h1>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={clients.length === 0}
            className="flex items-center gap-1.5 border px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <Link
            href="/dashboard/clients/new"
            className="flex items-center gap-1.5 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium border-b-2 border-primary/70 shadow-sm transition-all hover:shadow-primary/30 hover:shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Add client
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, phone, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border rounded-md pl-8 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1">
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                stage === s.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground">
          No clients found.{" "}
          <Link href="/dashboard/clients/new" className="text-primary hover:underline">
            Add your first client →
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b last:border-0 hover:bg-muted/10 transition-colors ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STAGE_STYLES[c.stage] ?? ""}`}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {c.source?.replace("_", " ") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className="text-xs px-2.5 py-1 rounded border font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
