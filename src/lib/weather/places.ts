export interface Place {
  city: string;
  latitude: number;
  longitude: number;
}

/**
 * Approximate city-centre coordinates for Gujarat PIN prefixes (first three digits). A forecast at city
 * level is accurate enough for household nudges; it is not a measurement at the user's own roof.
 */
const GUJARAT_PLACES: Record<string, Place> = {
  "360": { city: "Rajkot", latitude: 22.3, longitude: 70.8 },
  "361": { city: "Jamnagar", latitude: 22.47, longitude: 70.07 },
  "362": { city: "Junagadh", latitude: 21.52, longitude: 70.46 },
  "363": { city: "Surendranagar", latitude: 22.73, longitude: 71.64 },
  "364": { city: "Bhavnagar", latitude: 21.76, longitude: 72.15 },
  "365": { city: "Amreli", latitude: 21.6, longitude: 71.22 },
  "370": { city: "Bhuj", latitude: 23.25, longitude: 69.67 },
  "380": { city: "Ahmedabad", latitude: 23.03, longitude: 72.58 },
  "382": { city: "Gandhinagar", latitude: 23.22, longitude: 72.65 },
  "383": { city: "Himmatnagar", latitude: 23.6, longitude: 72.97 },
  "384": { city: "Mehsana", latitude: 23.6, longitude: 72.37 },
  "385": { city: "Palanpur", latitude: 24.17, longitude: 72.43 },
  "387": { city: "Nadiad", latitude: 22.69, longitude: 72.86 },
  "388": { city: "Anand", latitude: 22.56, longitude: 72.95 },
  "389": { city: "Godhra", latitude: 22.78, longitude: 73.61 },
  "390": { city: "Vadodara", latitude: 22.31, longitude: 73.18 },
  "391": { city: "Vadodara", latitude: 22.31, longitude: 73.18 },
  "392": { city: "Bharuch", latitude: 21.7, longitude: 72.99 },
  "393": { city: "Ankleshwar", latitude: 21.63, longitude: 73.0 },
  "394": { city: "Surat", latitude: 21.17, longitude: 72.83 },
  "395": { city: "Surat", latitude: 21.17, longitude: 72.83 },
  "396": { city: "Valsad", latitude: 20.6, longitude: 72.93 },
};

/** Null for PIN codes outside Gujarat, where the app has no forecast location. */
export function placeForPincode(pincode: string): Place | null {
  return GUJARAT_PLACES[pincode.trim().slice(0, 3)] ?? null;
}
