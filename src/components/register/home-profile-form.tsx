"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Choice } from "@/components/register/choice";
import { EquipmentPicker } from "@/components/register/equipment-picker";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { EMPTY_EQUIPMENT, HOME_TYPES, OWNERSHIP_OPTIONS, ROOF_OPTIONS } from "@/features/equipment/catalog";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";
import type { Equipment, HomeType, Ownership, RoofAccess } from "@/types";

interface Props {
  initial: { pincode: string; householdSize: number; homeType?: HomeType; ownership?: Ownership; roofAccess?: RoofAccess; equipment?: Equipment };
  /** Demo accounts are shared, so their home cannot be changed. */
  readOnly: boolean;
}

/** Change the home and the equipment. Saving updates which tips, tasks and tools the household sees. */
export function HomeProfileForm({ initial, readOnly }: Props) {
  const { pending, error, run } = useAction();
  const [saved, setSaved] = useState(false);
  const [pincode, setPincode] = useState(initial.pincode);
  const [size, setSize] = useState(String(initial.householdSize));
  const [homeType, setHomeType] = useState<HomeType | "">(initial.homeType ?? "");
  const [ownership, setOwnership] = useState<Ownership | "">(initial.ownership ?? "");
  const [roofAccess, setRoofAccess] = useState<RoofAccess | "">(initial.roofAccess ?? "");
  const [equipment, setEquipment] = useState<Equipment>(initial.equipment ?? EMPTY_EQUIPMENT);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    await run(
      () => callApi("/api/v1/profile/home", "PUT", { pincode, householdSize: size, homeType, ownership, roofAccess, equipment }),
      () => setSaved(true),
    );
  }

  return (
    <form className="form" onSubmit={save} style={{ maxWidth: "none" }}>
      <div className="form-grid">
        <Field label="PIN code" name="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required disabled={readOnly} />
        <Field label="People in your household" name="householdSize" type="number" min={1} max={20} value={size} onChange={(e) => setSize(e.target.value)} required disabled={readOnly} />
      </div>
      <Choice label="Type of home" options={HOME_TYPES} value={homeType} onPick={(v) => !readOnly && setHomeType(v)} />
      <Choice label="Ownership" options={OWNERSHIP_OPTIONS.map((o) => ({ ...o, hint: undefined }))} value={ownership} onPick={(v) => !readOnly && setOwnership(v)} />
      <Choice label="Roof access" options={ROOF_OPTIONS} value={roofAccess} onPick={(v) => !readOnly && setRoofAccess(v)} />
      <div>
        <p style={{ margin: "0 0 10px", fontWeight: 650, color: "var(--forest-900)", fontSize: "14px" }}>Equipment</p>
        <EquipmentPicker value={equipment} onChange={(next) => !readOnly && setEquipment(next)} />
      </div>

      <FormError message={error} />
      {saved ? (
        <div role="status" className="form-ok" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Check size={18} aria-hidden="true" /> Saved. Your tips, tasks and tools now match your home.
        </div>
      ) : null}
      {readOnly ? (
        <p className="muted" style={{ margin: 0 }}>This is a shared demo account, so its home is view only. Create your own account to set up your home.</p>
      ) : (
        <div>
          <Button type="submit" disabled={pending || !homeType || !ownership || !roofAccess} className="button-surya">
            {pending ? "Saving…" : "Save my home"}
          </Button>
        </div>
      )}
    </form>
  );
}
