import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { claims } from "../../db/schema";
import { getDb } from "../../server/db";
import { requireAdmin } from "../../server/auth";
import { HttpError, json, parseBody, route } from "../../server/http";
import { decisionSchema } from "../../server/constants";

export default route({
  async PATCH(req, context) {
    const admin = await requireAdmin(context);
    if (!z.uuid().safeParse(context.params.id).success) throw new HttpError("Claim not found.", 404);
    const { status } = await parseBody(req, decisionSchema, "Invalid status.");

    const [claim] = await getDb()
      .update(claims)
      .set({ status, decidedById: admin.id, decidedAt: new Date() })
      .where(eq(claims.id, context.params.id))
      .returning();

    if (!claim) throw new HttpError("Claim not found.", 404);
    return json({ claim });
  },
});

export const config: Config = { path: "/api/claims/:id" };
