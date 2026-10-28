import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Sustainable actions" };

export default function Page() {
  return <PlaceholderPage title="Sustainable actions" description="Build everyday habits for a lighter footprint." planned="Personalized nudges and action tracking are planned." />;
}
