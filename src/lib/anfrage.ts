import { apiBasis } from './api'
import { ereignis } from './analytics'

// Anfragen an die Ämter direkt verschicken.
//
// Der Server kennt die Empfängeradressen selbst – die Seite kann sie nicht
// vorgeben, damit der Versand nicht für fremde Post missbraucht werden kann.
// Als Absender antwortet die Behörde an die angegebene E-Mail-Adresse
// (Reply-To); eine Kopie geht an dieselbe Adresse.
//
// Ist kein Server hinterlegt, bleibt der alte Weg über das E-Mail-Programm.

export type AnfrageArt = 'ma25' | 'ma50' | 'wwaf'

export interface Anhang {
  filename: string
  /** Inhalt als Base64, ohne den data:-Vorspann. */
  content: string
}

export interface Anfrage {
  art: AnfrageArt
  name: string
  email: string
  betreff: string
  text: string
  anhaenge?: Anhang[]
}

/**
 * Beim Bundeswohnbaufonds gibt es keine gesicherte E-Mail-Adresse – dort bleibt
 * es beim vorbereiteten Text.
 */
export function direktVersandMoeglich(art: AnfrageArt): boolean {
  return apiBasis().length > 0 && art !== 'wwaf'
}

export async function alsAnhang(datei: File): Promise<Anhang> {
  const inhalt = await new Promise<string>((fertig, fehler) => {
    const leser = new FileReader()
    leser.onload = () => fertig(String(leser.result).split(',')[1] ?? '')
    leser.onerror = () => fehler(new Error(`"${datei.name}" ließ sich nicht lesen.`))
    leser.readAsDataURL(datei)
  })
  return { filename: datei.name, content: inhalt }
}

export async function anfrageSenden(anfrage: Anfrage): Promise<void> {
  const antwort = await fetch(`${apiBasis()}/anfrage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(anfrage),
  })
  if (!antwort.ok) {
    let meldung = 'Die Anfrage ließ sich nicht versenden.'
    try {
      const daten = (await antwort.json()) as { meldung?: string }
      if (daten.meldung) meldung = daten.meldung
    } catch {
      // Antwort ohne JSON – Standardmeldung behalten.
    }
    throw new Error(meldung)
  }
  ereignis('anfrage_gesendet', { art: anfrage.art })
}
