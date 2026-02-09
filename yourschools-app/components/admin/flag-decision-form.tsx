import { adminResolveFlagAction } from "@/lib/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function FlagDecisionForm({ flagId }: { flagId: string }) {
  return (
    <form action={adminResolveFlagAction} className="flex gap-2">
      <input type="hidden" name="flagId" value={flagId} />
      <Button type="submit" name="decision" value="RESOLVED" size="sm">Hide review</Button>
      <Button type="submit" name="decision" value="DISMISSED" size="sm" variant="outline">Dismiss</Button>
    </form>
  );
}
