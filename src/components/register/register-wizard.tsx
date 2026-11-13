"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, House, Wrench } from "lucide-react";
import { Choice } from "@/components/register/choice";
import { EquipmentPicker } from "@/components/register/equipment-picker";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { EMPTY_EQUIPMENT, HOME_TYPES, OWNERSHIP_OPTIONS, ROOF_OPTIONS, describeEquipment } from "@/features/equipment/catalog";
import { VENDOR_SERVICES } from "@/features/vendors/catalog";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";
import type { Equipment, HomeType, Ownership, RoofAccess, VendorService } from "@/types";

type Kind = "citizen" | "installer";

const CITIZEN_STEPS = ["Account", "Your home", "Your bill", "Equipment", "Review"];
const INSTALLER_STEPS = ["Account", "Business", "Review"];

interface Form {
  displayName: string;
  email: string;
  password: string;
  pincode: string;
  householdSize: string;
  homeType: HomeType | "";
  ownership: Ownership | "";
  roofAccess: RoofAccess | "";
  electricityKwh: string;
  billAmountInr: string;
  equipment: Equipment;
  // installer
  businessName: string;
  city: string;
  businessPincode: string;
  services: VendorService[];
  phone: string;
  website: string;
  empanelmentClaim: string;
}

const START: Form = {
  displayName: "", email: "", password: "", pincode: "", householdSize: "4", homeType: "", ownership: "", roofAccess: "", electricityKwh: "", billAmountInr: "", equipment: EMPTY_EQUIPMENT,
  businessName: "", city: "", businessPincode: "", services: [], phone: "", website: "", empanelmentClaim: "",
};

/**
 * Sign-up for households and installers. Households say what they own before they ever see the app, so
 * every tip, task and tool can be limited to what applies to them. Nothing is saved until the last step.
 */
export function RegisterWizard({ initialKind }: { initialKind?: Kind }) {
  const [kind, setKind] = useState<Kind | null>(initialKind ?? null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(START);
  const { pending, error, run, router } = useAction();

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const steps = kind === "installer" ? INSTALLER_STEPS : CITIZEN_STEPS;
  const last = step === steps.length - 1;

  function next(e: React.FormEvent) {
    e.preventDefault();
    setStep((s) => s + 1);
  }

  async function create() {
    const account = { email: form.email, password: form.password };
    const call =
      kind === "installer"
        ? () =>
            callApi<{ home: string }>("/api/v1/register/installer", "POST", {
              ...account,
              name: form.businessName,
              city: form.city,
              pincode: form.businessPincode,
              services: form.services,
              phone: form.phone,
              website: form.website,
              empanelmentClaim: form.empanelmentClaim,
            })
        : () =>
            callApi<{ home: string }>("/api/v1/register/citizen", "POST", {
              ...account,
              displayName: form.displayName,
              pincode: form.pincode,
              householdSize: form.householdSize,
              homeType: form.homeType,
              ownership: form.ownership,
              roofAccess: form.roofAccess,
              equipment: form.equipment,
              electricityKwh: form.electricityKwh,
              billAmountInr: form.billAmountInr,
            });
    await run(call, (data) => router.push(data.home));
  }

  if (!kind) {
    return (
      <div className="wizard">
        <p className="eyebrow">Create an account</p>
        <h1>Who is signing up?</h1>
        <p className="intro">Pick the one that fits. Each gets its own screens, and you only see what is meant for you.</p>
        <div className="choice-grid">
          <button type="button" className="choice-card" aria-pressed={false} onClick={() => setKind("citizen")}>
            <House size={22} style={{ color: "var(--surya-600)" }} aria-hidden="true" />
            <strong>A household</strong>
            <span>Track your footprint, get tips for the equipment you own, join community goals and plan rooftop solar.</span>
          </button>
          <button type="button" className="choice-card" aria-pressed={false} onClick={() => setKind("installer")}>
            <Wrench size={22} style={{ color: "var(--surya-600)" }} aria-hidden="true" />
            <strong>A solar installer or supplier</strong>
            <span>List your business for citizens to find and see how much rooftop demand there is in your area.</span>
          </button>
        </div>
        <p className="muted" style={{ marginTop: "22px" }}>GEDA administrators sign in from the welcome screen with their access code.</p>
      </div>
    );
  }

  const toggleService = (s: VendorService) => set({ services: form.services.includes(s) ? form.services.filter((x) => x !== s) : [...form.services, s] });
  const back = () => (step === 0 ? setKind(initialKind ? kind : null) : setStep((s) => s - 1));

  return (
    <div className="wizard">
      <p className="eyebrow">{kind === "installer" ? "Register your business" : "Create your household"}</p>
      <h1>{steps[step]}</h1>
      <div className="wizard-progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((s, i) => (
          <i key={s} className={i <= step ? "done" : ""} />
        ))}
      </div>

      {/* ---------- Account ---------- */}
      {step === 0 ? (
        <form className="form" onSubmit={next} style={{ maxWidth: "none" }}>
          {kind === "citizen" ? <Field label="Your name" name="displayName" value={form.displayName} onChange={(e) => set({ displayName: e.target.value })} required minLength={2} maxLength={40} autoComplete="name" placeholder="e.g. Aarav Patel" hint="Only shown on community leaderboards if you opt in." /> : null}
          <div className="form-grid">
            <Field label="Email" name="email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} required maxLength={120} autoComplete="email" />
            <Field label="Password" name="password" type="password" value={form.password} onChange={(e) => set({ password: e.target.value })} required minLength={8} maxLength={128} autoComplete="new-password" hint="At least 8 characters." />
          </div>
          <Actions step={step} back={back} />
        </form>
      ) : null}

      {/* ---------- Household: home ---------- */}
      {kind === "citizen" && step === 1 ? (
        <form className="form" onSubmit={(e) => (form.homeType && form.ownership && form.roofAccess ? next(e) : e.preventDefault())} style={{ maxWidth: "none" }}>
          <div className="form-grid">
            <Field label="PIN code" name="pincode" value={form.pincode} onChange={(e) => set({ pincode: e.target.value })} inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required placeholder="e.g. 380015" hint="Connects you to local goals and today's weather." />
            <Field label="People in your household" name="householdSize" type="number" min={1} max={20} value={form.householdSize} onChange={(e) => set({ householdSize: e.target.value })} required />
          </div>
          <Choice label="Type of home" options={HOME_TYPES} value={form.homeType} onPick={(v) => set({ homeType: v })} />
          <Choice label="Ownership" options={OWNERSHIP_OPTIONS.map((o) => ({ ...o, hint: undefined }))} value={form.ownership} onPick={(v) => set({ ownership: v })} />
          <Choice label="Roof access" options={ROOF_OPTIONS} value={form.roofAccess} onPick={(v) => set({ roofAccess: v })} />
          {!(form.homeType && form.ownership && form.roofAccess) ? <p className="muted" style={{ margin: 0, fontSize: "13px" }}>Pick one option in each group to continue.</p> : null}
          <Actions step={step} back={back} />
        </form>
      ) : null}

      {/* ---------- Household: bill ---------- */}
      {kind === "citizen" && step === 2 ? (
        <form className="form" onSubmit={next} style={{ maxWidth: "none" }}>
          <p className="muted" style={{ margin: 0 }}>Last month&apos;s electricity bill gives us your starting footprint. You can add more months later.</p>
          <div className="form-grid">
            <Field label="Electricity units (kWh)" name="electricityKwh" type="number" min={1} step="any" value={form.electricityKwh} onChange={(e) => set({ electricityKwh: e.target.value })} required placeholder="e.g. 282" hint="Printed as Units or kWh on your bill." />
            <Field label="Bill amount (₹, optional)" name="billAmountInr" type="number" min={0} step="any" value={form.billAmountInr} onChange={(e) => set({ billAmountInr: e.target.value })} placeholder="e.g. 1930" hint="Lets us show savings in rupees at your own rate." />
          </div>
          <Actions step={step} back={back} />
        </form>
      ) : null}

      {/* ---------- Household: equipment ---------- */}
      {kind === "citizen" && step === 3 ? (
        <form className="form" onSubmit={next} style={{ maxWidth: "none" }}>
          <p className="muted" style={{ margin: 0 }}>Tick what you have. Tips, daily tasks and tools will only cover these, so you never see advice for things you do not own.</p>
          <EquipmentPicker value={form.equipment} onChange={(equipment) => set({ equipment })} />
          <Actions step={step} back={back} />
        </form>
      ) : null}

      {/* ---------- Installer: business ---------- */}
      {kind === "installer" && step === 1 ? (
        <form className="form" onSubmit={(e) => (form.services.length ? next(e) : e.preventDefault())} style={{ maxWidth: "none" }}>
          <Field label="Business name" name="businessName" value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} required minLength={3} maxLength={80} autoComplete="organization" />
          <div className="form-grid">
            <Field label="City" name="city" value={form.city} onChange={(e) => set({ city: e.target.value })} required minLength={2} maxLength={40} autoComplete="address-level2" />
            <Field label="PIN code" name="businessPincode" value={form.businessPincode} onChange={(e) => set({ businessPincode: e.target.value })} inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required autoComplete="postal-code" />
          </div>
          <div>
            <p style={{ margin: "0 0 10px", fontWeight: 650, color: "var(--forest-900)", fontSize: "14px" }}>What do you offer?</p>
            <div className="choice-grid">
              {VENDOR_SERVICES.map((s) => (
                <button key={s.id} type="button" className="choice-card" aria-pressed={form.services.includes(s.id)} onClick={() => toggleService(s.id)}>
                  <strong>{s.label}</strong>
                </button>
              ))}
            </div>
            {!form.services.length ? <p className="muted" style={{ margin: "10px 0 0", fontSize: "13px" }}>Pick at least one.</p> : null}
          </div>
          <div className="form-grid">
            <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => set({ phone: e.target.value })} hint="10 digits. Add this or a website." />
            <Field label="Website" name="website" type="url" maxLength={200} value={form.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://" />
          </div>
          <Field label="Empanelment or registration ID (optional)" name="empanelmentClaim" maxLength={120} value={form.empanelmentClaim} onChange={(e) => set({ empanelmentClaim: e.target.value })} hint="Shown as self-declared. Citizens are told to verify it on the official lists." />
          <Actions step={step} back={back} />
        </form>
      ) : null}

      {/* ---------- Review ---------- */}
      {last ? (
        <div>
          <ul className="summary-list">
            <li><span>Email</span><strong>{form.email}</strong></li>
            {kind === "citizen" ? (
              <>
                <li><span>Name</span><strong>{form.displayName}</strong></li>
                <li><span>Home</span><strong>{HOME_TYPES.find((h) => h.value === form.homeType)?.label} · {OWNERSHIP_OPTIONS.find((o) => o.value === form.ownership)?.label.toLowerCase()} · PIN {form.pincode} · {form.householdSize} people</strong></li>
                <li><span>Roof</span><strong>{ROOF_OPTIONS.find((r) => r.value === form.roofAccess)?.label}</strong></li>
                <li><span>Last bill</span><strong>{form.electricityKwh} kWh{form.billAmountInr ? ` · ₹${form.billAmountInr}` : ""}</strong></li>
                <li><span>Equipment</span><strong>{describeEquipment(form.equipment).join(", ") || "None selected"}</strong></li>
              </>
            ) : (
              <>
                <li><span>Business</span><strong>{form.businessName}</strong></li>
                <li><span>Where</span><strong>{form.city} · {form.businessPincode}</strong></li>
                <li><span>Offers</span><strong>{form.services.map((s) => VENDOR_SERVICES.find((v) => v.id === s)?.label).join(", ")}</strong></li>
                <li><span>Contact</span><strong>{[form.phone, form.website].filter(Boolean).join(" · ")}</strong></li>
              </>
            )}
          </ul>
          {kind === "installer" ? <p className="muted" style={{ marginTop: "14px", fontSize: "13.5px" }}>Your listing is reviewed by an administrator before citizens can see it.</p> : null}
          <div style={{ marginTop: "16px" }}>
            <FormError message={error} />
          </div>
          <div className="wizard-actions">
            <Button type="button" className="button-outline" onClick={back} disabled={pending}>
              <ArrowLeft size={16} aria-hidden="true" /> Back
            </Button>
            <Button type="button" className="button-surya" onClick={create} disabled={pending}>
              {pending ? "Creating…" : kind === "installer" ? "Register my business" : "Create my account"} <Check size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Actions({ step, back }: { step: number; back: () => void }) {
  return (
    <div className="wizard-actions">
      <Button type="button" className="button-outline" onClick={back}>
        <ArrowLeft size={16} aria-hidden="true" /> {step === 0 ? "Change type" : "Back"}
      </Button>
      <Button type="submit" className="button-surya">
        Continue <ArrowRight size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
