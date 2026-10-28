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

## Planned features — not implemented

- Sustainable energy habits and personalized nudges.
- Carbon footprint inputs, calculations, history, and analytics.
- Community challenges and gamification.
- Rooftop solar education and awareness.

Authentication, session refresh/proxy wiring, authorization, row-level security, database tables, integrations, and business logic are deliberately deferred. Before adding data, define migrations and RLS policies, configure Supabase Authentication and redirect URLs, and enforce admin roles on the server. The Supabase server helper prepares cookie access but does not implement an authentication flow.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase PostgreSQL and Authentication SDKs, Recharts, Lucide React, and ESLint. npm is the package manager. No live database or external API is required to run this scaffold.
