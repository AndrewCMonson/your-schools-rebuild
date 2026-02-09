"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { canManageSchool } from "@/lib/auth/permissions";

function getStorageClient() {
  if (!process.env.S3_REGION || !process.env.S3_BUCKET_NAME || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    throw new Error("Storage credentials are not configured.");
  }

  return new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
}

export async function createSchoolImageUploadUrlAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; signedUrl?: string; publicUrl?: string; key?: string }> {
  const session = await getServerSession(authOptions);
  const schoolId = String(formData.get("schoolId") ?? "").trim();
  if (!session?.user?.id || !schoolId) {
    return { ok: false, error: "Unauthorized." };
  }
  const allowed = await canManageSchool(session.user.id, schoolId);
  if (!allowed) return { ok: false, error: "Unauthorized." };

  const filename = String(formData.get("filename") ?? "").trim();
  const mimeType = String(formData.get("mimeType") ?? "image/jpeg").trim();

  if (!filename) {
    return { ok: false, error: "Filename is required." };
  }

  try {
    const bucket = process.env.S3_BUCKET_NAME as string;
    const region = process.env.S3_REGION as string;
    const client = getStorageClient();

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const key = `schools/${randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return { ok: true, signedUrl, publicUrl, key };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Unable to generate upload URL." };
  }
}

export async function attachSchoolImageAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const schoolId = String(formData.get("schoolId") ?? "");
  const url = String(formData.get("url") ?? "");
  const alt = String(formData.get("alt") ?? "").trim();

  if (!session?.user?.id || !schoolId || !url) {
    throw new Error("School and image URL are required.");
  }
  const allowed = await canManageSchool(session.user.id, schoolId);
  if (!allowed) throw new Error("Unauthorized.");

  const lastImage = await db.schoolImage.findFirst({
    where: { schoolId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.schoolImage.create({
    data: {
      schoolId,
      url,
      alt,
      sortOrder: (lastImage?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/portal");
  revalidatePath(`/portal/schools/${schoolId}`);
  revalidatePath("/schools/[slug]", "page");
}
