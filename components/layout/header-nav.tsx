"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderNavProps {
  signedIn: boolean;
  isAdmin: boolean;
  hasSchoolPortal: boolean;
}

export function HeaderNav({ signedIn, isAdmin, hasSchoolPortal }: HeaderNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-2 md:flex md:gap-3">
        <Link href="/schools">
          <Button variant="ghost" size="sm">Find Preschools</Button>
        </Link>
        <Link href="/compare">
          <Button variant="ghost" size="sm">My Shortlist</Button>
        </Link>
        <Link href="/guides">
          <Button variant="ghost" size="sm">Guides</Button>
        </Link>
        {signedIn ? (
          <>
            <Link href="/profile">
              <Button variant="ghost" size="sm">My Plan</Button>
            </Link>
            {hasSchoolPortal ? (
              <Link href="/portal">
                <Button variant="ghost" size="sm">School Portal</Button>
              </Link>
            ) : null}
            {isAdmin ? (
              <Link href="/admin">
                <Button variant="outline" size="sm">Admin</Button>
              </Link>
            ) : null}
            <form action="/api/auth/signout" method="post">
              <Button size="sm" variant="secondary" type="submit">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" variant="accent">Get Started</Button>
            </Link>
          </>
        )}
      </nav>

      <div className="md:hidden">
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen((prev) => !prev)}>
          Menu
        </Button>
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-border bg-background px-4 py-3 shadow-lg md:hidden">
          <div className="flex flex-col gap-2">
            <Link href="/schools" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">Find Preschools</Button>
            </Link>
            <Link href="/compare" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">My Shortlist</Button>
            </Link>
            <Link href="/guides" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">Guides</Button>
            </Link>
            {signedIn ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">My Plan</Button>
                </Link>
                {hasSchoolPortal ? (
                  <Link href="/portal" onClick={() => setOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">School Portal</Button>
                  </Link>
                ) : null}
                {isAdmin ? (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">Admin</Button>
                  </Link>
                ) : null}
                <form action="/api/auth/signout" method="post">
                  <Button size="sm" variant="secondary" type="submit" className="w-full justify-start">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Log in</Button>
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}>
                  <Button size="sm" variant="accent" className="w-full justify-start">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
