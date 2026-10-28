# Core backend setup and verification

## What the backend implements

- Shared auth/profile types and browser-safe adapters.
- Email/password signup, signin, current-user, and local signout Route Handlers.
- Validated, private profile read/upsert API; no client-supplied ownership.
- Supabase SSR cookie handling and Next.js proxy token refresh.
- A versioned profile migration with RLS, column grants, constraints, immutable ownership, and database-managed timestamps.
- Footprint entry/history storage, energy normalization, and optional reviewed carbon snapshots.
- Contextual daily tasks, atomic completion/reward ledger, streaks, privacy-safe leaderboard, and challenges.
- Source-linked public resources and a transparent illustrative solar sizing API.
- Typed browser adapters for every feature, focused tests, and deployment/integration instructions.

The frontend remains unchanged so Person 2 can work in owned files. All four core backend groups are implemented. No privileged admin, OCR, SMS, or AI functionality is exposed.

## Configure a development Supabase project

1. Create or select a development Supabase project. Do not use production data for these tests.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` locally, or secure environment settings in the cloud. Use only the project's public/publishable key; no service-role key is needed by the app. Never commit environment values.
3. Apply both numbered files under `supabase/migrations/` once, in filename order through your normal Supabase migration workflow (if using its CLI, link the development project and use `supabase db push`). For a one-off SQL Editor application, record that application and reconcile the migration history before later CLI pushes. Do not rerun an applied migration manually or edit it after deployment; use a new migration for changes.
4. Enable email/password authentication. Set a password policy compatible with the app's 12-character signup minimum, and review provider rate limits/email delivery settings.
5. Set the Auth Site URL to the app's origin and configure allowed redirect URLs. Set the signup confirmation email link to `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email`. The implemented server endpoint verifies the one-time token and redirects to `/`. Do not use an unhandled implicit hash/PKCE callback. OAuth and password recovery callbacks are not implemented. Treat confirmation URLs as sensitive; do not log query strings in deployment request logs.
6. Restart the app after changing public environment variables; rebuild for production. These public variables are bundled at build time.

No Supabase project or hosted database connection was available during implementation. Credentials are not invented and a local PostgreSQL test is not a hosted Supabase integration test.

## Local automated checks

```sh
npm ci
npm run test:backend
npm run lint
npm run build
npm run typecheck
```

`@electric-sql/pglite` is a development-only embedded PostgreSQL engine. The migration tests create minimal `auth.users`/`auth.uid()` stubs and actual `anon`/`authenticated` roles, apply the real migration, and execute RLS and grant checks as two users. They verify SQL constraints, own-profile upsert, denied cross-user reads/inserts/updates/deletes, anonymous denial, protected identity/timestamps, and account-delete cascade. They do not emulate the Supabase Auth service or PostgREST transport.

Input/request tests exercise malformed input, unknown fields, password handling, body-size enforcement, and same-origin mutation protection. Hosted end-to-end tests below remain necessary.

## Hosted two-user acceptance checklist (requires configuration)

- Create two disposable users A and B through signup; verify email if required. Confirm generic signup responses do not disclose account existence.
- Sign in A through the actual API and verify the returned cookie session with `GET /api/auth/me`. Save A's profile through `PUT /api/profile`, reload, and read it back.
- Repeat for B using a separate cookie jar/browser context. B's profile endpoint must never return A's profile.
- Using B's authenticated Supabase connection, attempt direct table reads and mutations targeting A's ID. RLS must deny access even when bypassing Next.js.
- Try invalid/extra fields (`id`, `points`, metadata timestamps), missing/foreign Origin, invalid JSON, and oversized bodies; confirm safe failures without secret values in responses.
- Test cookie refresh and expiry, email-unconfirmed signin, rate limits, signout, and provider outage behavior. Public pages should render without configuration; private endpoints must fail closed.
- Ensure responses that carry session cookies/private data are not publicly cached by the deployment CDN. Never forward a caller-provided Origin or expose a service-role key to make a failing test pass.

Do not describe the auth/profile workflow as hosted-verified until this checklist has actually run. A successful build alone does not verify persistence or email delivery.

## Validation recorded for this milestone

- The backend runner reports 21 passing tests, including real profile/core migrations, two-user RLS/grants, footprint periods/cursors, factor snapshots, idempotent rewards, atomic rollback on storage failure, challenge progress, privacy opt-out, and local-day streak checks.
- ESLint, production build, and TypeScript checks passed.
- All seven existing page routes returned HTTP 200 with expected navigation.
- Local HTTP checks cover safe unconfigured-service responses, missing/foreign Origin, invalid JSON/fields/media type, oversized bodies, invalid dates/identifiers/pagination, and invalid confirmation links. Exact final results are recorded in `PERSON_1_STATUS.md`.
- The frontend-owned pages, components, and styles were not edited.
- Hosted Supabase, email confirmation delivery, token refresh against a provider, PostgREST, and actual deployed persistence were not run. The project owner selected local validation while a Supabase project is not yet available.
- GitHub Actions is configured, but a successful local run does not establish that remote CI has run.

## Remaining operational steps

Configure Supabase and apply both migrations before connecting the real frontend. See `CALCULATION_METHODS.md` before activating an emissions coefficient. The electricity tracker works without a coefficient; carbon values are null rather than fabricated. Official data hosts are requested in the saved environment draft but were not reachable during implementation; review/save that configuration and publish before retrying source verification. Seeded official resource links have null review dates until checked.

The unconfigured HTTP suite can be repeated with `npm run test:http` after a build. It starts/stops a local production server automatically and refuses working copies with Supabase variables or `.env.local`. Its expected 503 cases deliberately verify fail-closed behavior, not a successful hosted workflow. Do not run this failure-only suite against a configured/production build.
