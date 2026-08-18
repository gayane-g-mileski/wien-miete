// Öffnet die Anmeldung von überall auf der Seite – etwa aus einem Preis-Button
// oder aus dem Ergebnis heraus, wenn etwas Kostenpflichtiges angeklickt wird.

const NAME = 'konto-oeffnen'

export interface KontoAnlass {
  /** Womit die Maske startet. */
  modus: 'anmelden' | 'registrieren'
  /** Wofür die Anmeldung nötig ist – erscheint über dem Formular. */
  anlass?: string
}

export function kontoOeffnen(anlass?: string, modus: KontoAnlass['modus'] = 'registrieren'): void {
  window.dispatchEvent(new CustomEvent<KontoAnlass>(NAME, { detail: { modus, anlass } }))
}

export function aufKontoOeffnen(handler: (a: KontoAnlass) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<KontoAnlass>).detail)
  window.addEventListener(NAME, listener)
  return () => window.removeEventListener(NAME, listener)
}
