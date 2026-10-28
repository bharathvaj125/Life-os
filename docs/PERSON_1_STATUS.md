# Person 1 implementation status

## Outcome

The independent backend implementation is complete on `feat/backend-foundation`. It is not a fully integrated or deployed application. The frontend-owned pages/layout/styles remain unchanged, so Person 2 can implement them without competing edits.

| Responsibility | Implementation | Verification / outstanding condition |
| --- | --- | --- |
| Shared contracts and data model | Complete: types, API contract, two migrations, ownership/handoff docs | Person 2 must review v0.2 nullability and units before connecting UI |
| Auth and profiles | Signup, confirmation, signin, signout, current user, SSR refresh, profile read/upsert | Local input/permission/error checks pass; actual Supabase/email/session refresh still unverified |
| Footprint | Baseline, non-overlapping periods, immutable snapshots, daily comparison, paginated history | PostgreSQL lifecycle tests pass; carbon coefficients deliberately unseeded pending official source review; energy tracking works without one |
| Nudges and daily tasks | Context rules, stable daily assignments, completion/expiry, one-time rewards | PostgreSQL tests pass; no background notifications or live-grid feed claimed |
| Gamification and community | Ledger, streaks, challenge participation/progress, opt-in aliases and ranking | Privacy, retry, rollback, stale-date, and isolation checks pass locally |
| Resources and solar | Public curated source links, filters, authenticated planning estimate, evidence/limitations | Calculation tests pass; scenario assumptions are not verified local yields; link content checks pending network access |
| Frontend integration support | Complete adapters for every feature and `PERSON_2_HANDOFF.md` | Actual connected UI and joint end-to-end acceptance await Person 2 and Supabase |
| Release support | CI workflow, local HTTP suite, setup/deployment instructions and demo sequence | Actual hosting, required-check configuration, deployed acceptance, and submission demo are not completed |

## Verification actually executed

- `npm run test:backend`: **21 passed**, zero failures/skips. Includes parent test groups in the runner count.
- Both real numbered migrations executed on embedded PostgreSQL. Core functions were then tested with a migration owner having neither SUPERUSER nor BYPASSRLS.
- Tests cover private reads/writes, anonymous access, profile constraints, real calendar periods, baseline uniqueness/retry paths, overlapping periods, factor snapshots, daily normalization, cursors, task context, completion expiry, one-time rewards, forced storage-failure rollback, opt-in privacy, challenge progress, local-day streaks, and account-delete cascades.
- `npm run lint`, `npm run build`, and `npm run typecheck`: passed.
- `npm run test:http`: **39 passed** — seven public pages and 32 API cases against a real local production server. Expected unconfigured-service 503 responses verify safe failure behavior, not successful hosted authentication/persistence.
- The HTTP test runner starts and stops its own server; it does not leave a background server running.
- Frontend-owned paths are checked for changes before publication of this branch; no UI implementation is included.

## What these results do not prove

PGlite uses a real PostgreSQL engine, but the auth schema/identity mechanism in tests is a local fixture. The tests do not verify hosted GoTrue, PostgREST transport, email delivery, deployed cookies/refresh, or external source access. The embedded engine serializes a single connection, so retry/uniqueness tests are not a substitute for separate concurrent hosted transactions. Profile-row locks and restricted write grants are the concurrency design; validate that design on the configured service before release.

No emissions coefficient, financial tariff, subsidy value, live grid feed, or regional solar forecast was invented. Resource review dates remain null until checked. Solar is explicitly a disclosed illustrative sizing scenario. The carbon path is implemented and tested with synthetic test-only data; activating a real coefficient requires a reviewed source.

## Remaining dependencies and actions

1. **Supabase:** create a development project; enter the two public environment variables securely; apply both migrations; configure email confirmation and Site URL. Follow `BACKEND_SETUP.md` and the hosted two-user checklist.
2. **Official sources:** review/save the environment network additions and publish before retrying blocked official websites. Then verify a suitable emissions coefficient and official resource links. Never activate the synthetic test factor in a real project.
3. **Person 2:** use `PERSON_2_HANDOFF.md` and the adapter modules; implement the owned frontend files; run connected journeys with Person 1 on the configured development database.
4. **Release:** review/merge the feature branches, verify hosted concurrent requests, run deployed acceptance, configure repository protection, and prepare the final demo/submission. Deployment requires a chosen hosting account and configuration.

These prerequisites prevent claiming a finished production application or 100% completion of every Person 1 integration/release task. All backend work that could be implemented and meaningfully validated independently is available in this branch. No optional OCR, SMS, AI, or privileged admin features were added.
