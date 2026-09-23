# Agent notes

This is a Vite + React single-page app with Netlify Functions (v2, `netlify/functions/*.mts`) as
the API and Netlify Database (Postgres) queried with Drizzle ORM. There is no Next.js here: no
server components or `next/*` imports. Routing is React Router in `src/app.tsx`, and pages load
data from `/api/*` in the browser.

- Run it with `netlify dev --offline` (port 3102), not `vite` alone, or `/api/*` will not exist.
- A new API route is a new function file with `export const config = { path: "/api/..." }`. Shared
  server code goes in `server/`, never inside `netlify/functions/`, because every file there
  becomes a function.
- The database connection comes from `@netlify/database` (`db/client.ts`); there is no
  `DATABASE_URL`. Netlify applies `netlify/database/migrations/` on every deploy; locally run
  `npm run db:migrate` while `netlify dev` is running.
- After changing `db/schema.ts`, run `npm run db:generate` and commit the new migration. Never edit
  a migration that has shipped; add a new one (demo data lives in `0001_demo_data.sql`).
- Check your work with `npm run build` (runs `tsc -b`) and `npm run lint`.
