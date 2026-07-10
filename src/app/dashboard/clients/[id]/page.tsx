"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  dashboardInputClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

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
  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editStage, setEditStage] = useState<(typeof STAGES)[number]>("lead");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // New note state
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
      });
  }, [id]);

  async function saveProfile() {
    setSaving(true);
    const res = await fetch(`/api/dashboard/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: editStage, internalNotes: editInternalNotes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setClient(updated);
    }
    setSaving(false);
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/dashboard/clients/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNoteBody("");
    }
    setAddingNote(false);
  }

  if (loading) {
    return (
      <div className="text-muted-foreground text-sm p-8">Loading…</div>
    );
  }

  if (!client) {
    return (
      <div className="text-muted-foreground text-sm p-8">Client not found.</div>
    );
  }

  return (
    <div>
      {/* Header */}
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
        {/* Left col: profile + stage editor */}
        <div className="space-y-4 lg:col-span-1">
          {/* Contact info */}
          <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-5 space-y-3">
            <h2 className="font-medium text-sm">Contact</h2>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{client.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{client.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="text-sm font-medium capitalize">{client.source?.replace("_", " ") ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client since</p>
              <p className="text-sm font-medium">{format(new Date(client.createdAt), "d MMM yyyy")}</p>
            </div>
          </div>

          {/* Stage & internal notes editor */}
          <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-5 space-y-3">
            <h2 className="font-medium text-sm">CRM</h2>
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

        {/* Right col: booking history + notes feed */}
        <div className="space-y-5 lg:col-span-2">
          {/* Booking history */}
          <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-medium text-sm">Booking history ({bookings.length})</h2>
            </div>
            {bookings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No bookings yet.</p>
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

          {/* Notes feed */}
          <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-medium text-sm">Notes</h2>
            </div>
            <div className="p-5 space-y-3">
              {/* Add note */}
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

              {/* Notes list */}
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="border rounded-lg px-4 py-3 text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
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
