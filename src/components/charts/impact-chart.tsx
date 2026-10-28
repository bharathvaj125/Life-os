"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ImpactPoint = { label: string; kgCO2e: number };

// Future analytics can supply real measurements. No mock impact data is generated.
export function ImpactChart({ data }: { data: ImpactPoint[] }) {
  if (!data.length) return <p className="muted">No footprint measurements yet.</p>;
  return <div role="img" aria-label="Carbon footprint trend in kilograms of CO2 equivalent"><ResponsiveContainer width="100%" height={280}><LineChart data={data}><XAxis dataKey="label" /><YAxis unit=" kg" /><Tooltip /><Line type="monotone" dataKey="kgCO2e" name="kg CO₂e" stroke="#245d3f" /></LineChart></ResponsiveContainer></div>;
}
