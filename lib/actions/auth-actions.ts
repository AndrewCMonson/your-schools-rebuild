"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const zipcode = String(formData.get("zipcode") ?? "").trim();

  if (!email || !name || password.length < 8) {
    throw new Error("Please provide name, email, and a stronger password.");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: {
      email,
      name,
      zipcode,
      passwordHash,
    },
  });

  redirect("/login?created=1");
}
