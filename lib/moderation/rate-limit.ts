import { db } from "@/lib/db";

const WINDOW_MS = 10 * 60 * 1000;

export async function checkReviewRateLimit(userId: string): Promise<boolean> {
  const threshold = new Date(Date.now() - WINDOW_MS);

  const existing = await db.review.findFirst({
    where: {
      userId,
      createdAt: {
        gte: threshold,
      },
    },
    select: { id: true },
  });

  return !existing;
}
