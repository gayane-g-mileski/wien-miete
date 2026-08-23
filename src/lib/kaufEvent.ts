import type { Produkt } from './konto'
import type { MietobjektInput } from './types'

// Öffnet den Kaufdialog von überall – aus dem Ergebnis, aus dem Profi-Bereich
// oder aus der Preisliste.

const NAME = 'kauf-oeffnen'

export interface KaufAnlass {
  produkt: Produkt
  /** Nur beim Prüfbericht: das Objekt, über das er erstellt wird. */
  input?: MietobjektInput
  adresse?: string
}

export function kaufOeffnen(produkt: Produkt, objekt?: { input: MietobjektInput; adresse: string }): void {
  window.dispatchEvent(new CustomEvent<KaufAnlass>(NAME, { detail: { produkt, ...objekt } }))
}

/** Kurzer Weg für den Knopf im Ergebnis. */
export function pruefberichtOeffnen(input: MietobjektInput, adresse: string): void {
  kaufOeffnen('bericht', { input, adresse })
}

export function aufKaufOeffnen(handler: (a: KaufAnlass) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<KaufAnlass>).detail)
  window.addEventListener(NAME, listener)
  return () => window.removeEventListener(NAME, listener)
}
