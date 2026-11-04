"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";
import { Check, Shield } from "lucide-react";

export function JoinChallengeButton({ challengeId }: { challengeId: string }) {
  const { pending, error, run, router } = useAction();
  const [joined, setJoined] = useState(false);

  if (joined) {
    return (
      <span className="done-badge" style={{ marginTop: "12px", display: "inline-flex" }}>
        <Check size={16} /> Joined
      </span>
    );
  }

  return (
    <div style={{ marginTop: "12px" }}>
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            () => callApi(`/api/v1/challenges/${challengeId}/join`, "POST"),
            () => {
              setJoined(true);
              router.refresh();
            }
          )
        }
        className="button-surya"
        style={{ width: "100%", fontSize: "14px", padding: "10px 16px" }}
      >
        {pending ? "Joining…" : "Join This Challenge"}
      </Button>
      {error ? (
        <p role="alert" className="form-error" style={{ marginTop: "6px", fontSize: "12px" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function LeaderboardOptIn({ optedIn }: { optedIn: boolean }) {
  const { pending, error, run, router } = useAction();

  return (
    <div
      style={{
        background: "var(--forest-50)",
        border: "1px solid var(--forest-100)",
        borderRadius: "14px",
        padding: "16px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div>
        <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontWeight: 700, color: "var(--forest-900)" }}>
          <input
            type="checkbox"
            defaultChecked={optedIn}
            disabled={pending}
            onChange={(e) =>
              run(
                () => callApi("/api/v1/profile", "PATCH", { leaderboardOptIn: e.target.checked }),
                () => router.refresh()
              )
            }
          />
          Participate in Public Community Leaderboards
        </label>
        <div style={{ fontSize: "12.5px", color: "var(--muted-text)", marginLeft: "28px", marginTop: "2px" }}>
          Strict privacy guarantee: Only your chosen display name and total points are shown. Never your address, bills, or private breakdown.
        </div>
      </div>
      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "12px", color: "var(--forest-700)", fontWeight: 600 }}>
        <Shield size={14} /> Opt-in only · Fully anonymous by default
      </div>
      {error ? (
        <p role="alert" className="form-error" style={{ width: "100%", margin: "8px 0 0" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
