"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required.");
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    redirect("/forgot-password?sent=1");
    return;
  }

  await db.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "Reset your YourSchools password",
    text: `Use this link to reset your password: ${resetLink}`,
    html: `<p>Reset your password by clicking <a href=\"${resetLink}\">this link</a>.</p>`,
  });

  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token || !password || password.length < 8) {
    throw new Error("Invalid password reset request.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const record = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new Error("Reset token is invalid or expired.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  redirect("/login?reset=1");
}
