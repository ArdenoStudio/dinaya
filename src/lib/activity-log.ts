import { db } from "@/db";
import { activityLog } from "@/db/schema";

export type LogActivityInput = {
  action: string;
  actorUserId?: string | null;
  businessId: string;
  entity: string;
  entityId?: string | null;
  meta?: unknown;
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  await db.insert(activityLog).values({
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    businessId: input.businessId,
    entity: input.entity,
    entityId: input.entityId ?? null,
    meta: input.meta ?? null,
  });
}
