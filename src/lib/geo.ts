import type { BaubewilligungGebaeude, Koordinaten } from './types'

// Anbindung an offene Wiener Geodaten. Läuft im Browser der Nutzer:innen direkt
// gegen data.wien.gv.at (öffentlich, CORS-fähig). Fällt bei Netz-/CORS-Fehlern
// still zurück (die Anwendung bleibt mit manueller PLZ-Eingabe nutzbar).

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
// Der Wiener Adressdienst liefert je nach crs-Parameter Grad (EPSG:4326),
// Wiener Gauß-Krüger (EPSG:31256, Standard – z.B. [3051, 341122]) oder
// Web-Mercator (EPSG:3857). Alle drei werden hier auf WGS84 gebracht.
const GK_OST =
  '+proj=tmerc +lat_0=0 +lon_0=16.3333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel ' +
  '+towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'

const istLat = (v: number) => v > 46 && v < 49 // Wien ~48,2
const istLon = (v: number) => v > 14 && v < 18 // Wien ~16,37

// proj4 nur bei Bedarf nachladen (hält das Startpaket klein).
type Proj4 = (from: string, to: string, coords: number[]) => number[]
let proj4Ref: Proj4 | null = null
async function ladeProj4(): Promise<void> {
  if (proj4Ref) return
  try {
    proj4Ref = (await import('proj4')).default as unknown as Proj4
  } catch {
    /* ohne proj4 bleiben projizierte Koordinaten unlesbar */
  }
}

function normalisiereKoords(c: unknown): Koordinaten | null {
  if (!Array.isArray(c) || c.length < 2) return null
  const a = Number(c[0])
  const b = Number(c[1])
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (istLat(a) && istLon(b)) return { lat: a, lon: b } // [lat, lon]
  if (istLon(a) && istLat(b)) return { lat: b, lon: a } // [lon, lat] (GeoJSON-Standard)
  // Projizierte Koordinaten: beide Systeme und beide Achsreihenfolgen testen;
  // gültig ist das Ergebnis, das tatsächlich in Wien liegt.
  const proj4 = proj4Ref
  if (!proj4) return null
  for (const proj of [GK_OST, 'EPSG:3857']) {
    for (const [x, y] of [
      [a, b],
      [b, a],
    ]) {
      try {
        const [lon, lat] = proj4(proj, 'EPSG:4326', [x, y]) as [number, number]
        if (istLat(lat) && istLon(lon)) return { lat, lon }
      } catch {
        /* nächste Kombination versuchen */
      }
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
  await ladeProj4() // für ggf. projizierte Koordinaten (EPSG:31256/3857)
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
  await ladeProj4()
  // Eng um die Adresse: ein größerer Radius würde benachbarte Wohnhausanlagen
  // mitfangen und fälschlich einen Gemeindebau melden.
  const d = 0.00018 // ~20 m
  const { lat, lon } = koords
  const base =
    'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0' +
    '&srsName=EPSG:4326&outputFormat=json&typeName=ogdwien:GEMBAUTENFLOGD&bbox='
  // Zuerst lon,lat (so nutzen es funktionierende Wiener WFS-Beispiele),
  // danach lat,lon als Absicherung.
  const boxes = [
    `${lon - d},${lat - d},${lon + d},${lat + d},EPSG:4326`,
    `${lat - d},${lon - d},${lat + d},${lon + d},EPSG:4326`,
  ]
  let fehler = 0
  for (const box of boxes) {
    // Wichtig: pro Anfrage abfangen. Liefert eine Variante einen XML-Fehler,
    // darf das die andere Variante nicht verhindern.
    try {
      const res = await fetch(base + box, { signal })
      if (!res.ok) {
        fehler++
        continue
      }
      const data = (await res.json()) as { features?: unknown[] }
      if (Array.isArray(data.features) && data.features.length > 0) return true
    } catch {
      fehler++
    }
  }
  return fehler === boxes.length ? null : false
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

export interface GruenderzeitBefund {
  /** Anteil der Gebäude im Umkreis mit Baujahr 1870–1917. */
  anteil: number
  /** Wie viele Gebäude ausgewertet werden konnten. */
  gebaeude: number
  /** Radius der Auswertung in Metern. */
  radius: number
}

/**
 * Schätzt den Gründerzeit-Anteil rund um eine Adresse aus den Gebäudedaten der
 * Stadt Wien. § 2 Abs 3 RichtWG schließt einen Lagezuschlag aus, wenn die Lage
 * in einem Gebiet liegt, in dem überwiegend Gebäude aus 1870–1917 stehen, die
 * ursprünglich Kleinwohnungen ohne Bad enthielten. Der Baualtersanteil ist nur
 * das erste Merkmal davon – deshalb ist das Ergebnis ein Indiz, kein Beweis.
 */
export async function gruenderzeitAnteil(
  koords: Koordinaten,
  signal?: AbortSignal,
): Promise<GruenderzeitBefund | null> {
  const { lat, lon } = koords
  // ~150 m Umkreis: 0.00135° Breite ≈ 150 m, Länge in Wien entsprechend weiter.
  const dLat = 0.00135
  const dLon = 0.00202
  const basis =
    'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0' +
    '&srsName=EPSG:4326&typeName=ogdwien:GEBAEUDEINFOOGD&outputFormat=csv'
  const boxen = [
    `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat},EPSG:4326`,
    `${lat - dLat},${lon - dLon},${lat + dLat},${lon + dLon},EPSG:4326`,
  ]

  for (const box of boxen) {
    try {
      const res = await fetch(`${basis}&bbox=${box}`, { signal })
      if (!res.ok) continue
      const text = await res.text()
      if (!text || text.trimStart().startsWith('<')) continue
      const zeilen = text.split(/\r?\n/).filter((z) => z.trim())
      if (zeilen.length < 3) continue
      const kopf = csvZeile(zeilen[0]).map((h) => h.trim().toUpperCase())
      const iBj = kopf.findIndex((h) => h === 'BAUJAHR')
      const iLabel = kopf.findIndex((h) => h === 'L_BAUJ' || h === 'BAUALTER')
      if (iBj < 0 && iLabel < 0) continue

      let gesamt = 0
      let gruenderzeit = 0
      for (const zeile of zeilen.slice(1)) {
        const f = csvZeile(zeile)
        const info =
          (iBj >= 0 ? baujahrDeuten(f[iBj] ?? '') : null) ?? (iLabel >= 0 ? baujahrDeuten(f[iLabel] ?? '') : null)
        if (!info) continue
        const jahr = Number((info.text.match(/\b(1[89]\d{2}|20\d{2})\b/) ?? [])[1])
        if (!Number.isFinite(jahr)) continue
        gesamt++
        if (jahr >= 1870 && jahr <= 1917) gruenderzeit++
      }
      if (gesamt < 5) continue // zu dünne Datenlage für eine Aussage
      return { anteil: gruenderzeit / gesamt, gebaeude: gesamt, radius: 150 }
    } catch {
      /* nächste Achsreihenfolge versuchen */
    }
  }
  return null
}

/**
 * Lagezuschlagskarte der Stadt Wien. Der Lagezuschlag gilt grundstücksscharf –
 * die hinterlegten Bezirkswerte sind nur eine Näherung, verbindlich ist die
 * Auskunft für die konkrete Liegenschaft.
 */
export function lagezuschlagLink(): string {
  return 'https://mein.wien.gv.at/Richtwert/ui/lagezuschlag/#/LagezuschlagImInternet/Adresse'
}

/** Eine CSV-Zeile in Felder zerlegen (mit Anführungszeichen-Behandlung). */
function csvZeile(zeile: string): string[] {
  const felder: string[] = []
  let feld = ''
  let inAnf = false
  for (let i = 0; i < zeile.length; i++) {
    const c = zeile[i]
    if (inAnf) {
      if (c === '"') {
        if (zeile[i + 1] === '"') {
          feld += '"'
          i++
        } else inAnf = false
      } else feld += c
    } else if (c === '"') inAnf = true
    else if (c === ',') {
      felder.push(feld)
      feld = ''
    } else feld += c
  }
  felder.push(feld)
  return felder
}

/** Erste Koordinate aus einer WKT-Geometrie (POINT/POLYGON …) lesen. */
function wktPunkt(wkt: string): Koordinaten | null {
  const m = wkt.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/)
  if (!m) return null
  return normalisiereKoords([Number(m[1]), Number(m[2])])
}

export function periodeAusBaujahr(bj: number): BaubewilligungGebaeude {
  if (bj <= 1945) return 'vor_1945'
  if (bj <= 1953) return '1945_1953'
  return 'nach_1953'
}

/** Was die Gebäudedaten zum Baujahr hergeben. */
export interface BaujahrInfo {
  /** Anzeigetext, z.B. „1899“ oder „nach 1945“. */
  text: string
  /** Eindeutig zuordenbare Bauperiode – null, wenn die Angabe offenlässt, welche. */
  periode: BaubewilligungGebaeude | null
}

/**
 * Baujahr-Angabe deuten. Der Datensatz nennt bei jüngeren Häusern häufig kein
 * exaktes Jahr, sondern „nach 1945“ – daraus darf keine Jahreszahl 1945 (und
 * damit fälschlich „Altbau“) werden. Bei einer Spanne zählt das Endjahr.
 */
function baujahrDeuten(text: string): BaujahrInfo | null {
  const t = text.trim()
  if (!t) return null
  // „nach 1945“, „ab 1945“, „nach 1918“ …
  const nach = t.match(/\b(?:nach|ab)\s*(1[0-9]{3}|20[0-9]{2})\b/i)
  if (nach) {
    const jahr = Number(nach[1])
    // Nach 1945 gebaut: sicher kein Altbau, aber 1945–1953 vs. später bleibt offen.
    return { text: `nach ${jahr}`, periode: jahr >= 1953 ? 'nach_1953' : null }
  }
  const direkt = Number(t)
  if (Number.isFinite(direkt) && direkt >= 1000 && direkt <= 2100) {
    return { text: String(direkt), periode: periodeAusBaujahr(direkt) }
  }
  // Spanne „1919-1945“ oder Einzeljahr im Text: das späteste Jahr ist maßgeblich.
  const jahre = [...t.matchAll(/\b(1[0-9]{3}|20[0-9]{2})\b/g)].map((m) => Number(m[1]))
  if (jahre.length === 0) return null
  const ende = Math.max(...jahre)
  return { text: t, periode: periodeAusBaujahr(ende) }
}

/**
 * Baujahr einer Adresse aus den Wiener Gebäudedaten lesen
 * (ogdwien:GEBAEUDEINFOOGD – dieselbe Quelle wie „Wien Kulturgut,
 * Gebäudedaten"). Abgefragt wird CSV; dieses Ausgabeformat ist für den Layer
 * dokumentiert. Rückgabe: die Baujahr-Angabe des nächstgelegenen Gebäudes.
 */
export async function baujahrAusKoordinaten(
  koords: Koordinaten,
  signal?: AbortSignal,
): Promise<BaujahrInfo | null> {
  await ladeProj4()
  const { lat, lon } = koords
  const basis =
    'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0' +
    '&srsName=EPSG:4326&typeName=ogdwien:GEBAEUDEINFOOGD'
  // Erst eng um die Adresse, dann etwas weiter; beide Achsreihenfolgen.
  const varianten: string[] = []
  for (const d of [0.0004, 0.0012]) {
    for (const box of [
      `${lon - d},${lat - d},${lon + d},${lat + d},EPSG:4326`,
      `${lat - d},${lon - d},${lat + d},${lon + d},EPSG:4326`,
    ]) {
      varianten.push(`${basis}&outputFormat=csv&bbox=${box}`)
    }
  }
  for (const url of varianten) {
    // Pro Anfrage abfangen: ein Fehlversuch darf die nächsten nicht verhindern.
    try {
      const res = await fetch(url, { signal })
      if (!res.ok) continue
      const text = await res.text()
      if (!text || text.trimStart().startsWith('<')) continue // XML-Fehler
      const zeilen = text.split(/\r?\n/).filter((z) => z.trim())
      if (zeilen.length < 2) continue
      const kopf = csvZeile(zeilen[0]).map((h) => h.trim().toUpperCase())
      const iBj = kopf.findIndex((h) => h === 'BAUJAHR')
      const iLabel = kopf.findIndex((h) => h === 'L_BAUJ' || h === 'BAUALTER')
      if (iBj < 0 && iLabel < 0) continue
      // Geometriespalte am Inhalt erkennen (der Spaltenname variiert je nach
      // Dienst) – nur so lässt sich das nächstgelegene Gebäude bestimmen.
      const ersteDaten = csvZeile(zeilen[1])
      const iGeom = ersteDaten.findIndex((w) => /POINT|POLYGON|LINESTRING|MULTI/i.test(w))
      if (iGeom < 0) continue // ohne Geometrie lieber nichts setzen als das falsche Haus
      let bestInfo: BaujahrInfo | null = null
      let bestDist = Infinity
      for (const zeile of zeilen.slice(1)) {
        const f = csvZeile(zeile)
        // Das Label (z.B. „nach 1945") ist aussagekräftiger als eine leere
        // oder auf 1945 gerundete Jahresspalte – deshalb zuerst prüfen.
        const info =
          (iLabel >= 0 ? baujahrDeuten(f[iLabel] ?? '') : null) ?? (iBj >= 0 ? baujahrDeuten(f[iBj] ?? '') : null)
        if (!info) continue
        const g = wktPunkt(f[iGeom] ?? '')
        if (!g) continue
        const dist = (g.lat - lat) ** 2 + (g.lon - lon) ** 2
        if (dist < bestDist) {
          bestDist = dist
          bestInfo = info
        }
      }
      if (bestInfo != null) return bestInfo
    } catch {
      /* nächste Variante versuchen */
    }
  }
  return null
}

/**
 * Link auf die Wiener Gebäudedaten („Wien Kulturgut“). Dort lässt sich das
 * Baujahr eines Hauses nachschlagen – über eine Schnittstelle sind die Daten
 * nicht zuverlässig abfragbar.
 */
export function bauperiodenLink(): string {
  return 'https://www.wien.gv.at/kultur/kulturgut-gebaeudedaten'
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
