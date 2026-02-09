"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { reorderSchoolImagesAction } from "@/lib/actions/school-portal-actions";
import { SubmitButton } from "@/components/ui/submit-button";

interface PortalImage {
  id: string;
  url: string;
  alt: string | null;
}

export function ImageReorderManager({ schoolId, images }: { schoolId: string; images: PortalImage[] }) {
  const [ordered, setOrdered] = useState(images);

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ordered.length) return;
    const next = [...ordered];
    const temp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = temp;
    setOrdered(next);
  };

  if (ordered.length === 0) {
    return <p className="text-sm text-muted-foreground">No images uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {ordered.map((image, index) => (
        <div key={image.id} className="flex items-center gap-3 rounded-md border border-border p-2">
          <div className="relative h-16 w-24 overflow-hidden rounded-md">
            <Image src={image.url} alt={image.alt ?? "School image"} fill className="object-cover" sizes="96px" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium">{image.alt ?? "No alt text"}</p>
            <p className="text-xs text-muted-foreground">Position {index + 1}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => move(index, -1)} disabled={index === 0}>
              Up
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => move(index, 1)} disabled={index === ordered.length - 1}>
              Down
            </Button>
          </div>
        </div>
      ))}

      <form action={reorderSchoolImagesAction}>
        <input type="hidden" name="schoolId" value={schoolId} />
        <input type="hidden" name="orderedImageIds" value={ordered.map((image) => image.id).join(",")} />
        <SubmitButton type="submit" size="sm" variant="outline" pendingText="Saving order...">
          Save image order
        </SubmitButton>
      </form>
    </div>
  );
}
