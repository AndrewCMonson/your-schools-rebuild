import { z } from "zod";

export const createReviewSchema = z.object({
  schoolId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  childAgeYears: z.coerce.number().int().min(0).max(8).optional(),
  attendanceMonths: z.coerce.number().int().min(0).max(120).optional(),
  pros: z.string().trim().max(300, "Pros are too long").optional(),
  cons: z.string().trim().max(300, "Cons are too long").optional(),
  body: z
    .string()
    .trim()
    .min(20, "Review must be at least 20 characters")
    .max(1200, "Review must be at most 1200 characters"),
});

export const flagReviewSchema = z.object({
  reviewId: z.string().cuid(),
  reason: z
    .string()
    .trim()
    .min(8, "Please include enough detail")
    .max(500, "Reason is too long"),
});
