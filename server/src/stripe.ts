import { gleich, type Umgebung } from './hilfen'

// Stripe ohne Bibliothek: die REST-Schnittstelle nimmt Formulardaten entgegen,
// die Signatur der Ereignisse wird mit HMAC-SHA256 geprüft.

const BASIS = 'https://api.stripe.com/v1'

async function stripe(env: Umgebung, pfad: string, felder?: Record<string, string>): Promise<Record<string, unknown>> {
  const antwort = await fetch(`${BASIS}${pfad}`, {
    method: felder ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SCHLUESSEL}`,
      ...(felder ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: felder ? new URLSearchParams(felder).toString() : undefined,
  })
  const daten = (await antwort.json()) as Record<string, unknown>
  if (!antwort.ok) {
    const f = daten.error as { message?: string } | undefined
    throw new Error(f?.message ?? 'Stripe hat die Anfrage abgelehnt.')
  }
  return daten
}

export type Produkt = 'bericht' | 'profi' | 'api'

function preisId(env: Umgebung, produkt: Produkt): string {
  if (produkt === 'bericht') return env.STRIPE_PREIS_BERICHT
  if (produkt === 'profi') return env.STRIPE_PREIS_PROFI
  return env.STRIPE_PREIS_API
}

/**
 * Bezahlseite anlegen. Einmalkauf für den Prüfbericht, Abonnement für die
 * laufenden Zugänge. Die Zustimmung zum sofortigen Beginn wandert als
 * Metadatum mit, damit sie zum Zahlungsbeleg dokumentiert ist.
 */
export async function checkoutAnlegen(
  env: Umgebung,
  optionen: {
    kontoId: string
    email: string
    produkt: Produkt
    sofortStart: boolean
    erfolg: string
    abbruch: string
  },
): Promise<string> {
  const abo = optionen.produkt !== 'bericht'
  const felder: Record<string, string> = {
    mode: abo ? 'subscription' : 'payment',
    'line_items[0][price]': preisId(env, optionen.produkt),
    'line_items[0][quantity]': '1',
    customer_email: optionen.email,
    client_reference_id: optionen.kontoId,
    success_url: optionen.erfolg,
    cancel_url: optionen.abbruch,
    locale: 'de',
    'metadata[konto]': optionen.kontoId,
    'metadata[produkt]': optionen.produkt,
    'metadata[sofort_start]': optionen.sofortStart ? 'ja' : 'nein',
    'metadata[zustimmung_am]': new Date().toISOString(),
    'automatic_tax[enabled]': 'true',
    'tax_id_collection[enabled]': 'true',
  }
  if (!abo) felder['invoice_creation[enabled]'] = 'true'
  const sitzung = await stripe(env, '/checkout/sessions', felder)
  return sitzung.url as string
}

export async function rechnungen(env: Umgebung, kundeId: string): Promise<Record<string, unknown>[]> {
  const daten = await stripe(env, `/invoices?customer=${encodeURIComponent(kundeId)}&limit=24`)
  return (daten.data as Record<string, unknown>[]) ?? []
}

/** Signatur eines Stripe-Ereignisses prüfen (Kopf `Stripe-Signature`). */
export async function ereignisPruefen(koerper: string, signatur: string, geheimnis: string): Promise<boolean> {
  const teile = Object.fromEntries(signatur.split(',').map((t) => t.split('=') as [string, string]))
  const zeit = teile.t
  const erwartet = teile.v1
  if (!zeit || !erwartet) return false
  // Ereignisse älter als fünf Minuten werden verworfen (Wiedereinspielung).
  if (Math.abs(Date.now() / 1000 - Number(zeit)) > 300) return false

  const schluessel = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(geheimnis),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const roh = await crypto.subtle.sign('HMAC', schluessel, new TextEncoder().encode(`${zeit}.${koerper}`))
  const eigen = [...new Uint8Array(roh)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return gleich(eigen, erwartet)
}
