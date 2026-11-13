import type { VendorService } from "@/types";

export const VENDOR_SERVICES: { id: VendorService; label: string }[] = [
  { id: "rooftop-solar", label: "Rooftop solar" },
  { id: "solar-water-heater", label: "Solar water heater" },
  { id: "ev-charging", label: "EV charging" },
  { id: "energy-audit", label: "Energy audit" },
  { id: "efficient-appliances", label: "Efficient appliances" },
];

export const VENDOR_SERVICE_IDS = VENDOR_SERVICES.map((s) => s.id) as [VendorService, ...VendorService[]];

export const serviceLabel = (id: VendorService) => VENDOR_SERVICES.find((s) => s.id === id)?.label ?? id;

/** Official places to check a rooftop solar installer before paying anyone. */
export const OFFICIAL_VENDOR_CHECKS = [
  { title: "PM Surya Ghar national portal", note: "Registered and empanelled installers by state and district.", url: "https://pmsuryaghar.gov.in/" },
  { title: "PGVCL rooftop solar", note: "Empanelled vendor lists and procedure for Saurashtra and Kutch.", url: "https://pgvcl.com/solar_rooftop" },
  { title: "GEDA", note: "State agency for renewable energy programmes in Gujarat.", url: "https://geda.gujarat.gov.in/" },
];

export const VERIFY_STEPS = [
  "Find the installer on the PM Surya Ghar portal or on your electricity company's empanelled vendor list. A claim on this page is not proof.",
  "Ask for a written quote showing system size in kWp, panel and inverter make, warranty and who handles the net meter application.",
  "Do not pay the full amount upfront. The central subsidy is paid to your bank account after your electricity company inspects the plant.",
  "Compare at least two quotes, and check that the quoted size fits your roof area and monthly units using the calculator above.",
];
