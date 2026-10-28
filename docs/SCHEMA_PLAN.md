# LiFE-OS data model

Both numbered migrations implement the core schema below. All core writes use identity-guarded RPC functions; only profile fields have direct authenticated insert/update grants. Row-level policies protect private reads. See the migration for exact SQL and `API_CONTRACT.md` for public DTOs.

| Table | Owner / purpose | Constraints and access plan |
| --- | --- | --- |
| `profiles` (implemented) | One row per auth user | PK/FK auth.users, cascade on account deletion; private own-row SELECT/INSERT/UPDATE, no client DELETE; no admin role field; privacy opt-in defaults false |
| `emission_factors` | Sourced, versioned reference coefficients | Immutable factor version, geography, period, kg CO2e/kWh, source URL; clients read published factors but never write |
| `footprint_entries` | User measurement and result snapshots | User FK, inclusive period dates, nonnegative kWh, coefficient/formula snapshot; profile-row lock serializes overlap checks; unique baseline index; own-row reads and guarded writes |
| `action_definitions` | Curated sustainable tasks and rule versions | Server-managed rewards and eligibility; no client reward writes |
| `daily_assignments` | Tasks assigned to a user/date | Unique (user_id, date, action_id), Asia/Kolkata date, rule version; own-row reads; controlled assignment creation |
| `action_completions` | Validated assignment completions | Unique assignment ID; own-row reads; completion transaction verifies user, eligibility and day before recording |
| `points_events` | Append-only reward ledger | Unique completion reference, server reward snapshot; no user inserts/updates; completion + reward in one atomic transaction |
| `community_aliases` | Explicit public aliases | Generated random alias per profile, no name/email fallback; a restricted leaderboard RPC filters current profile opt-in and returns only rank/alias/points |
| `challenges` | Server-managed community goals | Valid date range, positive target; bounded public/participant-readable fields |
| `challenge_memberships` | Opt-in participation | Unique (user_id, challenge_id), own writes only through reviewed join operation |
| `resources` | Curated actionable links | Category, authoritative source URL, reviewed date, publication flag; public published reads, no user writes |

The implementation uses a unique partial baseline index and a per-user profile row lock for every core mutation. Overlap checks happen after obtaining the lock; direct table writes are revoked. This serializes baseline creation and reward processing. Local tests cover retry/uniqueness paths; independent concurrent hosted transactions still need validation before release. Snapshot factors so historical estimates do not silently change after a source update.

Reward creation must be atomic and idempotent. Do not let a browser update totals, choose reward points, forge completion timestamps, or write ledger rows directly. Community aggregation must read an explicit privacy-safe projection, never expose private profile rows through a broad policy. Use security-invoker views where appropriate; any security-definer function requires a fixed search path, restricted execution grants, ownership checks, and focused tests.

Indexes support footprint history, assignments by user/day, ledger by user, completions by user, and memberships by challenge. The initial resource catalog is bounded to 100 rows. Migrations and permission checks are exercised locally with multiple identities and the anonymous role. After deployment, make changes through new forward migrations; do not edit applied files.
