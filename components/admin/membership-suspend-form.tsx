import { revokeSchoolMembershipAction } from "@/lib/actions/membership-actions";
import { Button } from "@/components/ui/button";

export function MembershipSuspendForm({ membershipId }: { membershipId: string }) {
  return (
    <form action={revokeSchoolMembershipAction}>
      <input type="hidden" name="membershipId" value={membershipId} />
      <Button type="submit" size="sm" variant="outline">
        Suspend
      </Button>
    </form>
  );
}
