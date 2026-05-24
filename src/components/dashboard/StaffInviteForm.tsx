"use client";

import { useState } from "react";

export function StaffInviteForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/dashboard/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send invite.");
      return;
    }
    setMessage(`Invite sent to ${email}.`);
    setName("");
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="font-semibold">Invite a team member</h2>
      <p className="text-sm text-muted-foreground">
        They&apos;ll get dashboard access as staff — not an owner account.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-lg border px-3 py-2 text-sm"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-lg border px-3 py-2 text-sm"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}
