import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/password-reset-actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";

interface ForgotPasswordPageProps {
  searchParams: Promise<{ sent?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 md:px-8">
      {params.sent ? <Badge variant="success">If the email exists, a reset link has been sent.</Badge> : null}
      <form action={requestPasswordResetAction} className="surface w-full max-w-md space-y-4 p-6">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">We&apos;ll email a secure reset link if the account exists.</p>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" name="email" type="email" required />
        </div>
        <SubmitButton type="submit" className="w-full" pendingText="Sending link...">
          Send reset link
        </SubmitButton>
      </form>
      <p className="text-sm text-muted-foreground">Back to <Link className="text-primary underline" href="/login">login</Link>.</p>
    </section>
  );
}
