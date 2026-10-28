# LiFE-OS — Two-Person Work Plan

Project: HackCult 2026 · HC26-GEDA01 · Mission LiFE Citizen Engagement Application

## 1. Starting point and scope

The Next.js scaffold is already complete and pushed. Do not recreate the project, replace the stack, or regenerate configuration. At the initial scaffold commit, the routes were placeholders and authentication/database logic was not implemented. The first Person 1 backend branch now adds the auth/profile foundation, shared contracts, and a private-profile migration; see `docs/API_CONTRACT.md` and `docs/BACKEND_SETUP.md`. Hosted Supabase validation is pending project creation. The four core business feature groups remain to be implemented.

Confirmed stack: Next.js App Router, React, TypeScript, Tailwind CSS, Supabase PostgreSQL and Authentication, Recharts, Lucide React, ESLint, and npm. Use Next.js Route Handlers for backend endpoints initially. Do not add a separate backend, state library, UI framework, or external API dependency without agreement.

Roles throughout this document:

- **Person 1 — us / project owner:** backend, authentication, database, calculation rules, shared contracts, integration, and final merge/release.
- **Person 2 — teammate:** frontend pages, forms, charts, interactions, responsive design, and accessibility.

Both people contribute to all four core feature groups through different files. This is a development plan, not a claim that the features already work.

## 2. Deliver the four official requirements first

| Core requirement | Person 1 delivers | Person 2 delivers | Acceptance condition |
| --- | --- | --- | --- |
| Personalised footprint tracker | Profile/onboarding persistence, validated baseline inputs, versioned energy/carbon calculations, history endpoints, user data isolation | Onboarding form, footprint form, baseline/results display, dashboard and progress charts | A signed-in user saves a baseline and later entries, sees progress after reload, and cannot access another user's private records |
| Behavioural nudges and micro-tasks | Documented contextual rules, daily task assignment, completion persistence, duplicate prevention | Actions page, contextual suggestion cards, daily task list, loading/error/completed states | Recorded user context produces a useful explanation and an actionable task; completion survives reload and cannot be rewarded twice |
| Gamification and social impact | Server-controlled points ledger, explicit streak/timezone rules, challenge membership, leaderboard/community aggregation | Community page, join/complete interactions, points/streak display, leaderboard and goal progress | Completing an eligible task awards points once; community progress updates; public displays do not expose private user data |
| Actionable resource hub | Curated resource records and sources, validated solar estimate module and endpoint, transparent assumptions | Resources page, resource cards/filtering, rooftop solar input form, estimates and assumptions display | Users can find an actionable resource and obtain a clearly labelled solar estimate from valid inputs; invalid inputs are explained |

Use the supplied problem statement as the requirements source. A solar calculator is the chosen actionable resource-hub implementation. A vendor directory is optional unless later explicitly selected; do not invent vendor affiliations or imply endorsement.

## 3. File ownership — prevent overlapping edits

Ownership applies to every new file under a directory unless an exception is listed. An owner is the only person who edits that file in a feature branch. Request a change from its owner instead of editing it yourself.

| Path | Owner | Boundary |
| --- | --- | --- |
| `src/app/api/**` | Person 1 | All request handlers, validation, authorization, and responses |
| `src/lib/supabase/**` | Person 1 | Browser/server configuration, session helpers |
| `src/lib/calculations/**` | Person 1 | Footprint and solar formulas, constants, source metadata |
| `src/lib/integrations/**` | Person 1 | External service adapters and server-only credentials |
| `src/lib/utils/**` | Person 1 | Shared utilities; teammate requests additions |
| `src/types/**` | Person 1 | Shared API/domain types; neither person duplicates them elsewhere |
| `supabase/**` | Person 1 | Migrations, seed/reference data, RLS policies, database functions |
| `src/proxy.ts` if introduced | Person 1 | Next.js session-refresh plumbing; route UI remains Person 2's responsibility |
| `src/features/*/components/**` | Person 2 | Feature UI only; this exception overrides the next row |
| Rest of `src/features/**` | Person 1 | Domain services, rules, server logic, data access, and client API adapters |
| `src/app/**` except `api/**` | Person 2 | Existing pages/layout/styles plus future auth/onboarding pages and route error/loading UI |
| `src/components/**` | Person 2 | UI primitives, navigation, charts, shared presentation |
| `public/**` | Person 2 | Reviewed static assets with appropriate usage rights |
| `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, ESLint/PostCSS config, `.gitignore`, `.env.example` | Person 1 | Teammate requests dependency/config changes; never regenerate these independently |
| `README.md`, `docs/WORK_SPLIT.md`, `docs/API_CONTRACT.md`, `.github/**` if added | Person 1 | Integration documentation, shared plan, CI, and release setup |
| `docs/ui/**` if added | Person 2 | UI notes, screenshots, accessibility review |
| `tests/backend/**` if added | Person 1 | Domain/API/security tests |
| `tests/ui/**` if added | Person 2 | UI and browser tests; shared test configuration belongs to Person 1 |

Example: `src/features/footprint/components/footprint-form.tsx` belongs to Person 2; `src/features/footprint/service.ts` belongs to Person 1. Do not put server logic inside the UI-owned directory. Feature-local presentation helpers can stay beside their UI components.

For any path not listed, agree on an owner before either person edits it. This includes new shared test configuration or deployment files.

## 4. First handoff: agree contracts before connected UI work

Person 1's first implementation PR must add `docs/API_CONTRACT.md` and shared TypeScript types. Person 2 reviews these before connecting forms. The following is a proposed contract checklist, not an already implemented API.

Agree and document:

- Exact endpoint paths and HTTP methods for profile, footprint entries/history, actions/completion, community/join/leaderboard, and resources/solar estimates.
- Request/response types, validation limits, nullability, pagination where needed, and stable error codes.
- Units: electricity in kWh; emissions in kg CO2e; roof area in m²; solar capacity in kWp; generation in kWh; monetary estimates in INR with their time period stated.
- Billing-period start/end dates and any normalization used when comparing periods of different lengths. Do not compare a two-month bill directly with a one-month bill.
- ISO timestamps for events, explicit dates for measurement periods, and the documented timezone for daily tasks/streak boundaries.
- A proposed success envelope `{ data: T }` and error envelope `{ error: { code: string, message: string, fieldErrors?: Record<string, string> } }`; finalize these in the contract.
- Authentication expectations, allowed public community fields, empty states, and representative success/error examples.
- Calculation response metadata: factor/formula version, source, period, assumptions, and whether the result is an estimate.

Person 1 owns shared data access adapters under `src/features/<feature>/api.ts` or another agreed non-UI path. Person 2 calls those adapters and imports shared types rather than writing a second Supabase/data access layer. Mark server-only modules appropriately and never import them into Client Components.

Person 2 may build against local fixtures matching the agreed types while APIs are being implemented. Keep fixtures inside UI-owned paths, visibly label demo data, and never silently fall back to mock success when a real API fails. Remove runtime fixtures from production flows at integration.

Contract changes require both people to acknowledge the change and update consumers in the same integration cycle. Do not rename fields or change units silently.

## 5. Person 1 — our concrete work queue

1. **Contracts and persistence foundation:** define the first API/types handoff; design profiles, footprint entries, action definitions/completions, points events, challenges/memberships, and resources. Record ownership, constraints, indexes, and calculation versions. Finalize the schema before writing dependent APIs.
2. **Authentication and isolation:** implement signup/sign-in/sign-out/session refresh using Supabase; provide the agreed auth adapter to the UI. Add RLS, server-side ownership checks, safe session handling, and a two-user isolation check. Never trust a submitted user ID, points value, or admin flag.
3. **Footprint service:** validate inputs, select a traceable emissions source relevant to the intended geography, document assumptions, calculate a baseline, persist history, and return comparable progress data. Store source/version metadata; handle missing or invalid inputs explicitly.
4. **Nudges and actions:** start with explainable rules using available user context. Return why a nudge applies. Implement daily task assignment and idempotent completion. Do not claim live grid awareness without a verified live source.
5. **Community and gamification:** award points only through validated server/database operations, prevent duplicate awards, implement membership and privacy-safe aggregates, and define streak/day-boundary behavior.
6. **Resources and solar:** curate actionable source-linked resources; implement an assumption-based solar estimate and validate inputs. Investigate API coverage/access before choosing an external solar provider. Keep formulas/rates dated and sourced; never present estimates as verified installation quotes.
7. **Integration and delivery:** review the teammate's UI PRs, connect agreed adapters, run end-to-end journeys, handle shared configuration changes, update setup docs, and prepare deployment/demo once core acceptance checks pass.

Person 1 also handles repository settings, environment variables, migrations, dependency additions, and release configuration. No admin service-role key belongs in client code or `NEXT_PUBLIC_*` variables.

## 6. Person 2 — teammate's concrete work queue

1. **UI foundation:** refine existing navigation, responsive layout, consistent cards/buttons/inputs, focus states, readable contrast, and form labels. Preserve the stack and current route structure.
2. **Auth and onboarding screens:** create the agreed auth/onboarding route UI; call Person 1's auth/profile adapters. Add validation feedback and loading/signed-out/error states. Do not independently implement session middleware or database access.
3. **Dashboard and footprint:** create input forms and baseline/history views, display units and assumptions, and connect Recharts to real response data. Make empty/new-user states useful. Never use an invented reduction percentage as a real result.
4. **Actions:** render contextual nudges, explanations, daily tasks, completion feedback, and safe retry behavior. Disable duplicate submissions in the UI while relying on backend idempotency for correctness.
5. **Community:** create challenge cards, join controls, goal progress, points/streak displays, and leaderboard states. Render only fields explicitly approved for public display.
6. **Resources and solar:** create browsable resource cards and solar estimate forms/results. Display source links, estimate labels, units, invalid-input feedback, and limitations supplied by the backend.
7. **Frontend quality:** check phone/tablet/desktop layouts, keyboard navigation, form usability, loading/empty/error states, and real-data rendering. Send reproducible backend issues to Person 1 instead of changing backend files.

Keep `/admin` as a harmless placeholder during core development. Do not add admin controls, charts presented as real statistics, or privileged operations yet.

## 7. Development order and integration gates

| Stage | Person 1 | Person 2 | Gate before progressing |
| --- | --- | --- | --- |
| A — coordination | Commit contract/types and schema plan | Review contract; refine UI shell in owned files | Both agree on payloads, units, file ownership, and feature acceptance |
| B — identity + footprint | Auth, profiles, RLS, baseline/history services | Auth/onboarding, footprint and dashboard UI | Real signed-in baseline → saved entry → reload → progress; cross-user access denied |
| C — actions + community | Rules, completions, points, challenges, aggregation | Actions and community UI | Task completion → one reward → persisted community update; retries do not duplicate points |
| D — resources | Source-linked resources and solar service | Resource hub and solar UI | Valid inputs produce explained estimates; invalid inputs and service errors are handled |
| E — integration | Security/calculation checks, deployment setup | Responsive/accessibility review, demo flow | All four core requirements work together with real persistence |

After Stage A, work can proceed in parallel within each stage. Person 2 can prepare later UI from approved fixtures while Person 1 finishes services. A UI merge does not mean the feature is complete until its real-data gate passes.

Suggested first assignments: Person 1 starts Stage A and the auth/database foundation; Person 2 starts the responsive shell and footprint form layout without changing shared contracts or backend files.

## 8. Git rules for both people

1. Work in separate local clones/environments. Start each small feature branch from the latest `main`; do not share a writable checkout or branch.
2. Use branches such as `feat/backend-footprint` and `feat/ui-footprint`. Do not push unfinished work directly to `main`.
3. Before starting, check `git status`, fetch the remote, and update a clean local `main` with `git pull --ff-only origin main`. Commit or otherwise preserve your own work before switching branches.
4. Keep each PR limited to one feature slice and owned files. Include changed paths, contract changes, validation results, and screenshots for UI changes.
5. Person 1 owns final integration into `main`; both review changes to shared contracts. Set up required PR checks/branch protection when repository permissions permit.
6. If a dependency is needed, Person 2 requests it. Person 1 updates both package files together; the teammate syncs and runs `npm ci`. Never hand-merge a lockfile or delete it to resolve conflicts.
7. Before requesting merge, fetch `origin` and merge `origin/main` into your feature branch, then rerun checks. Do not force-push `main`. If a conflict touches another owner's file, coordinate with that owner; never choose all of “ours” or “theirs” blindly.
8. After a merge, update local `main`, reinstall only if dependencies changed, and branch from the updated base for the next slice.

Ownership reduces conflicts but cannot guarantee they never happen. Small PRs, stable contracts, and frequent integration are required. Do not replace whole folders, rerun scaffold generators, or perform unrelated formatting.

## 9. Verification and definition of done

Both people run from the project root before handing off:

```sh
npm ci
npm run lint
npm run build
npm run typecheck
```

Run the build before the standalone typecheck in a fresh checkout so generated route types are available. On this cloud environment, Turbopack may require execution outside a restrictive sandbox because it opens a local worker port.

Person 1 additionally verifies calculation examples and edge cases, API authentication/validation, two-user data isolation, duplicate completion/reward prevention, and migrations on a development database. Add focused automated tests where they protect these behaviors; neither a build nor a zero-test run proves them correct.

Person 2 additionally checks every affected page on mobile and desktop, keyboard access, form errors, loading/empty/failure states, and agreed adapter responses. Do not claim these passed until executed.

A feature is done only when it has real persistence, relevant acceptance checks, documented assumptions, no committed secrets, and an integrated UI. Full core readiness requires all four rows in Section 2, not merely all routes rendering.

## 10. APIs, evidence, and features deferred until core completion

External APIs are not automatically required. Record the selected provider, coverage, credential requirements, source date, quotas, and failure behavior before connecting one. Do not add multiple interchangeable providers in the first version.

- Footprint factors: investigate authoritative CEA or other appropriate published data; verify applicability and units before use.
- Solar: begin with transparent sourced assumptions if suitable. Evaluate PVGIS or another provider only after confirming geographic coverage and access. Maps, satellite imagery, and weather integrations are not prerequisites for the core scaffold or first calculator.
- Tariffs/subsidies: use current official sources for the selected geography. Gujarat is the problem-statement context; Tamil Nadu bill support is a potential later extension, not an assumed statewide integration.
- Bill PDF/photo OCR, tariff alerts, SMS automation, appliance scheduling, satellite solar maps, vendor directories beyond the chosen core scope, admin heatmaps, and an AI coach remain backlog items until the four core groups pass acceptance.
- If bill extraction is later added, distinguish **user-entered**, **document-extracted**, and **verified through an authorized official source**. OCR does not prove authenticity. A website cannot freely read a phone's SMS inbox. Do not collect utility passwords/OTPs or assume an official utility API exists.

No business features are implemented by this document. Its purpose is to assign the next implementation work without overlap or scope drift.
