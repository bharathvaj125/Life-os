/**
 * Counts failed sign-ins in memory. This is enough for one server process (our deployment). Behind several
 * instances it would need a shared store such as Redis or a database table.
 */
/** Failures allowed against one email in the window. Strict, because it protects one account from guessing. */
export const MAX_FAILURES = 8;
/** Failures allowed from one network address. Looser, because a school, office or event Wi-Fi shares one address among many people. */
export const MAX_IP_FAILURES = 30;
export const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, number[]>();

const recent = (key: string, now: number) => (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

export function isBlocked(key: string, limit = MAX_FAILURES, now = Date.now()): boolean {
  return recent(key, now).length >= limit;
}

export function recordFailure(key: string, now = Date.now()): void {
  failures.set(key, [...recent(key, now), now]);
  // Keep the map from growing without bound under a flood of distinct keys.
  if (failures.size > 5000) for (const [k, times] of failures) if (!times.some((t) => now - t < WINDOW_MS)) failures.delete(k);
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
