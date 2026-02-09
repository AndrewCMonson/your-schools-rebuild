import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/db.ts",
        "lib/actions/**",
        "lib/auth/**",
        "lib/data-quality.ts",
        "lib/email.ts",
        "lib/schools.ts",
        "lib/school-field-display.ts",
        "lib/ingestion/**",
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
