import type { Metadata } from "next";
import { Scheduler } from "@/components/schedule/scheduler";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Cleanest Hour" };

export default function SchedulePage() {
  return (
    <>
      <p className="eyebrow">CLEANEST HOUR</p>
      <h1>When you run it matters</h1>
      <p className="intro">Move heavy appliances out of the evening peak and see how the modelled emissions change. Rupee effects appear only if your own tariff has a peak surcharge.</p>
      <Card title="Plan your appliances"><Scheduler /></Card>
    </>
  );
}
