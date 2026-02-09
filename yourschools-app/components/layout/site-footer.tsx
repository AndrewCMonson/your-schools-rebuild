import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-muted-foreground md:px-8">
        <p>Built for families comparing early education with clarity and confidence.</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/guides/choose-preschool" className="hover:text-foreground">How to choose a preschool</Link>
          <Link href="/guides/verified-schools" className="hover:text-foreground">Verified guide</Link>
          <Link href="/policies/reviews" className="hover:text-foreground">Review policy</Link>
          <Link href="/policies/claims-verification" className="hover:text-foreground">Claims policy</Link>
          <Link href="/report-issue" className="hover:text-foreground">Report an issue</Link>
        </div>
        <p>© {new Date().getFullYear()} yourschools.co</p>
      </div>
    </footer>
  );
}
