import Link from "next/link";
import { Card } from "@/components/ui/card";

export function PlaceholderPage({ title, description, planned }: { title: string; description: string; planned: string }) {
  return <><p className="eyebrow">MISSION LiFE · PROJECT FOUNDATION</p><h1>{title}</h1><p className="intro">{description}</p><Card title="Coming next"><p>{planned}</p><p className="muted">This page is a scaffold. No activity is recorded and no live data is displayed.</p></Card><Link className="text-link" href="/">Back to overview →</Link></>;
}
