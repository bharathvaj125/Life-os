import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { MAX_FAILURES, MAX_IP_FAILURES, WINDOW_MS, clearFailures, isBlocked, recordFailure } from "@/lib/auth/rate-limit";
import { accountSchema, loginSchema, onboardingSchema } from "@/lib/validation";

const household = { displayName: "Aarav Patel", pincode: "380015", householdSize: "4", electricityKwh: "240" };

describe("password hashing", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterz", hash)).toBe(false);
  });
  it("salts every hash, so the same password never produces the same string", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password"), hashPassword("same-password")]);
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(a).not.toContain("same-password");
  });
  it("rejects malformed stored values instead of throwing", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "plain$text")).toBe(false);
    expect(await verifyPassword("x", "scrypt$1$1$1$only-salt")).toBe(false);
  });
});

describe("sign-in rate limit", () => {
  it("blocks after the maximum number of failures and recovers after the window", () => {
    const key = "test:block";
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_FAILURES - 1; i++) recordFailure(key, t0 + i);
    expect(isBlocked(key, MAX_FAILURES, t0 + 100)).toBe(false);
    recordFailure(key, t0 + 200);
    expect(isBlocked(key, MAX_FAILURES, t0 + 300)).toBe(true);
    expect(isBlocked(key, MAX_FAILURES, t0 + WINDOW_MS + 1000)).toBe(false);
  });
  it("allows a shared network address far more failures than a single account", () => {
    const key = "test:shared-wifi";
    for (let i = 0; i < MAX_FAILURES + 5; i++) recordFailure(key);
    expect(isBlocked(key, MAX_FAILURES)).toBe(true);
    expect(isBlocked(key, MAX_IP_FAILURES)).toBe(false);
  });
  it("is cleared by a successful sign-in", () => {
    const key = "test:clear";
    for (let i = 0; i < MAX_FAILURES; i++) recordFailure(key);
    expect(isBlocked(key)).toBe(true);
    clearFailures(key);
    expect(isBlocked(key)).toBe(false);
  });
  it("keeps separate counts per key", () => {
    for (let i = 0; i < MAX_FAILURES; i++) recordFailure("test:a");
    expect(isBlocked("test:b")).toBe(false);
  });
});

describe("account validation", () => {
  it("lets onboarding stay anonymous, and lower-cases an email when one is given", () => {
    expect(onboardingSchema.safeParse({ ...household, email: "", password: "" }).success).toBe(true);
    const parsed = onboardingSchema.parse({ ...household, email: "  Aarav@Example.COM ", password: "longenough" });
    expect(parsed.email).toBe("aarav@example.com");
  });
  it("needs email and password together", () => {
    expect(onboardingSchema.safeParse({ ...household, email: "a@b.co", password: "" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...household, email: "", password: "longenough" }).success).toBe(false);
  });
  it("rejects short passwords and bad emails", () => {
    expect(accountSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
    expect(accountSchema.safeParse({ email: "not-an-email", password: "longenough" }).success).toBe(false);
    expect(accountSchema.safeParse({ email: "a@b.co", password: "longenough" }).success).toBe(true);
  });
  it("login only needs a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
