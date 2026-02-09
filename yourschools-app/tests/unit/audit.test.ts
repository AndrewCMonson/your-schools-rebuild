import { describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      create: createMock,
    },
  },
}));

describe("audit logging", () => {
  it("writes actor, entity and metadata", async () => {
    const { logAudit } = await import("@/lib/audit");

    await logAudit({
      actorId: "actor_1",
      action: "school_profile_updated",
      entityType: "School",
      entityId: "school_1",
      metadata: { field: "description" },
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        actorId: "actor_1",
        action: "school_profile_updated",
        entityType: "School",
        entityId: "school_1",
        metadata: { field: "description" },
      },
    });
  });
});
