// Driving route + ETA from OSRM's public demo server (free, no key). Fine for development / small apps.
import type { Coords } from "./types";

export type RouteInfo = { coords: Coords[]; minutes: number; km: number };

export async function getRoute(from: Coords, to: Coords): Promise<RouteInfo | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const j = await (await fetch(url)).json();
    const r = j?.routes?.[0];
    if (!r) return null;
    return {
      coords: r.geometry.coordinates.map(([lng, lat]: number[]) => ({ latitude: lat, longitude: lng })),
      minutes: r.duration / 60,
      km: r.distance / 1000,
    };
  } catch {
    return null;
  }
}
