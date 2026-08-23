import { apiBasis } from './api'
import { ereignis } from './analytics'
import { dateiSpeichern } from './speichern'
import { evaluateMrg } from './mrgEngine'
import type { MietobjektInput } from './types'

// Kauf eines Prüfberichts: Angaben merken, bezahlen, Bericht ausliefern.
//
// Der Ablauf ist der übliche für digitale Inhalte: Name und E-Mail, dann die
// Bezahlseite des Zahlungsdienstleisters (Apple Pay, PayPal oder Karte), danach
// zurück auf diese Seite. Weil die Bezahlseite die Anwendung verlässt, liegen
// die Angaben so lange im Sitzungsspeicher – nur dort, nicht dauerhaft.

const SPEICHER = 'wien-miete:offener-kauf'
const FERTIG = 'kauf-fertig'

export type Zahlungsart = 'applepay' | 'paypal' | 'karte'

export interface OffenerKauf {
  input: MietobjektInput
  adresse: string
  name: string
  email: string
  art: Zahlungsart
}

export function kaufMerken(kauf: OffenerKauf): void {
  try {
    sessionStorage.setItem(SPEICHER, JSON.stringify(kauf))
  } catch {
    // Ohne Sitzungsspeicher wird der Bericht nach der Zahlung neu erzeugt.
  }
}

export function kaufAbholen(): OffenerKauf | null {
  try {
    const roh = sessionStorage.getItem(SPEICHER)
    sessionStorage.removeItem(SPEICHER)
    return roh ? (JSON.parse(roh) as OffenerKauf) : null
  } catch {
    return null
  }
}

/** Meldung „Danke, der Bericht wurde gesendet“ unter dem Hero. */
export function kaufFertigMelden(text: string): void {
  window.dispatchEvent(new CustomEvent<string>(FERTIG, { detail: text }))
}

export function aufKaufFertig(handler: (text: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail)
  window.addEventListener(FERTIG, listener)
  return () => window.removeEventListener(FERTIG, listener)
}

function base64(blob: Blob): Promise<string> {
  return new Promise((fertig, fehler) => {
    const leser = new FileReader()
    leser.onload = () => fertig(String(leser.result).split(',')[1] ?? '')
    leser.onerror = () => fehler(new Error('Die Datei ließ sich nicht lesen.'))
    leser.readAsDataURL(blob)
  })
}

/**
 * Nach der Zahlung: Bericht erzeugen, der Käuferin übergeben und – wenn ein
 * Server hinterlegt ist – zusätzlich per E-Mail schicken. `sitzung` ist die
 * Kennung des Bezahlvorgangs; der Server prüft damit, dass wirklich bezahlt
 * wurde, bevor er etwas verschickt.
 */
export async function berichtAusliefern(kauf: OffenerKauf, sitzung: string | null): Promise<'gesendet' | 'gespeichert'> {
  const { ergebnisPdfBlob, dateiname } = await import('./pdf')
  const ergebnis = evaluateMrg(kauf.input)
  const name = `${dateiname(kauf.adresse)}-Pruefbericht.pdf`
  const blob = ergebnisPdfBlob(ergebnis, kauf.adresse)

  let gesendet = false
  if (apiBasis() && sitzung) {
    try {
      const antwort = await fetch(`${apiBasis()}/bericht/senden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitzung,
          email: kauf.email,
          name: kauf.name,
          dateiname: name,
          pdf: await base64(blob),
        }),
      })
      gesendet = antwort.ok
    } catch {
      // Kommt die Nachricht nicht durch, bleibt der Download der sichere Weg.
    }
  }

  await dateiSpeichern(blob, name)
  ereignis('bericht_ausgeliefert', { versand: gesendet ? 'mail' : 'download' })
  return gesendet ? 'gesendet' : 'gespeichert'
}
