import type { Config } from "@netlify/functions";
import { getCurrentUser } from "../../server/auth";
import { json, route } from "../../server/http";

export default route({
  async GET(_req, context) {
    const user = await getCurrentUser(context);
    if (!user) return json({ user: null }, { status: 401 });
    return json({ user });
  },
});

export const config: Config = { path: "/api/auth/me" };
