// Place search via the Open-Meteo Geocoding API (no key, CORS enabled, CC BY 4.0 data from GeoNames).
// Only the typed place name is sent. Birth data never leaves the browser.

export interface Place {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  featureCode?: string;
}

const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

interface ApiResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  feature_code?: string;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${ENDPOINT}?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const body = (await res.json()) as { results?: ApiResult[] };
  return (body.results ?? [])
    .filter((r) => r.timezone)
    .map((r) => ({
      id: r.id,
      name: r.name,
      admin1: r.admin1,
      country: r.country,
      countryCode: r.country_code,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone!,
      featureCode: r.feature_code,
    }));
}

let regionNames: Intl.DisplayNames | undefined;
function countryName(p: Place): string | undefined {
  if (p.country) return p.country;
  if (!p.countryCode) return undefined;
  try {
    regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(p.countryCode);
  } catch {
    return p.countryCode;
  }
}

export function placeLabel(p: Place): string {
  const parts = [p.name, p.admin1, countryName(p)].filter((x): x is string => !!x);
  return parts.filter((x, i) => parts.indexOf(x) === i).join(', ');
}

/** Short description to tell apart places with the same name (GeoNames feature code). */
export function placeDetail(p: Place): string {
  const c = p.featureCode ?? '';
  const kind = c.startsWith('PPL') ? 'city / town' : c.startsWith('PCL') ? 'country / territory' : c.startsWith('ADM') ? 'region' : c === 'ISL' ? 'island' : 'place';
  const lat = `${Math.abs(p.latitude).toFixed(2)}°${p.latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(p.longitude).toFixed(2)}°${p.longitude >= 0 ? 'E' : 'W'}`;
  return `${kind} · ${lat} ${lon}`;
}
