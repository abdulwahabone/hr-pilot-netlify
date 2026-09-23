import type { Config } from "@netlify/functions";
import { desc, eq } from "drizzle-orm";
import { payslips } from "../../db/schema";
import { getDb } from "../../server/db";
import { requireUser } from "../../server/auth";
import { json, route } from "../../server/http";
import { USER_SUMMARY } from "../../server/constants";

export default route({
  // ?scope=all (admins only) lists every employee's payslips; otherwise only your own.
  async GET(req, context) {
    const user = await requireUser(context);
    const db = getDb();

    if (new URL(req.url).searchParams.get("scope") === "all" && user.role === "ADMIN") {
      const rows = await db.query.payslips.findMany({
        orderBy: desc(payslips.month),
        with: { user: { columns: USER_SUMMARY } },
      });
      return json({ payslips: rows });
    }

    const rows = await db.query.payslips.findMany({
      where: eq(payslips.userId, user.id),
      orderBy: desc(payslips.month),
    });
    return json({ payslips: rows });
  },
});

export const config: Config = { path: "/api/payroll" };
