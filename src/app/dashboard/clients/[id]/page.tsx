"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useDashboardToast } from "@/components/dashboard/ToastProvider";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import {
  dashboardInputClass,
  dashboardOutlineActionClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

type Booking = {
  id: string;
  startsAt: string;
  status: string;
  serviceName: string;
  staffName: string;
};

type Note = {
  id: string;
  body: string;
  createdAt: string;
};

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  stage: "lead" | "prospect" | "active" | "churned";
  source: string | null;
  tags: string[] | null;
  internalNotes: string | null;
  createdAt: string;
};

const STAGES = ["lead", "prospect", "active", "churned"] as const;

const STAGE_STYLES: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700",
  prospect: "bg-purple-100 text-purple-700",
  active: "bg-green-100 text-green-700",
  churned: "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200",
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showToast } = useDashboardToast();
  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [editStage, setEditStage] = useState<(typeof STAGES)[number]>("lead");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/clients/${id}`)
      .then((r) => r.json())
      .then(({ client, bookings, notes }) => {
        setClient(client);
        setBookings(bookings);
        setNotes(notes);
        setEditStage(client.stage);
        setEditInternalNotes(client.internalNotes ?? "");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showToast({
          title: "Could not load client",
          description: "Check your connection and try again.",
        });
      });
  }, [id, showToast]);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: editStage, internalNotes: editInternalNotes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setClient(updated);
        showToast({ title: "Client saved" });
      } else {
        showToast({
          title: "Could not save client",
          description: "Try again or refresh the page.",
        });
      }
    } catch {
      showToast({
        title: "Could not save client",
        description: "Check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/dashboard/clients/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setNoteBody("");
        showToast({ title: "Note added" });
      } else {
        showToast({
          title: "Could not add note",
          description: "Try again in a moment.",
        });
      }
    } catch {
      showToast({
        title: "Could not add note",
        description: "Check your connection and try again.",
      });
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return <DashboardLoadingPanel rows={4} />;
  }

  if (!client) {
    return <div className="p-8 text-sm text-muted-foreground">Client not found.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <Link
          href="/dashboard/clients"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Clients
        </Link>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="min-w-0 truncate font-cal text-xl sm:text-2xl">{client.name}</h1>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
              STAGE_STYLES[client.stage],
            )}
          >
            {client.stage}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="space-y-3 rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-medium">Contact</h2>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{client.phone}</p>
            </div>
            <a
              href={whatsappUrl(client.phone, `Hi ${client.name},`)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(dashboardOutlineActionClass, "w-full justify-center")}
            >
              WhatsApp
            </a>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{client.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="text-sm font-medium capitalize">
                {client.source?.replace("_", " ") ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client since</p>
              <p className="text-sm font-medium">
                {format(new Date(client.createdAt), "d MMM yyyy")}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-medium">CRM</h2>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Stage</label>
              <select
                value={editStage}
                onChange={(e) => setEditStage(e.target.value as typeof editStage)}
                className={dashboardInputClass}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Internal notes</label>
              <textarea
                rows={4}
                value={editInternalNotes}
                onChange={(e) => setEditInternalNotes(e.target.value)}
                className={cn(dashboardInputClass, "resize-none")}
              />
            </div>
            <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 -mx-5 border-t bg-white/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-neutral-900/95 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className={cn(dashboardPrimaryActionClass, "w-full justify-center")}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-medium">Booking history ({bookings.length})</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="flex flex-col items-start gap-3 px-5 py-6">
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
                <Link
                  href="/dashboard/bookings/new"
                  className={cn(dashboardPrimaryActionClass, "justify-center")}
                >
                  Create booking
                </Link>
              </div>
            ) : (
              <>
                <ul className="divide-y md:hidden">
                  {bookings.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/dashboard/bookings/${b.id}`}
                        className="flex min-h-11 flex-col gap-1 px-5 py-4 active:bg-muted/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium tabular-nums">
                            {format(new Date(b.startsAt), "d MMM yyyy, h:mm a")}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                              BOOKING_STATUS_STYLES[b.status] ?? "",
                            )}
                          >
                            {b.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {b.serviceName} · {b.staffName}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Service
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Staff
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b, i) => (
                        <tr
                          key={b.id}
                          className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                        >
                          <td className="px-4 py-2.5 text-xs tabular-nums">
                            {format(new Date(b.startsAt), "d MMM yyyy, h:mm a")}
                          </td>
                          <td className="px-4 py-2.5 text-xs">{b.serviceName}</td>
                          <td className="px-4 py-2.5 text-xs">{b.staffName}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                                BOOKING_STATUS_STYLES[b.status] ?? "",
                              )}
                            >
                              {b.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-medium">Notes</h2>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <textarea
                  rows={2}
                  placeholder="Add a note…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  className={cn(dashboardInputClass, "min-h-11 flex-1 resize-none")}
                />
                <button
                  type="button"
                  onClick={addNote}
                  disabled={addingNote || !noteBody.trim()}
                  className={cn(
                    dashboardPrimaryActionClass,
                    "shrink-0 justify-center self-stretch sm:self-end",
                  )}
                >
                  {addingNote ? "…" : "Add"}
                </button>
              </div>

              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="rounded-lg border px-4 py-3 text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {format(new Date(n.createdAt), "d MMM yyyy, h:mm a")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
