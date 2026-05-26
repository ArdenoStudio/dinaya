import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./styles.css";

type Business = {
  customDomain: string | null;
  id: string;
  name: string;
  plan: string;
  slug: string;
  timezone: string;
};

type StaffMember = {
  id: string;
  isActive: boolean;
  name: string;
};

type BookingRow = {
  clientEmail: string | null;
  clientName: string;
  clientPhone: string;
  endsAt: string;
  id: string;
  revisionTs: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  status: BookingStatus;
};

type BookingDetail = BookingRow & {
  clientId: string | null;
  clientStage: string | null;
  createdAt: string;
  notes: string | null;
  staffNotes: string | null;
};

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
type Tab = "today" | "upcoming" | "past";
type View = "today" | "bookings" | "settings";

type BootstrapPayload = {
  business: Business;
  staff: StaffMember[];
  serverTime: string;
};

type SyncPayload = {
  bootstrap: BootstrapPayload;
  bookings: {
    rows: BookingRow[];
    serverTime: string;
    tab: Tab;
  };
};

type LoginPayload = {
  business: Business;
  user: {
    email: string;
    id: string;
    name: string;
    role: "owner" | "staff";
  };
};

const statusLabels: Record<BookingStatus, string> = {
  cancelled: "Cancelled",
  completed: "Completed",
  confirmed: "Confirmed",
  no_show: "No-show",
  pending: "Pending",
};

const knownBookingStorageKey = "dinaya.desktop.knownBookings";
const reminderStorageKey = "dinaya.desktop.remindedBookings";

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

function transitionsFor(status: BookingStatus): BookingStatus[] {
  if (status === "pending") return ["confirmed", "cancelled"];
  if (status === "confirmed") return ["completed", "no_show", "cancelled"];
  return [];
}

function readStoredSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(window.sessionStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}

function writeStoredSet(key: string, values: Set<string>) {
  const trimmed = Array.from(values).slice(-250);
  window.sessionStorage.setItem(key, JSON.stringify(trimmed));
}

function App() {
  const [booting, setBooting] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [view, setView] = useState<View>("today");
  const [tab, setTab] = useState<Tab>("today");
  const [query, setQuery] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState("");
  const initialNotificationSync = useRef(true);

  const activeRows = useMemo(() => {
    if (view !== "today") return rows;
    return rows.filter((row) => row.status === "pending" || row.status === "confirmed");
  }, [rows, view]);

  async function runSync(nextTab = tab) {
    setSyncing(true);
    setError("");
    try {
      const payload = await invoke<SyncPayload>("desktop_sync_run", {
        request: {
          limit: 80,
          q: query || undefined,
          staffId: staffFilter || undefined,
          status: statusFilter || undefined,
          tab: nextTab,
        },
      });
      setAuthReady(true);
      setBusiness(payload.bootstrap.business);
      setStaff(payload.bootstrap.staff);
      setRows(payload.bookings.rows);
      setLastSync(payload.bookings.serverTime);
      if (payload.bookings.tab === "today") {
        void invoke("updateTrayCount", { count: payload.bookings.rows.length, offline: false });
      }
      notifyFromRows(payload.bookings.rows);
      if (selectedId) {
        await openDetail(selectedId, false);
      }
    } catch (syncError) {
      const message = String(syncError);
      setError(message);
      void invoke("updateTrayCount", { count: rows.length, offline: true });
      if (
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("desktop key not configured")
      ) {
        setAuthReady(false);
        setBusiness(null);
      }
    } finally {
      setBooting(false);
      setSyncing(false);
    }
  }

  function notifyFromRows(nextRows: BookingRow[]) {
    const knownBookings = readStoredSet(knownBookingStorageKey);
    const remindedBookings = readStoredSet(reminderStorageKey);
    const now = Date.now();

    for (const row of nextRows) {
      if (!initialNotificationSync.current && !knownBookings.has(row.id)) {
        void invoke("notifyNewBooking", {
          payload: {
            bookingId: row.id,
            clientName: row.clientName,
            serviceName: row.serviceName,
            startsAt: formatDateTime(row.startsAt),
          },
        });
      }

      knownBookings.add(row.id);

      const startsAt = new Date(row.startsAt).getTime();
      const minutesUntilStart = (startsAt - now) / 60_000;
      if (
        row.status === "confirmed" &&
        minutesUntilStart >= 0 &&
        minutesUntilStart <= 15 &&
        !remindedBookings.has(row.id)
      ) {
        remindedBookings.add(row.id);
        void invoke("notifyUpcoming", {
          payload: {
            bookingId: row.id,
            clientName: row.clientName,
            serviceName: row.serviceName,
            startsAt: formatDateTime(row.startsAt),
          },
        });
      }
    }

    initialNotificationSync.current = false;
    writeStoredSet(knownBookingStorageKey, knownBookings);
    writeStoredSet(reminderStorageKey, remindedBookings);
  }

  async function openDetail(id: string, showLoading = true) {
    setSelectedId(id);
    if (showLoading) setDetail(null);
    try {
      const next = await invoke<BookingDetail>("desktop_fetch_booking_detail", { id });
      setDetail(next);
    } catch (detailError) {
      setError(String(detailError));
    }
  }

  async function updateStatus(id: string, status: BookingStatus) {
    const previousRows = rows;
    const previousDetail = detail;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    if (detail?.id === id) setDetail({ ...detail, status });
    try {
      await invoke("desktop_set_booking_status", { payload: { id, status } });
      await runSync(tab);
      await openDetail(id, false);
    } catch (mutationError) {
      setRows(previousRows);
      setDetail(previousDetail);
      setError(String(mutationError));
    }
  }

  async function login(email: string, password: string) {
    setError("");
    const payload = await invoke<LoginPayload>("desktop_auth_login", {
      payload: {
        deviceName: navigator.userAgent.includes("Windows") ? "Windows PC" : "Desktop",
        email,
        password,
      },
    });
    setBusiness(payload.business);
    setAuthReady(true);
    setView("today");
    setTab("today");
    await runSync("today");
  }

  async function logout() {
    await invoke("desktop_logout").catch(() => undefined);
    setAuthReady(false);
    setBusiness(null);
    setRows([]);
    setDetail(null);
    setSelectedId(null);
  }

  useEffect(() => {
    async function boot() {
      const hasKey = await invoke<boolean>("desktop_auth_has_key").catch(() => false);
      if (!hasKey) {
        setBooting(false);
        setAuthReady(false);
        return;
      }
      await runSync("today");
      const pending = await invoke<string | null>("desktop_take_pending_booking").catch(() => null);
      if (pending) await openDetail(pending);
    }
    void boot();
    // Boot must run once; subsequent syncs are handled by the interval below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (authReady && !syncing) void runSync(tab);
    }, 45_000);
    return () => window.clearInterval(timer);
    // Recreate the polling timer only when user-controlled sync inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, syncing, tab, query, staffFilter, statusFilter]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<{ id?: string }>("desktop-open-booking", (event) => {
      const id = event.payload?.id;
      if (id) {
        setView("bookings");
        void openDetail(id);
      }
    }).then((handler) => {
      unlisten = handler;
    });
    return () => unlisten?.();
  }, []);

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="app-mark">D</div>
        <p>Starting Dinaya Desktop...</p>
      </div>
    );
  }

  if (!authReady) {
    return <LoginScreen error={error} onLogin={login} />;
  }

  return (
    <div className="desktop-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="app-mark">D</div>
          <div>
            <strong>Dinaya</strong>
            <span>Desktop</span>
          </div>
        </div>
        <nav>
          <button className={view === "today" ? "active" : ""} onClick={() => { setView("today"); setTab("today"); void runSync("today"); }}>
            Today
          </button>
          <button className={view === "bookings" ? "active" : ""} onClick={() => setView("bookings")}>
            Bookings
          </button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>
            Settings
          </button>
        </nav>
      </aside>

      <main className="main-pane">
        <header className="topbar">
          <div>
            <h1>{view === "settings" ? "Settings" : view === "today" ? "Today" : "Bookings"}</h1>
            <p>{business?.name} {lastSync ? `- Synced ${formatTime(lastSync)}` : ""}</p>
          </div>
          <button className="primary small" disabled={syncing} onClick={() => void runSync(tab)}>
            {syncing ? "Syncing..." : "Refresh"}
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {view === "settings" ? (
          <SettingsView business={business} onLogout={logout} />
        ) : (
          <section className="workspace">
            <div className="list-pane">
              <Filters
                query={query}
                staff={staff}
                staffFilter={staffFilter}
                statusFilter={statusFilter}
                tab={tab}
                view={view}
                onApply={() => void runSync(tab)}
                onQuery={setQuery}
                onStaffFilter={setStaffFilter}
                onStatusFilter={setStatusFilter}
                onTab={(next) => {
                  setTab(next);
                  setView(next === "today" ? "today" : "bookings");
                  void runSync(next);
                }}
              />
              <BookingList
                rows={activeRows}
                selectedId={selectedId}
                onOpen={(id) => void openDetail(id)}
              />
            </div>
            <BookingDetailPanel
              detail={detail}
              selectedId={selectedId}
              onOpenWeb={(id) => void invoke("desktop_open_booking_web", { id })}
              onStatus={(id, status) => void updateStatus(id, status)}
            />
          </section>
        )}
      </main>
    </div>
  );
}

function LoginScreen({ error, onLogin }: { error: string; onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setLocalError("");
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setLocalError(String(loginError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand compact">
          <div className="app-mark">D</div>
          <div>
            <strong>Dinaya Desktop</strong>
            <span>Business sign in</span>
          </div>
        </div>
        <label>
          Email
          <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {(localError || error) && <div className="error-banner">{localError || error}</div>}
        <button className="primary" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Filters(props: {
  query: string;
  staff: StaffMember[];
  staffFilter: string;
  statusFilter: string;
  tab: Tab;
  view: View;
  onApply: () => void;
  onQuery: (value: string) => void;
  onStaffFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onTab: (tab: Tab) => void;
}) {
  return (
    <div className="filters">
      <div className="tabs">
        {(["today", "upcoming", "past"] as Tab[]).map((item) => (
          <button key={item} className={props.tab === item ? "active" : ""} onClick={() => props.onTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <input
        placeholder="Search client, phone, email"
        value={props.query}
        onChange={(event) => props.onQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") props.onApply();
        }}
      />
      <div className="filter-row">
        <select value={props.staffFilter} onChange={(event) => props.onStaffFilter(event.target.value)}>
          <option value="">All staff</option>
          {props.staff.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <select value={props.statusFilter} onChange={(event) => props.onStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button onClick={props.onApply}>Apply</button>
      </div>
    </div>
  );
}

function BookingList({ rows, selectedId, onOpen }: { rows: BookingRow[]; selectedId: string | null; onOpen: (id: string) => void }) {
  if (rows.length === 0) {
    return <div className="empty-state">No bookings in this view.</div>;
  }

  return (
    <ul className="booking-list">
      {rows.map((row) => (
        <li key={row.id}>
          <button className={selectedId === row.id ? "booking-row selected" : "booking-row"} onClick={() => onOpen(row.id)}>
            <span className="time">{formatTime(row.startsAt)}</span>
            <span className="booking-copy">
              <strong>{row.clientName}</strong>
              <span>{row.serviceName} with {row.staffName}</span>
            </span>
            <span className={`badge ${row.status}`}>{statusLabels[row.status]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function BookingDetailPanel(props: {
  detail: BookingDetail | null;
  selectedId: string | null;
  onOpenWeb: (id: string) => void;
  onStatus: (id: string, status: BookingStatus) => void;
}) {
  if (!props.selectedId) {
    return <aside className="detail-pane empty">Select a booking to see details.</aside>;
  }

  if (!props.detail) {
    return <aside className="detail-pane empty">Loading booking...</aside>;
  }

  const actions = transitionsFor(props.detail.status);

  return (
    <aside className="detail-pane">
      <div className="detail-head">
        <div>
          <h2>{props.detail.clientName}</h2>
          <p>{props.detail.serviceName}</p>
        </div>
        <span className={`badge ${props.detail.status}`}>{statusLabels[props.detail.status]}</span>
      </div>
      <dl>
        <dt>When</dt>
        <dd>{formatDateTime(props.detail.startsAt)} - {formatTime(props.detail.endsAt)}</dd>
        <dt>Staff</dt>
        <dd>{props.detail.staffName}</dd>
        <dt>Phone</dt>
        <dd>{props.detail.clientPhone || "Not provided"}</dd>
        <dt>Email</dt>
        <dd>{props.detail.clientEmail || "Not provided"}</dd>
        <dt>Notes</dt>
        <dd>{props.detail.notes || "No notes"}</dd>
      </dl>
      <div className="actions">
        {actions.map((status) => (
          <button key={status} className="primary subtle" onClick={() => props.onStatus(props.detail!.id, status)}>
            {statusLabels[status]}
          </button>
        ))}
        <button onClick={() => props.onOpenWeb(props.detail!.id)}>Open Web</button>
      </div>
    </aside>
  );
}

function SettingsView({ business, onLogout }: { business: Business | null; onLogout: () => Promise<void> }) {
  return (
    <section className="settings-view">
      <div className="settings-card">
        <h2>{business?.name ?? "Dinaya"}</h2>
        <p>Native bookings are enabled on this desktop.</p>
        <button onClick={() => void invoke("desktop_open_dashboard")}>Open Web Dashboard</button>
        <button className="danger" onClick={() => void onLogout()}>Log out</button>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
