import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  /** Lets other pages link straight to this card. */
  id?: string;
}

export function Card({ title, children, className = "", action, badge, icon, id }: CardProps) {
  return (
    <section id={id} className={`card ${className}`.trim()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {icon}
          <h2 style={{ margin: 0 }}>{title}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {badge}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}
