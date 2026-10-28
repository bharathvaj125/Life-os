import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Resources" };

export default function Page() {
  return <PlaceholderPage title="Resources" description="Learn about sustainable energy and rooftop solar." planned="Educational resources, solar awareness, and future integration points are planned." />;
}
