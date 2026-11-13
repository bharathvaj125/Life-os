"use client";

/** A labelled group of pick-one cards. */
export function Choice<T extends string>({ label, options, value, onPick }: { label: string; options: { value: T; label: string; hint?: string }[]; value: T | ""; onPick: (v: T) => void }) {
  return (
    <div>
      <p style={{ margin: "0 0 10px", fontWeight: 650, color: "var(--forest-900)", fontSize: "14px" }}>{label}</p>
      <div className="choice-grid">
        {options.map((o) => (
          <button key={o.value} type="button" className="choice-card" aria-pressed={value === o.value} onClick={() => onPick(o.value)}>
            <strong>{o.label}</strong>
            {o.hint ? <span>{o.hint}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
