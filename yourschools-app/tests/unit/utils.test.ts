import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges classes and resolves conflicts", () => {
    expect(cn("p-2", "p-4", "text-sm")).toContain("p-4");
    expect(cn("p-2", "p-4", "text-sm")).not.toContain("p-2");
  });
});
