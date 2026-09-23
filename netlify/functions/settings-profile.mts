import type { Config } from "@netlify/functions";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../db/schema";
import { getDb } from "../../server/db";
import { requireUser, toSafeUser } from "../../server/auth";
import { HttpError, json, parseBody, route } from "../../server/http";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Please provide a valid email address."),
});

export default route({
  async PATCH(req, context) {
    const user = await requireUser(context);
    const input = await parseBody(req, profileSchema);
    const db = getDb();

    const taken = await db.query.users.findFirst({
      where: and(eq(users.email, input.email), ne(users.id, user.id)),
      columns: { id: true },
    });
    if (taken) throw new HttpError("That email address is already in use.", 409);

    const [updated] = await db
      .update(users)
      .set({ name: input.name, email: input.email })
      .where(eq(users.id, user.id))
      .returning();

    return json({ user: toSafeUser(updated) });
  },
});

export const config: Config = { path: "/api/settings/profile" };
