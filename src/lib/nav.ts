import type { Role } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  /** Name of a lucide icon, resolved in the dock component. */
  icon: string;
}

/**
 * What each role can reach from the bottom menu. A household never sees installer or administrator screens
 * and the other way round, and the server redirects anyone who types an address they should not use.
 */
export const NAV: Record<Role, NavItem[]> = {
  citizen: [
    { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
    { href: "/footprint", label: "Footprint", icon: "Leaf" },
    { href: "/actions", label: "Actions", icon: "ListChecks" },
    { href: "/schedule", label: "Cleanest hour", icon: "Clock" },
    { href: "/community", label: "Community", icon: "Users" },
    { href: "/resources", label: "Solar", icon: "Sun" },
    { href: "/vendors", label: "Vendors", icon: "Store" },
    { href: "/profile", label: "My home", icon: "House" },
  ],
  installer: [
    { href: "/installer", label: "Overview", icon: "LayoutDashboard" },
    { href: "/installer/listing", label: "My listing", icon: "Store" },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
    { href: "/admin/vendors", label: "Vendors", icon: "Store" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { citizen: "Household", installer: "Installer", admin: "Administrator" };
