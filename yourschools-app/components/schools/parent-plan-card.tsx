import { ParentPlanStatus } from "@prisma/client";
import { upsertParentPlanItemAction, removeParentPlanItemAction } from "@/lib/actions/parent-plan-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const statusOptions: ParentPlanStatus[] = [
  ParentPlanStatus.SAVED,
  ParentPlanStatus.TOUR_REQUESTED,
  ParentPlanStatus.CONTACTED,
  ParentPlanStatus.APPLIED,
];

export function ParentPlanCard({
  schoolId,
  initial,
}: {
  schoolId: string;
  initial?: { status: ParentPlanStatus; notes: string | null; remindAt: Date | null } | null;
}) {
  return (
    <div className="surface space-y-3 p-4">
      <h3 className="text-lg font-semibold">My Plan</h3>
      <p className="text-sm text-muted-foreground">Track where your family is in the decision process for this school.</p>
      <form action={upsertParentPlanItemAction} className="space-y-3">
        <input type="hidden" name="schoolId" value={schoolId} />
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`plan-status-${schoolId}`}>Decision status</label>
          <select
            id={`plan-status-${schoolId}`}
            name="status"
            defaultValue={initial?.status ?? ParentPlanStatus.SAVED}
            className="h-10 w-full rounded-md border border-border bg-white/90 px-3 text-sm"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`plan-notes-${schoolId}`}>Notes</label>
          <Textarea id={`plan-notes-${schoolId}`} name="notes" defaultValue={initial?.notes ?? ""} className="min-h-[90px]" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`plan-remind-${schoolId}`}>Reminder date</label>
          <input
            id={`plan-remind-${schoolId}`}
            type="date"
            name="remindAt"
            defaultValue={initial?.remindAt ? initial.remindAt.toISOString().slice(0, 10) : ""}
            className="h-10 w-full rounded-md border border-border bg-white/90 px-3 text-sm"
          />
        </div>
        <SubmitButton type="submit" className="w-full" pendingText="Saving plan...">Save Plan</SubmitButton>
      </form>
      {initial ? (
        <form action={removeParentPlanItemAction}>
          <input type="hidden" name="schoolId" value={schoolId} />
          <Button type="submit" variant="outline" size="sm" className="w-full">Remove from plan</Button>
        </form>
      ) : null}
    </div>
  );
}
