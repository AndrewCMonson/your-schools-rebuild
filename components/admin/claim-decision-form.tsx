import { adminResolveClaimAction } from "@/lib/actions/claim-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ClaimDecisionForm({ claimId }: { claimId: string }) {
  return (
    <form action={adminResolveClaimAction} className="space-y-2 rounded-md border border-border p-3">
      <input type="hidden" name="claimId" value={claimId} />
      <Textarea name="adminNotes" placeholder="Admin notes" className="min-h-[80px]" />
      <div className="flex gap-2">
        <Button name="decision" value="APPROVED" variant="default" size="sm" type="submit">Approve</Button>
        <Button name="decision" value="REJECTED" variant="outline" size="sm" type="submit">Reject</Button>
      </div>
    </form>
  );
}
