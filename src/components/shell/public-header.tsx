import Link from "next/link";
import { Leaf } from "lucide-react";
import { ThemeToggle } from "@/components/shell/theme-toggle";

/** Slim header for screens people see before signing in (registration, how it works). */
export function PublicHeader() {
  return (
    <header className="shell-top">
      <div className="shell-top-inner">
        <Link href="/" className="brand" aria-label="LiFE-OS welcome">
          <div className="brand-badge" aria-hidden="true">
            <Leaf size={22} />
          </div>
          <span>
            LiFE<span style={{ color: "var(--surya-600)" }}>-OS</span>
          </span>
        </Link>
        <div className="top-actions">
          <Link href="/about" className="text-link" style={{ fontSize: "14px" }}>
            How it works
          </Link>
          <ThemeToggle />
          <Link href="/" className="button button-outline" style={{ padding: "8px 16px", fontSize: "14px" }}>
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
