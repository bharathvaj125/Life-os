import type { Metadata } from "next";
import { EyeOff, MapPin, TrendingUp } from "lucide-react";
import { LeafletMap, type MapMarker } from "@/components/maps/leaflet-map";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/field";
import { MIN_GROUP_SIZE, regionOf } from "@/lib/calculations/aggregate";
import { requireViewer } from "@/lib/auth/viewer";
import { areaCentre } from "@/lib/maps/locate";
import { getRepository } from "@/lib/store";
import { getDemand } from "@/services/installer";

export const metadata: Metadata = { title: "Installer: local demand" };

export default async function InstallerDemandPage() {
  const { user } = await requireViewer("installer");
  if (!user) return null;
  const demand = await getDemand(user);
  const prefix = regionOf(user.pincode);
  const centre = areaCentre(prefix);
  // How many approved businesses already serve this area, counted by the first three PIN digits.
  const vendors = (await getRepository().listVendors()).filter((v) => v.status === "approved" && regionOf(v.pincode) === prefix);
  const markers: MapMarker[] = centre
    ? [{ id: prefix, position: centre, kind: "bubble", tone: demand.visible ? "green" : "grey", radius: demand.visible ? Math.min(34, 12 + (demand.households ?? 0) * 2) : 10, title: demand.areaLabel, lines: demand.visible ? [`${demand.households} households`, `${demand.solarFit} worth a conversation`] : [`Fewer than ${MIN_GROUP_SIZE} households, so no numbers are shown`] }]
    : [];

  return (
    <>
      <p className="eyebrow">Installer · Local demand</p>
      <h1>Rooftop solar demand around {demand.areaLabel}</h1>
      <p className="intro">Area totals from households using LiFE-OS. Individual households are never listed, and an area with fewer than {MIN_GROUP_SIZE} households shows no numbers at all.</p>

      {demand.visible ? (
        <section className="stats" aria-label="Local demand">
          <Stat label="Households using LiFE-OS" value={demand.households} note={`In ${demand.areaLabel}`} />
          <Stat label="Worth a conversation" value={demand.solarFit} note="Use 250 kWh or more, can use a roof, no solar yet" tone="good" />
          <Stat label="Average monthly use" value={`${demand.avgKwh} kWh`} note="Latest bill of each household" />
          <Stat label="Approved installers here" value={vendors.length} note="Listed in this area, including you if approved" />
        </section>
      ) : (
        <Card title="Not enough households yet" icon={<EyeOff size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ margin: 0 }}>Fewer than five households in {demand.areaLabel} use LiFE-OS so far. To protect their privacy, numbers appear once at least five do.</p>
        </Card>
      )}

      {markers.length ? (
        <Card title="Your area" icon={<MapPin size={20} className="card-icon" style={{ margin: 0 }} />}>
          <LeafletMap markers={markers} height={320} label="Map of your area" />
          <p className="muted" style={{ margin: "10px 0 0", fontSize: "12.5px" }}>The circle sits at the centre of the area and grows with the number of households. A grey circle means too few households to show numbers.</p>
        </Card>
      ) : null}

      <Card title="What &quot;worth a conversation&quot; means" icon={<TrendingUp size={20} className="card-icon surya" style={{ margin: 0 }} />}>
        <p style={{ margin: 0 }}>A household counts when its latest bill is 250 kWh a month or more, it has some roof access, and it does not already have rooftop solar. It is a rough sign of fit, not a lead list. Nobody is contacted through this page.</p>
      </Card>
    </>
  );
}
