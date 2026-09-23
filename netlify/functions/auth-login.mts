import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import { getDb } from "../../server/db";
import { createSession, toSafeUser, verifyPassword } from "../../server/auth";
import { json, route } from "../../server/http";

export default route({
  async POST(req, context) {
    const body = (await req.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
    const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return json({ error: "Username and password are required." }, { status: 400 });
    }

    const user = await getDb().query.users.findFirst({ where: eq(users.username, username) });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return json({ error: "Invalid username or password." }, { status: 401 });
    }

    await createSession(req, context, user.id);
    return json({ user: toSafeUser(user) });
  },
});

export const config: Config = { path: "/api/auth/login" };
