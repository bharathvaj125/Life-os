import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Administration" };

export default function Page() {
  return <PlaceholderPage title="Administration" description="A future workspace for platform management." planned="Authentication and role-based authorization must be implemented before any administrative data or operations are added. This public placeholder grants no administrative access." />;
}
