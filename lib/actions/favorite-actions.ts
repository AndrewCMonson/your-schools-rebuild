"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";

export async function toggleFavoriteAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in to favorite schools.");
  }

  const schoolId = String(formData.get("schoolId") ?? "");
  if (!schoolId) {
    throw new Error("Missing school.");
  }

  const [userExists, schoolExists] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    }),
  ]);

  if (!userExists) {
    throw new Error("Session is stale. Please sign out and sign in again.");
  }

  if (!schoolExists) {
    throw new Error("This school no longer exists.");
  }

  const favorite = await db.favorite.findUnique({
    where: {
      userId_schoolId: {
        userId: session.user.id,
        schoolId,
      },
    },
  });

  if (favorite) {
    await db.favorite.delete({ where: { id: favorite.id } });
  } else {
    try {
      await db.favorite.create({
        data: {
          userId: session.user.id,
          schoolId,
        },
      });
    } catch {
      throw new Error("Unable to save favorite right now. Please refresh and try again.");
    }
  }

  revalidatePath("/profile");
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");

}
