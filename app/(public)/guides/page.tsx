import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

const guides = [
  {
    href: "/guides/choose-preschool",
    title: "How to choose a preschool",
    description: "A parent-first shortlist and tour framework.",
    updatedLabel: "Updated February 9, 2026",
  },
  {
    href: "/guides/preschool-tuition",
    title: "Tuition guide",
    description: "How to compare cost realistically across schools.",
    updatedLabel: "Updated February 9, 2026",
  },
  {
    href: "/guides/verified-schools",
    title: "Verified schools guide",
    description: "How verification works and what it means.",
    updatedLabel: "Updated February 9, 2026",
  },
];

export const metadata: Metadata = {
  title: "Preschool Guides",
  description: "Practical, parent-first guides for choosing and comparing preschools.",
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    url: "/guides",
  },
};

export default function GuidesPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-8 md:py-12">
      <div className="space-y-3">
        <Badge variant="secondary" className="w-fit">Parent education</Badge>
        <h1 className="text-3xl font-bold md:text-4xl">Guides</h1>
        <p className="max-w-2xl text-muted-foreground">
          Learn how to evaluate schools with confidence, compare tradeoffs, and make a decision that works for your family.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guides.map((guide) => (
          <Link key={guide.href} href={guide.href} className="surface flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary/50">
            <h2 className="text-xl font-semibold">{guide.title}</h2>
            <p className="flex-1 text-sm text-muted-foreground">{guide.description}</p>
            <p className="text-xs text-muted-foreground">{guide.updatedLabel}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
