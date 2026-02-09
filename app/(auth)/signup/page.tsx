import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 md:px-8">
      <SignupForm />
      <p className="text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="text-primary underline">Sign in</Link>
      </p>
    </section>
  );
}
