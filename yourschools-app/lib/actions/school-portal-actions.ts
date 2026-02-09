"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSchoolScope } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit";

export async function updateSchoolProfileAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  if (!schoolId) {
    throw new Error("Missing school id.");
  }

  const session = await requireSchoolScope(schoolId);

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    zipcode: String(formData.get("zipcode") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    minTuition: Number(formData.get("minTuition") || 0),
    maxTuition: Number(formData.get("maxTuition") || 0),
    minAge: Number(formData.get("minAge") || 0),
    maxAge: Number(formData.get("maxAge") || 0),
    offersDaycare: String(formData.get("offersDaycare") ?? "false") === "true",
  };

  const updated = await db.school.update({
    where: { id: schoolId },
    data: {
      name: payload.name,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      zipcode: payload.zipcode,
      phone: payload.phone,
      website: payload.website,
      email: payload.email,
      description: payload.description,
      minTuition: payload.minTuition || null,
      maxTuition: payload.maxTuition || null,
      minAge: payload.minAge || null,
      maxAge: payload.maxAge || null,
      offersDaycare: payload.offersDaycare,
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "school_profile_updated",
    entityType: "School",
    entityId: updated.id,
    metadata: {
      name: updated.name,
    },
  });

  revalidatePath("/portal");
  revalidatePath(`/portal/schools/${schoolId}`);
  revalidatePath("/schools/[slug]", "page");
}

export async function reorderSchoolImagesAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  if (!schoolId) throw new Error("Missing school id.");

  const session = await requireSchoolScope(schoolId);

  const orderedIds = String(formData.get("orderedImageIds") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  await Promise.all(
    orderedIds.map((imageId, index) =>
      db.schoolImage.update({
        where: { id: imageId },
        data: { sortOrder: index },
      }),
    ),
  );

  await logAudit({
    actorId: session.user.id,
    action: "school_images_reordered",
    entityType: "School",
    entityId: schoolId,
    metadata: { orderedIds },
  });

  revalidatePath(`/portal/schools/${schoolId}`);
  revalidatePath("/schools/[slug]", "page");
}

export async function respondToFlagAction(formData: FormData) {
  const flagId = String(formData.get("flagId") ?? "");
  const response = String(formData.get("response") ?? "").trim();

  if (!flagId || response.length < 10) {
    throw new Error("Response must be at least 10 characters.");
  }

  const flag = await db.reviewFlag.findUnique({
    where: { id: flagId },
    include: {
      review: true,
    },
  });

  if (!flag) {
    throw new Error("Flag not found.");
  }

  const session = await requireSchoolScope(flag.review.schoolId);

  await db.reviewFlag.update({
    where: { id: flagId },
    data: {
      schoolResponse: response,
      respondedAt: new Date(),
      responseUserId: session.user.id,
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "review_flag_responded",
    entityType: "ReviewFlag",
    entityId: flagId,
  });

  revalidatePath("/portal");
  revalidatePath(`/portal/schools/${flag.review.schoolId}`);
  revalidatePath("/admin");
}
