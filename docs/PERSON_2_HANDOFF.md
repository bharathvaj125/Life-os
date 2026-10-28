# Person 2 — frontend integration handoff

Use the `feat/backend-foundation` branch as your backend integration base, or merge it after the owner reviews it. Do not copy files manually or start again from the initial scaffold. Keep UI work on a separate branch.

The backend implementation is available in this branch; a hosted Supabase project and live integration are still required. Read `API_CONTRACT.md` and `BACKEND_SETUP.md` first. Do not replace production calls with successful fixtures when configuration is missing.

## Import these adapters

| UI | Adapter module | Functions |
| --- | --- | --- |
| Auth / onboarding | `@/features/auth/api` | `signUp`, `signIn`, `signOut`, `getCurrentUser` |
| Profile | `@/features/profile/api` | `getProfile`, `saveProfile` |
| Footprint / dashboard | `@/features/footprint/api` | `saveFootprint`, `getFootprintHistory` |
| Daily actions | `@/features/nudges/api` | `getTodayActions`, `completeAction` |
| Community | `@/features/gamification/api` | `getChallenges`, `joinChallenge`, `getLeaderboard`, `getCommunitySummary` |
| Resources / solar | `@/features/solar/api` | `getResources`, `estimateRooftopSolar` |

Adapters return the `data` member directly, not the envelope. `ApiClientError` exposes `code`, `message`, `status`, and optional `fieldErrors`. Native fetch failures are also possible. Shared types live in `src/types/api.ts` and `src/types/domain.ts`.

## Page connection order

1. Create signup/signin forms and signed-out handling. If signup requires confirmation, show a neutral check-email message; never treat `user: null` as signed in. The confirmation endpoint redirects to `/`; the homepage can then resolve user/profile state.
2. Read profile. A null profile means show onboarding. Save a full `ProfileInput` with an explicit leaderboard opt-in preference; label it as permission to display their generated alias/points on the leaderboard, and never silently opt the user in. Challenge participation is a separate explicit join action.
3. Footprint: submit inclusive billing-period dates and household kWh. Render baseline/history, actual daily averages, and signed progress. Reuse the returned `nextCursor` for subsequent history pages; do not parse/rebuild it yourself.
4. Actions: render the actual assignments, explanations, point values, and completed state. Complete by `assignmentId`, then refetch actions and community summary. Disable in-flight buttons. Do not calculate or award points in the browser.
5. Community: show summary/streak, list/join challenges, refetch progress after completion, and show the privacy-safe leaderboard. Use the profile adapter to change opt-in; no separate alias editor is implemented.
6. Resources: filter the source-linked catalog and render the solar form with every assumption/limitation returned by the estimate. Resources are public; solar estimation requires authentication.

## Contract changes to review in v0.2

- Carbon fields and the emissions factor can be null until a reviewed coefficient is configured. Display “Carbon estimate unavailable”, never 0 kg.
- Progress is explicitly `reductionMetric: "electricityKwhPerDay"` so a factor change cannot masquerade as behavior improvement. A negative percentage is increased usage; null means no valid comparison.
- Resources can have `reviewedOn: null` because official-link content/availability checks are pending; do not label them recently verified.
- Added `GET /api/community/me` for total points, completed-task count, generated alias, opt-in status, and current streak.
- New expected 409 errors: `PROFILE_REQUIRED`, `PERIOD_OVERLAP`, `BASELINE_ORDER`, `ACTION_EXPIRED`, and `CHALLENGE_CLOSED`. A missing/unowned item returns `NOT_FOUND` (404).

These changes were made while the endpoints were still proposed; confirm the types before connecting forms and request any changes through Person 1.

## Required presentation and failure behavior

- No false live-grid indicator or verified-bill badge. Actions and consumption inputs are self-reported.
- Never equate points/completed tasks with verified kg CO2e saved.
- An empty history/challenge/leaderboard is a valid empty state; 503 is not an empty success.
- Handle expired sessions by asking for signin. Do not store session tokens yourself or expose service-role keys.
- Do not format an unknown carbon coefficient as zero. Show units consistently: kWh, kg CO2e, m², kWp, annual kWh.
- The solar calculator is a planning scenario, not a regional forecast or guaranteed financial saving.
- All inputs need labels and keyboard access; validate client-side for usability while retaining backend validation.
- `/admin` stays a harmless placeholder; no privileged operations were added.

Your files remain the pages/layout/styles, `src/components/**`, `src/features/*/components/**`, and static assets. Do not edit the migration, shared types/adapters, lockfile, or backend functions to make a UI test pass. Raise the issue with Person 1.
