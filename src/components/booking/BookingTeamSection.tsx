"use client";

import { useRef } from "react";
import type { Staff } from "@/db/schema";
import type { BookingCopy } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BlurFade } from "@/components/ui/blur-fade";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { AvatarCircles } from "@/components/ui/avatar-circles";

type StaffMember = Pick<Staff, "id" | "name" | "bio" | "avatarUrl">;

interface Props {
  members: StaffMember[];
  copy: BookingCopy;
  /** dialog = compact trigger + overlay (centered booker/hub). card = inline section for wide layouts. */
  variant: "dialog" | "card";
  className?: string;
}

function MemberAvatar({
  member,
  size = "md",
  stacked = false,
}: {
  member: StaffMember;
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
}) {
  const sizeClass = size === "lg" ? "size-16 text-2xl" : size === "sm" ? "size-7 text-xs" : "size-14 text-xl";
  return (
    <Avatar
      className={`${sizeClass} ${stacked ? "border-2 border-background" : ""}`}
      data-size={size === "lg" ? "lg" : undefined}
    >
      {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.name} /> : null}
      <AvatarFallback className="bg-[var(--booking-accent-muted)] font-bold text-[var(--booking-accent)]">
        {member.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function teamTooltipItems(members: StaffMember[]) {
  return members.map((member, index) => ({
    id: index,
    name: member.name,
    designation: member.bio?.slice(0, 48) ?? "Team member",
    image:
      member.avatarUrl ??
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`,
  }));
}

export function BookingTeamSection({ members, copy, variant, className }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (members.length === 0) return null;

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
  };

  const closeDialog = () => dialogRef.current?.close();

  if (variant === "dialog") {
    const preview = members.slice(0, 5);
    const overflow = members.length - preview.length;
    const avatarUrls = preview.map((member) => ({
      imageUrl:
        member.avatarUrl ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`,
      profileUrl: "#",
    }));

    return (
      <BlurFade className={className}>
        <button
          type="button"
          onClick={openDialog}
          className="group mx-auto flex min-h-11 items-center gap-3 rounded-full border border-border/60 bg-card/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
        >
          {members.length <= 5 ? (
            <span className="hidden sm:flex">
              <AnimatedTooltip items={teamTooltipItems(preview)} />
            </span>
          ) : null}
          <span className={members.length <= 5 ? "sm:hidden" : ""}>
            <AvatarCircles avatarUrls={avatarUrls} numPeople={overflow > 0 ? overflow : undefined} />
          </span>
          <span className="font-medium">
            {copy.meetTeam}
            <span className="ml-1 font-normal text-muted-foreground">({members.length})</span>
          </span>
          <Icon name="chevron-right" className="text-xs opacity-50 transition-transform group-hover:translate-x-0.5" />
        </button>

        <dialog
          ref={dialogRef}
          className="fixed top-1/2 left-1/2 z-50 m-0 flex max-h-[min(85dvh,32rem)] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40 open:flex"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
          onClose={closeDialog}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">{copy.meetTeam}</h2>
            <Button type="button" variant="ghost" size="icon-xs" onClick={closeDialog} aria-label={copy.close}>
              <Icon name="x-lg" />
            </Button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-start gap-3 rounded-xl px-3 py-3">
                <MemberAvatar member={member} size="md" />
                <div className="min-w-0 pt-0.5">
                  <p className="font-semibold text-foreground">{member.name}</p>
                  {member.bio ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </dialog>
      </BlurFade>
    );
  }

  return (
    <BlurFade className={className}>
      <section>
        <Card className="mt-0 overflow-hidden rounded-none border-x-0 py-0 shadow-none md:mt-6 md:rounded-xl md:border-x md:shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{copy.meetTeam}</CardTitle>
          </CardHeader>
          <Separator />
          {members.length === 1 ? (
            <CardContent className="flex items-center gap-4 py-4">
              <MemberAvatar member={members[0]!} size="lg" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{members[0]!.name}</p>
                {members[0]!.bio && (
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{members[0]!.bio}</p>
                )}
              </div>
            </CardContent>
          ) : (
            <CardContent className="flex justify-center py-6">
              <AnimatedTooltip items={teamTooltipItems(members.slice(0, 8))} />
            </CardContent>
          )}
        </Card>
      </section>
    </BlurFade>
  );
}
