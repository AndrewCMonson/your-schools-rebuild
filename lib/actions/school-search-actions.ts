"use server";

import { db } from "@/lib/db";

const MAX_VISIBLE_CARD_RESULTS = 150;

export async function getSchoolsForVisiblePinsAction(ids: string[]) {
  const normalizedIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).slice(0, MAX_VISIBLE_CARD_RESULTS);
  if (normalizedIds.length === 0) {
    return [];
  }

  const schools = await db.school.findMany({
    where: {
      id: {
        in: normalizedIds,
      },
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
    },
  });

  const byId = new Map(schools.map((school) => [school.id, school]));
  return normalizedIds
    .map((id) => byId.get(id))
    .filter((school): school is NonNullable<typeof school> => Boolean(school));
}
