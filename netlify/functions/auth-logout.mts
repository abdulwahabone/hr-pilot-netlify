import type { Config } from "@netlify/functions";
import { destroySession } from "../../server/auth";
import { json, route } from "../../server/http";

export default route({
  async POST(_req, context) {
    await destroySession(context);
    return json({ ok: true });
  },
});

export const config: Config = { path: "/api/auth/logout" };
