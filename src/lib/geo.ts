import type { Koordinaten } from './types'

// Anbindung an offene Wiener Geodaten. Läuft im Browser der Nutzer:innen direkt
// gegen data.wien.gv.at (öffentlich, CORS-fähig). Fällt bei Netz-/CORS-Fehlern
// still zurück (die App bleibt mit manueller PLZ-Eingabe nutzbar).

export interface AdressTreffer {
  label: string
  bezirk: number | null
  koords: Koordinaten | null
}

interface OgdFeature {
  properties?: Record<string, unknown>
  geometry?: { coordinates?: [number, number] }
}

function bezirkAusProps(p: Record<string, unknown>): number | null {
  const raw = p.Bezirk ?? p.bezirk ?? p.BEZIRK
  if (typeof raw === 'number' && raw >= 1 && raw <= 23) return raw
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10)
    if (n >= 1 && n <= 23) return n
  }
  // Fallback: aus PLZ (1XX0)
  const plz = String(p.PostalCode ?? p.PLZ ?? '')
  const m = plz.match(/^1(\d{2})0$/)
  if (m) {
    const n = parseInt(m[1], 10)
    if (n >= 1 && n <= 23) return n
  }
  return null
}

/**
 * Adress-Autocomplete über den offiziellen Wiener Adressdienst.
 * Liefert Vorschläge inkl. Bezirk und Koordinaten (WGS84).
 */
export async function sucheAdressen(query: string, signal?: AbortSignal): Promise<AdressTreffer[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url =
    'https://data.wien.gv.at/daten/OGDAddressService.svc/GetAddressInfo' +
    `?Address=${encodeURIComponent(q)}&crs=EPSG:4326`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Adressdienst ${res.status}`)
  const data = (await res.json()) as { features?: OgdFeature[] }
  const features = data.features ?? []
  const treffer: AdressTreffer[] = []
  const gesehen = new Set<string>()
  for (const f of features) {
    const p = f.properties ?? {}
    const strasse = String(p.StreetName ?? p.Adresse ?? '').trim()
    const hausnr = String(p.StreetNumber ?? p.Hausnrtext ?? p.HausNr ?? '').trim()
    const plz = String(p.PostalCode ?? p.PLZ ?? '').trim()
    const label = [
      [strasse, hausnr].filter(Boolean).join(' '),
      [plz, 'Wien'].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ')
    if (!label || gesehen.has(label)) continue
    gesehen.add(label)
    const c = f.geometry?.coordinates
    treffer.push({
      label,
      bezirk: bezirkAusProps(p),
      koords: c ? { lat: c[1], lon: c[0] } : null,
    })
    if (treffer.length >= 8) break
  }
  return treffer
}

/**
 * Link auf die interaktive Lärmkarte (maps.laerminfo.at), zentriert auf die
 * eingegebene Adresse und mit der Adresse im Suchfeld. Layer "cstrasse22_24h"
 * = Straßenlärm (24h), grauer Hintergrund.
 * Format: /#/<layer>/<hintergrund>/a-<adresse>/@<lat>,<lon>,<zoom>z
 */
export function laerminfoLink(koords: Koordinaten | null, adresse = ''): string {
  const adr = adresse.trim() ? `a-${encodeURIComponent(adresse.trim())}` : 'a-'
  if (koords) return `https://maps.laerminfo.at/#/cstrasse22_24h/bgrau/${adr}/@${koords.lat},${koords.lon},17z`
  return 'https://maps.laerminfo.at/'
}

/**
 * Link auf den Wiener Flächenwidmungsplan, zentriert auf die eingegebene
 * Adresse und mit der Adresse im Suchfeld. ViennaGIS-Hash-Format:
 * #c=<lon>,<lat>&z=<zoom>&q=<adresse>.
 */
export function flaechenwidmungLink(koords: Koordinaten | null, adresse = ''): string {
  const q = adresse.trim() ? `&q=${encodeURIComponent(adresse.trim())}` : ''
  if (koords) return `https://www.wien.gv.at/flaechenwidmung/public/#c=${koords.lon},${koords.lat}&z=17${q}`
  return 'https://www.wien.gv.at/flaechenwidmung/public/'
}
