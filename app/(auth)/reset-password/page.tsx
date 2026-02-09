import { resetPasswordAction } from "@/lib/actions/password-reset-actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="surface p-6 text-sm text-muted-foreground">Missing reset token.</div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 md:px-8">
      <form action={resetPasswordAction} className="surface w-full max-w-md space-y-4 p-6">
        <h1 className="text-3xl font-bold">Choose a new password</h1>
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">New password</label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
          <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
        </div>
        <SubmitButton type="submit" className="w-full" pendingText="Resetting...">
          Reset password
        </SubmitButton>
      </form>
    </section>
  );
}
