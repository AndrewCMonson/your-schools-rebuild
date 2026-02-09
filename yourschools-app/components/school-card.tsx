import Image from "next/image";
import Link from "next/link";
import type { School, SchoolImage } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompareButton } from "@/components/schools/compare-button";

type SchoolCardProps = {
  school: School & { images: SchoolImage[]; distanceMiles?: number | null };
  imagePriority?: boolean;
  activeFilters?: {
    daycare?: string;
    verified?: string;
    minTuition?: string;
    maxTuition?: string;
    minAge?: string;
    maxAge?: string;
  };
};

export function SchoolCard({ school, imagePriority = false, activeFilters }: SchoolCardProps) {
  const image = school.images[0]?.url ?? "https://placehold.co/1200x800?text=School";
  const reasons: string[] = [];
  const minTuition = activeFilters?.minTuition ? Number(activeFilters.minTuition) : null;
  const maxTuition = activeFilters?.maxTuition ? Number(activeFilters.maxTuition) : null;
  const minAge = activeFilters?.minAge ? Number(activeFilters.minAge) : null;
  const maxAge = activeFilters?.maxAge ? Number(activeFilters.maxAge) : null;

  if (activeFilters?.verified === "true" && school.isVerified) reasons.push("Verified profile");
  if (activeFilters?.daycare === "true" && school.offersDaycare) reasons.push("Offers daycare");
  if (minTuition !== null && school.minTuition !== null && school.minTuition >= minTuition) reasons.push("Meets tuition floor");
  if (maxTuition !== null && school.maxTuition !== null && school.maxTuition <= maxTuition) reasons.push("Within tuition ceiling");
  if (minAge !== null && school.minAge !== null && school.minAge >= minAge) reasons.push("Age range starts at your min");
  if (maxAge !== null && school.maxAge !== null && school.maxAge <= maxAge) reasons.push("Age range fits your max");

  return (
    <Card className="overflow-hidden">
      <div className="relative h-44 w-full">
        <Image
          src={image}
          alt={school.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
          priority={imagePriority}
          loading={imagePriority ? "eager" : "lazy"}
        />
      </div>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{school.name}</h3>
            <p className="text-sm text-muted-foreground">{school.city}, {school.state} {school.zipcode}</p>
          </div>
          {school.isVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{school.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span>Tuition: ${school.minTuition ?? "?"} - ${school.maxTuition ?? "?"}</span>
          <span>{school.averageRating?.toFixed(1) ?? "New"} ★</span>
        </div>
        {reasons.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {reasons.slice(0, 3).map((reason) => (
              <Badge key={reason} variant="secondary">{reason}</Badge>
            ))}
          </div>
        ) : null}
        {school.distanceMiles !== undefined && school.distanceMiles !== null ? (
          <p className="text-xs text-muted-foreground">{school.distanceMiles.toFixed(1)} miles away</p>
        ) : null}
        <div className="flex gap-2">
          <Link href={`/schools/${school.slug}`} className="flex-1">
            <Button className="w-full" variant="outline">View Profile</Button>
          </Link>
          <CompareButton schoolId={school.id} />
        </div>
      </CardContent>
    </Card>
  );
}
