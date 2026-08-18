import { getBezirk } from './pricingData'
import type { Gruenderzeitlage } from './types'

// Adressscharfer Lagezuschlag, so weit er sich aus offenen Daten herleiten
// lässt – mit Bandbreite statt Punktwert und einer nachvollziehbaren
// Herleitung, die jede Annahme benennt.
//
// Amtlich maßgeblich bleibt die Lagezuschlagskarte der Stadt Wien (MA 25),
// die den Zuschlag je Liegenschaft aus den Grundkostenanteilen ableitet.
// Sie hat keine offene Schnittstelle; hier fließen daher ein:
//   1. der Bezirkswert als Ausgangspunkt (aus den veröffentlichten Werten),
//   2. die Streuung innerhalb des Bezirks als Bandbreite,
//   3. der Ausschluss nach § 2 Abs 3 RichtWG für Gründerzeitviertel.

/** Relative Streuung des Lagezuschlags innerhalb eines Bezirks. */
const STREUUNG = 0.25

export interface LagezuschlagHerleitung {
  /** Untere und obere Grenze in €/m², bereits gerundet. */
  min: number
  max: number
  /** Mittelwert, mit dem gerechnet wird. */
  wert: number
  /** Ausgeschlossen nach § 2 Abs 3 RichtWG? */
  ausgeschlossen: boolean
  /** Schritte der Herleitung, in der Reihenfolge der Anwendung. */
  schritte: { was: string; ergebnis: string; quelle: string }[]
}

function euro(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} €/m²`
}

export function lagezuschlagHerleiten(
  bezirk: number | null,
  gruenderzeit: Gruenderzeitlage,
  gruenderzeitAnteil: number | null,
): LagezuschlagHerleitung {
  const schritte: LagezuschlagHerleitung['schritte'] = []

  if (bezirk == null) {
    schritte.push({
      was: 'Lage',
      ergebnis: 'ohne Anschrift kein Lagezuschlag',
      quelle: 'keine Adresse eingegeben',
    })
    return { min: 0, max: 0, wert: 0, ausgeschlossen: false, schritte }
  }

  const b = getBezirk(bezirk)
  const basis = b.lagezuschlag
  schritte.push({
    was: `Ausgangswert für den ${bezirk}. Bezirk (${b.name})`,
    ergebnis: euro(basis),
    quelle: 'Bezirksmittel aus den veröffentlichten Lagezuschlägen',
  })

  if (basis <= 0) {
    schritte.push({
      was: 'Überdurchschnittliche Lage',
      ergebnis: 'nicht gegeben – kein Zuschlag',
      quelle: '§ 16 Abs 3 MRG',
    })
    return { min: 0, max: 0, wert: 0, ausgeschlossen: false, schritte }
  }

  // Gründerzeitviertel: Der Lagezuschlag entfällt vollständig.
  const anteilText = gruenderzeitAnteil != null ? ` (${Math.round(gruenderzeitAnteil * 100)} % der Gebäude im 150-m-Umkreis aus 1870–1917)` : ''
  if (gruenderzeit === 'ja') {
    schritte.push({
      was: 'Gründerzeitviertel',
      ergebnis: `bejaht${anteilText} – Lagezuschlag entfällt`,
      quelle: '§ 2 Abs 3 RichtWG',
    })
    return { min: 0, max: 0, wert: 0, ausgeschlossen: true, schritte }
  }

  if (gruenderzeit === 'unbekannt') {
    schritte.push({
      was: 'Gründerzeitviertel',
      ergebnis: gruenderzeitAnteil != null ? `offen${anteilText}` : 'nicht geprüft – bitte selbst angeben',
      quelle: '§ 2 Abs 3 RichtWG',
    })
  } else {
    schritte.push({
      was: 'Gründerzeitviertel',
      ergebnis: `verneint${anteilText}`,
      quelle: '§ 2 Abs 3 RichtWG',
    })
  }

  const min = Math.round(basis * (1 - STREUUNG) * 100) / 100
  const max = Math.round(basis * (1 + STREUUNG) * 100) / 100
  schritte.push({
    was: 'Streuung innerhalb des Bezirks',
    ergebnis: `${euro(min)} bis ${euro(max)}`,
    quelle: 'der Zuschlag gilt je Liegenschaft, nicht je Bezirk',
  })
  schritte.push({
    was: 'Verbindlicher Wert',
    ergebnis: 'Lagezuschlagskarte der Stadt Wien für die konkrete Anschrift',
    quelle: 'MA 25, abgeleitet aus den Grundkostenanteilen',
  })

  return { min, max, wert: basis, ausgeschlossen: false, schritte }
}
