"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { hasProfanity } from "@/lib/moderation/profanity";
import { checkReviewRateLimit } from "@/lib/moderation/rate-limit";
import { createReviewSchema, flagReviewSchema } from "@/lib/validators/review";

async function recalcSchoolRating(schoolId: string) {
  const agg = await db.review.aggregate({
    where: {
      schoolId,
      status: "PUBLISHED",
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  await db.school.update({
    where: { id: schoolId },
    data: {
      averageRating: agg._avg.rating ?? 0,
      reviewCount: agg._count._all,
    },
  });
}

export async function createReviewAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in to post a review.");
  }

  const parsed = createReviewSchema.safeParse({
    schoolId: formData.get("schoolId"),
    rating: formData.get("rating"),
    childAgeYears: formData.get("childAgeYears") || undefined,
    attendanceMonths: formData.get("attendanceMonths") || undefined,
    pros: formData.get("pros") || undefined,
    cons: formData.get("cons") || undefined,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid review.");
  }

  if (hasProfanity(parsed.data.body)) {
    throw new Error("Review blocked due to profanity policy. Please revise your text.");
  }

  const underLimit = await checkReviewRateLimit(session.user.id);
  if (!underLimit) {
    throw new Error("You can submit one review every 10 minutes.");
  }

  try {
    await db.review.create({
      data: {
        schoolId: parsed.data.schoolId,
        userId: session.user.id,
        rating: parsed.data.rating,
        body: parsed.data.body,
        childAgeYears: parsed.data.childAgeYears ?? null,
        attendanceMonths: parsed.data.attendanceMonths ?? null,
        pros: parsed.data.pros ?? null,
        cons: parsed.data.cons ?? null,
      },
    });

    await recalcSchoolRating(parsed.data.schoolId);

    revalidatePath(`/schools`);
    revalidatePath(`/schools/[slug]`, "page");

    return;
  } catch {
    throw new Error("You can only submit one review per school.");
  }
}

export async function flagReviewAction(formData: FormData) {
  const session = await getServerSession(authOptions);

  const parsed = flagReviewSchema.safeParse({
    reviewId: formData.get("reviewId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid flag payload.");
  }

  await db.reviewFlag.create({
    data: {
      reviewId: parsed.data.reviewId,
      reason: parsed.data.reason,
      userId: session?.user?.id ?? null,
    },
  });

  await db.review.update({
    where: { id: parsed.data.reviewId },
    data: { status: "FLAGGED" },
  });

  revalidatePath(`/admin`);

}
