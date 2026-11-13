import { TreePine, Bike, Coffee } from "lucide-react";
import { num } from "@/lib/format";

interface TangibleImpactProps {
  kgAvoided: number;
  kwhSaved?: number;
  inrSaved?: number;
  compact?: boolean;
}

export function TangibleImpact({ kgAvoided, kwhSaved, inrSaved, compact = false }: TangibleImpactProps) {
  // Conversions based on authoritative Indian standards:
  // 1 mature Neem/Peepal tree absorbs ~22 kg CO2 per year (~1.83 kg/month)
  const treesEquiv = Math.max(0.1, Math.round((kgAvoided / 1.83) * 10) / 10);
  
  // Electric two-wheeler (e.g. Ola / Ather): ~0.03 kWh/km => 1 kWh runs ~33 km
  const kwhBase = kwhSaved ?? (kgAvoided / 0.71);
  const evKm = Math.round(kwhBase * 33);
  
  // Everyday rupee equivalents: ~₹30 for 500ml milk packet or 3 cups of tea
  const milkPackets = inrSaved ? Math.round((inrSaved / 32) * 10) / 10 : null;

  if (compact) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", fontSize: "12.5px" }}>
        <span className="chip" style={{ background: "var(--forest-50)", color: "var(--forest-800)" }}>
          <TreePine size={13} /> {treesEquiv} tree-months CO₂ absorbed
        </span>
        <span className="chip" style={{ background: "var(--surya-50)", color: "var(--surya-700)" }}>
          <Bike size={13} /> ~{num(evKm)} km EV scooter range
        </span>
        {milkPackets && milkPackets > 1 ? (
          <span className="chip" style={{ background: "#FFFFFF", color: "var(--forest-900)" }}>
            <Coffee size={13} /> ₹{inrSaved} saved (~{milkPackets} milk packets)
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--forest-50), var(--sand-50))",
        border: "1.5px solid var(--forest-100)",
        borderRadius: "16px",
        padding: "20px 22px",
        margin: "18px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-700)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          🌱 Your Real-World Environmental Equivalence
        </span>
        <span style={{ fontSize: "12px", color: "var(--muted-light)" }}>
          Making abstract kilograms tangible
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
        <div style={{ background: "#FFFFFF", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sand-200)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--forest-50)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--forest-700)" }}>
            <TreePine size={20} />
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--forest-900)" }}>
              {treesEquiv}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
              Mature Neem tree-months
            </div>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sand-200)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--surya-50)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--surya-600)" }}>
            <Bike size={20} />
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--forest-900)" }}>
              {num(evKm)} km
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
              EV scooter clean range
            </div>
          </div>
        </div>

        {milkPackets && milkPackets >= 1 ? (
          <div style={{ background: "#FFFFFF", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--sand-200)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--terra-100)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--terra-600)" }}>
              <Coffee size={20} />
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--forest-900)" }}>
                ~{milkPackets} pkts
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
                Daily milk budget saved
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

