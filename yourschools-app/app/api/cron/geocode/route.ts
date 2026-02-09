import { NextResponse } from "next/server";
import { updateMissingSchoolCoordinates } from "@/lib/geocoding";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await updateMissingSchoolCoordinates(100);
  return NextResponse.json({ ok: true, ...result });
}
