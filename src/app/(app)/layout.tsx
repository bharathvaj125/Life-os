import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getViewer } from "@/lib/auth/viewer";

/** Every signed-in screen sits inside the shell (top bar, role menu). Visitors with no session go to the welcome screen. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  return <AppShell viewer={viewer}>{children}</AppShell>;
}
