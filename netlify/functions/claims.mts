import type { Config } from "@netlify/functions";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { claims } from "../../db/schema";
import { getDb } from "../../server/db";
import { requireUser } from "../../server/auth";
import { HttpError, json, parseBody, route } from "../../server/http";
import { USER_SUMMARY } from "../../server/constants";

const createClaimSchema = z.object({
  category: z.enum(["FOOD", "TRAVEL", "MEDICAL", "OTHER"]),
  amount: z.number().positive().max(100000),
  description: z.string().trim().min(3, "Please provide a short description.").max(500),
  date: z.string(),
});

export default route({
  // ?scope=all (admins only) lists the whole team's claims; otherwise only your own.
  async GET(req, context) {
    const user = await requireUser(context);
    const db = getDb();

    if (new URL(req.url).searchParams.get("scope") === "all" && user.role === "ADMIN") {
      const rows = await db.query.claims.findMany({
        orderBy: desc(claims.createdAt),
        with: { user: { columns: USER_SUMMARY } },
      });
      return json({ claims: rows });
    }

    const rows = await db.query.claims.findMany({
      where: eq(claims.userId, user.id),
      orderBy: desc(claims.createdAt),
    });
    return json({ claims: rows });
  },

  async POST(req, context) {
    const user = await requireUser(context);
    const input = await parseBody(req, createClaimSchema);

    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) {
      throw new HttpError("Please provide a valid date.", 400);
    }

    const [claim] = await getDb()
      .insert(claims)
      .values({
        userId: user.id,
        category: input.category,
        amount: input.amount,
        description: input.description,
        date,
      })
      .returning();

    return json({ claim }, { status: 201 });
  },
});

export const config: Config = { path: "/api/claims" };
