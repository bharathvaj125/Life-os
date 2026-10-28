// Planned feature contracts: no corresponding feature endpoints exist yet.
export type CalculationEvidence = {
  formulaVersion: string;
  sourceUrl: string;
  sourcePeriod: string;
  assumptions: string[];
  isEstimate: true;
};
export type FootprintInput = { periodStart: string; periodEnd: string; electricityKwh: number };
export type FootprintEntry = FootprintInput & {
  id: string; createdAt: string; isBaseline: boolean;
  periodDays: number; electricityKwhPerDay: number; emissionsKgCO2e: number;
  emissionsKgCO2ePerDay: number; factorKgCO2ePerKwh: number;
  evidence: CalculationEvidence;
};
export type FootprintHistory = {
  entries: FootprintEntry[];
  nextCursor: string | null;
  baseline: FootprintEntry | null;
  reductionPercent: number | null;
};
export type DailyAction = {
  assignmentId: string; date: string; title: string; explanation: string;
  points: number; completedAt: string | null;
};
export type CompletionResult = { assignmentId: string; completedAt: string; awardedPoints: number; alreadyCompleted: boolean };
export type Challenge = { id: string; title: string; description: string; startsOn: string; endsOn: string; targetCompletions: number; completionCount: number; joined: boolean };
// Public alias is opt-in and must never fall back to email, profile name, or user ID.
export type LeaderboardEntry = { rank: number; alias: string; points: number };
export type Resource = { id: string; title: string; description: string; category: "energy" | "solar" | "habits"; sourceUrl: string; reviewedOn: string };
export type SolarInput = { roofAreaM2: number; monthlyElectricityKwh: number };
export type SolarEstimate = { capacityKwp: number; annualGenerationKwh: number; evidence: CalculationEvidence };
