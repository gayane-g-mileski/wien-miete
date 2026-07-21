// Domain types for the Wiener Mietzins-Check.
// Terminology follows the Mietrechtsgesetz (MRG) as summarized in the
// reference material (Voll-/Teilausnahme/Vollanwendung, Tabelle 1, Förderungen).

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

export type Foerderung = 'keine' | 'gefoerdert_offen' | 'gefoerdert_getilgt' | 'wgg'

export type Kategorie = 'A' | 'B' | 'C' | 'D_brauchbar' | 'D_unbrauchbar'

export type Lagequalitaet = 'unterdurchschnittlich' | 'durchschnittlich' | 'ueberdurchschnittlich' | 'sehr_gut'

export type Zustand = 'gut' | 'durchschnittlich' | 'sanierungsbeduerftig'

export interface MietobjektInput {
  objektart: Objektart
  baubewilligungGebaeude: BaubewilligungGebaeude
  dgAusbauNachStichtag: boolean // Baubewilligung/Mietvertrag nach 31.12.2001 (Objektart dg_ausbau)
  zubauNachStichtag: boolean // Baubewilligung nach 30.9.2006 (Objektart zubau)
  foerderung: Foerderung
  kategorie: Kategorie
  flaeche: number // m²
  bezirk: number // 1-23
  lagequalitaet: Lagequalitaet
  zustand: Zustand
  balkonTerrasse: boolean
  lift: boolean
  befristet: boolean
  marktmieteM2Override: number | null // manueller Override, sonst Bezirks-Schätzung
}

export type MietzinsArt =
  | 'richtwert'
  | 'kategorie_d'
  | 'angemessen'
  | 'frei'
  | 'wgg'
  | 'foerderungsrechtlich'

export type MrgAnwendung = 'voll' | 'teil' | 'ausnahme'

export interface Preisspanne {
  proM2Min: number
  proM2Max: number
  monatlichMin: number
  monatlichMax: number
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
}
