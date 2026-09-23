# Agent notes

This is a Vite + React single-page app with Netlify Functions (v2, `netlify/functions/*.mts`) as
the API and Drizzle ORM on Postgres. There is no Next.js here: no server components or
`next/*` imports. Routing is React Router in `src/app.tsx`, and pages load data from `/api/*` in
the browser.

- Run it with `npx netlify dev --offline` (port 3102), not `vite` alone, or `/api/*` will not exist.
- A new API route is a new function file with `export const config = { path: "/api/..." }`. Shared
  server code goes in `server/`, never inside `netlify/functions/`, because every file there
  becomes a function.
- After changing `db/schema.ts`, run `npm run db:generate` and commit the new file in `drizzle/`.
- Check your work with `npm run build` (runs `tsc -b`) and `npm run lint`.
