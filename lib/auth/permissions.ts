import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function isSiteAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export async function canManageSchool(userId: string, schoolId: string): Promise<boolean> {
  if (await isSiteAdmin(userId)) {
    return true;
  }

  const membership = await db.schoolMembership.findUnique({
    where: {
      userId_schoolId: {
        userId,
        schoolId,
      },
    },
    select: {
      status: true,
      role: true,
    },
  });

  if (!membership || membership.status !== "ACTIVE") {
    return false;
  }

  return membership.role === "SCHOOL_ADMIN" || membership.role === "SCHOOL_EDITOR";
}

export async function requireSchoolScope(schoolId: string) {
  const session = await requireSession();
  const allowed = await canManageSchool(session.user.id, schoolId);

  if (!allowed) {
    throw new Error("Unauthorized.");
  }

  return session;
}

export async function getManagedSchools(userId: string) {
  if (await isSiteAdmin(userId)) {
    return db.school.findMany({
      orderBy: { name: "asc" },
    });
  }

  const memberships = await db.schoolMembership.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      school: true,
    },
    orderBy: {
      school: {
        name: "asc",
      },
    },
  });

  return memberships.map((entry) => entry.school);
}
