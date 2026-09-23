import { defineConfig } from "drizzle-kit";

// `npm run db:generate` writes new SQL migrations straight into the directory
// Netlify Database applies on every deploy. Hand-written data migrations are
// added with `npx drizzle-kit generate --custom --name <slug>` so the numbering
// stays in drizzle-kit's journal (meta/), which Netlify ignores.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./netlify/database/migrations",
});
