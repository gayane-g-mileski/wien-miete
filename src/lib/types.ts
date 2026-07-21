// Domain types für den Wiener Mietzins-Check.
// Terminologie folgt dem Mietrechtsgesetz (MRG) und dem Richtwertgesetz.

export type Objektart =
  | 'wohnung'
  | 'geschaeftsraum'
  | 'geschaeftsraum_kurzzeit'
  | 'einfamilienhaus'
  | 'zweifamilienhaus'
  | 'dg_ausbau'
  | 'zubau'
  | 'dienstwohnung'
  | 'karitatives_wohnen'
  | 'heim_beherbergung'
  | 'zweitwohnung_befristet'
  | 'ferienwohnung'
  | 'pacht'
  | 'nebenflaeche_separat'
  | 'wirtschaftspark'

export type BaubewilligungGebaeude = 'vor_1945' | '1945_1953' | 'nach_1953'

export type Kategorie = 'A' | 'B' | 'C' | 'D_brauchbar' | 'D_unbrauchbar'

export type ZustandHaus = 'sehr_gut' | 'durchschnittlich' | 'schlecht'
export type Heizung = 'zentral_etage' | 'keine'
export type Stockwerk = 'erdgeschoss' | 'normal' | 'hoch_ohne_lift'

// Förderungsprogramme laut Unterlage "Förderungen".
export type FoerderungProgramm =
  | 'keine'
  | 'wwg1948'
  | 'wfg1954'
  | 'gr_beschluss'
  | 'wfg1968'
  | 'wfg1984'
  | 'wwfsg1989'
  | 'wgg'

export type Tilgungsstatus = 'offen' | 'getilgt_wgg' | 'rbg1971' | 'rbg1987'

export interface MietobjektInput {
  objektart: Objektart
  baubewilligungGebaeude: BaubewilligungGebaeude
  dgAusbauNachStichtag: boolean
  zubauNachStichtag: boolean
  anschrift: string // optional; leer = ohne Lageberücksichtigung
  flaeche: number // m²
  bezirk: number // 1-23 (für Marktpreis)
  eigentumswohnung: boolean
  befristet: boolean

  // Förderung
  foerderungProgramm: FoerderungProgramm
  tilgungsstatus: Tilgungsstatus

  // Ausstattung & Zustand (Zu-/Abschläge)
  kategorie: Kategorie
  zustandHaus: ZustandHaus
  heizung: Heizung
  stockwerk: Stockwerk
  lift: boolean
  balkonTerrasse: boolean
  garten: boolean
  ruhelage: boolean
  ausblick: boolean
  hochwertigeAusstattung: boolean
  keller: boolean
  garage: boolean
  gemeinschaft: boolean
  strassenlaerm: boolean
}

export type MietzinsArt =
  | 'richtwert'
  | 'kategorie_d'
  | 'angemessen'
  | 'frei'
  | 'wgg'
  | 'foerderungsrechtlich'

export type MrgAnwendung = 'voll' | 'teil' | 'ausnahme'

export interface Preisbestandteil {
  label: string
  wert: number // €/m²
}

export interface Preisspanne {
  proM2Min: number
  proM2Max: number
  monatlichMin: number
  monatlichMax: number
  bestandteile?: Preisbestandteil[]
}

export interface MrgErgebnis {
  mietzinsArt: MietzinsArt
  mietzinsArtLabel: string
  anwendung: MrgAnwendung
  anwendungLabel: string
  kuendigungsschutz: boolean
  preisschutz: boolean
  preis: Preisspanne | null
  rechtsgrundlagen: string[]
  begruendung: string[]
  hinweise: string[]
  lageHinweis: string | null
}
