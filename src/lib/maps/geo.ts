import { placeForPincode } from "@/lib/weather/places";
import type { LatLon } from "./locate";

const EARTH_M = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Straight-line distance in kilometres between two points (haversine). */
export function distanceKm([lat1, lon1]: LatLon, [lat2, lon2]: LatLon): number {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return (2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(a)))) / 1000;
}

/**
 * Area of a small polygon drawn on the map, in square metres. Points are projected onto a flat plane around
 * their middle, which is accurate to well under 1% for something the size of a roof.
 */
export function polygonAreaM2(points: LatLon[]): number {
  if (points.length < 3) return 0;
  const lat0 = rad(points.reduce((s, p) => s + p[0], 0) / points.length);
  const xy = points.map(([lat, lon]) => [EARTH_M * rad(lon) * Math.cos(lat0), EARTH_M * rad(lat)] as const);
  let twice = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2;
}

export interface Place {
  position: LatLon;
  label: string;
  /** "exact" when a map service found the PIN or place; "area" when we fell back to the city centre for the PIN prefix. */
  precision: "exact" | "area";
}

const isPin = (q: string) => /^[1-9]\d{5}$/.test(q.trim());

/**
 * Finds a PIN code or a place name. Uses OpenStreetMap's Nominatim from the browser (free, no key, light use
 * only), and falls back to the city centre we know for Gujarat PIN prefixes, so a PIN always lands somewhere.
 */
export async function findPlace(query: string, signal?: AbortSignal): Promise<Place | null> {
  const q = query.trim();
  if (!q) return null;
  const params = new URLSearchParams({ format: "json", limit: "1", countrycodes: "in" });
  if (isPin(q)) params.set("postalcode", q);
  else params.set("q", /gujarat/i.test(q) ? q : `${q}, Gujarat`);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal, headers: { "accept-language": "en" } });
    if (res.ok) {
      const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      if (rows[0]) return { position: [Number(rows[0].lat), Number(rows[0].lon)], label: rows[0].display_name.split(",").slice(0, 3).join(","), precision: "exact" };
    }
  } catch {
    // Fall through to the city centre.
  }
  if (isPin(q)) {
    const place = placeForPincode(q);
    if (place) return { position: [place.latitude, place.longitude], label: `${place.city} (PIN ${q})`, precision: "area" };
  }
  return null;
}

export interface OsmBusiness {
  id: string;
  name: string;
  position: LatLon;
  kind: string;
  phone?: string;
  website?: string;
  address?: string;
  osmUrl: string;
}

/** What to look for on OpenStreetMap for each service. Names in Gujarat often use "solar", "surya" or "urja". */
function overpassFilters(service: string): string[] {
  const solar = '["name"~"solar|surya|urja|photovoltaic",i]';
  switch (service) {
    case "ev-charging":
      return ['["amenity"="charging_station"]'];
    case "efficient-appliances":
      return ['["shop"~"electronics|appliance|electrical"]'];
    case "energy-audit":
      return [solar, '["name"~"energy",i]'];
    case "rooftop-solar":
    case "solar-water-heater":
      return [solar];
    default:
      return [solar, '["amenity"="charging_station"]'];
  }
}

/**
 * Businesses that people have mapped on OpenStreetMap near a point. This is public, community-edited data: it
 * shows that a place exists, not that it is genuine, empanelled or still open, and the page says so.
 */
export async function findOsmBusinesses(centre: LatLon, radiusKm: number, service: string, signal?: AbortSignal): Promise<OsmBusiness[]> {
  const r = Math.round(Math.min(radiusKm, 50) * 1000);
  const [lat, lon] = centre;
  const parts = overpassFilters(service).map((f) => `nwr${f}(around:${r},${lat.toFixed(5)},${lon.toFixed(5)});`).join("");
  const query = `[out:json][timeout:20];(${parts});out center tags 80;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: query }), signal });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = (await res.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };
  const out: OsmBusiness[] = [];
  for (const e of json.elements) {
    const t = e.tags ?? {};
    const la = e.lat ?? e.center?.lat;
    const lo = e.lon ?? e.center?.lon;
    if (la === undefined || lo === undefined) continue;
    const name = t.name ?? t["name:en"] ?? (t.amenity === "charging_station" ? `EV charging${t.operator ? ` · ${t.operator}` : ""}` : "");
    if (!name) continue;
    const address = [t["addr:housenumber"], t["addr:street"], t["addr:suburb"], t["addr:city"], t["addr:postcode"]].filter(Boolean).join(", ");
    const website = t.website ?? t["contact:website"];
    out.push({
      id: `${e.type}/${e.id}`,
      name,
      position: [la, lo],
      kind: t.amenity === "charging_station" ? "EV charging" : t.shop ? `Shop: ${t.shop}` : t.office ? "Office" : t.craft ? "Workshop" : "Business",
      phone: t.phone ?? t["contact:phone"],
      website: website && /^https?:\/\//i.test(website) ? website : undefined,
      address: address || undefined,
      osmUrl: `https://www.openstreetmap.org/${e.type}/${e.id}`,
    });
  }
  // The same business can be mapped twice, as a point and as a building.
  const seen = new Set<string>();
  return out.filter((b) => {
    const key = `${b.name.toLowerCase()}|${b.position[0].toFixed(3)}|${b.position[1].toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
