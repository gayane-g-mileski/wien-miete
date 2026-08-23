import { useEffect, useState } from 'react'
import { apiBasis } from './api'
import { ereignis } from './analytics'

// Konto, Anmeldung ohne Passwort (Magic-Link) und Bezahlung über Stripe.
//
// Der Server dazu liegt unter server/ (Cloudflare Worker). Ist keine
// Serveradresse gesetzt (VITE_API_BASIS), läuft die Anwendung im Vorschau-
// Betrieb: Der Rechner bleibt vollständig nutzbar, kostenpflichtige Schritte
// führen sichtbar auf die Warteliste statt eine Anmeldung vorzutäuschen.

const SITZUNG = 'wien-miete:sitzung-token'

export type Tarif = 'frei' | 'bericht' | 'profi' | 'api'

export interface Konto {
  email: string
  tarif: Tarif
  /** Firmendaten für die Rechnung (B2B). */
  firma?: string
  uid?: string
  land?: string
  /** Freigeschaltete Prüfberichte, die noch nicht abgerufen wurden. */
  guthabenBerichte: number
  /** API-Schlüssel, nur im Unternehmenszugang. */
  apiSchluessel?: string
  /** Laufzeitende des Abonnements (ISO), falls vorhanden. */
  laufzeitBis?: string
}

export function serverVorhanden(): boolean {
  return apiBasis().length > 0
}

export function tokenLesen(): string | null {
  try {
    return localStorage.getItem(SITZUNG)
  } catch {
    return null
  }
}

function tokenSchreiben(token: string | null): void {
  try {
    if (token) localStorage.setItem(SITZUNG, token)
    else localStorage.removeItem(SITZUNG)
  } catch {
    // Ohne Speicher gilt die Anmeldung nur für diese Sitzung.
  }
}

async function anfrage<T>(pfad: string, optionen: RequestInit = {}): Promise<T> {
  const token = tokenLesen()
  const antwort = await fetch(`${apiBasis()}${pfad}`, {
    ...optionen,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(optionen.headers ?? {}),
    },
  })
  if (!antwort.ok) {
    const text = await antwort.text().catch(() => '')
    let meldung = 'Das hat nicht geklappt. Bitte später noch einmal versuchen.'
    try {
      const daten = JSON.parse(text) as { meldung?: string }
      if (daten.meldung) meldung = daten.meldung
    } catch {
      // Antwort ohne JSON – Standardmeldung behalten.
    }
    throw new Error(meldung)
  }
  return (await antwort.json()) as T
}

/** Anmeldelink anfordern. Der Link führt zurück auf diese Seite. */
export async function magicLinkAnfordern(email: string, zweck?: string): Promise<void> {
  await anfrage('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email, ziel: location.href.split('?')[0], zweck }),
  })
  ereignis('anmeldelink_angefordert')
}

/** Token aus dem Link gegen eine Sitzung tauschen. */
export async function anmeldenMitToken(token: string): Promise<Konto> {
  const { sitzung, konto } = await anfrage<{ sitzung: string; konto: Konto }>('/auth/sitzung', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
  tokenSchreiben(sitzung)
  ereignis('angemeldet', { tarif: konto.tarif })
  melden(konto)
  return konto
}

export async function kontoLaden(): Promise<Konto | null> {
  if (!serverVorhanden() || !tokenLesen()) return null
  try {
    const konto = await anfrage<Konto>('/konto')
    melden(konto)
    return konto
  } catch {
    tokenSchreiben(null)
    melden(null)
    return null
  }
}

export function abmelden(): void {
  tokenSchreiben(null)
  melden(null)
}

export interface KontoDaten {
  firma?: string
  uid?: string
  land?: string
}

export async function kontoAktualisieren(daten: KontoDaten): Promise<Konto> {
  const konto = await anfrage<Konto>('/konto', { method: 'PATCH', body: JSON.stringify(daten) })
  melden(konto)
  return konto
}

export type Produkt = 'bericht' | 'profi' | 'api'

/**
 * Bezahlvorgang starten. `sofortStart` hält die ausdrückliche Zustimmung zum
 * vorzeitigen Beginn und die Kenntnisnahme des Verlusts des Rücktrittsrechts
 * fest (§ 18 Abs 1 Z 11 FAGG); der Server speichert sie zum Kauf.
 */
export interface KaufAngaben {
  /** Gewählte Zahlungsart – bestimmt, was die Bezahlseite anbietet. */
  zahlungsart?: 'applepay' | 'paypal' | 'karte'
  /** Name und E-Mail für Rechnung und Zustellung, wenn ohne Konto gekauft wird. */
  name?: string
  email?: string
}

export async function bezahlenStarten(produkt: Produkt, sofortStart: boolean, angaben: KaufAngaben = {}): Promise<void> {
  const { url } = await anfrage<{ url: string }>('/zahlung/checkout', {
    method: 'POST',
    body: JSON.stringify({
      produkt,
      sofortStart,
      ...angaben,
      // Die Kennung des Bezahlvorgangs kommt zurück, damit der Server die
      // Zahlung prüfen kann, bevor er den Bericht verschickt.
      erfolg: `${location.origin}${location.pathname}?kauf=ok&sitzung={CHECKOUT_SESSION_ID}`,
      abbruch: `${location.origin}${location.pathname}?kauf=abbruch`,
    }),
  })
  ereignis('checkout_gestartet', { produkt, zahlungsart: angaben.zahlungsart ?? 'karte' })
  location.href = url
}

/** Rechnungen des Kontos (Stripe-Belege). */
export async function rechnungenLaden(): Promise<{ nummer: string; datum: string; betrag: string; url: string }[]> {
  return anfrage('/zahlung/rechnungen')
}

// Kleiner Zustandsspeicher, damit mehrere Bereiche denselben Kontostand sehen.
type Beobachter = (konto: Konto | null) => void
const beobachter = new Set<Beobachter>()
let aktuell: Konto | null = null

function melden(konto: Konto | null): void {
  aktuell = konto
  beobachter.forEach((b) => b(konto))
}

export function useKonto(): { konto: Konto | null; laedt: boolean } {
  const [konto, setKonto] = useState<Konto | null>(aktuell)
  const [laedt, setLaedt] = useState(() => serverVorhanden() && tokenLesen() !== null && aktuell === null)

  useEffect(() => {
    beobachter.add(setKonto)
    return () => {
      beobachter.delete(setKonto)
    }
  }, [])

  useEffect(() => {
    if (!laedt) return
    void kontoLaden().finally(() => setLaedt(false))
  }, [laedt])

  return { konto, laedt }
}

/**
 * Nach dem Klick auf den Anmeldelink und nach der Rückkehr aus dem
 * Bezahlvorgang die Adresszeile wieder aufräumen.
 */
export async function anmeldungAusUrlUebernehmen(): Promise<void> {
  const p = new URLSearchParams(location.search)
  const token = p.get('anmeldung')
  const kauf = p.get('kauf')
  const sitzung = p.get('sitzung')
  if (!token && !kauf) return
  try {
    if (token && serverVorhanden()) await anmeldenMitToken(token)
    if (kauf === 'ok') {
      ereignis('kauf_abgeschlossen')
      if (serverVorhanden() && tokenLesen()) await kontoLaden()
      // Gekaufter Prüfbericht: erzeugen, ausliefern, Bescheid geben.
      const { kaufAbholen, berichtAusliefern, kaufFertigMelden } = await import('./kauf')
      const offen = kaufAbholen()
      if (offen) {
        const weg = await berichtAusliefern(offen, sitzung)
        kaufFertigMelden(
          weg === 'gesendet'
            ? `Danke, der Bericht wurde an ${offen.email} gesendet.`
            : 'Danke, der Bericht wurde erstellt und gespeichert.',
        )
      }
    }
  } catch {
    // Fehlgeschlagene Anmeldung führt zurück in den abgemeldeten Zustand.
  }
  p.delete('anmeldung')
  p.delete('kauf')
  p.delete('sitzung')
  const rest = p.toString()
  history.replaceState({}, '', `${location.pathname}${rest ? `?${rest}` : ''}`)
}
