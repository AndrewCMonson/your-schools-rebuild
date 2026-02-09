import { signupAction } from "@/lib/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignupForm() {
  return (
    <form action={signupAction} className="surface w-full max-w-lg space-y-4 p-6">
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="text-sm text-muted-foreground">Search is public. Sign up to add reviews, favorites, and claims.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Full name</label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="zipcode" className="text-sm font-medium">Zipcode</label>
          <Input id="zipcode" name="zipcode" maxLength={5} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      <SubmitButton type="submit" className="w-full" pendingText="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
}
