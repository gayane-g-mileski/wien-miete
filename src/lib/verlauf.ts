import type { MietobjektInput } from './types'

// Verlauf (Historie) bewerteter Adressen – im Browser (localStorage) gespeichert.

export interface VerlaufEintrag {
  adresse: string
  input: MietobjektInput
  ts: number
}

const KEY = 'wien-miete:verlauf'
const MAX = 25

export function ladeVerlauf(): VerlaufEintrag[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const daten = JSON.parse(raw)
    return Array.isArray(daten) ? (daten as VerlaufEintrag[]) : []
  } catch {
    return []
  }
}

export function speichereVerlauf(verlauf: VerlaufEintrag[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(verlauf.slice(0, MAX)))
  } catch {
    /* localStorage nicht verfügbar – Verlauf bleibt nur im Speicher. */
  }
}
