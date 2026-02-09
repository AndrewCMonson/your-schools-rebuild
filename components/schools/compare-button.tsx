"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const MAX_COMPARE = 4;

export function CompareButton({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const currentIds = useMemo(() => {
    const raw = params.get("ids") ?? "";
    return raw.split(",").map((value) => value.trim()).filter(Boolean);
  }, [params]);

  const included = currentIds.includes(schoolId);

  const onClick = () => {
    const next = new Set(currentIds);
    if (included) {
      next.delete(schoolId);
    } else if (next.size < MAX_COMPARE) {
      next.add(schoolId);
    }

    const nextIds = [...next];
    if (typeof window !== "undefined") {
      window.localStorage.setItem("yourschools:compareIds", nextIds.join(","));
    }
    if (nextIds.length === 0) {
      router.push("/compare");
      return;
    }

    router.push(`/compare?ids=${nextIds.join(",")}`);
  };

  return (
    <Button type="button" size="sm" variant={included ? "default" : "outline"} onClick={onClick}>
      {included ? "In Compare" : "Compare"}
    </Button>
  );
}
