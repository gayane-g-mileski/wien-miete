import type {
  BaubewilligungGebaeude,
  Heizung,
  Kategorie,
  Objektart,
  Stockwerk,
  ZustandHaus,
} from './types'

export const OBJEKTART_GRUPPEN: { label: string; optionen: { value: Objektart; label: string }[] }[] = [
  {
    label: 'Standard',
    optionen: [
      { value: 'wohnung', label: 'Wohnung' },
      { value: 'geschaeftsraum', label: 'Geschäftsraum / Lokal' },
    ],
  },
  {
    label: 'Neubau-Sonderfälle',
    optionen: [
      { value: 'dg_ausbau', label: 'Dachgeschoß-Ausbau / -Aufstockung' },
      { value: 'zubau', label: 'Zubau (Erweiterung eines Bestandsgebäudes)' },
    ],
  },
  {
    label: 'Vollausnahmen vom MRG',
    optionen: [
      { value: 'einfamilienhaus', label: 'Einfamilienhaus' },
      { value: 'zweifamilienhaus', label: 'Zweifamilienhaus' },
      { value: 'dienstwohnung', label: 'Dienst-, Natural- oder Werkswohnung' },
      { value: 'karitatives_wohnen', label: 'Karitatives, sozialpädagogisch betreutes Wohnen' },
      { value: 'heim_beherbergung', label: 'Heim oder Beherbergungsbetrieb' },
      { value: 'zweitwohnung_befristet', label: 'Befristete berufsbedingte Zweitwohnung (≤ 6 Monate)' },
      { value: 'ferienwohnung', label: 'Ferien-/Freizeitwohnung' },
      { value: 'pacht', label: 'Pachtverhältnis' },
      { value: 'nebenflaeche_separat', label: 'Separate Nebenfläche (Garage, Stellplatz, Garten, o.Ä.)' },
      { value: 'geschaeftsraum_kurzzeit', label: 'Geschäftsraum, höchstens 6 Monate befristet' },
    ],
  },
  {
    label: 'Sonstiges',
    optionen: [{ value: 'wirtschaftspark', label: 'Objekt in einem Wirtschaftspark' }],
  },
]

export const BAUBEWILLIGUNG_LABEL: Record<BaubewilligungGebaeude, string> = {
  vor_1945: 'bis 8.5.1945 (Altbau)',
  '1945_1953': '9.5.1945 – 30.6.1953',
  nach_1953: 'nach dem 30.6.1953 (Neubau)',
}

export const KATEGORIE_LABEL: Record<Kategorie, string> = {
  A: 'Kategorie A (voll ausgestattet, Zimmer ≥ 30 m²)',
  B: 'Kategorie B (Bad/WC, Zimmer ≥ 30 m²)',
  C: 'Kategorie C (WC + fließend Wasser, Zimmer < 30 m²)',
  D_brauchbar: 'Kategorie D – brauchbar',
  D_unbrauchbar: 'Kategorie D – unbrauchbar',
}

export const ZUSTAND_HAUS_LABEL: Record<ZustandHaus, string> = {
  sehr_gut: 'sehr gut / saniert (Zuschlag)',
  durchschnittlich: 'durchschnittlich',
  schlecht: 'sanierungsbedürftig (Abschlag)',
}

export const HEIZUNG_LABEL: Record<Heizung, string> = {
  zentral_etage: 'Zentral- oder Etagenheizung (Zuschlag)',
  keine: 'keine Zentral-/Etagenheizung',
}

export const STOCKWERK_LABEL: Record<Stockwerk, string> = {
  erdgeschoss: 'Erdgeschoss / Hochparterre (Abschlag)',
  normal: 'Normalgeschoss',
  hoch_ohne_lift: 'hohes Stockwerk ohne Lift (Abschlag)',
}

export function zeigeBaujahr(objektart: Objektart): boolean {
  return ['wohnung', 'geschaeftsraum', 'dg_ausbau', 'zubau'].includes(objektart)
}

export function zeigeFoerderung(objektart: Objektart): boolean {
  return ['wohnung', 'geschaeftsraum', 'dg_ausbau', 'zubau'].includes(objektart)
}

export function zeigeKategorie(objektart: Objektart): boolean {
  return ['wohnung', 'dg_ausbau', 'zubau', 'zweitwohnung_befristet'].includes(objektart)
}

export function zeigeAusstattung(objektart: Objektart): boolean {
  return ['wohnung', 'geschaeftsraum', 'dg_ausbau', 'zubau'].includes(objektart)
}
