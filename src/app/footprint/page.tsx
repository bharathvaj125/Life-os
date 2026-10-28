import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Carbon footprint" };

export default function Page() {
  return <PlaceholderPage title="Carbon footprint" description="Make sense of your everyday environmental impact." planned="Footprint inputs, transparent calculation assumptions, and history are planned." />;
}
