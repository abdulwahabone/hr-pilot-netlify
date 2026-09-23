# HR Pilot (Netlify edition)

A practice HR SaaS app: one landing page, a simple login, and a dashboard with four modules -
**Leaves**, **Payroll**, **Claims**, and **Settings** - seeded with an admin account and a 20-person
software company.

This edition is built for **Netlify**: a static Vite single-page app plus Netlify Functions as the
API, with Drizzle ORM on Postgres.

## Tech stack

- **Vite + React 19 + TypeScript**, client-side routing with **React Router**. `npm run build`
  produces a static `dist/` folder.
- **Netlify Functions** (v2 API, `netlify/functions/*.mts`) serve `/api/*`. Each function declares
  its own route with `export const config = { path: "/api/..." }`.
- **Tailwind CSS v4** + **shadcn/ui** (built on Base UI), Geist fonts via Fontsource.
- **Drizzle ORM + Postgres** (`postgres` driver). Schema in `db/schema.ts`, SQL migrations in
  `drizzle/`.
- **bcryptjs** password hashes and a random session token stored in the `sessions` table, sent as
  an httpOnly cookie. No third-party auth provider - this is intentionally simple.

## Local setup

You need Node 22.22+ and a local Postgres. The Netlify CLI is used through `npx`, so no global
install is required.

```bash
createdb hr_pilot_netlify        # an empty local database
cp .env.example .env             # DATABASE_URL=postgresql://localhost:5432/hr_pilot_netlify
npm install
npm run db:migrate               # applies the SQL in drizzle/
npm run seed                     # admin + 20 employees + sample leaves, claims and payslips
npx netlify dev --offline        # Vite on :5174 behind Netlify Dev on :3102
```

Then open [http://localhost:3102](http://localhost:3102). Netlify Dev serves the Vite app, runs the
functions for `/api/*`, and applies the SPA fallback from `netlify.toml`, just like production.
`--offline` keeps it from contacting Netlify, so no login or linked site is needed
(`npm run dev:netlify` runs the same command).

> Re-running `npm run seed` at any time wipes and regenerates all data back to a clean demo state.

Other scripts: `npm run build` (typecheck + production build), `npm run lint`,
`npm run db:generate` (new migration after editing `db/schema.ts`).

## Deploy on Netlify

1. Push this repo to GitHub and choose **Add new project -> Import an existing project** in
   Netlify. The build settings come from `netlify.toml` (`npm run build`, publish `dist`, functions
   in `netlify/functions`).
2. Add a database: either **Netlify DB** (Extensions -> Neon), which sets `NETLIFY_DATABASE_URL`
   automatically, or any hosted Postgres - set `DATABASE_URL` under **Project configuration ->
   Environment variables**. `DATABASE_URL` wins when both are set.
3. Create the tables and demo data once, from your machine, against that database:

   ```bash
   DATABASE_URL="postgresql://...your connection string..." npm run db:migrate
   DATABASE_URL="postgresql://...your connection string..." npm run seed
   ```

4. Trigger a deploy. The session cookie is marked `Secure` automatically on HTTPS.

## Demo credentials

This app uses simple, practice-only authentication - there is no email verification, OAuth, or
password reset flow. Credentials are shown right on the login page too.

| Role     | Username     | Password      |
| -------- | ------------ | ------------- |
| Admin/HR | `admin`      | `admin`       |
| Employee | `ahmad.faiz` | `password123` |

All 20 seeded employees share the password `password123`, with usernames in `firstname.lastname`
format (e.g. `wei.jian`, `priya.sharma`, `farah.aziz` - see `db/seed.ts` for the full list).

## Modules

- **Leaves** - apply for annual/sick/unpaid leave, track your balance, and (as Admin) approve or
  reject requests from the whole team.
- **Payroll** - view your monthly payslips with a full breakdown of basic salary, allowances, and
  deductions. Admins can also view payroll for every employee.
- **Claims** - submit expense claims (food, travel, medical, other) and track their approval
  status. Admins approve or reject claims from the team.
- **Settings** - update your name/email and change your password.

Only the `ADMIN` role can approve or reject leave requests and claims; regular employees can only
see and manage their own.

## API

| Method      | Path                     | Function                |
| ----------- | ------------------------ | ----------------------- |
| POST        | `/api/auth/login`        | `auth-login.mts`        |
| POST        | `/api/auth/logout`       | `auth-logout.mts`       |
| GET         | `/api/auth/me`           | `auth-me.mts`           |
| GET         | `/api/dashboard`         | `dashboard.mts`         |
| GET, POST   | `/api/leaves`            | `leaves.mts`            |
| PATCH       | `/api/leaves/:id`        | `leave-decision.mts`    |
| GET, POST   | `/api/claims`            | `claims.mts`            |
| PATCH       | `/api/claims/:id`        | `claim-decision.mts`    |
| GET         | `/api/payroll`           | `payroll.mts`           |
| PATCH       | `/api/settings/profile`  | `settings-profile.mts`  |
| PATCH       | `/api/settings/password` | `settings-password.mts` |

The list endpoints take `?scope=all` to return the whole team's records, which only works for admins.

## Project structure

```
index.html                  Vite entry
src/
  app.tsx                   Routes (landing, login, /dashboard/*)
  pages/                    Landing, login, dashboard layout + module pages
  components/               shadcn/ui primitives + feature components
  lib/                      API client, session context, formatting helpers
netlify/functions/          One file per API route (Netlify Functions v2)
server/                     Code shared by functions: db pool, auth, HTTP helpers
db/
  schema.ts                 Drizzle schema
  seed.ts                   Seed script
drizzle/                    Generated SQL migrations
netlify.toml                Build, functions, dev server and SPA fallback
```

## Notes

- Route protection has two layers: the dashboard layout calls `/api/auth/me` and redirects to
  `/login` on a 401, and every function checks the session and role again on the server.
- Each function keeps one small Postgres pool per instance and reuses it while the instance is warm.
