import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Badge } from "@/components/ui/badge";

interface LoginPageProps {
  searchParams: Promise<{ created?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 md:px-8">
      {params.created ? <Badge variant="success">Account created. You can sign in now.</Badge> : null}
      {params.reset ? <Badge variant="success">Password updated. Sign in with your new password.</Badge> : null}
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account? <Link href="/signup" className="text-primary underline">Create one</Link>
      </p>
    </section>
  );
}
