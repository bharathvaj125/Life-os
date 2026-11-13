"use client";

import Link from "next/link";
import { House, LogOut } from "lucide-react";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

interface Props {
  name: string;
  roleLabel: string;
  /** Link to the home profile, shown for households only. */
  profileHref?: string;
}

/** Name, role and the way out. Signing out clears every kind of session and returns to the welcome screen. */
export function UserMenu({ name, roleLabel, profileHref }: Props) {
  const { pending, run, router } = useAction();
  return (
    <details className="user-menu">
      <summary aria-label={`Account menu for ${name}`}>
        <span className="user-avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase() || "?"}</span>
        <span className="user-meta">
          <strong>{name}</strong>
          <span>{roleLabel}</span>
        </span>
      </summary>
      <div className="menu-panel">
        {profileHref ? (
          <Link href={profileHref}>
            <House size={16} aria-hidden="true" /> My home and equipment
          </Link>
        ) : null}
        <button type="button" disabled={pending} onClick={() => run(() => callApi("/api/v1/session", "DELETE"), () => router.push("/"))}>
          <LogOut size={16} aria-hidden="true" /> Sign out
        </button>
      </div>
    </details>
  );
}
