"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ImpactPoint = { label: string; kgCO2e: number };

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid var(--sand-200)",
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: "0 6px 20px -2px rgba(11, 37, 25, 0.12)",
        }}
      >
        <p style={{ margin: 0, fontSize: "12px", color: "var(--muted-text)", fontWeight: 600 }}>
          {label}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "17px",
            fontWeight: 700,
            fontFamily: "JetBrains Mono, monospace",
            color: "var(--forest-900)",
          }}
        >
          {payload[0].value} <span style={{ fontSize: "12px", fontWeight: 500 }}>kg CO₂e</span>
        </p>
      </div>
    );
  }
  return null;
}

export function ImpactChart({ data }: { data: ImpactPoint[] }) {
  if (!data.length) {
    return (
      <div
        style={{
          padding: "48px 20px",
          textAlign: "center",
          background: "var(--sand-50)",
          borderRadius: "12px",
          border: "1px dashed var(--sand-200)",
        }}
      >
        <p className="muted" style={{ margin: 0 }}>
          No historical footprint data recorded yet. Submit your first bill to see your trend curve.
        </p>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label="Carbon footprint trend in kilograms of CO2 equivalent"
      style={{ width: "100%", height: 280, marginTop: "8px" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="impactGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--forest-700)" stopOpacity={0.28} />
              <stop offset="95%" stopColor="var(--forest-700)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE9DE" />
          <XAxis
            dataKey="label"
            stroke="#8E9B93"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "#E2DAD0" }}
          />
          <YAxis
            stroke="#8E9B93"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            unit=" kg"
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="kgCO2e"
            name="Emissions"
            stroke="var(--forest-800)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#impactGradient)"
            activeDot={{
              r: 6,
              fill: "var(--surya-600)",
              stroke: "#FFFFFF",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
