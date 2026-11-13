"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Building2, ExternalLink, LocateFixed, MapPin, MessageSquare, Phone, Search, ShieldCheck } from "lucide-react";
import { LeafletMap, type MapFocus, type MapMarker } from "@/components/maps/leaflet-map";
import { QuoteRequestForm } from "@/components/vendors/quote-request-form";
import { VENDOR_SERVICES, serviceLabel } from "@/features/vendors/catalog";
import { distanceKm, findPlace, type Place } from "@/lib/maps/geo";
import type { VendorService } from "@/types";

export type EntryKind = "installer" | "official" | "company" | "sample";

export interface ExplorerVendor {
  id: string;
  name: string;
  city: string;
  pincode: string;
  services: VendorService[];
  kind: EntryKind;
  phone?: string;
  website?: string;
  claim?: string;
  sourceUrl?: string;
  verifiedOn?: string;
  verifiedNote?: string;
  /** The demo installer account: it can take a request, but it is not a real business. */
  demo?: boolean;
  /** A registered installer with an account here, so a household can send a request. */
  canRequest: boolean;
  position: [number, number];
}

interface Props {
  vendors: ExplorerVendor[];
  home: { position: [number, number]; pincode: string };
  initialService?: VendorService;
}

const KIND_LABEL: Record<EntryKind, string> = { installer: "Registered installer", official: "Official body", company: "Company, public information", sample: "Sample listing" };
const RADII = [10, 25, 50, 100, 250];

function toneOf(v: ExplorerVendor): MapMarker["tone"] {
  if (v.kind === "sample") return "grey";
  if (v.kind === "official" || v.kind === "company") return "blue";
  return v.verifiedOn ? "green" : "amber";
}

/**
 * The vendor directory as a map and a list that move together. Search by PIN code or place (or use your own
 * location), pick how far to look, and the list is sorted by distance. Sample listings are hidden unless asked for.
 */
export function VendorExplorer({ vendors, home, initialService }: Props) {
  const [service, setService] = useState<VendorService | "">(initialService ?? "");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState<number>(0);
  const [showSamples, setShowSamples] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [requestFor, setRequestFor] = useState<string | null>(null);

  const centre = place?.position ?? home.position;

  const rows = useMemo(() => {
    return vendors
      .filter((v) => (showSamples || v.kind !== "sample") && (!service || v.services.includes(service)))
      .map((v) => ({ v, km: distanceKm(centre, v.position) }))
      .filter((r) => radius === 0 || r.km <= radius)
      .sort((a, b) => a.km - b.km);
  }, [vendors, service, radius, showSamples, centre]);

  const markers = useMemo<MapMarker[]>(() => {
    const pins: MapMarker[] = rows.map(({ v, km }) => ({
      id: v.id,
      position: v.position,
      kind: "pin",
      tone: toneOf(v),
      title: v.name,
      lines: [`${v.city} · ${v.pincode}`, `${Math.round(km)} km away`, v.services.map(serviceLabel).join(", "), KIND_LABEL[v.kind]],
      link: v.website && v.kind !== "sample" ? { href: v.website, text: "Website" } : undefined,
    }));
    pins.push({ id: "centre", position: centre, kind: "bubble", tone: "you", radius: 10, title: place ? place.label : "Your area", lines: [place ? (place.precision === "exact" ? "Searched place" : "City centre for this PIN prefix") : `PIN ${home.pincode}`] });
    return pins;
  }, [rows, centre, place, home.pincode]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) {
      setPlace(null);
      setNote(null);
      setFocus({ position: home.position, zoom: 9, key: `home-${Date.now()}` });
      return;
    }
    setSearching(true);
    setNote(null);
    const found = await findPlace(q);
    setSearching(false);
    if (!found) {
      setNote("We could not find that place. Try a 6-digit PIN code or the name of a city in Gujarat.");
      return;
    }
    setPlace(found);
    setFocus({ position: found.position, zoom: 10, key: `${found.label}-${Date.now()}` });
    if (found.precision === "area") setNote("The map service did not know this exact PIN, so the centre of its city is used.");
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setNote("This browser cannot share a location. Search by PIN code instead.");
    setNote("Asking your browser for your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: Place = { position: [pos.coords.latitude, pos.coords.longitude], label: "Your location", precision: "exact" };
        setPlace(p);
        setQuery("");
        setNote(null);
        setFocus({ position: p.position, zoom: 11, key: `me-${Date.now()}` });
      },
      () => setNote("Location was not shared. Search by PIN code instead."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  const nearest = rows[0];

  return (
    <>
      <form onSubmit={search} className="vendor-search" aria-label="Find vendors">
        <div className="field">
          <label htmlFor="v-service">Service</label>
          <select id="v-service" value={service} onChange={(e) => setService(e.target.value as VendorService | "")}>
            <option value="">All services</option>
            {VENDOR_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="v-place">PIN code or place</label>
          <input id="v-place" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. 380009 or Rajkot" maxLength={60} inputMode="search" />
        </div>
        <div className="field">
          <label htmlFor="v-radius">How far</label>
          <select id="v-radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            <option value={0}>Any distance</option>
            {RADII.map((r) => (
              <option key={r} value={r}>Within {r} km</option>
            ))}
          </select>
        </div>
        <div className="vendor-search-actions">
          <button type="submit" className="button" disabled={searching}>
            <Search size={16} aria-hidden="true" /> {searching ? "Searching…" : "Search"}
          </button>
          <button type="button" className="button button-outline" onClick={useMyLocation}>
            <LocateFixed size={16} aria-hidden="true" /> Use my location
          </button>
        </div>
      </form>

      <label className="vendor-sample-toggle">
        <input type="checkbox" checked={showSamples} onChange={(e) => setShowSamples(e.target.checked)} />
        Also show sample listings (made-up placeholders for the demo)
      </label>

      {note ? (
        <p className="muted" role="status" style={{ margin: "8px 0" }}>
          {note}
        </p>
      ) : null}

      <div className="vendor-legend" aria-hidden="true">
        <span><i style={{ background: "#6DBE90" }} />Installer checked on an official list</span>
        <span><i style={{ background: "#EE9B3F" }} />Registered installer</span>
        <span><i style={{ background: "#5BA3E0" }} />Official body or company</span>
        <span><i style={{ background: "#FF8E72" }} />{place ? "Your search" : "Your area"}</span>
      </div>

      <LeafletMap markers={markers} height={400} label="Map of vendors and official bodies" autoFit={!focus} focus={focus} onSelect={(id) => id !== "centre" && document.getElementById(`vendor-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} />

      <p className="muted" style={{ margin: "10px 0 16px", fontSize: "13px" }} aria-live="polite">
        {rows.length} {rows.length === 1 ? "result" : "results"}, nearest first
        {place ? ` from ${place.label}` : ` from your area (PIN ${home.pincode})`}.
        {rows.length === 0 && radius !== 0 ? " Nothing in that distance. Try a wider one." : ""}
        {nearest && radius === 0 && nearest.km > 100 ? ` The nearest is about ${Math.round(nearest.km)} km away.` : ""} Pins mark a city area, not a street address.
      </p>

      {rows.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>No listings match. Try a wider distance, another service, or turn on sample listings.</p>
        </div>
      ) : (
        <div className="grid">
          {rows.map(({ v, km }) => (
            <article key={v.id} id={`vendor-${v.id}`} className="card vendor-card">
              <div className="vendor-card-head">
                <h2>{v.name}</h2>
                <span className="chip" style={{ whiteSpace: "nowrap" }}>{Math.round(km)} km</span>
              </div>
              <div className="badge-row">
                {v.kind === "installer" ? (
                  v.demo ? (
                    <span className="chip warn">Demo installer account: try a request</span>
                  ) : v.verifiedOn ? (
                    <span className="chip" style={{ background: "var(--forest-50)", color: "var(--forest-800)" }} title={v.verifiedNote}><ShieldCheck size={12} aria-hidden="true" /> Checked on an official list · {v.verifiedOn}</span>
                  ) : (
                    <span className="chip"><BadgeCheck size={12} aria-hidden="true" /> Registered here, listing reviewed</span>
                  )
                ) : v.kind === "sample" ? (
                  <span className="chip warn">Sample listing</span>
                ) : (
                  <span className="chip" style={{ background: "rgba(91,163,224,0.14)", color: "#5BA3E0" }}><Building2 size={12} aria-hidden="true" /> {KIND_LABEL[v.kind]}</span>
                )}
              </div>
              <p style={{ margin: "10px 0", display: "flex", gap: "6px", alignItems: "center" }}>
                <MapPin size={15} aria-hidden="true" /> {v.city} · {v.pincode}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {v.services.map((s) => (
                  <span key={s} className="chip">{serviceLabel(s)}</span>
                ))}
              </div>
              {v.claim ? (
                <p className="muted" style={{ fontSize: "13px", margin: "0 0 10px" }}>
                  {v.kind === "installer" ? <>Says: &ldquo;{v.claim}&rdquo;. Self-declared, so check it on the official list.</> : v.claim}
                </p>
              ) : null}
              {v.kind === "company" ? <p className="muted" style={{ fontSize: "12.5px", margin: "0 0 10px" }}>Listed from the company&apos;s own public website. It is not a LiFE-OS partner and has not been checked by us. Confirm it on the official lists before you pay.</p> : null}
              {v.kind === "sample" ? <p className="muted" style={{ fontSize: "13px", margin: 0 }}>Placeholder entry for demonstration. It is not a real business.</p> : null}

              {v.kind !== "sample" ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center" }}>
                  {v.phone ? (
                    <a className="text-link" href={`tel:+91${v.phone}`}>
                      <Phone size={13} aria-hidden="true" /> {v.phone}
                    </a>
                  ) : null}
                  {v.website ? (
                    <a className="text-link" href={v.website} target="_blank" rel="noopener noreferrer nofollow">
                      Website <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  ) : null}
                  <button type="button" className="text-link" style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }} onClick={() => setFocus({ position: v.position, zoom: 13, key: `${v.id}-${Date.now()}` })}>
                    Show on map
                  </button>
                </div>
              ) : null}

              {v.canRequest ? (
                <div style={{ marginTop: "12px" }}>
                  {requestFor === v.id ? (
                    <QuoteRequestForm vendorId={v.id} vendorName={v.name} services={v.services} defaultService={service || undefined} />
                  ) : (
                    <button type="button" className="button button-surya" onClick={() => setRequestFor(v.id)}>
                      <MessageSquare size={15} aria-hidden="true" /> Request a quote
                    </button>
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
