import { format } from "date-fns";
import { AlertTriangle, Megaphone, ShieldCheck, UsersRound } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { listPlatformAdminMembers } from "@/lib/platform-admin-members";
import { getAnnouncement } from "@/lib/platform-config";
import { updateAnnouncement } from "./actions";
import { inviteAdminMember, revokeAdminMember } from "./admin-team-actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requirePlatformAdmin();
  const members = await listPlatformAdminMembers();
  const announcement = await getAnnouncement();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-3xl tracking-tight">Admin settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage who can access the platform admin area and what tenants see across the
          product.
        </p>
      </div>

      <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UsersRound className="size-4" aria-hidden="true" />
            </span>
            <h2 className="font-semibold">Platform admin team</h2>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          Active members can sign in to{" "}
          <code className="rounded bg-muted px-1 text-xs">/admin</code>. Env allowlist entries
          remain as a bootstrap fallback.
        </p>

        <ul className="space-y-2">
          {members.map((member) => {
            const isYou = member.email.toLowerCase() === admin.email.toLowerCase();
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                  <span className="font-mono">{member.email}</span>
                  {isYou && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-primary">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Source: {member.source}
                  </span>
                  {member.source === "database" && !isYou && (
                    <form action={revokeAdminMember}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline"
                      >
                        Revoke
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <form action={inviteAdminMember} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[16rem] flex-1">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Invite admin by email
            </span>
            <input
              type="email"
              name="email"
              required
              placeholder="admin@example.com"
              className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Invite
          </button>
        </form>

        <div className="mt-4 flex gap-3 rounded-md border border-amber-500/20 bg-amber-50 dark:bg-amber-950/35 p-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <p>
            Invited admins must already have a Dinaya account with the same email.{" "}
            <code className="rounded bg-white px-1 dark:bg-neutral-800">PLATFORM_ADMIN_EMAILS</code> env entries
            still grant access for bootstrap and disaster recovery.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Megaphone className="size-4" aria-hidden="true" />
          </span>
          <h2 className="font-semibold">Platform announcement</h2>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Display a banner across all tenant dashboards. Useful for scheduled
          maintenance, outages, or product news.
        </p>

        {announcement && (
          <div
            className={
              announcement.tone === "critical"
                ? "mb-4 rounded-md border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-3 text-sm text-rose-900 dark:text-rose-200"
                : announcement.tone === "warning"
                ? "mb-4 rounded-md border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-900 dark:text-amber-200"
                : "mb-4 rounded-md border border-primary/30 bg-primary/[0.04] p-3 text-sm"
            }
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              {announcement.active ? "Currently live preview" : "Saved (inactive)"}
            </p>
            <p className="mt-1">{announcement.message}</p>
            <p className="mt-2 text-xs opacity-60">
              Updated {format(new Date(announcement.updatedAt), "d MMM, h:mm a")} by{" "}
              {announcement.updatedBy}
            </p>
          </div>
        )}

        <form action={updateAnnouncement} className="space-y-3">
          <div>
            <label htmlFor="message" className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              defaultValue={announcement?.message ?? ""}
              placeholder="e.g. Scheduled maintenance on Sunday 2:00 AM — bookings unaffected."
              className="w-full rounded-md border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank and save to clear the announcement.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="tone" className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tone
              </label>
              <select
                id="tone"
                name="tone"
                defaultValue={announcement?.tone ?? "info"}
                className="h-10 rounded-md border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="info">Info (cobalt)</option>
                <option value="warning">Warning (amber)</option>
                <option value="critical">Critical (red)</option>
              </select>
            </div>

            <label className="flex h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={announcement?.active ?? true}
                className="size-4 rounded border-muted-foreground/30 text-primary focus:ring-primary"
              />
              Show to tenants
            </label>

            <button
              type="submit"
              className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
