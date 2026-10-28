# LiFE-OS data model plan

Only `profiles` is created by the current migration. All other tables below are a design proposal for later feature slices. Names and constraints are reviewed with the corresponding API before migrations are added.

| Table | Owner / purpose | Constraints and access plan |
| --- | --- | --- |
| `profiles` (implemented) | One row per auth user | PK/FK auth.users, cascade on account deletion; private own-row SELECT/INSERT/UPDATE, no client DELETE; no admin role field; privacy opt-in defaults false |
| `emission_factors` | Sourced, versioned reference coefficients | Immutable factor version, geography, period, kg CO2e/kWh, source URL; clients read published factors but never write |
| `footprint_entries` | User measurement and result snapshots | User FK, inclusive period dates, nonnegative kWh, coefficient/formula snapshot; reject overlapping periods, one baseline per user; own-row reads and reviewed writes |
| `action_definitions` | Curated sustainable tasks and rule versions | Server-managed rewards and eligibility; no client reward writes |
| `daily_assignments` | Tasks assigned to a user/date | Unique (user_id, date, action_id), Asia/Kolkata date, rule version; own-row reads; controlled assignment creation |
| `action_completions` | Validated assignment completions | Unique assignment ID; own-row reads; completion transaction verifies user, eligibility and day before recording |
| `points_events` | Append-only reward ledger | Unique completion reference, server reward snapshot; no user inserts/updates; completion + reward in one atomic transaction |
| `public_community_profiles` | Explicit public aliases | Separate opt-in projection, no email/private profile name fallback; revoking opt-in removes public visibility |
| `challenges` | Server-managed community goals | Valid date range, positive target; bounded public/participant-readable fields |
| `challenge_memberships` | Opt-in participation | Unique (user_id, challenge_id), own writes only through reviewed join operation |
| `resources` | Curated actionable links | Category, authoritative source URL, reviewed date, publication flag; public published reads, no user writes |

Use a unique partial index for the baseline invariant and a database-enforced range exclusion (or a correctly locked transaction) for overlapping measurement periods. The first baseline must be established atomically under concurrent requests. Snapshot factors so historical estimates do not silently change after a source update.

Reward creation must be atomic and idempotent. Do not let a browser update totals, choose reward points, forge completion timestamps, or write ledger rows directly. Community aggregation must read an explicit privacy-safe projection, never expose private profile rows through a broad policy. Use security-invoker views where appropriate; any security-definer function requires a fixed search path, restricted execution grants, ownership checks, and focused tests.

Add indexes for (user_id, period_end, id), assignments by (user_id, date), ledger by user, memberships by challenge, and resource publication/category as those tables are implemented. Add migrations forward-only after deployment. Test each migration and policy with at least two users and the anonymous role before enabling its feature API.
