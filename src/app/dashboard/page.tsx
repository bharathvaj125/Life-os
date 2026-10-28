import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return <PlaceholderPage title="Dashboard" description="Your sustainability journey, in one place." planned="Personal impact summaries and analytics will be added in a later phase." />;
}
