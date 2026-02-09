"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SchoolSearchForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [manualAdvanced, setManualAdvanced] = useState<boolean | null>(null);
  const hasAdvancedFilters = Boolean(
    params.get("address")
    || params.get("minTuition")
    || params.get("maxTuition")
    || params.get("minAge")
    || params.get("maxAge")
    || params.get("daycare")
    || params.get("verified"),
  );
  const showAdvanced = manualAdvanced ?? hasAdvancedFilters;

  function onSubmit(formData: FormData) {
    const next = new URLSearchParams(params.toString());

    const keys = [
      "q",
      "zipcode",
      "town",
      "address",
      "sort",
      "daycare",
      "verified",
      "minTuition",
      "maxTuition",
      "minAge",
      "maxAge",
    ];

    for (const key of keys) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }

    router.push(`/schools?${next.toString()}`);
  }

  function applyPreset(preset: "infant" | "prek" | "verified_budget" | "daycare") {
    const next = new URLSearchParams(params.toString());
    if (preset === "infant") {
      next.set("minAge", "0");
      next.set("maxAge", "2");
    }
    if (preset === "prek") {
      next.set("minAge", "4");
      next.set("maxAge", "6");
    }
    if (preset === "verified_budget") {
      next.set("verified", "true");
      next.set("maxTuition", "1200");
    }
    if (preset === "daycare") {
      next.set("daycare", "true");
    }
    next.set("sort", "relevance");
    router.push(`/schools?${next.toString()}`);
  }

  return (
    <form action={onSubmit} className="surface space-y-4 p-4 md:p-5" aria-label="Search schools">
      <div className="grid gap-3 md:grid-cols-4">
        <Input name="q" placeholder="School or keyword" defaultValue={params.get("q") ?? ""} />
        <Input name="town" placeholder="Town/City" defaultValue={params.get("town") ?? ""} />
        <Input name="zipcode" placeholder="Zipcode" maxLength={5} defaultValue={params.get("zipcode") ?? ""} />
        <select
          name="sort"
          className="h-10 rounded-md border border-border bg-white/90 px-3 text-sm"
          defaultValue={params.get("sort") ?? "relevance"}
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="distance">Sort: Distance</option>
          <option value="rating">Sort: Rating</option>
          <option value="tuition_low">Sort: Tuition (low-high)</option>
          <option value="tuition_high">Sort: Tuition (high-low)</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("infant")}>Infant Care</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("prek")}>Pre-K Focus</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("verified_budget")}>Verified Under $1200</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("daycare")}>Daycare Available</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setManualAdvanced((prev) => !(prev ?? hasAdvancedFilters))}>
          {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
        </Button>
        <Button type="submit" size="sm">Apply Filters</Button>
      </div>

      <div className={`grid gap-3 border-t border-border pt-4 md:grid-cols-4 ${showAdvanced ? "" : "hidden"}`}>
          <Input name="address" placeholder="Address for distance sort" defaultValue={params.get("address") ?? ""} />
          <Input name="minTuition" placeholder="Min tuition" type="number" defaultValue={params.get("minTuition") ?? ""} />
          <Input name="maxTuition" placeholder="Max tuition" type="number" defaultValue={params.get("maxTuition") ?? ""} />
          <Input name="minAge" placeholder="Min age" type="number" defaultValue={params.get("minAge") ?? ""} />
          <Input name="maxAge" placeholder="Max age" type="number" defaultValue={params.get("maxAge") ?? ""} />
          <select
            name="daycare"
            className="h-10 rounded-md border border-border bg-white/90 px-3 text-sm"
            defaultValue={params.get("daycare") ?? ""}
          >
            <option value="">Daycare: Any</option>
            <option value="true">Daycare: Yes</option>
            <option value="false">Daycare: No</option>
          </select>
          <select
            name="verified"
            className="h-10 rounded-md border border-border bg-white/90 px-3 text-sm"
            defaultValue={params.get("verified") ?? ""}
          >
            <option value="">Verification: Any</option>
            <option value="true">Verified only</option>
            <option value="false">Unverified only</option>
          </select>
      </div>
    </form>
  );
}
