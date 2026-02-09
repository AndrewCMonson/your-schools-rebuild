import { z } from "zod";

export const claimSchema = z.object({
  schoolId: z.string().cuid(),
  fullName: z.string().trim().min(2).max(120),
  workEmail: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  roleTitle: z.string().trim().min(2).max(120),
  relationship: z.string().trim().min(8).max(280),
  schoolDomain: z.string().trim().min(4).max(120),
  proof: z.string().trim().min(30).max(1500),
});
