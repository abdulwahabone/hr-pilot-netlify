import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../db/schema";
import { getDb } from "../../server/db";
import { hashPassword, requireUser, verifyPassword } from "../../server/auth";
import { HttpError, json, parseBody, route } from "../../server/http";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password."),
  newPassword: z.string().min(4, "New password must be at least 4 characters."),
});

export default route({
  async PATCH(req, context) {
    const user = await requireUser(context);
    const input = await parseBody(req, passwordSchema);
    const db = getDb();

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { passwordHash: true },
    });
    if (!dbUser || !(await verifyPassword(input.currentPassword, dbUser.passwordHash))) {
      throw new HttpError("Current password is incorrect.", 401);
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(input.newPassword) })
      .where(eq(users.id, user.id));

    return json({ ok: true });
  },
});

export const config: Config = { path: "/api/settings/password" };
