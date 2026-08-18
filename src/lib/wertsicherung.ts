import type { MietzinsArt } from './types'

// Wertsicherung und Indexierung nach dem Mieten-Wertsicherungsgesetz (MieWeG,
// 5. Mietrechtliches Inflationslinderungsgesetz) und § 16 Abs 9 MRG.
//
// Seit 1.1.2026 werden Richtwert und Kategoriebeträge jährlich angepasst,
// nicht mehr in mehrjährigen Abständen. Die letzte Anhebung des Richtwerts
// erfolgte am 1.4.2026 um 1 %. Für 2027 lässt das Gesetz höchstens 2 % zu.

export interface Anpassung {
  /** Stichtag, an dem der neue Wert gilt. */
  stichtag: string
  /** Erhöhung in Prozent (0,01 = 1 %). */
  satz: number
  /** Gesetzliche Obergrenze für diesen Stichtag. */
  deckel: number
}

export const ANPASSUNGEN: Anpassung[] = [
  { stichtag: '2026-04-01', satz: 0.01, deckel: 0.01 },
  { stichtag: '2027-04-01', satz: 0.02, deckel: 0.02 },
]

/** Deckel für ein Jahr; ohne Eintrag gilt der zuletzt bekannte Wert. */
export function deckelFuer(jahr: number): { deckel: number; bekannt: boolean; stichtag: string } {
  const treffer = ANPASSUNGEN.find((a) => a.stichtag.startsWith(String(jahr)))
  if (treffer) return { deckel: treffer.deckel, bekannt: true, stichtag: treffer.stichtag }
  const letzte = ANPASSUNGEN[ANPASSUNGEN.length - 1]
  return { deckel: letzte.deckel, bekannt: false, stichtag: `${jahr}-04-01` }
}

export interface IndexEingabe {
  mietzinsArt: MietzinsArt
  /** Aktueller Netto-Hauptmietzins pro Monat. */
  aktuell: number
  /** Datum der letzten Anpassung (ISO). */
  letzteAnpassung: string
  /** Jahr, für das gerechnet wird. */
  jahr: number
  /**
   * Bei frei vereinbarten Mietzinsen: vereinbarte Indexsteigerung in Prozent
   * (aus dem Verbraucherpreisindex laut Vertrag).
   */
  indexSteigerung: number
  /** Schwellenwert der Wertsicherungsklausel in Prozent (0 = keine Schwelle). */
  schwelle: number
}

export interface IndexErgebnis {
  /** Zulässiger neuer Netto-Hauptmietzins pro Monat. */
  neu: number
  /** Angewandte Steigerung in Prozent. */
  satz: number
  /** Ab wann die Erhöhung wirkt. */
  wirksamAb: string
  /** Wurde die Erhöhung durch den gesetzlichen Deckel gekappt? */
  gedeckelt: boolean
  /** Schwelle noch nicht erreicht – keine Erhöhung möglich. */
  schwelleOffen: boolean
  schritte: { was: string; ergebnis: string; quelle: string }[]
}

function prozent(n: number): string {
  return `${(n * 100).toLocaleString('de-AT', { maximumFractionDigits: 2 })} %`
}

function euro(n: number): string {
  return `${n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

/** Gesetzlich gedeckelte Arten: Hier gilt die jährliche Anpassung nach MieWeG. */
function gesetzlichGedeckelt(art: MietzinsArt): boolean {
  return art === 'richtwert' || art === 'kategorie' || art === 'kategorie_d' || art === 'wgg'
}

export function berechneIndex(e: IndexEingabe): IndexErgebnis {
  const schritte: IndexErgebnis['schritte'] = []
  const { deckel, bekannt, stichtag } = deckelFuer(e.jahr)

  schritte.push({
    was: 'Aktueller Hauptmietzins',
    ergebnis: `${euro(e.aktuell)} pro Monat`,
    quelle: e.letzteAnpassung ? `zuletzt angepasst am ${e.letzteAnpassung.split('-').reverse().join('.')}` : 'Angabe',
  })

  // Jährliche Anpassung seit dem MieWeG: frühestens ein Jahr nach der letzten.
  let zuFrueh = false
  if (e.letzteAnpassung) {
    const letzte = new Date(e.letzteAnpassung)
    const naechste = new Date(letzte)
    naechste.setFullYear(letzte.getFullYear() + 1)
    zuFrueh = new Date(stichtag) < naechste
    schritte.push({
      was: 'Abstand zur letzten Anpassung',
      ergebnis: zuFrueh
        ? `zu kurz – frühestens ab ${naechste.toISOString().slice(0, 10).split('-').reverse().join('.')}`
        : 'mindestens ein Jahr, Anpassung möglich',
      quelle: 'jährliche Anpassung seit MieWeG (1.1.2026)',
    })
  }

  let satz: number
  let gedeckelt = false

  if (gesetzlichGedeckelt(e.mietzinsArt)) {
    satz = deckel
    gedeckelt = true
    schritte.push({
      was: 'Gesetzliche Anpassung',
      ergebnis: `${prozent(deckel)} zum ${stichtag.split('-').reverse().join('.')}${bekannt ? '' : ' (fortgeschrieben, Kundmachung abwarten)'}`,
      quelle: 'MieWeG / 5. MILG, § 16 Abs 9 MRG',
    })
  } else {
    // Frei oder angemessen vereinbart: Es zählt die Wertsicherungsklausel des
    // Vertrags, gedeckelt durch die gesetzliche Obergrenze.
    satz = Math.max(0, e.indexSteigerung)
    schritte.push({
      was: 'Wertsicherung laut Vertrag',
      ergebnis: `${prozent(satz)} Indexsteigerung`,
      quelle: 'Verbraucherpreisindex, Klausel im Mietvertrag',
    })
    if (satz > deckel) {
      satz = deckel
      gedeckelt = true
      schritte.push({
        was: 'Gesetzliche Obergrenze',
        ergebnis: `auf ${prozent(deckel)} gekappt`,
        quelle: 'MieWeG / 5. MILG',
      })
    }
  }

  // Schwellenwert: Erst ab dieser Steigerung darf angepasst werden.
  const schwelleOffen = e.schwelle > 0 && satz < e.schwelle
  if (e.schwelle > 0) {
    schritte.push({
      was: 'Schwellenwert der Klausel',
      ergebnis: schwelleOffen ? `${prozent(e.schwelle)} noch nicht erreicht` : `${prozent(e.schwelle)} erreicht`,
      quelle: 'Vereinbarung im Mietvertrag',
    })
  }

  const wirksam = schwelleOffen || zuFrueh ? 0 : satz
  const neu = Math.round(e.aktuell * (1 + wirksam) * 100) / 100

  schritte.push({
    was: 'Zulässiger neuer Hauptmietzins',
    ergebnis: `${euro(neu)} pro Monat (${wirksam > 0 ? '+' : ''}${euro(Math.round((neu - e.aktuell) * 100) / 100)})`,
    quelle: 'Ergebnis der Kontrollrechnung',
  })

  return {
    neu,
    satz: wirksam,
    wirksamAb: stichtag,
    gedeckelt,
    schwelleOffen: schwelleOffen || zuFrueh,
    schritte,
  }
}
