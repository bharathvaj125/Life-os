# LiFE-OS API contract — core backend v0.2

Status: all endpoints listed below are implemented in this branch and locally validated. Person 2 must review the v0.2 type changes before frontend integration. Hosted Supabase Auth/PostgREST and deployment validation are still pending; Local verification covers database functions and HTTP failure/validation wiring; successful web authentication/persistence still requires the real provider. Local SQL tests are not proof of hosted connectivity.

## Shared rules

- Same-origin Next.js endpoints under `/api`. Browser callers use the exported adapters below with cookie-based sessions; no bearer token handling or localStorage token copies in page code.
- Success: `{ "data": T }`. Failure: `{ "error": { "code": string, "message": string, "fieldErrors"?: { "field": "message" } } }`.
- Shared implemented types: `src/types/api.ts` and `src/types/domain.ts`. Error handling: `ApiClientError` from `src/lib/utils/api-client.ts`.
- Authenticated responses and auth failures use `Cache-Control: private, no-store`.
- Mutation requests require an `Origin` matching the incoming HTTP Host and request protocol. Do not add wildcard CORS. Non-browser test clients must supply the correct Origin. Configure deployment host/scheme forwarding so the application sees its public origin. The check does not use `x-forwarded-host`; the edge must validate incoming hostnames.
- JSON bodies use `Content-Type: application/json`; maximum 16 KiB, enforced by bytes read. Unknown input fields are rejected. IDs, timestamps, and points are never accepted from user inputs unless explicitly specified.
- Never render provider/SQL errors, passwords, or tokens in the UI. Network failures may throw a native fetch error; show a retryable failure state rather than mock success.

## Implemented auth endpoints

| Method/path | Request | Success | Adapter |
| --- | --- | --- | --- |
| `POST /api/auth/sign-up` | `CredentialsInput` | 201: `SignUpResult` | `signUp(input)` |
| `POST /api/auth/sign-in` | `CredentialsInput` | 200: `{ user: AuthUser }` | `signIn(input)` |
| `POST /api/auth/sign-out` | No body | 200: `{ signedOut: true }` | `signOut()` |
| `GET /api/auth/me` | No body | 200: `{ user: AuthUser }` | `getCurrentUser()` |
| `GET /api/auth/confirm?token_hash=...&type=email` | Single-use email token | 303 redirect to `/` on verification | Email link only; no adapter |

Import adapters from `@/features/auth/api`. `AuthUser` contains only `id` and `email` (nullable). A missing/expired session gives 401, not a successful anonymous user. Sign-out affects the current local session; it is not an account-deletion operation.

Credentials: trimmed email, syntactically valid, at most 254 characters. Password is never trimmed; signup requires 12–128 characters, signin accepts 1–128 to support existing accounts. Configure a compatible Supabase password policy. Hosted Supabase may impose additional password/rate-limit rules.

Signup with email confirmation enabled returns `{ "data": { "user": null, "requiresEmailConfirmation": true } }`. Show the same “Check your email if registration is available” message regardless of whether the address already exists. Never treat this response as an authenticated session. With confirmation disabled, the provider may immediately establish a cookie session and return a user with `requiresEmailConfirmation: false`.

This slice uses email/password only. Set the Supabase confirmation template link to `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email` and configure Site URL to the app origin. This server route verifies the token, persists cookies, and redirects to the fixed `/` destination. It never accepts a caller-provided redirect destination. Invalid/expired links return a sanitized JSON error; a dedicated error UI can be added by Person 2 later. Never log confirmation URLs or token hashes. OAuth, password reset, and account deletion are not implemented in this slice. The teammate owns the eventual sign-in/onboarding pages.

Example signin:

```ts
import { signIn } from "@/features/auth/api";
import { ApiClientError } from "@/lib/utils/api-client";

try {
  const { user } = await signIn({ email, password });
  // Navigate using the app's agreed onboarding/profile flow; do not store tokens.
  // Render the authenticated state using user; do not log private identifiers.
} catch (error) {
  if (error instanceof ApiClientError) {
    // Render error.message and error.fieldErrors, if present.
  }
}
```

Do not copy the example logging into production analytics. It illustrates the return shape only.

## Implemented profile endpoints

| Method/path | Request | Success | Adapter |
| --- | --- | --- | --- |
| `GET /api/profile` | No body | 200: `{ profile: Profile \| null }` | `getProfile()` |
| `PUT /api/profile` | Full `ProfileInput` | 200: `{ profile: Profile }` | `saveProfile(input)` |

Import adapters from `@/features/profile/api`. Both endpoints require a provider-validated user. `PUT` replaces editable fields (it is not PATCH); all fields below are required. The server derives the profile ID from the authenticated user and ignores no extra fields: unknown fields produce 400.

```json
{
  "displayName": "Citizen",
  "state": "Gujarat",
  "district": null,
  "householdSize": 3,
  "communityOptIn": false
}
```

- `displayName`: trimmed, 2–60 characters.
- `state`: trimmed, 2–80 characters; geographical selection data can be added later. This is currently validated text, not a verified administrative region.
- `district`: null or trimmed text, 2–80 characters.
- `householdSize`: integer 1–50.
- `communityOptIn`: explicit boolean; private by default. Opting in does not currently publish a profile or implement a leaderboard.
- Output adds `id`, `createdAt`, and `updatedAt`; timestamps are ISO strings set by the database.

A user without a profile receives `{ "data": { "profile": null } }`; use this for onboarding, not an error. Profiles are private and are never the public leaderboard DTO. No delete endpoint exists.

## Error codes and HTTP status

| Code | Status | Meaning |
| --- | --- | --- |
| `INVALID_INPUT` | 400 | Invalid JSON/fields or provider-rejected registration |
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `INVALID_CREDENTIALS` | 401 | Signin rejected; do not reveal whether an account exists |
| `FORBIDDEN` | 403 | Missing/foreign Origin |
| `EMAIL_CONFIRMATION_REQUIRED` | 403 | Confirm email before signing in |
| `PAYLOAD_TOO_LARGE` | 413 | JSON body exceeds 16 KiB |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Body is not application/json |
| `RATE_LIMITED` | 429 | Provider rate limit; wait before retrying |
| `SERVICE_UNAVAILABLE` | 503 | Missing configuration or unavailable provider/storage |
| `INTERNAL_ERROR` | 500 | Unexpected failure, with sanitized message |
| `PROFILE_REQUIRED` | 409 | Complete onboarding/profile first |
| `PERIOD_OVERLAP` | 409 | Measurement period overlaps saved data |
| `BASELINE_ORDER` | 409 | New period must follow original baseline |
| `NOT_FOUND` | 404 | Unknown or unowned task/challenge |
| `ACTION_EXPIRED` | 409 | New completion is outside the assigned local date |
| `CHALLENGE_CLOSED` | 409 | Challenge is not active for joining |

The rate-limit response currently comes from Supabase; there is no claim of a custom distributed application rate limiter. Platform-level request limits should also be configured for deployment.

## Implemented core feature endpoints

Import the browser-safe adapters documented in `PERSON_2_HANDOFF.md`. Data persistence is implemented through the second migration and reviewed RPCs. A real Supabase project must be configured before the web endpoints can access that database.

| Method/path | Payload / return | Authorization and behavior |
| --- | --- | --- |
| `POST /api/footprint/entries` | `FootprintInput` → `FootprintEntry` | User only; first accepted entry establishes baseline atomically |
| `GET /api/footprint/entries?limit=20&cursor=...` | `FootprintHistory` | User only; limit integer 1–100, opaque cursor; oldest baseline retained separately |
| `GET /api/actions/today` | `{ actions: DailyAction[] }` | User only; rule-based assignment in Asia/Kolkata |
| `POST /api/actions/{assignmentId}/complete` | No body → `CompletionResult` | User only; owned assignment; award once; repeated completion returns original result and `alreadyCompleted: true` |
| `GET /api/community/challenges` | `{ challenges: Challenge[] }` | User only; initial active catalog capped at 100 |
| `POST /api/community/challenges/{challengeId}/join` | No body → `{ challengeId, joined: true }` | User only; idempotent membership |
| `GET /api/community/me` | `CommunitySummary` | User only; current user's generated alias, opt-in, points, completed tasks, local-day streak |
| `GET /api/community/leaderboard?limit=20` | `{ entries: LeaderboardEntry[] }` | User only; limit 1–100; opt-in aliases only, no private identifiers |
| `GET /api/resources?category=solar` | `{ resources: Resource[] }` | Public; optional category energy/solar/habits; initial curated catalog capped at 100 |
| `POST /api/resources/solar-estimate` | `SolarInput` → `SolarEstimate` | User only; same-origin; assumption-based estimate, no quote or subsidy guarantee |

Footprint constraints: ISO `YYYY-MM-DD` dates, inclusive start/end, start ≤ end, period 1–366 days, no future dates in Asia/Kolkata, non-overlapping periods per user, finite electricity 0–100,000 kWh per period. Daily averages use actual inclusive period days. Baseline comparisons use daily kWh, never raw totals from periods of different lengths or coefficient changes. History is newest first by period end plus unique ID, with null cursor at the end; reduction is null before a post-baseline entry or if baseline daily electricity is zero. No coefficient is seeded. Until a reviewed factor covers the full period, carbon/factor fields are null and progress uses `reductionMetric: "electricityKwhPerDay"`. See `CALCULATION_METHODS.md` for publication and immutable snapshot rules.

Solar constraints: finite roof area 1–10,000 m² and monthly usage 0–100,000 kWh. The current result is an illustrative scenario using 10 m²/kWp and 1200 kWh/kWp/year, limited by both roof area and annual demand. These are disclosed engineering assumptions, not verified regional forecasts. Monetary savings are omitted until a dated tariff source is selected. No live grid/satellite API is integrated. All assumptions are returned with the result.

Daily tasks/streaks use Asia/Kolkata calendar dates, not rolling 24-hour windows. Event timestamps are UTC ISO instants. Challenges use documented calendar start/end dates. All measurement and calculation fields carry explicit units from `src/types/domain.ts` and source/formula metadata. Resource `reviewedOn` is nullable until a content/availability check is recorded. Challenges count post-join, in-range task completions; all-time leaderboard points and current local-day streaks do not imply verified emissions savings. Empty lists are `[]`, unavailable baseline/profile values are `null`, and errors are not represented as empty success lists.

## Next handoff for Person 2

1. Review this contract and the nullable carbon/resource fields before connecting forms.
2. Follow `PERSON_2_HANDOFF.md` for the complete adapter and page connection order.
3. Configure a development Supabase project and apply both migrations before live integration.
4. Read `BACKEND_SETUP.md` and `DEPLOYMENT.md` for test limitations and release gates.
