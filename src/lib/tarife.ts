import type { Produkt } from './konto'

// Preise an einer Stelle, damit Preisseite, Anmeldemaske und Rechnung nicht
// auseinanderlaufen. Angegeben wird immer der Bruttopreis (§ 4 PrAG:
// Endpreise inklusive Umsatzsteuer); der Nettobetrag steht daneben, weil
// Unternehmen ihn für die Buchhaltung brauchen.

export const UST_SATZ = 0.2

export function netto(brutto: number): number {
  return Math.round((brutto / (1 + UST_SATZ)) * 100) / 100
}

export function euro(betrag: number): string {
  return `${betrag.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export interface Tarif {
  id: 'frei' | 'bericht' | 'profi' | 'api'
  name: string
  /** Bruttopreis in Euro; 0 = kostenlos. */
  brutto: number
  /** „ab“ vor dem Preis anzeigen. */
  ab?: boolean
  einheit: string
  fuer: string
  leistungen: string[]
  cta: string
  produkt?: Produkt
  anlass?: string
  /** Laufzeit und Verlängerung – Pflichtangabe nach § 6 Abs 1 KSchG. */
  laufzeit?: string
  hervor?: boolean
}

export const TARIFE: Tarif[] = [
  {
    id: 'frei',
    name: 'Rechner',
    brutto: 0,
    einheit: 'dauerhaft',
    fuer: 'Einzelne Einheit, schnelle Einordnung',
    leistungen: [
      'Mietzinsart, Schutzumfang und Preisbandbreite',
      'Judikatur-, Schlichtungsstellen- und Marktsicht',
      'Wertsicherung, Betriebskosten und Rendite',
      'Ergebnis als PDF, Verlauf im Browser',
    ],
    cta: 'Ohne Konto starten',
  },
  {
    id: 'bericht',
    name: 'Prüfbericht PRO',
    brutto: 24,
    einheit: 'je Bericht, einmalig',
    fuer: 'Beilage für Akt, Eigentümer und Schlichtungsstelle',
    leistungen: [
      'Alles aus der Einzelprüfung',
      'Ausführlicher Bericht mit Fundstellen und Rechenweg',
      'Herleitung des Lagezuschlags mit Quellenangabe',
      'Zeitstempel und Version der Rechenlogik',
    ],
    cta: 'Zahlungspflichtig bestellen',
    produkt: 'bericht',
    anlass: 'Der Prüfbericht PRO kostet 24,00 € inklusive Umsatzsteuer und wird über ein Konto abgerechnet.',
    laufzeit: 'Einmalkauf, keine Laufzeit, keine automatische Verlängerung.',
    hervor: true,
  },
  {
    id: 'profi',
    name: 'Profi',
    brutto: 49,
    ab: true,
    einheit: 'pro Monat',
    fuer: 'Hausverwaltung, Immobilientreuhand, Bestandshalter',
    leistungen: [
      'Alles aus dem Prüfbericht PRO, unbegrenzt',
      'Bestandslisten per CSV, ganze Häuser auf einmal',
      'Wertsicherung fürs Portfolio, Erhöhungsschreiben in Serie',
      'Zugänge für das Team, gemeinsame Objektlisten',
    ],
    cta: 'Zahlungspflichtig bestellen',
    produkt: 'profi',
    anlass: 'Der Profi-Zugang kostet ab 49,00 € pro Monat inklusive Umsatzsteuer.',
    laufzeit: 'Monatlich, jederzeit zum Ende des laufenden Monats kündbar. Verlängert sich monatlich, bis gekündigt wird.',
  },
  {
    id: 'api',
    name: 'API & White-Label',
    brutto: 149,
    ab: true,
    einheit: 'pro Monat',
    fuer: 'Eigene Software, eingebetteter Rechner',
    leistungen: [
      'REST-Schnittstelle mit 2.000 Abfragen im Monat',
      'Eingebetteter Rechner im eigenen Erscheinungsbild',
      'Auftragsverarbeitungsvertrag nach Art. 28 DSGVO',
      'Versionierte Rechenlogik, Zeitstempel je Antwort',
    ],
    cta: 'Zugang anfragen',
    produkt: 'api',
    anlass: 'Der Zugang zu Schnittstelle und White-Label kostet ab 149,00 € pro Monat inklusive Umsatzsteuer.',
    laufzeit: 'Monatlich, jederzeit zum Ende des laufenden Monats kündbar. Verlängert sich monatlich, bis gekündigt wird.',
  },
]

export function tarifFuer(produkt: Produkt): Tarif | undefined {
  return TARIFE.find((t) => t.produkt === produkt)
}

export function preisText(t: Tarif): string {
  if (t.brutto === 0) return '0 €'
  return `${t.ab ? 'ab ' : ''}${euro(t.brutto)}`
}
