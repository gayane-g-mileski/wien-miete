// Preis-Referenzdaten. Quellen: mietervereinigung.at (Richtwert, Zuschläge/Abschläge,
// Lagezuschlag Wien), Richtwertgesetz, allgemeine Marktbeobachtung. Marktmiet- und
// Lagezuschlag-Werte sind hinterlegte Näherungen (kein Live-Datenabgleich).

/** Richtwert Wien in €/m² netto, monatlich (mietrechtliche Normwohnung, Kat. A). Seit 1.4.2026. */
export const RICHTWERT_WIEN = 6.74

/** Kategorie-Faktor auf den Richtwert (Normwohnung = Kategorie A). */
export const KATEGORIE_FAKTOR: Record<'A' | 'B' | 'C', number> = {
  A: 1,
  B: 0.75,
  C: 0.5,
}

/** Gesetzlich fixierter Kategorie-D-Hauptmietzins, €/m² netto pro Monat. */
export const KAT_D_HMZ = {
  brauchbar: 2.24,
  unbrauchbar: 1.12,
}

/** Befristungsabschlag bei Vollanwendung (schriftlich), WHG + GL. */
export const BEFRISTUNGSABSCHLAG = 0.25

/** Vereinfachte Umrechnung: angemessener Mietzins ≈ freier Mietzins − 25 %. */
export const ANGEMESSEN_ABSCHLAG_VON_FREI = 0.25

/**
 * Zu- und Abschläge auf den Richtwert in €/m². Da das Gesetz keine fixen
 * Prozentsätze vorgibt (Einzelfallprüfung/Vergleichswertverfahren), sind dies
 * praxisorientierte Näherungswerte für eine Ersteinschätzung.
 */
export const ZUSCHLAG = {
  lift: 0.3,
  balkonTerrasse: 0.4,
  garten: 0.6,
  ruhelage: 0.4,
  ausblick: 0.25,
  hochwertigeAusstattung: 0.5,
  heizungZentral: 0.3,
  keller: 0.1,
  garage: 0.35,
  gemeinschaft: 0.15,
  zustandSehrGut: 0.4,
} as const

export const ABSCHLAG = {
  zustandSchlecht: 0.6,
  stockwerkErdgeschoss: 0.25,
  stockwerkHochOhneLift: 0.3,
  strassenlaerm: 0.4,
} as const

export interface BezirkInfo {
  nr: number
  name: string
  /** Grobe Bandbreite freier/marktüblicher Nettomiete in €/m²/Monat (unmöbliert, Bestand). */
  marktmieteMin: number
  marktmieteMax: number
  /**
   * Geschätzter Lagezuschlag in €/m² für überdurchschnittliche Lagen des Bezirks.
   * 0 = im Bezirksdurchschnitt keine überdurchschnittliche Lage / kein Lagezuschlag.
   * Der reale Lagezuschlag wird lt. OGH anhand der Wiener Lagezuschlagskarte auf
   * Zählgebiets-Ebene (Adressgenauigkeit) bestimmt – hier nur genähert.
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
 * Erkennt Wiener Postleitzahlen der Form 1XX0 (z.B. 1070 -> 7. Bezirk) sowie
 * Angaben wie "1070 Wien". Gibt null zurück, wenn kein Bezirk ableitbar ist.
 */
export function bezirkAusAnschrift(anschrift: string): number | null {
  if (!anschrift) return null
  const match = anschrift.match(/\b1(\d{2})0\b/)
  if (!match) return null
  const nr = parseInt(match[1], 10)
  if (nr >= 1 && nr <= 23) return nr
  return null
}
