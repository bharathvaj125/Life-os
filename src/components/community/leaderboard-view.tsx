"use client";

import { useState, useMemo } from "react";
import type { LeaderRow } from "@/services/community";
import { GUJARAT_DISTRICT_LIST, regionLabel } from "@/lib/calculations/aggregate";
import { num } from "@/lib/format";
import { TermHelp } from "@/components/ui/term-help";
import { MapPin, Search, ShieldCheck } from "lucide-react";

interface LeaderboardViewProps {
  allRows: LeaderRow[];
  userPrefix: string;
  userRegion: string;
}

type Scope = "all" | "local" | string; // prefix string
type Tier = "all" | "smart_meter" | "bill_verified" | "self_reported";

const medalColors: Record<number, string> = {
  1: "#D97706", // Gold
  2: "#6B7280", // Silver
  3: "#B45309", // Bronze
};

export function LeaderboardView({ allRows, userPrefix, userRegion }: LeaderboardViewProps) {
  const [scope, setScope] = useState<Scope>("local");
  const [tier, setTier] = useState<Tier>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return allRows
      .filter((r) => {
        // Scope filter
        if (scope === "local" && r.pincodePrefix !== userPrefix) return false;
        if (scope !== "all" && scope !== "local" && r.pincodePrefix !== scope) return false;

        // Tier filter
        if (tier !== "all" && r.verificationTier !== tier) return false;

        // Search filter
        if (search && !r.displayName.toLowerCase().includes(search.toLowerCase()) && !r.region.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }

        return true;
      })
      .map((r, i) => ({ ...r, displayRank: i + 1 }));
  }, [allRows, scope, tier, search, userPrefix]);

  const currentLabel =
    scope === "all"
      ? "Across All Gujarat"
      : scope === "local"
      ? `My Area (${userRegion} · ${userPrefix}xxx)`
      : `${regionLabel(scope)} District (${scope}xxx)`;

  return (
    <div style={{ background: "var(--card-bg)", border: "1.5px solid var(--sand-200)", borderRadius: "18px", padding: "24px", boxShadow: "0 4px 20px -2px rgba(11, 37, 25, 0.05)" }}>
      {/* Filters row */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
        {/* District & Region Selector */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--forest-800)", display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={14} /> Region:
          </span>

          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label="Filter leaderboard by region or district"
            style={{
              padding: "6px 12px",
              minHeight: "38px",
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: 600,
              background: "var(--sand-50)",
              border: "1.5px solid var(--sand-200)",
              cursor: "pointer",
            }}
          >
            <option value="local">📍 My Area ({userRegion})</option>
            <option value="all">🌐 All Gujarat (Statewide)</option>
            <optgroup label="Gujarat Districts">
              {GUJARAT_DISTRICT_LIST.map((d) => (
                <option key={d.prefix} value={d.prefix}>
                  {d.name} ({d.prefix}xxx)
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Verification Tier Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--forest-800)", display: "flex", alignItems: "center", gap: "4px", marginRight: "4px" }}>
            <ShieldCheck size={14} /> Trust Tier:
          </span>

          <button
            type="button"
            onClick={() => setTier("all")}
            className="chip"
            style={{
              cursor: "pointer",
              background: tier === "all" ? "var(--forest-900)" : "var(--sand-50)",
              color: tier === "all" ? "var(--on-accent)" : "var(--forest-800)",
              borderColor: tier === "all" ? "var(--forest-900)" : "var(--sand-200)",
            }}
          >
            All Tiers
          </button>

          <button type="button" className="chip" disabled title="Smart-meter confirmation is planned, so nobody holds this tier yet" style={{ cursor: "not-allowed", opacity: 0.6, background: "var(--sand-50)", color: "var(--muted-text)", borderColor: "var(--sand-200)" }}>
            🟢 Smart meter (planned)
          </button>

          <button
            type="button"
            onClick={() => setTier("bill_verified")}
            className="chip"
            style={{
              cursor: "pointer",
              background: tier === "bill_verified" ? "var(--surya-600)" : "var(--sand-50)",
              color: tier === "bill_verified" ? "var(--on-accent)" : "var(--forest-800)",
              borderColor: tier === "bill_verified" ? "var(--surya-600)" : "var(--sand-200)",
            }}
          >
            🟡 Bill-scanned
          </button>

          <button
            type="button"
            onClick={() => setTier("self_reported")}
            className="chip"
            style={{
              cursor: "pointer",
              background: tier === "self_reported" ? "var(--muted-text)" : "var(--sand-50)",
              color: tier === "self_reported" ? "var(--on-accent)" : "var(--muted-text)",
              borderColor: tier === "self_reported" ? "var(--muted-text)" : "var(--sand-200)",
            }}
          >
            ⚪ Self-Reported
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--forest-900)" }}>
            🏆 {currentLabel}
          </h3>
          <span style={{ fontSize: "12.5px", color: "var(--muted-text)" }}>
            Showing {filtered.length} opt-in citizen ranking{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Quick Search */}
        <div style={{ position: "relative", width: "200px" }}>
          <input
            type="text"
            placeholder="Search citizen or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 10px 6px 30px",
              minHeight: "34px",
              fontSize: "12.5px",
              borderRadius: "8px",
              border: "1px solid var(--sand-200)",
            }}
          />
          <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--muted-light)" }} />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--sand-50)", borderRadius: "12px", border: "1px dashed var(--sand-200)" }}>
          <p className="muted" style={{ margin: 0 }}>
            No citizens found in this district/tier category yet. Be the first to join!
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "65px" }}>Rank</th>
                <th>Citizen Name</th>
                <th>District / Area</th>
                <th>Trust Tier</th>
                <th>Rank Tier</th>
                <th style={{ textAlign: "right" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    Points <TermHelp termKey="points" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isMedal = r.displayRank <= 3;
                return (
                  <tr key={`${r.displayRank}-${r.displayName}`} className={r.isYou ? "you" : undefined}>
                    <td>
                      {isMedal ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            background: medalColors[r.displayRank],
                            color: "var(--on-accent)",
                            fontSize: "12px",
                            fontWeight: 800,
                          }}
                        >
                          {r.displayRank}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted-light)", fontWeight: 600 }}>#{r.displayRank}</span>
                      )}
                    </td>
                    <td>
                      <strong>{r.displayName}</strong>
                      {r.isYou ? (
                        <span className="chip surya" style={{ fontSize: "11px", marginLeft: "6px" }}>
                          You
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                        <MapPin size={12} style={{ color: "var(--muted-light)" }} /> {r.region}
                      </span>
                    </td>
                    <td>
                      {r.verificationTier === "smart_meter" ? (
                        <span className="chip" style={{ background: "var(--forest-50)", color: "var(--forest-800)", borderColor: "var(--forest-100)", fontSize: "11px" }}>
                          🟢 Smart Meter
                        </span>
                      ) : r.verificationTier === "bill_verified" ? (
                        <span className="chip" style={{ background: "var(--surya-50)", color: "var(--surya-700)", borderColor: "var(--surya-100)", fontSize: "11px" }}>
                          🟡 Bill-scanned
                        </span>
                      ) : (
                        <span className="chip" style={{ background: "var(--sand-50)", color: "var(--muted-text)", borderColor: "var(--sand-200)", fontSize: "11px" }}>
                          ⚪ Self-Reported
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: "11px" }}>
                        {r.level}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <strong style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--forest-900)", fontSize: "16px" }}>
                        {num(r.points)}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

