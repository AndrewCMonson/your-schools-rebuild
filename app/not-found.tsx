import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">We couldn&apos;t find what you were looking for.</p>
      <Link href="/schools">
        <Button>Browse schools</Button>
      </Link>
    </section>
  );
}
