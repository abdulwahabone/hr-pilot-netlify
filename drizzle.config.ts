import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) {
  throw new Error("Set DATABASE_URL (or NETLIFY_DATABASE_URL) before running drizzle-kit.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
