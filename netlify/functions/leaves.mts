import type { Config } from "@netlify/functions";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { leaveRequests } from "../../db/schema";
import { getDb } from "../../server/db";
import { requireUser } from "../../server/auth";
import { getLeaveBalance } from "../../server/leave-balance";
import { HttpError, json, parseBody, route } from "../../server/http";
import { USER_SUMMARY } from "../../server/constants";

const createLeaveSchema = z.object({
  type: z.enum(["ANNUAL", "SICK", "UNPAID"]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().trim().min(3, "Please provide a short reason.").max(500),
});

export default route({
  // ?scope=all (admins only) lists the whole team's requests; otherwise your own plus your balance.
  async GET(req, context) {
    const user = await requireUser(context);
    const db = getDb();

    if (new URL(req.url).searchParams.get("scope") === "all" && user.role === "ADMIN") {
      const leaves = await db.query.leaveRequests.findMany({
        orderBy: desc(leaveRequests.createdAt),
        with: { user: { columns: USER_SUMMARY } },
      });
      return json({ leaves });
    }

    const [leaves, balance] = await Promise.all([
      db.query.leaveRequests.findMany({
        where: eq(leaveRequests.userId, user.id),
        orderBy: desc(leaveRequests.createdAt),
      }),
      getLeaveBalance(user.id, user.annualLeaveDays, user.sickLeaveDays),
    ]);
    return json({ leaves, balance });
  },

  async POST(req, context) {
    const user = await requireUser(context);
    const input = await parseBody(req, createLeaveSchema);

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new HttpError("Please provide valid dates.", 400);
    }
    if (endDate < startDate) {
      throw new HttpError("End date must be on or after the start date.", 400);
    }

    const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const [leave] = await getDb()
      .insert(leaveRequests)
      .values({ userId: user.id, type: input.type, startDate, endDate, days, reason: input.reason })
      .returning();

    return json({ leave }, { status: 201 });
  },
});

export const config: Config = { path: "/api/leaves" };
