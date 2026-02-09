"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { claimSchema } from "@/lib/validators/claim";

export async function submitClaimAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in to submit a claim.");
  }

  const parsed = claimSchema.safeParse({
    schoolId: formData.get("schoolId"),
    fullName: formData.get("fullName"),
    workEmail: formData.get("workEmail"),
    phone: formData.get("phone"),
    roleTitle: formData.get("roleTitle"),
    relationship: formData.get("relationship"),
    schoolDomain: formData.get("schoolDomain"),
    proof: formData.get("proof"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid claim form.");
  }

  const existingOpenClaim = await db.claimRequest.findFirst({
    where: {
      schoolId: parsed.data.schoolId,
      userId: session.user.id,
      status: "PENDING",
    },
  });

  if (existingOpenClaim) {
    throw new Error("You already have a pending claim for this school.");
  }

  await db.claimRequest.create({
    data: {
      schoolId: parsed.data.schoolId,
      userId: session.user.id,
      fullName: parsed.data.fullName,
      workEmail: parsed.data.workEmail,
      phone: parsed.data.phone,
      roleTitle: parsed.data.roleTitle,
      relationship: parsed.data.relationship,
      schoolDomain: parsed.data.schoolDomain,
      proof: parsed.data.proof,
    },
  });

  revalidatePath("/admin");

}

export async function adminResolveClaimAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized.");
  }

  const claimId = String(formData.get("claimId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const adminNotes = String(formData.get("adminNotes") ?? "").trim();

  if (!claimId || !["APPROVED", "REJECTED"].includes(decision)) {
    throw new Error("Invalid claim decision.");
  }

  const claim = await db.claimRequest.update({
    where: { id: claimId },
    data: {
      status: decision === "APPROVED" ? "APPROVED" : "REJECTED",
      adminNotes,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  if (decision === "APPROVED") {
    await db.school.update({
      where: { id: claim.schoolId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedByUserId: session.user.id,
        claimedByUserId: claim.userId,
      },
    });

    await db.schoolMembership.upsert({
      where: {
        userId_schoolId: {
          userId: claim.userId,
          schoolId: claim.schoolId,
        },
      },
      update: {
        role: "SCHOOL_ADMIN",
        status: "ACTIVE",
      },
      create: {
        userId: claim.userId,
        schoolId: claim.schoolId,
        role: "SCHOOL_ADMIN",
        status: "ACTIVE",
      },
    });
  }

  await logAudit({
    actorId: session.user.id,
    action: decision === "APPROVED" ? "claim_approved" : "claim_rejected",
    entityType: "ClaimRequest",
    entityId: claimId,
    metadata: { decision },
  });

  revalidatePath("/admin");
  revalidatePath("/schools/[slug]", "page");

}
