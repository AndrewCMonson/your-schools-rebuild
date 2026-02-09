import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { HeaderNav } from "@/components/layout/header-nav";

export async function SiteHeader() {
  let session = null;
  let hasSchoolPortal = false;

  try {
    session = await getServerSession(authOptions);
    if (session?.user?.id) {
      if (session.user.role === "ADMIN") {
        hasSchoolPortal = true;
      } else {
        const membership = await db.schoolMembership.findFirst({
          where: {
            userId: session.user.id,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        hasSchoolPortal = Boolean(membership);
      }
    }
  } catch {
    session = null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          Your<span className="text-primary">Schools</span>
        </Link>
        <HeaderNav
          signedIn={Boolean(session?.user)}
          isAdmin={session?.user?.role === "ADMIN"}
          hasSchoolPortal={hasSchoolPortal}
        />
      </div>
    </header>
  );
}
