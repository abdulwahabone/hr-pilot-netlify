import type { Config } from "@netlify/functions";
import { and, count, desc, eq } from "drizzle-orm";
import { claims, leaveRequests } from "../../db/schema";
import { getDb } from "../../server/db";
import { requireUser } from "../../server/auth";
import { getLeaveBalance } from "../../server/leave-balance";
import { json, route } from "../../server/http";

// Everything the Overview page shows, in one round trip.
export default route({
  async GET(_req, context) {
    const user = await requireUser(context);
    const db = getDb();
    const pending = (table: typeof leaveRequests | typeof claims, userId?: string) =>
      db
        .select({ n: count() })
        .from(table)
        .where(userId ? and(eq(table.userId, userId), eq(table.status, "PENDING")) : eq(table.status, "PENDING"))
        .then(([row]) => row?.n ?? 0);

    const isAdmin = user.role === "ADMIN";
    const [balance, recentLeaves, recentClaims, pendingLeaves, pendingClaims, orgPendingLeaves, orgPendingClaims] =
      await Promise.all([
        getLeaveBalance(user.id, user.annualLeaveDays, user.sickLeaveDays),
        db.query.leaveRequests.findMany({
          where: eq(leaveRequests.userId, user.id),
          orderBy: desc(leaveRequests.createdAt),
          limit: 5,
        }),
        db.query.claims.findMany({
          where: eq(claims.userId, user.id),
          orderBy: desc(claims.createdAt),
          limit: 5,
        }),
        pending(leaveRequests, user.id),
        pending(claims, user.id),
        isAdmin ? pending(leaveRequests) : 0,
        isAdmin ? pending(claims) : 0,
      ]);

    return json({
      balance,
      recentLeaves,
      recentClaims,
      pendingLeaves,
      pendingClaims,
      orgPendingLeaves,
      orgPendingClaims,
    });
  },
});

export const config: Config = { path: "/api/dashboard" };
