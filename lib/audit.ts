import { db } from "@/lib/db";

export async function logAudit(params: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
}) {
  await db.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as object | undefined,
    },
  });
}
