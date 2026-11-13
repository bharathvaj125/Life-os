"use client";

import { BatteryCharging, Bike, Car, CookingPot, Droplets, Flame, Minus, Plug, Plus, Snowflake, SunMedium, Waves, WashingMachine, Wind, type LucideIcon } from "lucide-react";
import { EQUIPMENT_TOGGLES, EV_OPTIONS } from "@/features/equipment/catalog";
import type { Equipment } from "@/types";

const ICONS: Record<string, LucideIcon> = { Droplets, WashingMachine, Wind, Waves, CookingPot, Flame, Car, Bike, SunMedium, BatteryCharging };

interface Props {
  value: Equipment;
  onChange: (next: Equipment) => void;
}

/** The equipment checklist. Used by the registration wizard and by the "My home" page, so both look and behave the same. */
export function EquipmentPicker({ value, onChange }: Props) {
  const set = (patch: Partial<Equipment>) => onChange({ ...value, ...patch });

  return (
    <div style={{ display: "grid", gap: "22px" }}>
      <div className="equip-item" style={{ cursor: "default", justifyContent: "space-between", flexWrap: "wrap" }} data-pressed={value.acCount > 0}>
        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="equip-icon"><Snowflake size={20} aria-hidden="true" /></span>
          <span>
            <strong>Air conditioners</strong>
            <span className="sub">How many ACs do you run?</span>
          </span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <button type="button" className="icon-button" aria-label="Fewer air conditioners" disabled={value.acCount <= 0} onClick={() => set({ acCount: Math.max(0, value.acCount - 1) })}>
            <Minus size={16} aria-hidden="true" />
          </button>
          <strong aria-live="polite" style={{ minWidth: "22px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: "18px" }}>{value.acCount}</strong>
          <button type="button" className="icon-button" aria-label="More air conditioners" disabled={value.acCount >= 10} onClick={() => set({ acCount: Math.min(10, value.acCount + 1) })}>
            <Plus size={16} aria-hidden="true" />
          </button>
        </span>
      </div>

      <div className="equip-grid">
        {EQUIPMENT_TOGGLES.map((item) => {
          const Icon = ICONS[item.icon] ?? Plug;
          const on = value[item.key];
          return (
            <button key={item.key} type="button" className="equip-item" aria-pressed={on} onClick={() => set({ [item.key]: !on } as Partial<Equipment>)}>
              <span className="equip-icon"><Icon size={20} aria-hidden="true" /></span>
              <span>
                <strong>{item.label}</strong>
                <span className="sub">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <p style={{ margin: "0 0 10px", fontWeight: 650, color: "var(--forest-900)", fontSize: "14px" }}>Electric vehicle</p>
        <div className="choice-grid">
          {EV_OPTIONS.map((o) => (
            <button key={o.value} type="button" className="choice-card" aria-pressed={value.ev === o.value} onClick={() => set({ ev: o.value })}>
              <strong style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Plug size={16} aria-hidden="true" /> {o.label}
              </strong>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
