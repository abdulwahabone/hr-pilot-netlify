import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function databaseUrl() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL (or NETLIFY_DATABASE_URL) is not set.");
  }
  return url;
}

export function createDb(options: postgres.Options<Record<string, postgres.PostgresType>> = {}) {
  const client = postgres(databaseUrl(), options);
  return { db: drizzle(client, { schema }), client };
}

export type Db = ReturnType<typeof createDb>["db"];
