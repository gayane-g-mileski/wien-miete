// Kleine Helfer für den Worker: JSON-Antworten, CORS, Zufall, Hashes, Token.

export interface Umgebung {
  DB: D1Database
  SITZUNG_GEHEIMNIS: string
  STRIPE_SCHLUESSEL: string
  STRIPE_WEBHOOK_GEHEIMNIS: string
  STRIPE_PREIS_BERICHT: string
  STRIPE_PREIS_PROFI: string
  STRIPE_PREIS_API: string
  MAIL_ENDPUNKT: string
  MAIL_SCHLUESSEL: string
  MAIL_ABSENDER: string
  ERLAUBTE_HERKUNFT: string
}

export function cors(herkunft: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': herkunft,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function json(daten: unknown, status = 200, kopf: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...kopf },
  })
}

export function fehler(code: string, meldung: string, status: number, kopf: Record<string, string> = {}): Response {
  return json({ fehler: code, meldung }, status, kopf)
}

export function zufall(bytes = 32): string {
  const roh = crypto.getRandomValues(new Uint8Array(bytes))
  return [...roh].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hash(text: string): Promise<string> {
  const puffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function base64url(daten: ArrayBuffer | string): string {
  const bytes = typeof daten === 'string' ? new TextEncoder().encode(daten) : new Uint8Array(daten)
  let roh = ''
  bytes.forEach((b) => (roh += String.fromCharCode(b)))
  return btoa(roh).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmacSchluessel(geheimnis: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(geheimnis),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/** Sitzungstoken im JWT-Format (HS256). */
export async function tokenBauen(nutzlast: Record<string, unknown>, geheimnis: string, tage = 30): Promise<string> {
  const kopf = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const koerper = base64url(
    JSON.stringify({ ...nutzlast, exp: Math.floor(Date.now() / 1000) + tage * 24 * 3600 }),
  )
  const signatur = await crypto.subtle.sign('HMAC', await hmacSchluessel(geheimnis), new TextEncoder().encode(`${kopf}.${koerper}`))
  return `${kopf}.${koerper}.${base64url(signatur)}`
}

export async function tokenPruefen(token: string, geheimnis: string): Promise<Record<string, unknown> | null> {
  const teile = token.split('.')
  if (teile.length !== 3) return null
  const [kopf, koerper, signatur] = teile
  const erwartet = await crypto.subtle.sign('HMAC', await hmacSchluessel(geheimnis), new TextEncoder().encode(`${kopf}.${koerper}`))
  if (base64url(erwartet) !== signatur) return null
  try {
    const nutzlast = JSON.parse(atob(koerper.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
    if (typeof nutzlast.exp === 'number' && nutzlast.exp * 1000 < Date.now()) return null
    return nutzlast
  } catch {
    return null
  }
}

/** Zeitkonstanter Vergleich, damit Signaturen nicht erraten werden können. */
export function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let unterschied = 0
  for (let i = 0; i < a.length; i++) unterschied |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return unterschied === 0
}

export function istEmail(wert: unknown): wert is string {
  return typeof wert === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert) && wert.length <= 254
}
