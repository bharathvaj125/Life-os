import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Community" };

export default function Page() {
  return <PlaceholderPage title="Community" description="Take small steps toward shared goals." planned="Community challenges, participation, and gamification are planned." />;
}
