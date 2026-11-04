"use client";

import { Button } from "@/components/ui/button";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export function JoinChallengeButton({ challengeId }: { challengeId: string }) {
  const { pending, error, run } = useAction();
  return (
    <>
      <Button type="button" disabled={pending} onClick={() => run(() => callApi(`/api/v1/challenges/${challengeId}/join`, "POST"))}>{pending ? "Joining…" : "Join challenge"}</Button>
      {error ? <p role="alert" className="form-error">{error}</p> : null}
    </>
  );
}

export function LeaderboardOptIn({ optedIn }: { optedIn: boolean }) {
  const { pending, error, run } = useAction();
  return (
    <div className="optin">
      <label>
        <input type="checkbox" checked={optedIn} disabled={pending} onChange={(e) => run(() => callApi("/api/v1/profile", "PATCH", { leaderboardOptIn: e.target.checked }))} />
        Show my name on leaderboards
      </label>
      <small>Off by default. Others only see your name and points, never your bills.</small>
      {error ? <p role="alert" className="form-error">{error}</p> : null}
    </div>
  );
}
