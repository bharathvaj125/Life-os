# Submission checklist and demo script

Deadline: **4 November 2026, 6:30 PM IST**.

## What still needs a human (about 30 minutes)

1. **Supabase (optional but recommended for the live link).** Create a project, run `supabase/migrations/20261103000000_init.sql` in the SQL editor, copy the project URL, publishable key and service-role key.
2. **Deploy to Render.** The live app is <https://life-os-catalyx.onrender.com> (Web Service from this repo: build `npm ci && npm run build`, start `npm run start`; push to `main`, then Manual Deploy). Vercel is not used, because its serverless functions cannot share the JSON store. Set `SESSION_SECRET`, `ADMIN_ACCESS_CODE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Open the site, go to `/admin`, and press **Load demo households**.
3. **Record the video** (2–3 minutes, unlisted YouTube or Loom) following the script below.
4. **Upload the deck**: `docs/LiFE-OS-pitch-deck.pdf` (10 slides). Share it as a Drive or GitHub link.
5. **Push the code** to the public repo and confirm the README renders its diagrams.
6. **Submit** the repo URL, video URL and deck URL.

If you skip Supabase, run the demo locally; the app works fully on its built-in demo store.

## Demo script (about 2 minutes 30 seconds)

| Time | Show | Say |
| --- | --- | --- |
| 0:00 | Home page | "Everyone knows climate change matters. LiFE-OS makes the first step take one minute, using something every household already has: the electricity bill." |
| 0:15 | Onboarding: name, PIN, 4 people, 282 units, ₹1,930 | "Four details and last month's units. No questionnaire, no password." |
| 0:35 | Dashboard | "Instant footprint, per-person figure, and a trend once a second month is added. The note under the chart shows the exact grid factor used, so nothing is a black box." |
| 0:50 | Footprint: add a second month | "Add a month and the trend and change versus last month update. Travel and LPG are optional." |
| 1:10 | Actions: read a nudge, tick a task | "Nudges come from this household's own data and say why they fired. The rupee figure uses this household's own bill rate, not an assumed tariff. Tick a task and points update." |
| 1:30 | Tick the same task again | "Try twice and the server refuses. One reward per window, enforced by a database unique key. There is no daily limit, but unchecked ticks count for much less on the leaderboard." |
| 1:45 | Community: join a challenge, opt in | "Local challenges add up to a shared target. Leaderboards are opt-in. The entries marked demo are sample households." |
| 2:00 | Resources: roof 45 m² | "A rooftop estimate with ranges, a payback range, and the assumptions shown. Subsidy figures are flagged unverified, with the official portal one click away." |
| 2:15 | Cleanest Hour: move the geyser out of 7 PM | "Moving heavy appliances out of the evening peak shows the modelled emissions drop. It is a model, and says so." |
| 2:25 | Admin: sign in | "For GEDA: area totals only, and any area under five households is hidden so no one can be singled out." |
| 2:35 | Close | "LiFE-OS: a footprint, savings, a solar plan and community action, from one bill." |

Tips: start with `npm run dev` on a fresh `.data` folder (delete it to reset), and keep the admin access code from your `.env.local` ready.

## Questions judges may ask, and honest answers

- **Is the data real?** Households you create are real records. The 18 "(demo)" households are sample data, labelled everywhere.
- **Where do the emission factor and subsidy come from?** They are planning assumptions kept in one file each and shown in the UI. Update them from the current CEA release and the PM Surya Ghar portal before official use.
- **Is Cleanest Hour live grid data?** No. It is an illustrative hourly curve and says so.
- **How do you stop cheating?** Points are computed on the server, each task rewards once per window by a database unique key, and there is a daily cap. Tasks are self-reported, which is a known limit.
- **How does it scale?** Stateless domain logic, idempotent writes, indexed queries. Admin and leaderboard aggregates move to SQL views next.
