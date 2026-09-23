import { and, eq, sql } from "drizzle-orm";
import { leaveRequests } from "../db/schema";
import { getDb } from "./db";

export type LeaveBalance = {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
};

export async function getLeaveBalance(
  userId: string,
  annualLeaveDays: number,
  sickLeaveDays: number
): Promise<LeaveBalance> {
  const rows = await getDb()
    .select({ type: leaveRequests.type, used: sql<number>`coalesce(sum(${leaveRequests.days}), 0)`.mapWith(Number) })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.userId, userId), eq(leaveRequests.status, "APPROVED")))
    .groupBy(leaveRequests.type);

  const used = (type: "ANNUAL" | "SICK") => rows.find((row) => row.type === type)?.used ?? 0;
  const usedAnnual = used("ANNUAL");
  const usedSick = used("SICK");

  return {
    annual: { total: annualLeaveDays, used: usedAnnual, remaining: Math.max(annualLeaveDays - usedAnnual, 0) },
    sick: { total: sickLeaveDays, used: usedSick, remaining: Math.max(sickLeaveDays - usedSick, 0) },
  };
}
