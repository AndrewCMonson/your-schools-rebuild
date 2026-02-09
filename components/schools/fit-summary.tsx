"use client";

import { useMemo, useState } from "react";

function scoreLabel(score: number) {
  if (score >= 80) return "Excellent fit";
  if (score >= 60) return "Good fit";
  if (score >= 40) return "Potential fit";
  return "Needs review";
}

export function FitSummary({
  school,
}: {
  school: {
    minAge: number | null;
    maxAge: number | null;
    minTuition: number | null;
    maxTuition: number | null;
    offersDaycare: boolean;
    averageRating: number | null;
    reviewCount: number;
    isVerified: boolean;
    openingHours: string | null;
    closingHours: string | null;
  };
}) {
  const [childAge, setChildAge] = useState<number>(4);
  const [budget, setBudget] = useState<number>(1200);
  const [needsDaycare, setNeedsDaycare] = useState<boolean>(false);

  const result = useMemo(() => {
    let score = 0;
    const reasons: string[] = [];

    if (school.minAge !== null && school.maxAge !== null && childAge >= school.minAge && childAge <= school.maxAge) {
      score += 30;
      reasons.push("Age range matches your child.");
    } else {
      reasons.push("Age range may not match.");
    }

    if (school.maxTuition !== null && school.maxTuition <= budget) {
      score += 25;
      reasons.push("Tuition appears within budget.");
    } else {
      reasons.push("Tuition may exceed budget.");
    }

    if (!needsDaycare || school.offersDaycare) {
      score += 20;
      reasons.push(needsDaycare ? "Daycare is available." : "Daycare not required.");
    } else {
      reasons.push("Daycare required but not listed.");
    }

    if (school.isVerified) {
      score += 10;
      reasons.push("School profile is verified.");
    }
    if ((school.averageRating ?? 0) >= 4 && school.reviewCount > 0) {
      score += 15;
      reasons.push("Strong parent rating profile.");
    }

    return {
      score,
      label: scoreLabel(score),
      reasons,
    };
  }, [budget, childAge, needsDaycare, school]);

  return (
    <div className="surface space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Family Fit Summary</h3>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{result.label}</span>
      </div>
      <p className="text-sm text-muted-foreground">Quickly evaluate fit by age, budget, care needs, and trust signals.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Child age</span>
          <input
            type="number"
            min={0}
            max={8}
            value={childAge}
            onChange={(event) => setChildAge(Number(event.target.value || 0))}
            className="h-10 w-full rounded-md border border-border bg-white/90 px-3"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Max monthly budget</span>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value || 0))}
            className="h-10 w-full rounded-md border border-border bg-white/90 px-3"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={needsDaycare}
            onChange={(event) => setNeedsDaycare(event.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Daycare is required
        </label>
      </div>
      <div className="rounded-md border border-border bg-muted/40 p-3">
        <p className="text-sm font-semibold">Fit score: {result.score}/100</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {result.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
