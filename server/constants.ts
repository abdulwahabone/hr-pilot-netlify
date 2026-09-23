import { z } from "zod";

export const SESSION_COOKIE = "session_token";

// The employee fields attached to team-wide lists (leaves, claims, payroll).
export const USER_SUMMARY = { id: true, name: true, department: true, jobTitle: true } as const;

export const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
