import { flagReviewAction } from "@/lib/actions/review-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewFlagForm({ reviewId }: { reviewId: string }) {
  return (
    <form action={flagReviewAction} className="space-y-2 rounded-md border border-border p-3">
      <input type="hidden" name="reviewId" value={reviewId} />
      <label htmlFor={`reason-${reviewId}`} className="text-sm font-medium">Flag this review</label>
      <Textarea id={`reason-${reviewId}`} name="reason" placeholder="Why should this be reviewed?" className="min-h-[80px]" required />
      <Button type="submit" variant="outline" size="sm">Submit flag</Button>
    </form>
  );
}
