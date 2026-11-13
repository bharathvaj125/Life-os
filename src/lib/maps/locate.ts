import { placeForPincode } from "@/lib/weather/places";

export type LatLon = [latitude: number, longitude: number];

/** A small, stable number from a string, used to spread markers that share a city. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

/**
 * Where to draw something on the map from its PIN code. We only know the city centre for a PIN prefix, so
 * listings in one city would sit on top of each other. A small repeatable offset (about 2 km) spreads them out
 * without pretending to know a street address. Null for PIN codes outside Gujarat.
 */
export function locateByPincode(pincode: string, key: string): LatLon | null {
  const place = placeForPincode(pincode);
  if (!place) return null;
  const dLat = (hash(`${key}:lat`) - 0.5) * 0.04;
  const dLon = (hash(`${key}:lon`) - 0.5) * 0.04;
  return [place.latitude + dLat, place.longitude + dLon];
}

/** The exact city centre for an area (first three PIN digits), for area-level markers that must not imply a location. */
export function areaCentre(prefix: string): LatLon | null {
  const place = placeForPincode(`${prefix}000`);
  return place ? [place.latitude, place.longitude] : null;
}
