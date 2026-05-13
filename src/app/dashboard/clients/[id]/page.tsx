"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";

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
  churned: "bg-gray-100 text-gray-500",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 text-gray-800",
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
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/clients" className="text-muted-foreground hover:text-foreground text-sm">
          ← Clients
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-cal text-2xl">{client.name}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STAGE_STYLES[client.stage]}`}>
          {client.stage}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left col: profile + stage editor */}
        <div className="col-span-1 space-y-4">
          {/* Contact info */}
          <div className="bg-white border rounded-xl p-5 space-y-3">
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
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-medium text-sm">CRM</h2>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Stage</label>
              <select
                value={editStage}
                onChange={(e) => setEditStage(e.target.value as typeof editStage)}
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Internal notes</label>
              <textarea
                rows={4}
                value={editInternalNotes}
                onChange={(e) => setEditInternalNotes(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Right col: booking history + notes feed */}
        <div className="col-span-2 space-y-5">
          {/* Booking history */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-medium text-sm">Booking history ({bookings.length})</h2>
            </div>
            {bookings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Date</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Service</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Staff</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={b.id} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-4 py-2.5 text-xs">{format(new Date(b.startsAt), "d MMM yyyy, h:mm a")}</td>
                      <td className="px-4 py-2.5 text-xs">{b.serviceName}</td>
                      <td className="px-4 py-2.5 text-xs">{b.staffName}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BOOKING_STATUS_STYLES[b.status] ?? ""}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Notes feed */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-medium text-sm">Notes</h2>
            </div>
            <div className="p-5 space-y-3">
              {/* Add note */}
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="Add a note…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <button
                  onClick={addNote}
                  disabled={addingNote || !noteBody.trim()}
                  className="bg-primary text-primary-foreground px-4 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60 self-start mt-0.5 py-2"
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
