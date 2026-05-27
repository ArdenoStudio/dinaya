import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  dashboardRouteGroups,
  findDashboardRoute,
  type DashboardNavLabelKey,
  type DashboardRoute,
} from "../../../src/lib/dashboard-route-map";
import { buildDesktopApiPath, desktopApiRequest } from "./desktop-api";
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

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
type Tab = "today" | "upcoming" | "past";
type View = DashboardNavLabelKey;

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

type BootstrapPayload = {
  business: Business;
  staff: StaffMember[];
  serverTime: string;
};

type BookingsPayload = {
  limit: number;
  nextCursor: string | null;
  rows: BookingRow[];
  serverTime: string;
  tab: Tab;
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

type DashboardMetrics = {
  activeToday: number;
  confirmedToday: number;
  pendingToday: number;
  staffOnDeck: number;
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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { day: "numeric", month: "short", weekday: "short" });
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

function isActiveDailyStatus(status: BookingStatus): boolean {
  return status === "pending" || status === "confirmed";
}

function publicBookingUrl(business: Business | null): string {
  if (!business) return "https://dinaya.lk";
  if (business.customDomain) return `https://${business.customDomain}`;
  return `https://${business.slug}.dinaya.lk`;
}

function webPathForRoute(route: DashboardRoute): string {
  return route.href;
}

function App() {
  const [booting, setBooting] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [view, setView] = useState<View>("overview");
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

  const route = findDashboardRoute(view) ?? findDashboardRoute("overview")!;

  const visibleRows = useMemo(() => {
    if (view === "overview") return rows.filter((row) => isActiveDailyStatus(row.status));
    return rows;
  }, [rows, view]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const activeToday = rows.filter((row) => isActiveDailyStatus(row.status)).length;
    return {
      activeToday,
      confirmedToday: rows.filter((row) => row.status === "confirmed").length,
      pendingToday: rows.filter((row) => row.status === "pending").length,
      staffOnDeck: new Set(rows.map((row) => row.staffId)).size,
    };
  }, [rows]);

  async function fetchBootstrap(): Promise<BootstrapPayload> {
    return desktopApiRequest<BootstrapPayload>({
      method: "GET",
      path: "/api/v1/desktop/bootstrap",
    });
  }

  async function fetchBookings(nextTab = tab): Promise<BookingsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/bookings", {
      limit: 80,
      q: query || undefined,
      staffId: staffFilter || undefined,
      status: statusFilter || undefined,
      tab: nextTab,
    });
    return desktopApiRequest<BookingsPayload>({ method: "GET", path });
  }

  async function runSync(nextTab = tab) {
    setSyncing(true);
    setError("");
    try {
      const [bootstrap, bookings] = await Promise.all([
        fetchBootstrap(),
        fetchBookings(nextTab),
      ]);
      setAuthReady(true);
      setBusiness(bootstrap.business);
      setStaff(bootstrap.staff);
      setRows(bookings.rows);
      setLastSync(bookings.serverTime);
      if (bookings.tab === "today") {
        void invoke("updateTrayCount", { count: bookings.rows.length, offline: false });
      }
      notifyFromRows(bookings.rows);
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
      const next = await desktopApiRequest<BookingDetail>({
        method: "GET",
        path: `/api/v1/desktop/bookings/${id}`,
      });
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
      await desktopApiRequest({
        body: { status },
        method: "PATCH",
        path: `/api/v1/desktop/bookings/${id}/status`,
      });
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
    setView("overview");
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

  function openRoute(nextRoute: DashboardRoute) {
    setView(nextRoute.id);
    if (nextRoute.id === "overview") {
      setTab("today");
      void runSync("today");
    } else if (nextRoute.id === "bookings") {
      void runSync(tab);
    }
  }

  async function copyBookingLink() {
    const url = publicBookingUrl(business);
    await navigator.clipboard?.writeText(url);
  }

  function applyGlobalSearch() {
    if (view !== "overview" && view !== "bookings") {
      setView("bookings");
    }
    void runSync(tab);
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
      if (authReady && !syncing && (view === "overview" || view === "bookings")) {
        void runSync(tab);
      }
    }, 45_000);
    return () => window.clearInterval(timer);
    // Recreate the polling timer only when user-controlled sync inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, syncing, tab, query, staffFilter, statusFilter, view]);

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
      <DashboardSidebar
        business={business}
        currentView={view}
        onRoute={openRoute}
      />

      <main className="main-pane">
        <header className="topbar glass-surface">
          <div className="topbar-title">
            <p className="eyebrow">{business?.name ?? "Dinaya"}</p>
            <h1>{route.label}</h1>
          </div>
          <div className="command-bar">
            <input
              aria-label="Search dashboard"
              placeholder="Search bookings, clients, services"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyGlobalSearch();
              }}
            />
            <button className="primary small" disabled={syncing} onClick={() => void runSync(tab)}>
              {syncing ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {view === "overview" ? (
          <OverviewView
            business={business}
            lastSync={lastSync}
            metrics={metrics}
            rows={visibleRows}
            staff={staff}
            onCopyBookingLink={() => void copyBookingLink()}
            onOpenBooking={(id) => void openDetail(id)}
            onOpenBookings={() => setView("bookings")}
          />
        ) : view === "bookings" ? (
          <BookingsWorkspace
            detail={detail}
            rows={visibleRows}
            selectedId={selectedId}
            staff={staff}
            staffFilter={staffFilter}
            statusFilter={statusFilter}
            tab={tab}
            onApply={() => void runSync(tab)}
            onOpenBooking={(id) => void openDetail(id)}
            onOpenWeb={(id) => void invoke("desktop_open_booking_web", { id })}
            onStaffFilter={setStaffFilter}
            onStatus={(id, status) => void updateStatus(id, status)}
            onStatusFilter={setStatusFilter}
            onTab={(next) => {
              setTab(next);
              void runSync(next);
            }}
          />
        ) : view === "settings" ? (
          <SettingsView
            business={business}
            lastSync={lastSync}
            publicUrl={publicBookingUrl(business)}
            onLogout={logout}
          />
        ) : (
          <NativeModulePlaceholder route={route} />
        )}
      </main>
    </div>
  );
}

function DashboardSidebar({
  business,
  currentView,
  onRoute,
}: {
  business: Business | null;
  currentView: View;
  onRoute: (route: DashboardRoute) => void;
}) {
  return (
    <aside className="sidebar glass-surface">
      <div className="brand">
        <div className="app-mark">D</div>
        <div>
          <strong>Dinaya</strong>
          <span>{business?.plan ?? "Desktop"} dashboard</span>
        </div>
      </div>

      <nav className="nav-groups" aria-label="Desktop dashboard">
        {dashboardRouteGroups.map((group) => (
          <section key={group.id} className="nav-group">
            <p>{group.label}</p>
            {group.routes.map((routeItem) => (
              <button
                key={routeItem.id}
                className={currentView === routeItem.id ? "active" : ""}
                onClick={() => onRoute(routeItem)}
              >
                <span>{routeItem.label}</span>
                <span className={`route-state ${routeItem.nativeStatus}`}>
                  {routeItem.nativeStatus === "native"
                    ? "Native"
                    : routeItem.nativeStatus === "foundation"
                      ? "Base"
                      : `P${routeItem.desktopPhase}`}
                </span>
              </button>
            ))}
          </section>
        ))}
      </nav>
    </aside>
  );
}

function LoginScreen({
  error,
  onLogin,
}: {
  error: string;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
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
      <form className="login-card glass-surface" onSubmit={submit}>
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
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {(localError || error) && <div className="error-banner inline">{localError || error}</div>}
        <button className="primary" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function OverviewView({
  business,
  lastSync,
  metrics,
  rows,
  staff,
  onCopyBookingLink,
  onOpenBooking,
  onOpenBookings,
}: {
  business: Business | null;
  lastSync: string | null;
  metrics: DashboardMetrics;
  rows: BookingRow[];
  staff: StaffMember[];
  onCopyBookingLink: () => void;
  onOpenBooking: (id: string) => void;
  onOpenBookings: () => void;
}) {
  const [clock, setClock] = useState(() => new Date());
  const clockTime = clock.getTime();
  const nextBooking = rows.find((row) => new Date(row.startsAt).getTime() >= clockTime) ?? rows[0] ?? null;

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="overview-layout">
      <LivingDaySheet
        business={business}
        clock={clock}
        lastSync={lastSync}
        metrics={metrics}
        nextBooking={nextBooking}
        staff={staff}
        onCopyBookingLink={onCopyBookingLink}
        onOpenBookings={onOpenBookings}
      />

      <div className="overview-main">
        <div className="metric-grid">
          <MetricCard label="Active today" tone="cobalt" value={metrics.activeToday} />
          <MetricCard label="Pending" tone="amber" value={metrics.pendingToday} />
          <MetricCard label="Confirmed" tone="emerald" value={metrics.confirmedToday} />
          <MetricCard label="Staff load" tone="slate" value={`${metrics.staffOnDeck}/${staff.length || 0}`} />
        </div>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Bookings</p>
              <h2>Today queue</h2>
            </div>
            <button onClick={onOpenBookings}>Open inbox</button>
          </div>
          <BookingList rows={rows.slice(0, 8)} selectedId={null} onOpen={onOpenBooking} />
        </section>
      </div>
    </section>
  );
}

function LivingDaySheet({
  business,
  clock,
  lastSync,
  metrics,
  nextBooking,
  staff,
  onCopyBookingLink,
  onOpenBookings,
}: {
  business: Business | null;
  clock: Date;
  lastSync: string | null;
  metrics: DashboardMetrics;
  nextBooking: BookingRow | null;
  staff: StaffMember[];
  onCopyBookingLink: () => void;
  onOpenBookings: () => void;
}) {
  return (
    <aside className="living-day glass-surface">
      <div>
        <p className="eyebrow">Living Day Sheet</p>
        <h2>{formatDate(clock.toISOString())}</h2>
        <p>{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      <div className="day-focus">
        <span>Next</span>
        {nextBooking ? (
          <div>
            <strong>{nextBooking.clientName}</strong>
            <p>{formatTime(nextBooking.startsAt)} - {nextBooking.serviceName}</p>
          </div>
        ) : (
          <div>
            <strong>No active booking</strong>
            <p>{business?.name ?? "Dinaya"} is clear for now.</p>
          </div>
        )}
      </div>

      <div className="day-stack">
        <div>
          <span>Pending</span>
          <strong>{metrics.pendingToday}</strong>
        </div>
        <div>
          <span>Confirmed</span>
          <strong>{metrics.confirmedToday}</strong>
        </div>
        <div>
          <span>Staff</span>
          <strong>{metrics.staffOnDeck}/{staff.length || 0}</strong>
        </div>
      </div>

      <div className="day-actions">
        <button className="primary" onClick={onOpenBookings}>Review today</button>
        <button onClick={onCopyBookingLink}>Copy booking link</button>
      </div>

      <p className="sync-line">{lastSync ? `Synced ${formatTime(lastSync)}` : "Waiting for first sync"}</p>
    </aside>
  );
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "amber" | "cobalt" | "emerald" | "slate";
  value: React.ReactNode;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BookingsWorkspace(props: {
  detail: BookingDetail | null;
  rows: BookingRow[];
  selectedId: string | null;
  staff: StaffMember[];
  staffFilter: string;
  statusFilter: string;
  tab: Tab;
  onApply: () => void;
  onOpenBooking: (id: string) => void;
  onOpenWeb: (id: string) => void;
  onStaffFilter: (value: string) => void;
  onStatus: (id: string, status: BookingStatus) => void;
  onStatusFilter: (value: string) => void;
  onTab: (tab: Tab) => void;
}) {
  return (
    <section className="workspace">
      <div className="list-pane">
        <Filters
          staff={props.staff}
          staffFilter={props.staffFilter}
          statusFilter={props.statusFilter}
          tab={props.tab}
          onApply={props.onApply}
          onStaffFilter={props.onStaffFilter}
          onStatusFilter={props.onStatusFilter}
          onTab={props.onTab}
        />
        <BookingList
          rows={props.rows}
          selectedId={props.selectedId}
          onOpen={props.onOpenBooking}
        />
      </div>
      <BookingDetailPanel
        detail={props.detail}
        selectedId={props.selectedId}
        onOpenWeb={props.onOpenWeb}
        onStatus={props.onStatus}
      />
    </section>
  );
}

function Filters(props: {
  staff: StaffMember[];
  staffFilter: string;
  statusFilter: string;
  tab: Tab;
  onApply: () => void;
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

function BookingList({
  rows,
  selectedId,
  onOpen,
}: {
  rows: BookingRow[];
  selectedId: string | null;
  onOpen: (id: string) => void;
}) {
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
    return <aside className="detail-pane glass-surface empty">Select a booking to see details.</aside>;
  }

  if (!props.detail) {
    return <aside className="detail-pane glass-surface empty">Loading booking...</aside>;
  }

  const actions = transitionsFor(props.detail.status);

  return (
    <aside className="detail-pane glass-surface">
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

function NativeModulePlaceholder({ route }: { route: DashboardRoute }) {
  return (
    <section className="module-view">
      <div className="module-panel glass-surface">
        <p className="eyebrow">Phase {route.desktopPhase}</p>
        <h2>{route.label}</h2>
        <p>{route.summary}</p>
        <div className="module-meta">
          <span>{route.desktopApiPath ?? "Desktop API pending"}</span>
          <span>{route.nativeStatus === "fallback" ? "Web fallback available" : "Native foundation"}</span>
        </div>
        <button onClick={() => void invoke("desktop_open_dashboard_path", { path: webPathForRoute(route) }).catch(() => invoke("desktop_open_dashboard"))}>
          Open Web Dashboard
        </button>
      </div>
    </section>
  );
}

function SettingsView({
  business,
  lastSync,
  publicUrl,
  onLogout,
}: {
  business: Business | null;
  lastSync: string | null;
  publicUrl: string;
  onLogout: () => Promise<void>;
}) {
  return (
    <section className="settings-view">
      <div className="settings-card glass-surface">
        <div>
          <p className="eyebrow">Device</p>
          <h2>{business?.name ?? "Dinaya"}</h2>
          <p>{business?.plan ?? "Business"} plan - {business?.timezone ?? "Asia/Colombo"}</p>
        </div>
        <dl>
          <dt>Booking page</dt>
          <dd>{publicUrl}</dd>
          <dt>Sync</dt>
          <dd>{lastSync ? formatDateTime(lastSync) : "Not synced yet"}</dd>
          <dt>Storage</dt>
          <dd>OS secure keyring</dd>
        </dl>
        <div className="actions">
          <button onClick={() => void invoke("desktop_open_dashboard")}>Open Web Dashboard</button>
          <button className="danger" onClick={() => void onLogout()}>Log out</button>
        </div>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
