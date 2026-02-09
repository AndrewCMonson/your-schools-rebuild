import { toggleFavoriteAction } from "@/lib/actions/favorite-actions";
import { Button } from "@/components/ui/button";

interface FavoriteButtonProps {
  schoolId: string;
  isFavorite: boolean;
  disabled?: boolean;
}

export function FavoriteButton({ schoolId, isFavorite, disabled }: FavoriteButtonProps) {
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <Button type="submit" variant={isFavorite ? "secondary" : "outline"} disabled={disabled}>
        {isFavorite ? "Saved" : "Save school"}
      </Button>
    </form>
  );
}
