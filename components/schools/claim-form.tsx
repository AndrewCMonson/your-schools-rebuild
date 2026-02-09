import { submitClaimAction } from "@/lib/actions/claim-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function ClaimForm({ schoolId }: { schoolId: string }) {
  return (
    <form action={submitClaimAction} className="surface space-y-3 p-4">
      <h3 className="text-lg font-semibold">Claim this school</h3>
      <p className="text-sm text-muted-foreground">School staff can request verification by submitting professional credentials.</p>
      <input type="hidden" name="schoolId" value={schoolId} />
      <Input name="fullName" placeholder="Full name" required />
      <Input name="workEmail" type="email" placeholder="Work email" required />
      <Input name="phone" placeholder="Phone" required />
      <Input name="roleTitle" placeholder="Role or title" required />
      <Input name="schoolDomain" placeholder="School domain (example.org)" required />
      <Textarea name="relationship" placeholder="Describe your relationship to the school" required />
      <Textarea name="proof" placeholder="Provide proof, credentials, or verification details" required />
      <SubmitButton type="submit" className="w-full" variant="accent" pendingText="Submitting...">
        Submit claim
      </SubmitButton>
    </form>
  );
}
