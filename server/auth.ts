import { randomBytes } from "node:crypto";
import type { Context } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { sessions, type User } from "../db/schema";
import { getDb } from "./db";
import { HttpError } from "./http";
import { SESSION_COOKIE } from "./constants";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type SafeUser = Omit<User, "passwordHash">;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _omit, ...safe } = user;
  void _omit;
  return safe;
}

export async function createSession(req: Request, context: Context, userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await getDb().insert(sessions).values({ token, userId, expiresAt });

  context.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: new URL(req.url).protocol === "https:",
    sameSite: "Lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(context: Context) {
  const token = context.cookies.get(SESSION_COOKIE);
  if (token) {
    await getDb().delete(sessions).where(eq(sessions.token, token));
  }
  context.cookies.delete({ name: SESSION_COOKIE, path: "/" });
}

export async function getCurrentUser(context: Context): Promise<SafeUser | null> {
  const token = context.cookies.get(SESSION_COOKIE);
  if (!token) return null;

  const db = getDb();
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
    with: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id)).catch(() => {});
    return null;
  }

  return toSafeUser(session.user);
}

export async function requireUser(context: Context): Promise<SafeUser> {
  const user = await getCurrentUser(context);
  if (!user) throw new HttpError("You must be logged in.", 401);
  return user;
}

export async function requireAdmin(context: Context): Promise<SafeUser> {
  const user = await requireUser(context);
  if (user.role !== "ADMIN") throw new HttpError("Admin access required.", 403);
  return user;
}
