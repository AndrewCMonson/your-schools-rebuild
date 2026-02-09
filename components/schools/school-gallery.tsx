import Image from "next/image";
import { SchoolImage } from "@prisma/client";

export function SchoolGallery({ schoolName, images }: { schoolName: string; images: SchoolImage[] }) {
  if (images.length === 0) {
    return (
      <div className="surface p-4 text-sm text-muted-foreground">
        School photos are coming soon.
      </div>
    );
  }

  const [cover, ...rest] = images;

  return (
    <section className="surface space-y-3 p-4">
      <h2 className="text-lg font-semibold">Photo Gallery</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="relative min-h-[260px] overflow-hidden rounded-xl md:row-span-2">
          <Image
            src={cover.url}
            alt={cover.alt || `${schoolName} cover photo`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        {rest.slice(0, 4).map((image, index) => (
          <div key={image.id} className="relative min-h-[124px] overflow-hidden rounded-xl">
            <Image
              src={image.url}
              alt={image.alt || `${schoolName} gallery photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
