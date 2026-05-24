import { format } from "date-fns";
import { Activity, KeyRound, Megaphone, ShieldCheck } from "lucide-react";
import { readAdminEvents } from "@/lib/admin-audit";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

const ACTION_META: Record<
  string,
  { label: string; icon: typeof ShieldCheck; tone: string }
> = {
  "admin.view": {
    label: "Admin page view",
    icon: ShieldCheck,
    tone: "bg-muted text-muted-foreground",
  },
  "support.reset_password": {
    label: "Password reset",
    icon: KeyRound,
    tone: "bg-amber-500/15 text-amber-700",
  },
  "settings.announcement_updated": {
    label: "Announcement updated",
    icon: Megaphone,
    tone: "bg-primary/10 text-primary",
  },
  "settings.announcement_cleared": {
    label: "Announcement cleared",
    icon: Megaphone,
    tone: "bg-muted text-muted-foreground",
  },
  "support.impersonate": {
    label: "User impersonation",
    icon: ShieldCheck,
    tone: "bg-violet-500/15 text-violet-700",
  },
  "support.refund_payment": {
    label: "Payment refund",
    icon: KeyRound,
    tone: "bg-amber-500/15 text-amber-700",
  },
  "support.replay_webhook": {
    label: "Webhook replay",
    icon: Activity,
    tone: "bg-primary/10 text-primary",
  },
  "plans.updated": {
    label: "Plans updated",
    icon: ShieldCheck,
    tone: "bg-primary/10 text-primary",
  },
  "plans.reset_to_defaults": {
    label: "Plans reset",
    icon: ShieldCheck,
    tone: "bg-muted text-muted-foreground",
  },
};

export default async function AdminSecurityPage() {
  await requirePlatformAdmin();
  const events = await readAdminEvents(300);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventsToday = events.filter((e) => new Date(e.at) >= today).length;

  const actorCounts = new Map<string, number>();
  for (const e of events) {
    actorCounts.set(e.actorEmail, (actorCounts.get(e.actorEmail) ?? 0) + 1);
  }
  const topActors = [...actorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sensitive = events.filter(
    (e) => e.action !== "admin.view"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-3xl tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every action a platform admin takes is recorded here. Events are stored in Postgres with a
          local JSONL fallback for development.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="h-[3px] bg-primary" />
          <div className="p-5">
            <p className="text-xs text-muted-foreground">Events recorded</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{events.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">most recent 300</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="h-[3px] bg-violet-600" />
          <div className="p-5">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{eventsToday}</p>
            <p className="mt-1 text-xs text-muted-foreground">events since midnight</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="h-[3px] bg-rose-500" />
          <div className="p-5">
            <p className="text-xs text-muted-foreground">Sensitive actions</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{sensitive.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">resets, settings changes</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-xl border bg-white">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
              Recent events
            </h2>
          </div>
          {events.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No events recorded yet. Browse the admin area to populate the log.
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto divide-y">
              {events.map((e, idx) => {
                const meta = ACTION_META[e.action] ?? {
                  label: e.action,
                  icon: ShieldCheck,
                  tone: "bg-muted text-muted-foreground",
                };
                const Icon = meta.icon;
                return (
                  <div
                    key={`${e.at}-${idx}`}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.actorEmail}
                        {e.target ? ` · ${e.target}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(e.at), "d MMM, h:mm:ss a")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Most active admins</h2>
            {topActors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {topActors.map(([email, n]) => {
                  const max = Math.max(...topActors.map(([, c]) => c), 1);
                  const pct = Math.round((n / max) * 100);
                  return (
                    <div key={email}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{email}</span>
                        <span className="ml-2 tabular-nums text-muted-foreground">{n}</span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-50/40 p-5">
            <h2 className="mb-2 text-sm font-semibold text-rose-900">
              Roadmap
            </h2>
            <ul className="list-disc pl-5 text-xs text-rose-900/80 space-y-1">
              <li>Suspicious sign-in alerts (impossible travel, brute force)</li>
              <li>Per-event IP and user-agent capture</li>
              <li>Tamper-evident hash chain (each event references previous hash)</li>
              <li>Export to SIEM / S3 archival</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
