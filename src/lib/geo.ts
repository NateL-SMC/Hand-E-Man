// Location helpers: GPS via expo-location, geocoding via OpenStreetMap Nominatim (free, no API key, works on web + native).
import * as Location from "expo-location";
import type { Coords } from "./types";

export const haversineKm = (a: Coords, b: Coords) => {
  const R = 6371, rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude), dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export async function ensureLocationPermission() {
  const cur = await Location.getForegroundPermissionsAsync();
  if (cur.granted) return true;
  return (await Location.requestForegroundPermissionsAsync()).granted;
}

export async function getCurrentCoords(): Promise<Coords> {
  if (!(await ensureLocationPermission())) throw new Error("Location permission was denied.");
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: p.coords.latitude, longitude: p.coords.longitude };
}

const NOM = "https://nominatim.openstreetmap.org";

export async function reverseGeocode(c: Coords): Promise<string> {
  try {
    const r = await fetch(`${NOM}/reverse?format=jsonv2&addressdetails=1&zoom=16&lat=${c.latitude}&lon=${c.longitude}`, { headers: { "Accept-Language": "en" } });
    const j = await r.json();
    const a = j.address ?? {};
    const area = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.village ?? a.hamlet ?? a.road;
    const city = a.city ?? a.town ?? a.municipality ?? a.county ?? a.state;
    const label = [area, city].filter(Boolean).join(", ");
    return label || j.display_name || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;
  } catch {
    return `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;
  }
}

export async function geocode(query: string): Promise<{ coords: Coords; label: string } | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const r = await fetch(`${NOM}/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, { headers: { "Accept-Language": "en" } });
    const j = await r.json();
    if (!j?.length) return null;
    return { coords: { latitude: parseFloat(j[0].lat), longitude: parseFloat(j[0].lon) }, label: j[0].display_name };
  } catch {
    return null;
  }
}

/** GPS fix + a readable "Barangay, City" label. */
export async function getCurrentPlace() {
  const coords = await getCurrentCoords();
  return { coords, label: await reverseGeocode(coords) };
}
