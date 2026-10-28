# LiFE-OS

Mission LiFE citizen engagement platform for sustainable energy habits, carbon footprint tracking, community challenges, and rooftop solar awareness.

Built for **HackCult 2026**, problem statement **HC26-GEDA01 — Development of an Interactive Mission LiFE Citizen Engagement Application**.

## Local setup

Use Node.js 24 LTS and npm (the scaffold is validated with Node 24 and npm 11).

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open the development server on port 3000. All placeholder pages work without Supabase credentials. Before using the Supabase helpers, replace the placeholders in `.env.local` with your project's URL and publishable key from Supabase settings. Do not commit `.env.local`. Only public Supabase configuration uses `NEXT_PUBLIC_`; never put service-role keys or other secrets in public variables.

For repeatable installs after cloning, use `npm ci` with the committed lockfile.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js development server |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Run TypeScript checking |
| `npm run test:backend` | Calculation, validation, PostgreSQL/RLS and reward tests |
| `npm run test:http` | Failure-only HTTP smoke checks on an unconfigured production build |
| `npm run build` | Compile all routes for production |
| `npm start` | Serve the production build |

## Architecture

- `src/app`: App Router pages, shared layout, global styles, and future API route handlers.
- `src/components/ui`: Reusable button and card primitives.
- `src/components/layout`: Responsive navigation and placeholder page layout.
- `src/components/charts`: Client-side Recharts building blocks; no fabricated analytics.
- `src/features/{footprint,nudges,gamification,solar}`: Reserved feature modules.
- `src/lib/supabase`: Lazy browser/server Supabase factories using environment variables.
- `src/lib/calculations`: Future documented footprint calculations.
- `src/lib/integrations`: Future external API adapters. Keep credentials server-side.
- `src/lib/utils` and `src/types`: Future shared utilities and types.
- `public`: Static assets.
- `supabase/migrations`: Future versioned PostgreSQL schema and policies.

Empty directories have `.gitkeep` files so Git retains the structure.

## Routes

`/`, `/dashboard`, `/footprint`, `/actions`, `/community`, `/resources`, and `/admin` are working public placeholders. The admin route contains no privileged data or operations; it is not an authorization boundary.

## Core feature implementation status

- Backend: contextual daily tasks, one-time rewards, points/streaks, opt-in leaderboards, and community challenge progress.
- Backend: household electricity baseline/history with daily normalization; carbon estimates require a reviewed coefficient and are otherwise unavailable (null).
- Backend: official resource links and an illustrative rooftop solar planning estimate with disclosed assumptions.
- Frontend: routes remain placeholders, reserved for Person 2 to integrate using the feature adapters.

Email/password auth endpoints, SSR session refresh, private profiles, and both core migrations are implemented. Configure a development Supabase project and apply both migrations before testing hosted persistence. Auth/email/PostgREST and deployed integration remain unverified. No privileged admin operations are implemented.

Read the [API contract](docs/API_CONTRACT.md), [frontend handoff](docs/PERSON_2_HANDOFF.md), [backend setup](docs/BACKEND_SETUP.md), [calculation assumptions](docs/CALCULATION_METHODS.md), [release checklist](docs/DEPLOYMENT.md), and [work split](docs/WORK_SPLIT.md). Run `npm run test:backend` for validation/calculation and embedded PostgreSQL integration tests. The development-only PostgreSQL engine does not replace testing actual Supabase Auth/PostgREST or separate concurrent transactions.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase PostgreSQL and Authentication SDKs, Recharts, Lucide React, and ESLint. npm is the package manager. No live database or external API is required to run this scaffold.
