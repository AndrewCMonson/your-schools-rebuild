import { createReviewAction } from "@/lib/actions/review-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function ReviewForm({ schoolId }: { schoolId: string }) {
  return (
    <form action={createReviewAction} className="surface space-y-3 p-4">
      <h3 className="text-lg font-semibold">Leave a review</h3>
      <input type="hidden" name="schoolId" value={schoolId} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="rating" className="text-sm font-medium">Rating (1-5)</label>
          <Input id="rating" name="rating" type="number" min={1} max={5} required />
        </div>
        <div className="space-y-1">
          <label htmlFor="childAgeYears" className="text-sm font-medium">Child age (years)</label>
          <Input id="childAgeYears" name="childAgeYears" type="number" min={0} max={8} />
        </div>
        <div className="space-y-1">
          <label htmlFor="attendanceMonths" className="text-sm font-medium">Attendance duration (months)</label>
          <Input id="attendanceMonths" name="attendanceMonths" type="number" min={0} max={120} />
        </div>
        <div className="space-y-1">
          <label htmlFor="pros" className="text-sm font-medium">Top positive</label>
          <Input id="pros" name="pros" placeholder="What stood out positively?" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="cons" className="text-sm font-medium">Considerations</label>
          <Input id="cons" name="cons" placeholder="Any trade-offs parents should know?" />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="body" className="text-sm font-medium">Your review</label>
        <Textarea id="body" name="body" minLength={20} required />
      </div>
      <SubmitButton type="submit" className="w-full" pendingText="Publishing...">
        Publish review
      </SubmitButton>
      <p className="text-xs text-muted-foreground">Reviews are permanent for users and are moderated for profanity.</p>
    </form>
  );
}
