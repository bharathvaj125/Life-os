# Measurement and estimation methods — v1

## Electricity footprint

Scope: **self-reported household electricity**, not total lifestyle emissions. A person's household-size input is profile context; it does not silently divide the household's usage or turn it into personal usage. Transport, food, waste, and embodied emissions are not estimated in this release.

- Inputs: inclusive `periodStart`/`periodEnd`, finite `electricityKwh` between 0 and 100,000. Dates are real calendar dates from 2000 onward, completed in Asia/Kolkata, and periods span 1–366 days.
- `periodDays = end − start + 1`.
- `electricityKwhPerDay = electricityKwh / periodDays`.
- If a reviewed factor applies to the entire period: `emissionsKgCO2e = electricityKwh × factorKgCO2ePerKwh` and daily emissions divide by period days.
- Without that reviewed factor, carbon/factor fields are **null**, not zero. Electricity tracking and energy-based progress still work.
- Progress: `(baseline daily kWh − latest daily kWh) / baseline daily kWh × 100`. Null before a post-baseline entry or when baseline daily kWh is zero. A negative percentage means increased consumption, not a calculation error.

The first saved entry is the baseline and is immutable. Later entries must be after its period and may not overlap other entries. Duplicate retry submissions return a conflict rather than create another measurement. Corrections/deletion are deliberately not exposed; discuss a reviewed correction flow before adding one.

The database computes/stores inputs and factor/evidence snapshots atomically. It locks the caller's profile for mutations and rechecks overlaps after obtaining the lock. A unique partial index prevents duplicate baselines. No client has direct footprint write grants. Pure TypeScript calculation helpers support tests; the database is authoritative for persisted values.

Do not infer reductions in actual emissions from task points. Do not compare raw totals from billing periods of different length. These are estimates from user input, not independently verified meter readings.

### Emissions coefficient configuration

No coefficient is seeded. Access to the CEA site was denied by the environment network policy during implementation. A familiar-looking example number is not a verified factor.

An administrator must review an appropriate official source (start with https://cea.nic.in/), record its version, units, period, applicability, source URL, and review timestamp, and insert it in `emission_factors`. The schema uses kg CO2e/kWh; if the source reports another unit, document the conversion. Do not relabel CO2-only data as CO2e without justification. Select a measurement validity range deliberately; publication year alone does not define it. At most one factor is active in this initial national-grid implementation.

`supabase/templates/activate-reviewed-factor.sql` provides a parameterized operator template. Neither users nor the application publish factors. Each entry snapshots the coefficient and evidence so later administrative changes do not rewrite history. Entries created without a coefficient stay energy-only; no hidden backfill runs. A regional factor catalog and explicit historical recalculation require a future reviewed migration/API change.

## Rooftop solar planning estimate

This is an **illustrative sizing scenario**, not a site survey, verified local yield model, installation quote, or subsidy eligibility decision. Its numeric assumptions are deliberately documented engineering inputs rather than claims copied from a provider.

- Usable roof area excludes structural/setback/shading exclusions supplied by the user.
- Roof-limited capacity: area / **10 m² per kWp**.
- Demand-limited capacity: monthly kWh × 12 / **1200 kWh per kWp per year**.
- Suggested scenario capacity: the smaller of these capacities.
- Annual scenario generation: capacity × 1200.
- Zero supplied demand returns zero capacity/generation, not a fictional saving.

Neither 10 m²/kWp nor 1200 kWh/kWp/year is asserted to be a verified Gujarat or Tamil Nadu forecast. The API repeats these assumptions in every response. Solar calculations do not use grid emissions factors. No financial savings are computed because no dated tariff/export-credit source was verified. Do not present the output as roof suitability approval.

Before using this as installation advice, validate location, roof conditions, shading, module design, regional yield, regulations, and current official programme information. Candidate official resources include https://mnre.gov.in/ and https://pmsuryaghar.gov.in/; retrieval was blocked during implementation. External weather/maps/solar APIs are not integrated or required for this local planning tool.

## Nudges, rewards, and community

- Two daily tasks are assigned using the Asia/Kolkata calendar date. First retrieval freezes that day's assignments; later input changes do not churn them.
- One task is a safe switch-off check; the second is a high-use appliance review when the latest measurement exceeds an explicitly heuristic 8 kWh/day threshold, otherwise a daylight task. This threshold is a product rule, not a clinical/official efficiency benchmark.
- No live grid data, live peak-hour forecast, or guaranteed savings are claimed. Daily task completion is self-reported.
- Task points are copied from server-managed definitions on assignment. Completion, its timestamp, and its ledger reward are written in one transaction. The user supplies only the assignment ID. Repeating a completed request returns the original reward/result without an additional ledger entry, even after the original task date has passed.
- New completions for expired tasks are rejected. A current streak includes consecutive completion dates ending today or yesterday; it resets after a missed full local day. Multiple completions on the same local day count as one streak day.
- Challenge progress counts completions after joining and within the challenge's date range. A completion can contribute to each challenge the user joined before that completion. Goals measure task counts, not verified carbon savings.
- Leaderboard ranking is all-time points descending with generated alias as a deterministic tie-breaker. It exposes only rank, generated alias, and points from opted-in profiles. Profile names, emails, user IDs, and exact locations are never in that response. Opting out removes leaderboard visibility immediately.
