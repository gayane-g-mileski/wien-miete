import { evaluateMrg } from './mrgEngine'
import { ENGINE_VERSION } from './version'
import type { MietobjektInput, MrgErgebnis } from './types'

// Vertrag der öffentlichen Schnittstelle (Version 1).
//
// Dieselbe Rechenlogik, die die Oberfläche verwendet, steht Unternehmen als
// REST-Schnittstelle zur Verfügung. Die Typen hier sind die verbindliche
// Beschreibung der Antwort; die Dokumentationsseite erzeugt ihre Beispiele aus
// genau dieser Umwandlung, damit Beschreibung und Wirklichkeit nicht
// auseinanderlaufen.

export const API_VERSION = '1'

export interface ApiObjekt {
  anschrift?: string
  bezirk?: number | null
  flaeche: number
  objektart: MietobjektInput['objektart']
  baubewilligung: MietobjektInput['baubewilligungGebaeude']
  vertragsdatum?: string
  kategorie: MietobjektInput['kategorie']
  befristet: boolean
  gefoerdert: boolean
}

export interface ApiEinschaetzung {
  version: string
  engine: string
  erstellt: string
  objekt: ApiObjekt
  mietzins: {
    art: MrgErgebnis['mietzinsArt']
    bezeichnung: string
    mrg: {
      anwendung: MrgErgebnis['anwendung']
      bezeichnung: string
      kuendigungsschutz: boolean
      preisschutz: boolean
    }
  }
  preis: {
    flaeche: number
    proM2: { min: number; max: number }
    monat: { min: number; max: number }
    bestandteile: { label: string; wert: number }[]
    sichten: { name: string; titel: string; proM2Min: number; proM2Max: number; monatMin: number; monatMax: number }[]
  } | null
  lagezuschlag: {
    wert: number
    min: number
    max: number
    ausgeschlossen: boolean
    schritte: { was: string; ergebnis: string; quelle: string }[]
  } | null
  begruendung: string[]
  hinweise: string[]
  fundstellen: { label: string; url: string }[]
  haftung: string
}

export const HAFTUNGSHINWEIS =
  'Automatisierte Ersteinschätzung auf Basis vereinfachter Regeln und hinterlegter Näherungswerte. Kein Gutachten, keine Rechtsauskunft, keine Beratung im Einzelfall.'

/** Wandelt das Ergebnis der Rechenlogik in die Antwort der Schnittstelle um. */
export function alsApiAntwort(input: MietobjektInput, ergebnis: MrgErgebnis): ApiEinschaetzung {
  return {
    version: API_VERSION,
    engine: ENGINE_VERSION,
    erstellt: new Date().toISOString(),
    objekt: {
      anschrift: input.anschrift || undefined,
      bezirk: input.anschriftBezirk ?? input.bezirk,
      flaeche: input.flaeche,
      objektart: input.objektart,
      baubewilligung: input.baubewilligungGebaeude,
      vertragsdatum: input.vertragsdatum || undefined,
      kategorie: input.kategorie,
      befristet: input.befristet,
      gefoerdert: input.foerderungProgramm !== 'keine',
    },
    mietzins: {
      art: ergebnis.mietzinsArt,
      bezeichnung: ergebnis.mietzinsArtLabel,
      mrg: {
        anwendung: ergebnis.anwendung,
        bezeichnung: ergebnis.anwendungLabel,
        kuendigungsschutz: ergebnis.kuendigungsschutz,
        preisschutz: ergebnis.preisschutz,
      },
    },
    preis: ergebnis.preis
      ? {
          flaeche: ergebnis.preis.flaeche,
          proM2: { min: ergebnis.preis.proM2Min, max: ergebnis.preis.proM2Max },
          monat: { min: ergebnis.preis.monatlichMin, max: ergebnis.preis.monatlichMax },
          bestandteile: ergebnis.preis.bestandteile ?? [],
          sichten: (ergebnis.preis.sichten ?? []).map((s) => ({
            name: s.name,
            titel: s.titel,
            proM2Min: s.proM2Min,
            proM2Max: s.proM2Max,
            monatMin: s.monatlichMin,
            monatMax: s.monatlichMax,
          })),
        }
      : null,
    lagezuschlag: ergebnis.lagezuschlag
      ? {
          wert: ergebnis.lagezuschlag.wert,
          min: ergebnis.lagezuschlag.min,
          max: ergebnis.lagezuschlag.max,
          ausgeschlossen: ergebnis.lagezuschlag.ausgeschlossen,
          schritte: ergebnis.lagezuschlag.schritte,
        }
      : null,
    begruendung: ergebnis.begruendung,
    hinweise: ergebnis.hinweise,
    fundstellen: ergebnis.gesetze.map((g) => ({ label: g.label, url: g.url })),
    haftung: HAFTUNGSHINWEIS,
  }
}

/** Beispielantwort für die Dokumentation – aus der echten Rechenlogik. */
export function beispielAntwort(input: MietobjektInput): ApiEinschaetzung {
  return alsApiAntwort(input, evaluateMrg(input))
}

export interface Endpunkt {
  methode: 'GET' | 'POST'
  pfad: string
  zweck: string
  koerper?: string
  tarif: 'inklusive' | 'nach Abfragen' | 'PRO'
}

export const ENDPUNKTE: Endpunkt[] = [
  {
    methode: 'POST',
    pfad: '/v1/einschaetzung',
    zweck: 'Mietzinsart, Anwendungsbereich des MRG, Preisbandbreite und Herleitung des Lagezuschlags für ein Objekt.',
    koerper: 'Objektdaten (Fläche, Objektart, Baubewilligung, Vertragsdatum, Kategorie, Anschrift oder Bezirk)',
    tarif: 'nach Abfragen',
  },
  {
    methode: 'POST',
    pfad: '/v1/wertsicherung',
    zweck: 'Zulässige Anpassung eines laufenden Mietzinses samt Deckel, Schwellenwert und Wirksamkeitsdatum.',
    koerper: 'Aktueller Hauptmietzins, Mietzinsart, letzte Anpassung, Klauselwerte',
    tarif: 'nach Abfragen',
  },
  {
    methode: 'POST',
    pfad: '/v1/betriebskosten',
    zweck: 'Prüfung einer Jahresabrechnung gegen den Katalog des § 21 MRG, Position für Position.',
    koerper: 'Positionen mit Bezeichnung und Betrag, Nutzfläche des Objekts und des Hauses',
    tarif: 'nach Abfragen',
  },
  {
    methode: 'POST',
    pfad: '/v1/bestand',
    zweck: 'Mehrere Einheiten in einem Aufruf; Antwort als Liste in derselben Reihenfolge.',
    koerper: 'Array von Objektdaten (bis 500 je Aufruf)',
    tarif: 'nach Abfragen',
  },
  {
    methode: 'POST',
    pfad: '/v1/bericht',
    zweck: 'Prüfbericht als PDF mit Rechenweg, Fundstellen, Zeitstempel und Version der Rechenlogik.',
    koerper: 'Objektdaten wie bei /v1/einschaetzung',
    tarif: 'PRO',
  },
  {
    methode: 'GET',
    pfad: '/v1/kontingent',
    zweck: 'Verbrauchte und verbleibende Abfragen im laufenden Abrechnungszeitraum.',
    tarif: 'inklusive',
  },
]

export interface Fehlercode {
  code: string
  status: number
  bedeutung: string
}

export const FEHLERCODES: Fehlercode[] = [
  { code: 'schluessel_fehlt', status: 401, bedeutung: 'Kein oder ungültiger API-Schlüssel im Authorization-Kopf.' },
  { code: 'kontingent_erschoepft', status: 402, bedeutung: 'Das Kontingent des Zeitraums ist aufgebraucht.' },
  { code: 'eingabe_ungueltig', status: 422, bedeutung: 'Pflichtfeld fehlt oder Wert liegt außerhalb des Zulässigen.' },
  { code: 'zu_viele_anfragen', status: 429, bedeutung: 'Mehr als 60 Anfragen pro Minute je Schlüssel.' },
  { code: 'serverfehler', status: 500, bedeutung: 'Unerwarteter Fehler; die Anfrage kann wiederholt werden.' },
]

export function apiBasis(): string {
  // Optionaler Zugriff, weil dieselbe Datei auch im Server läuft, wo es
  // import.meta.env nicht gibt.
  return (import.meta.env?.VITE_API_BASIS as string | undefined) ?? ''
}

export function beispielAufruf(): string {
  const basis = apiBasis() || 'https://api.mietzins-check.at'
  return `curl -X POST ${basis}/v1/einschaetzung \\
  -H "Authorization: Bearer sk_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "anschrift": "Neubaugasse 1, 1070 Wien",
    "flaeche": 75,
    "objektart": "wohnung",
    "baubewilligung": "vor_1945",
    "vertragsdatum": "2024-05-01",
    "kategorie": "A",
    "befristet": false
  }'`
}
