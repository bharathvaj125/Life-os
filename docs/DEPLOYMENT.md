# Deployment and release checklist

## Current status

This repository contains a locally tested backend and placeholder frontend pages. It is not a deployed, fully integrated application. Person 2 must connect the UI; a real Supabase project and hosting account are required before live acceptance. No production credentials or hosting project have been configured by this code.

## Database and authentication

1. Create a development Supabase project first. Apply both numbered SQL migrations in order using the supported migration workflow. Keep migration history; do not rerun SQL manually on a populated project.
2. Configure the project's public URL and publishable key in the Next.js build/runtime environment. Never set a service-role key in the frontend. Use separate Supabase projects for production and tests.
3. Configure email/password policy, sender/email limits, Site URL, redirect allowlist, and the confirmation template described in `API_CONTRACT.md`.
4. Review the official resource links before publication and set `reviewed_on` only after that check. Review a grid coefficient and its period applicability before enabling carbon estimates; energy-only tracking remains usable without one.
5. The seed challenge lasts 30 days from migration application. Plan future challenges through controlled administrative SQL; no public challenge-management or admin endpoint exists.

## Hosting

Use a host supporting the selected Next.js/Node.js versions (for example, a compatible managed Next.js host or a Node server). Verify platform support before selecting it. Node 24 and npm 11 were used locally. No deployment-provider SDK is required by the app.

For a Node server:

```sh
npm ci
npm run test:backend
npm run lint
npm run build
npm run typecheck
npm start
```

Set Supabase public values before the build; rebuild after changing them. Terminate HTTPS at a trusted edge, enforce the canonical hostname, forward the correct scheme/Host, prevent private/session responses from being CDN cached, and set platform-level request/rate limits. Do not rewrite arbitrary caller `x-forwarded-host` into a trusted host. Keep provider TLS verification enabled.

GitHub Actions runs backend tests, lint, build, typecheck, and the unconfigured HTTP smoke suite for PRs and main/backend feature pushes. Configure branch protection and required checks after API/repository permissions are available. The workflow file alone does not prove that a GitHub Actions run succeeded.

## Live acceptance — required before claiming readiness

- Two actual accounts: signup → confirmation → signin → profile → baseline → later measurement → progress after reload.
- Private data stays private through both Next.js and direct authenticated Supabase requests.
- Daily task → completion → one reward → streak and challenge update; repeated and concurrent requests do not duplicate rewards or baselines.
- Opt-in/opt-out changes leaderboard visibility; responses never expose private profile identity.
- Resource links resolve and solar results show assumptions and limitations.
- Verify expiration/refresh/signout and sanitized provider-outage responses on the actual hosting domain.
- Repeat the journeys on phone/desktop with keyboard access; check loading, validation, empty, and failure states.
- Check that tracked files and build output do not contain private credentials; audit deployment logs for confirmation tokens/query strings and passwords.

## Demo sequence once integrated

Use disposable demo accounts and explicitly label seeded/self-reported data. Show a household baseline, a later comparable period, a contextual task, its one-time reward, an opt-in community challenge, an actionable official resource, and the illustrative solar estimate. Explain which outcomes are estimates rather than verified savings. Prepare screenshots/a short recording and the final submission materials only after the live journey works.

Bill OCR, SMS reading, AI features, vendor marketplaces, and admin analytics remain out of scope until core acceptance. There is no production admin role or public privileged endpoint to demonstrate.
