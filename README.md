# HR Pilot (Netlify edition)

A practice HR SaaS app: one landing page, a simple login, and a dashboard with four modules -
**Leaves**, **Payroll**, **Claims**, and **Settings** - seeded with an admin account and a 20-person
software company.

This edition is built for **Netlify**: a static Vite single-page app, Netlify Functions as the
API, and **Netlify Database** (Netlify's built-in Postgres) queried with Drizzle ORM.

## Tech stack

- **Vite + React 19 + TypeScript**, client-side routing with **React Router**. `npm run build`
  produces a static `dist/` folder.
- **Netlify Functions** (v2 API, `netlify/functions/*.mts`) serve `/api/*`. Each function declares
  its own route with `export const config = { path: "/api/..." }`.
- **Tailwind CSS v4** + **shadcn/ui** (built on Base UI), Geist fonts via Fontsource.
- **Netlify Database** through `@netlify/database`, with **Drizzle ORM** for queries. There is no
  connection string to configure: Netlify supplies it per environment. Schema in `db/schema.ts`,
  SQL migrations in `netlify/database/migrations/`, including the demo data.
- **bcryptjs** password hashes and a random session token stored in the `sessions` table, sent as
  an httpOnly cookie. No third-party auth provider - this is intentionally simple.

## Local setup

You need Node 22.22+ and the Netlify CLI 26+ (`npm install -g netlify-cli`). No Postgres install,
Netlify account, or linked site is needed: `netlify dev` runs a local Postgres-compatible database
(PGlite, stored in `.netlify/db`).

```bash
npm install
netlify dev --offline            # app on http://localhost:3102, local database started
npm run db:migrate               # in a second terminal: creates the tables and demo data
```

Then open [http://localhost:3102](http://localhost:3102). Netlify Dev serves the Vite app (port
5174), runs the functions for `/api/*`, and applies the SPA fallback from `netlify.toml`, just like
production. `--offline` keeps it from contacting Netlify. `npm run dev:netlify` runs the same
command.

Run `npm run db:migrate` once after the first start, and again whenever a new migration appears; it
only applies migrations that are not applied yet. The data persists between `netlify dev` runs.

> `npm run db:reset` wipes the local database and re-applies every migration, which puts the demo
> data back to its starting state.

Other scripts: `npm run build` (typecheck + production build), `npm run lint`, and
`npm run db:generate` (writes a new migration after you edit `db/schema.ts`).
`netlify database connect` opens a SQL prompt on the local database while `netlify dev` runs.

## Deploy on Netlify

1. Push this repo to GitHub and choose **Add new project -> Import an existing project** in
   Netlify. The build settings come from `netlify.toml` (`npm run build`, publish `dist`, functions
   in `netlify/functions`).
2. Deploy. Because the project depends on `@netlify/database`, Netlify provisions the database
   during the build and applies everything in `netlify/database/migrations/` before the deploy is
   published, including the demo data in `0001_demo_data.sql`. There are no environment variables
   to set and nothing to run by hand.

Every deploy preview gets its own database branch, migrated the same way, so a preview never
touches production data. A failed migration fails the deploy instead of publishing it.

Migrations run once per database. Editing an applied migration file changes nothing, so any
schema or data change needs a new migration (`npm run db:generate`, or
`npx drizzle-kit generate --custom --name <slug>` for hand-written SQL).

## Demo credentials

This app uses simple, practice-only authentication - there is no email verification, OAuth, or
password reset flow. Credentials are shown right on the login page too.

| Role     | Username     | Password      |
| -------- | ------------ | ------------- |
| Admin/HR | `admin`      | `admin`       |
| Employee | `ahmad.faiz` | `password123` |

All 20 seeded employees share the password `password123`, with usernames in `firstname.lastname`
format (e.g. `wei.jian`, `priya.sharma`, `farah.aziz` - see
`netlify/database/migrations/0001_demo_data.sql` for the full list).

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
netlify/database/migrations/  SQL migrations Netlify applies on deploy (schema + demo data)
server/                     Code shared by functions: database client, auth, HTTP helpers
db/
  schema.ts                 Drizzle schema
  client.ts                 Drizzle on top of @netlify/database
netlify.toml                Build, functions, dev server and SPA fallback
```

## Notes

- Route protection has two layers: the dashboard layout calls `/api/auth/me` and redirects to
  `/login` on a 401, and every function checks the session and role again on the server.
- Each function creates its database client once per instance and reuses it while the instance is
  warm. Deployed functions query over Netlify Database's serverless (HTTP) driver; under
  `netlify dev` they use a regular Postgres pool against the local database.
