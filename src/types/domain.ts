export type CalculationEvidence = {
  formulaVersion: string; sourceUrl: string; sourcePeriod: string;
  assumptions: string[]; isEstimate: true;
};
export type FootprintInput = { periodStart: string; periodEnd: string; electricityKwh: number };
export type FootprintEntry = FootprintInput & {
  id: string; createdAt: string; isBaseline: boolean;
  periodDays: number; electricityKwhPerDay: number;
  // Null until an independently reviewed coefficient is configured. Never zero-fill.
  emissionsKgCO2e: number | null; emissionsKgCO2ePerDay: number | null;
  factorKgCO2ePerKwh: number | null; evidence: CalculationEvidence;
};
export type FootprintHistory = {
  entries: FootprintEntry[]; nextCursor: string | null; baseline: FootprintEntry | null;
  reductionPercent: number | null; reductionMetric: "electricityKwhPerDay";
};
export type DailyAction = { assignmentId: string; date: string; title: string; explanation: string; points: number; completedAt: string | null };
export type CompletionResult = { assignmentId: string; completedAt: string; awardedPoints: number; alreadyCompleted: boolean };
export type Challenge = { id: string; title: string; description: string; startsOn: string; endsOn: string; targetCompletions: number; completionCount: number; joined: boolean };
export type LeaderboardEntry = { rank: number; alias: string; points: number };
export type CommunitySummary = { alias: string; communityOptIn: boolean; totalPoints: number; currentStreakDays: number; completedTasks: number; timezone: "Asia/Kolkata" };
export type Resource = { id: string; title: string; description: string; category: "energy" | "solar" | "habits"; sourceUrl: string; reviewedOn: string | null };
export type SolarInput = { roofAreaM2: number; monthlyElectricityKwh: number };
export type SolarEstimate = { capacityKwp: number; annualGenerationKwh: number; evidence: CalculationEvidence };
