// Domain types für den Wiener Mietzins-Check.

import type { Gesetzeslink } from './gesetze'

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

export type MerkmalKey =
  | 'hochwertigesBad'
  | 'zweitesWc'
  | 'hochwertigeKueche'
  | 'hochwertigeBoeden'
  | 'schallschutzfenster'
  | 'fussbodenheizung'
  | 'klimaanlage'
  | 'barrierefrei'
  | 'balkon'
  | 'loggia'
  | 'terrasse'
  | 'eigengarten'
  | 'dachterrasse'
  | 'ruhelage'
  | 'sonnig'
  | 'ausblick'
  | 'strassenlaerm'
  | 'dunkel'
  | 'schlechterGrundriss'
  | 'lift'
  | 'gegensprechanlage'
  | 'concierge'
  | 'gemeinschaft'
  | 'denkmalschutz'
  | 'begruenterInnenhof'
  | 'kellerabteil'
  | 'dachbodenabteil'
  | 'garage'
  | 'stellplatz'

export type Merkmale = Record<MerkmalKey, boolean>

export interface Koordinaten {
  lat: number
  lon: number
}

export interface MietobjektInput {
  objektart: Objektart
  baubewilligungGebaeude: BaubewilligungGebaeude
  dgAusbauNachStichtag: boolean
  zubauNachStichtag: boolean
  // Anschrift
  anschrift: string
  anschriftBezirk: number | null // aus gewählter Adresse (Autocomplete)
  anschriftKoords: Koordinaten | null
  gemeindebau: boolean // Gemeindebau der Stadt Wien (Wiener Wohnen)
  flaeche: number
  bezirk: number // Marktpreis-Fallback
  eigentumswohnung: boolean
  befristet: boolean
  // Förderung
  foerderungProgramm: FoerderungProgramm
  tilgungsstatus: Tilgungsstatus
  // Ausstattung & Zustand
  kategorie: Kategorie
  zustandHaus: ZustandHaus
  heizung: Heizung
  stockwerk: Stockwerk
  merkmale: Merkmale
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

export type LageStatus = 'unbekannt' | 'zuschlag' | 'neutral' | 'abschlag'

export interface LageInfo {
  status: LageStatus
  text: string // menschliche Erklärung
  bezirk: number | null
  koords: Koordinaten | null
  adresse: string
}

export interface MrgErgebnis {
  mietzinsArt: MietzinsArt
  mietzinsArtLabel: string
  anwendung: MrgAnwendung
  anwendungLabel: string
  kuendigungsschutz: boolean
  preisschutz: boolean
  preis: Preisspanne | null
  begruendung: string[] // menschlich, ohne Paragraphen
  gesetze: Gesetzeslink[] // Links zu den Gesetzestexten
  hinweise: string[]
  lage: LageInfo
}
