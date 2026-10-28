import { apiRequest } from "@/lib/utils/api-client";
import type { Challenge, CommunitySummary, LeaderboardEntry } from "@/types/domain";

export function getChallenges() { return apiRequest<{ challenges: Challenge[] }>("/api/community/challenges"); }
export function joinChallenge(challengeId: string) { return apiRequest<{ challengeId: string; joined: true }>(`/api/community/challenges/${encodeURIComponent(challengeId)}/join`, { method: "POST" }); }
export function getLeaderboard(limit = 20) { return apiRequest<{ entries: LeaderboardEntry[] }>(`/api/community/leaderboard?limit=${limit}`); }
export function getCommunitySummary() { return apiRequest<CommunitySummary>("/api/community/me"); }
