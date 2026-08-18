import type { Kategorie, MerkmalKey } from './types'

// Preis-Referenzdaten. Quellen: mietervereinigung.at (Richtwert, Zu-/Abschläge,
// Lagezuschlag Wien), Richtwertgesetz, allgemeine Marktbeobachtung. Marktmiet- und
// Lagezuschlag-Werte sind hinterlegte Näherungen (kein Live-Datenabgleich).

/** Richtwert Wien in €/m² netto, monatlich (mietrechtliche Normwohnung, Kat. A). Seit 1.4.2026. */
export const RICHTWERT_WIEN = 6.74

/**
 * Amtliche Kategoriebeträge (§ 15a MRG) in €/m² netto pro Monat, seit 1.4.2026.
 * Sie gelten als Obergrenze für Verträge vom 1.1.1982 bis 28.2.1994 und – bei
 * Kategorie D – unabhängig vom Vertragsdatum.
 */
export const KATEGORIE_BETRAG: Record<Kategorie, number> = {
  A: 4.51,
  B: 3.38,
  C: 2.25,
  D_brauchbar: 2.25,
  D_unbrauchbar: 1.13,
}

/**
 * Zeitraum, in dem der Kategoriemietzins gilt. Davor bleibt der damals
 * vereinbarte Mietzins maßgeblich, danach gilt der Richtwert.
 */
export const KATEGORIE_ZEITRAUM = { von: '1982-01-01', bis: '1994-02-28' }

/**
 * Abschlag vom Richtwert je Kategoriestufe. Der Richtwert ist gesetzlich für
 * die mietrechtliche Normwohnung (Kategorie A) definiert; eine gesetzliche
 * Staffel für B und C gibt es nicht. Die Praxis rechnet mit rund einem Viertel
 * Abschlag je Stufe – die Werte sind daher Näherungen, keine Rechengrößen des
 * Gesetzes, und werden im Ergebnis auch so ausgewiesen.
 */
export const KATEGORIE_ABSCHLAG: Record<'A' | 'B' | 'C', number> = {
  A: 0,
  B: -0.25,
  C: -0.5,
}

/**
 * Plausibilitätskorridor für die Summe der Ausstattungs-Zu- und -Abschläge,
 * bezogen auf den Grundwert. § 16 Abs 2 MRG verlangt eine Gesamtschau nach der
 * Verkehrsauffassung; der OGH lehnt es ab, jedes Ausstattungsdetail einzeln zu
 * bewerten und die Zuschläge schlicht zu addieren (RIS-Justiz RS0117881).
 * Deshalb wird die Summe hier gedeckelt, statt linear weiterzuzählen.
 */
export const ZUSCHLAG_KORRIDOR = 0.4

/** Befristungsabschlag bei Vollanwendung (schriftlich), WHG + GL. */
export const BEFRISTUNGSABSCHLAG = 0.25

/** Vereinfachte Umrechnung: angemessener Mietzins ≈ freier Mietzins − 25 %. */
export const ANGEMESSEN_ABSCHLAG_VON_FREI = 0.25

/** Zu-/Abschläge aus den Dropdown-Feldern (Zustand, Geschoss, Heizung), €/m². */
export const ZUSTAND_ABSCHLAG = { sehr_gut: 0.4, schlecht: -0.6 }
export const STOCKWERK_ABSCHLAG = { erdgeschoss: -0.25, hoch_ohne_lift: -0.3 }
export const HEIZUNG_ZUSCHLAG = 0.3

/**
 * Vollständiger Zu-/Abschlagskatalog (Einzelmerkmale) in €/m². Da das Gesetz
 * keine fixen Prozentsätze vorgibt (Einzelfallprüfung/Vergleichswertverfahren),
 * sind dies praxisorientierte Näherungswerte für eine Ersteinschätzung.
 */
export interface MerkmalDef {
  key: MerkmalKey
  label: string
  wert: number
  gruppe: string
}

export const MERKMAL_GRUPPEN = [
  'Ausstattung der Wohnung',
  'Freiflächen',
  'Lage & Grundriss',
  'Gebäude & Allgemeinflächen',
  'Zubehör',
] as const

export const MERKMAL_KATALOG: MerkmalDef[] = [
  // Ausstattung der Wohnung
  { key: 'hochwertigesBad', label: 'Hochwertiges / zweites Bad', wert: 0.35, gruppe: 'Ausstattung der Wohnung' },
  { key: 'zweitesWc', label: 'Zweites / getrenntes WC', wert: 0.2, gruppe: 'Ausstattung der Wohnung' },
  { key: 'hochwertigeKueche', label: 'Hochwertige Küche', wert: 0.3, gruppe: 'Ausstattung der Wohnung' },
  { key: 'hochwertigeBoeden', label: 'Hochwertige Böden (Parkett/Stein)', wert: 0.3, gruppe: 'Ausstattung der Wohnung' },
  { key: 'schallschutzfenster', label: 'Schallschutz-/Isolierfenster', wert: 0.15, gruppe: 'Ausstattung der Wohnung' },
  { key: 'fussbodenheizung', label: 'Fußbodenheizung', wert: 0.3, gruppe: 'Ausstattung der Wohnung' },
  { key: 'klimaanlage', label: 'Klimaanlage', wert: 0.2, gruppe: 'Ausstattung der Wohnung' },
  { key: 'barrierefrei', label: 'Barrierefrei', wert: 0.15, gruppe: 'Ausstattung der Wohnung' },
  // Freiflächen
  { key: 'balkon', label: 'Balkon', wert: 0.3, gruppe: 'Freiflächen' },
  { key: 'loggia', label: 'Loggia', wert: 0.25, gruppe: 'Freiflächen' },
  { key: 'terrasse', label: 'Terrasse', wert: 0.45, gruppe: 'Freiflächen' },
  { key: 'eigengarten', label: 'Eigengarten', wert: 0.6, gruppe: 'Freiflächen' },
  { key: 'dachterrasse', label: 'Dachterrasse', wert: 0.55, gruppe: 'Freiflächen' },
  // Lage & Grundriss
  { key: 'ruhelage', label: 'Besonders ruhige Lage', wert: 0.4, gruppe: 'Lage & Grundriss' },
  { key: 'sonnig', label: 'Sonnige Ausrichtung', wert: 0.2, gruppe: 'Lage & Grundriss' },
  { key: 'ausblick', label: 'Schöner Ausblick', wert: 0.25, gruppe: 'Lage & Grundriss' },
  { key: 'strassenlaerm', label: 'Straßenlärm / laute Lage', wert: -0.4, gruppe: 'Lage & Grundriss' },
  { key: 'dunkel', label: 'Dunkel / Nordlage', wert: -0.2, gruppe: 'Lage & Grundriss' },
  { key: 'schlechterGrundriss', label: 'Schlechter Grundriss / Durchgangszimmer', wert: -0.25, gruppe: 'Lage & Grundriss' },
  { key: 'starkeDachschraege', label: 'Starke Dachschräge', wert: -0.3, gruppe: 'Lage & Grundriss' },
  // Gebäude & Allgemeinflächen
  { key: 'lift', label: 'Lift im Haus', wert: 0.3, gruppe: 'Gebäude & Allgemeinflächen' },
  { key: 'gegensprechanlage', label: 'Gegensprech-/Videoanlage', wert: 0.1, gruppe: 'Gebäude & Allgemeinflächen' },
  { key: 'concierge', label: 'Concierge / Hausbesorger', wert: 0.2, gruppe: 'Gebäude & Allgemeinflächen' },
  { key: 'gemeinschaft', label: 'Gemeinschaftseinrichtungen', wert: 0.15, gruppe: 'Gebäude & Allgemeinflächen' },
  { key: 'denkmalschutz', label: 'Historische Fassade / Denkmalschutz', wert: 0.1, gruppe: 'Gebäude & Allgemeinflächen' },
  { key: 'begruenterInnenhof', label: 'Begrünter Innenhof', wert: 0.1, gruppe: 'Gebäude & Allgemeinflächen' },
  // Zubehör
  { key: 'kellerabteil', label: 'Kellerabteil', wert: 0.1, gruppe: 'Zubehör' },
  { key: 'dachbodenabteil', label: 'Dachbodenabteil', wert: 0.1, gruppe: 'Zubehör' },
  { key: 'garage', label: 'Garage / Tiefgaragenplatz', wert: 0.35, gruppe: 'Zubehör' },
  { key: 'stellplatz', label: 'Autoabstellplatz', wert: 0.2, gruppe: 'Zubehör' },
]

export interface BezirkInfo {
  nr: number
  name: string
  /** Grobe Bandbreite freier/marktüblicher Nettomiete in €/m²/Monat (unmöbliert, Bestand). */
  marktmieteMin: number
  marktmieteMax: number
  /**
   * Geschätzter Lagezuschlag in €/m² für überdurchschnittliche Lagen des Bezirks.
   * 0 = im Bezirksdurchschnitt keine überdurchschnittliche Lage / kein Lagezuschlag.
   */
  /**
   * Bezirksnäherung für den Lagezuschlag in €/m². Amtlich ist der Lagezuschlag
   * grundstücksscharf – maßgeblich ist die Lagezuschlagskarte der Stadt Wien,
   * die im Ergebnis für die eingegebene Adresse verlinkt wird.
   */
  lagezuschlag: number
}

export const BEZIRKE: BezirkInfo[] = [
  { nr: 1, name: 'Innere Stadt', marktmieteMin: 19, marktmieteMax: 29, lagezuschlag: 6.44 },
  { nr: 2, name: 'Leopoldstadt', marktmieteMin: 14, marktmieteMax: 20, lagezuschlag: 1.8 },
  { nr: 3, name: 'Landstraße', marktmieteMin: 15, marktmieteMax: 21, lagezuschlag: 2.1 },
  { nr: 4, name: 'Wieden', marktmieteMin: 16, marktmieteMax: 23, lagezuschlag: 3.4 },
  { nr: 5, name: 'Margareten', marktmieteMin: 14, marktmieteMax: 19, lagezuschlag: 1.2 },
  { nr: 6, name: 'Mariahilf', marktmieteMin: 16, marktmieteMax: 23, lagezuschlag: 3.2 },
  { nr: 7, name: 'Neubau', marktmieteMin: 16, marktmieteMax: 23, lagezuschlag: 3.4 },
  { nr: 8, name: 'Josefstadt', marktmieteMin: 15, marktmieteMax: 22, lagezuschlag: 3.0 },
  { nr: 9, name: 'Alsergrund', marktmieteMin: 15, marktmieteMax: 22, lagezuschlag: 2.6 },
  { nr: 10, name: 'Favoriten', marktmieteMin: 11, marktmieteMax: 15, lagezuschlag: 0 },
  { nr: 11, name: 'Simmering', marktmieteMin: 10, marktmieteMax: 14, lagezuschlag: 0 },
  { nr: 12, name: 'Meidling', marktmieteMin: 12, marktmieteMax: 16, lagezuschlag: 0 },
  { nr: 13, name: 'Hietzing', marktmieteMin: 14, marktmieteMax: 21, lagezuschlag: 2.5 },
  { nr: 14, name: 'Penzing', marktmieteMin: 12, marktmieteMax: 17, lagezuschlag: 0.6 },
  { nr: 15, name: 'Rudolfsheim-Fünfhaus', marktmieteMin: 12, marktmieteMax: 16, lagezuschlag: 0 },
  { nr: 16, name: 'Ottakring', marktmieteMin: 11, marktmieteMax: 15, lagezuschlag: 0 },
  { nr: 17, name: 'Hernals', marktmieteMin: 12, marktmieteMax: 17, lagezuschlag: 0.6 },
  { nr: 18, name: 'Währing', marktmieteMin: 14, marktmieteMax: 20, lagezuschlag: 2.0 },
  { nr: 19, name: 'Döbling', marktmieteMin: 15, marktmieteMax: 23, lagezuschlag: 2.6 },
  { nr: 20, name: 'Brigittenau', marktmieteMin: 11, marktmieteMax: 15, lagezuschlag: 0 },
  { nr: 21, name: 'Floridsdorf', marktmieteMin: 10, marktmieteMax: 14, lagezuschlag: 0 },
  { nr: 22, name: 'Donaustadt', marktmieteMin: 11, marktmieteMax: 15, lagezuschlag: 0 },
  { nr: 23, name: 'Liesing', marktmieteMin: 11, marktmieteMax: 15, lagezuschlag: 0 },
]

export function getBezirk(nr: number): BezirkInfo {
  return BEZIRKE.find((b) => b.nr === nr) ?? BEZIRKE[0]
}

/**
 * Versucht, aus einer Anschrift den Wiener Gemeindebezirk zu bestimmen.
 * Erkennt Wiener Postleitzahlen der Form 1XX0 (z.B. 1070 -> 7. Bezirk).
 */
export function bezirkAusAnschrift(anschrift: string): number | null {
  if (!anschrift) return null
  const match = anschrift.match(/\b1(\d{2})0\b/)
  if (!match) return null
  const nr = parseInt(match[1], 10)
  if (nr >= 1 && nr <= 23) return nr
  return null
}

/** Default: alle Merkmale abgewählt. */
export function leereMerkmale(): Record<MerkmalKey, boolean> {
  const m = {} as Record<MerkmalKey, boolean>
  for (const def of MERKMAL_KATALOG) m[def.key] = false
  return m
}
