// Preis-Referenzdaten. Quellen: mietervereinigung.at (Richtwert und Richtwertmiete,
// Zuschläge und Abschläge im Mietrecht, Lagezuschlag Wien) sowie allgemeine
// Marktbeobachtung. Alle Marktmiet-Werte sind grobe, manuell hinterlegte
// Näherungen (kein Live-Datenabgleich) und im Formular überschreibbar.

/** Richtwert Wien in €/m² netto, monatlich (Kategorie A, Vollausstattung). Seit 1.4.2026. */
export const RICHTWERT_WIEN = 6.74

/** Pauschale Kategorie-Abschläge auf den Richtwert (Normwohnung = Kategorie A). */
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

/** Befristungsabschlag bei Vollanwendung (schriftlich vereinbart), WHG + GL. */
export const BEFRISTUNGSABSCHLAG = 0.25

/** Vereinfachte Umrechnung: angemessener Mietzins ≈ freier Mietzins − 25 %. */
export const ANGEMESSEN_ABSCHLAG_VON_FREI = 0.25

export interface BezirkInfo {
  nr: number
  name: string
  /** Grobe Bandbreite freier/marktüblicher Nettomiete in €/m²/Monat (unmöbliert, Bestand). */
  marktmieteMin: number
  marktmieteMax: number
  /** Typische Lageeinstufung lt. Wiener Lagezuschlagskarte (grobe Näherung je Bezirk). */
  typischeLage: 'durchschnittlich' | 'ueberdurchschnittlich' | 'sehr_gut'
}

export const BEZIRKE: BezirkInfo[] = [
  { nr: 1, name: 'Innere Stadt', marktmieteMin: 19, marktmieteMax: 29, typischeLage: 'sehr_gut' },
  { nr: 2, name: 'Leopoldstadt', marktmieteMin: 14, marktmieteMax: 20, typischeLage: 'ueberdurchschnittlich' },
  { nr: 3, name: 'Landstraße', marktmieteMin: 15, marktmieteMax: 21, typischeLage: 'ueberdurchschnittlich' },
  { nr: 4, name: 'Wieden', marktmieteMin: 16, marktmieteMax: 23, typischeLage: 'sehr_gut' },
  { nr: 5, name: 'Margareten', marktmieteMin: 14, marktmieteMax: 19, typischeLage: 'durchschnittlich' },
  { nr: 6, name: 'Mariahilf', marktmieteMin: 16, marktmieteMax: 23, typischeLage: 'sehr_gut' },
  { nr: 7, name: 'Neubau', marktmieteMin: 16, marktmieteMax: 23, typischeLage: 'sehr_gut' },
  { nr: 8, name: 'Josefstadt', marktmieteMin: 15, marktmieteMax: 22, typischeLage: 'ueberdurchschnittlich' },
  { nr: 9, name: 'Alsergrund', marktmieteMin: 15, marktmieteMax: 22, typischeLage: 'ueberdurchschnittlich' },
  { nr: 10, name: 'Favoriten', marktmieteMin: 11, marktmieteMax: 15, typischeLage: 'durchschnittlich' },
  { nr: 11, name: 'Simmering', marktmieteMin: 10, marktmieteMax: 14, typischeLage: 'durchschnittlich' },
  { nr: 12, name: 'Meidling', marktmieteMin: 12, marktmieteMax: 16, typischeLage: 'durchschnittlich' },
  { nr: 13, name: 'Hietzing', marktmieteMin: 14, marktmieteMax: 21, typischeLage: 'ueberdurchschnittlich' },
  { nr: 14, name: 'Penzing', marktmieteMin: 12, marktmieteMax: 17, typischeLage: 'durchschnittlich' },
  { nr: 15, name: 'Rudolfsheim-Fünfhaus', marktmieteMin: 12, marktmieteMax: 16, typischeLage: 'durchschnittlich' },
  { nr: 16, name: 'Ottakring', marktmieteMin: 11, marktmieteMax: 15, typischeLage: 'durchschnittlich' },
  { nr: 17, name: 'Hernals', marktmieteMin: 12, marktmieteMax: 17, typischeLage: 'durchschnittlich' },
  { nr: 18, name: 'Währing', marktmieteMin: 14, marktmieteMax: 20, typischeLage: 'ueberdurchschnittlich' },
  { nr: 19, name: 'Döbling', marktmieteMin: 15, marktmieteMax: 23, typischeLage: 'sehr_gut' },
  { nr: 20, name: 'Brigittenau', marktmieteMin: 11, marktmieteMax: 15, typischeLage: 'durchschnittlich' },
  { nr: 21, name: 'Floridsdorf', marktmieteMin: 10, marktmieteMax: 14, typischeLage: 'durchschnittlich' },
  { nr: 22, name: 'Donaustadt', marktmieteMin: 11, marktmieteMax: 15, typischeLage: 'durchschnittlich' },
  { nr: 23, name: 'Liesing', marktmieteMin: 11, marktmieteMax: 15, typischeLage: 'durchschnittlich' },
]

export function getBezirk(nr: number): BezirkInfo {
  return BEZIRKE.find((b) => b.nr === nr) ?? BEZIRKE[0]
}

/**
 * Grober Lagezuschlag in €/m², abgeleitet aus der typischen Lageeinstufung des
 * Bezirks und der vom Nutzer gewählten (feineren) Lagequalität. Der reale
 * Lagezuschlag wird laut OGH-Rechtsprechung anhand der Wiener
 * Lagezuschlagskarte auf Zählgebiets-Ebene ermittelt (u.a. Verkehrsanbindung,
 * Bildungs-/Nahversorgung, Grünraum, Grundkostenanteil) - hier nur genähert.
 */
export function schaetzeLagezuschlag(lagequalitaet: 'unterdurchschnittlich' | 'durchschnittlich' | 'ueberdurchschnittlich' | 'sehr_gut'): number {
  switch (lagequalitaet) {
    case 'sehr_gut':
      return 3.2
    case 'ueberdurchschnittlich':
      return 1.4
    case 'durchschnittlich':
    case 'unterdurchschnittlich':
    default:
      return 0
  }
}
