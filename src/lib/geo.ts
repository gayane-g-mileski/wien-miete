import type { BaubewilligungGebaeude, Koordinaten } from './types'

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

/**
 * Koordinaten robust auf WGS84 (lat/lon) normalisieren. Der Adressdienst kann
 * je nach Konfiguration [lon,lat] (GeoJSON-Standard) oder [lat,lon] liefern –
 * anhand der für Wien bekannten Wertebereiche wird die richtige Zuordnung
 * erkannt. Projizierte Koordinaten (falscher CRS) fallen als null heraus.
 */
// Web-Mercator (EPSG:3857) -> WGS84 (Grad). Wien liegt bei x~1,82 Mio / y~6,14 Mio.
function ausMercator(x: number, y: number): Koordinaten {
  const lon = (x / 20037508.34) * 180
  const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360) / Math.PI - 90
  return { lat, lon }
}

function normalisiereKoords(c: unknown): Koordinaten | null {
  if (!Array.isArray(c) || c.length < 2) return null
  const a = Number(c[0])
  const b = Number(c[1])
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  const istLat = (v: number) => v > 46 && v < 49 // Wien ~48,2
  const istLon = (v: number) => v > 14 && v < 18 // Wien ~16,37
  if (istLat(a) && istLon(b)) return { lat: a, lon: b } // [lat, lon]
  if (istLon(a) && istLat(b)) return { lat: b, lon: a } // [lon, lat] (GeoJSON-Standard)
  // Projizierte Koordinaten (Web Mercator) umrechnen – der Adressdienst liefert
  // je nach crs-Parameter mitunter EPSG:3857 statt Grad.
  const grossX = Math.abs(a) > 1000 && Math.abs(b) > 1000
  if (grossX) {
    // erst [x,y], dann vertauscht versuchen; nur akzeptieren, wenn Ergebnis in Wien liegt.
    for (const [x, y] of [
      [a, b],
      [b, a],
    ]) {
      const k = ausMercator(x, y)
      if (istLat(k.lat) && istLon(k.lon)) return k
    }
  }
  return null
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
    treffer.push({
      label,
      bezirk: bezirkAusProps(p),
      koords: normalisiereKoords(f.geometry?.coordinates),
    })
    if (treffer.length >= 8) break
  }
  return treffer
}

/**
 * Best-effort-Erkennung, ob eine Adresse in einem Gemeindebau der Stadt Wien
 * (Wiener Wohnen) liegt – über den offenen Datensatz "Gemeindebauten Wien".
 * Läuft im Browser direkt gegen data.wien.gv.at. Bei Fehler/Unerreichbarkeit
 * wird null zurückgegeben (dann entscheidet die manuelle Auswahl).
 */
export async function istGemeindebau(koords: Koordinaten, signal?: AbortSignal): Promise<boolean | null> {
  const d = 0.0009 // ~90 m
  const { lat, lon } = koords
  const base =
    'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0' +
    '&srsName=EPSG:4326&outputFormat=json&typeName=ogdwien:GEMBAUTENFLOGD&bbox='
  // GeoServer WFS 1.1.0 nutzt bei EPSG:4326 die Achsreihenfolge lat,lon –
  // zur Sicherheit wird auch die vertauschte Reihenfolge versucht.
  const boxes = [
    `${lat - d},${lon - d},${lat + d},${lon + d},EPSG:4326`,
    `${lon - d},${lat - d},${lon + d},${lat + d},EPSG:4326`,
  ]
  try {
    for (const box of boxes) {
      const res = await fetch(base + box, { signal }) // rohe Kommas/Doppelpunkt wie in den offiziellen Beispielen
      if (!res.ok) continue
      const data = (await res.json()) as { features?: unknown[] }
      if (Array.isArray(data.features) && data.features.length > 0) return true
    }
    return false
  } catch {
    return null
  }
}

interface GebaeudeFeature {
  properties?: Record<string, unknown>
  geometry?: { coordinates?: unknown }
}

function periodeAusBaujahr(bj: number): BaubewilligungGebaeude {
  if (bj <= 1945) return 'vor_1945'
  if (bj <= 1953) return '1945_1953'
  return 'nach_1953'
}

/** Baujahr aus einem Feature lesen: primär BAUJAHR, sonst ein Jahr aus L_BAUJ. */
function baujahrAusFeature(p: Record<string, unknown>): number | null {
  const bj = Number(p.BAUJAHR)
  if (Number.isFinite(bj) && bj >= 1000 && bj <= 2100) return bj
  const label = String(p.L_BAUJ ?? p.BAUALTER ?? '')
  const m = label.match(/\b(1[5-9]\d{2}|20\d{2})\b/)
  if (m) return Number(m[1])
  return null
}

/**
 * Best-effort-Ermittlung des Baujahres (und damit der MRG-Baualtersklasse)
 * einer Adresse über den offenen Gebäudedatensatz der Stadt Wien
 * (ogdwien:GEBAEUDEINFOOGD, Attribut BAUJAHR bzw. L_BAUJ). Nimmt das
 * nächstgelegene Gebäude mit gültigem Baujahr. null bei Fehler/keinem Treffer.
 */
export async function baujahrAusKoordinaten(
  koords: Koordinaten,
  signal?: AbortSignal,
  onDiag?: (msg: string) => void,
): Promise<BaubewilligungGebaeude | null> {
  const d = 0.0012 // ~120 m – deckt auch größere Wohnhausanlagen ab
  const { lat, lon } = koords
  const base =
    'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0' +
    '&srsName=EPSG:4326&outputFormat=json&typeName=ogdwien:GEBAEUDEINFOOGD&bbox='
  // GeoServer WFS 1.1.0 nutzt bei EPSG:4326 lat,lon – zur Sicherheit beide Reihenfolgen.
  const boxes = [
    `${lat - d},${lon - d},${lat + d},${lon + d},EPSG:4326`,
    `${lon - d},${lat - d},${lon + d},${lat + d},EPSG:4326`,
  ]
  try {
    let letzterStatus = 0
    for (const box of boxes) {
      const url = base + box // rohe Kommas/Doppelpunkt wie in den offiziellen Beispielen
      const res = await fetch(url, { signal })
      if (!res.ok) {
        letzterStatus = res.status
        console.warn('[wien-miete] Gebäudeabfrage HTTP', res.status, url)
        continue
      }
      const data = (await res.json()) as { features?: GebaeudeFeature[] }
      const feats = data.features ?? []
      let bestBj: number | null = null
      let bestDist = Infinity
      for (const f of feats) {
        const bj = baujahrAusFeature(f.properties ?? {})
        if (bj == null) continue
        const fk = normalisiereKoords(f.geometry?.coordinates)
        const dist = fk ? (fk.lat - lat) ** 2 + (fk.lon - lon) ** 2 : 0
        if (dist < bestDist) {
          bestDist = dist
          bestBj = bj
        }
      }
      if (bestBj != null) {
        console.debug('[wien-miete] Baujahr erkannt:', bestBj)
        onDiag?.(`Baujahr laut Gebäuderegister: ${bestBj}.`)
        return periodeAusBaujahr(bestBj)
      }
    }
    if (letzterStatus) onDiag?.(`Gebäuderegister-Abfrage fehlgeschlagen (HTTP ${letzterStatus}).`)
    else onDiag?.('Kein Gebäude mit Baujahr im Umkreis gefunden – bitte manuell wählen.')
    console.debug('[wien-miete] Kein Baujahr im Umkreis gefunden für', koords)
    return null
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Netzwerkfehler'
    onDiag?.(`Gebäuderegister nicht erreichbar (${msg}).`)
    console.warn('[wien-miete] Gebäudeabfrage fehlgeschlagen:', e)
    return null
  }
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
