// Reichweitenmessung ohne Cookies und ohne personenbezogene Kennungen.
//
// Zwei Wege sind vorgesehen, beide in der EU betreibbar:
//   * Plausible (auch selbst gehostet oder Umami-kompatibel): lädt ein kleines
//     Skript, setzt keine Cookies, speichert keine Geräte-Kennung.
//   * PostHog EU (eu.i.posthog.com): Ereignisse gehen direkt per fetch an die
//     Erfassungsschnittstelle; die Kennung lebt nur in der aktuellen Sitzung
//     (sessionStorage) und wird beim Schließen des Tabs verworfen.
//
// Ohne gesetzte Umgebungsvariablen passiert nichts. „Do Not Track“ und ein
// Widerspruch über analytikAbschalten() werden beachtet.
//
// Rechtlicher Hinweis: Ob für diese Messung eine Einwilligung nötig ist, hängt
// davon ab, ob im Endgerät gespeichert oder ausgelesen wird (§ 165 Abs 3 TKG
// 2021). Der PostHog-Weg nutzt sessionStorage und ist deshalb ohne Einwilligung
// nicht ohne Weiteres zulässig – siehe docs/compliance/cookies-tracking.md.
// Der Plausible-Weg kommt ohne Speicherung im Endgerät aus.

const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined
const PLAUSIBLE_HOST = (import.meta.env.VITE_PLAUSIBLE_HOST as string | undefined) ?? 'https://plausible.io'
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

const WIDERSPRUCH = 'wien-miete:analytik-aus'
const SITZUNG = 'wien-miete:sitzung'

type Werte = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (ereignis: string, optionen?: { props?: Werte }) => void
  }
}

function abgeschaltet(): boolean {
  if (navigator.doNotTrack === '1' || (navigator as { msDoNotTrack?: string }).msDoNotTrack === '1') return true
  try {
    return localStorage.getItem(WIDERSPRUCH) === '1'
  } catch {
    return false
  }
}

export function analytikAbschalten(): void {
  try {
    localStorage.setItem(WIDERSPRUCH, '1')
  } catch {
    // Ohne Speicher bleibt der Widerspruch auf diese Sitzung beschränkt.
  }
}

export function analytikEingeschaltet(): boolean {
  return Boolean(PLAUSIBLE_DOMAIN || POSTHOG_KEY) && !abgeschaltet()
}

function sitzungsKennung(): string {
  try {
    const vorhanden = sessionStorage.getItem(SITZUNG)
    if (vorhanden) return vorhanden
    const neu = crypto.randomUUID()
    sessionStorage.setItem(SITZUNG, neu)
    return neu
  } catch {
    return 'ohne-speicher'
  }
}

let geladen = false

function plausibleLaden(): void {
  if (geladen || !PLAUSIBLE_DOMAIN) return
  geladen = true
  const s = document.createElement('script')
  s.defer = true
  s.dataset.domain = PLAUSIBLE_DOMAIN
  s.src = `${PLAUSIBLE_HOST}/js/script.manual.js`
  document.head.appendChild(s)
}

function anPostHog(ereignis: string, werte: Werte): void {
  if (!POSTHOG_KEY) return
  const koerper = JSON.stringify({
    api_key: POSTHOG_KEY,
    event: ereignis,
    distinct_id: sitzungsKennung(),
    properties: { ...werte, $current_url: location.href, $lib: 'mietzins-check' },
    timestamp: new Date().toISOString(),
  })
  // keepalive, damit auch der letzte Aufruf vor dem Verlassen ankommt.
  void fetch(`${POSTHOG_HOST}/i/v0/e/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: koerper,
    keepalive: true,
  }).catch(() => {
    // Messung ist Beiwerk: Fehler bleiben ohne Folgen für die Anwendung.
  })
}

export function analytikStarten(): void {
  if (!analytikEingeschaltet()) return
  plausibleLaden()
}

/** Seitenaufruf melden (auch bei Wechseln innerhalb der Anwendung). */
export function seitenaufruf(pfad: string = location.pathname): void {
  if (!analytikEingeschaltet()) return
  plausibleLaden()
  window.plausible?.('pageview', { props: { pfad } })
  anPostHog('$pageview', { pfad })
}

/** Ereignis ohne personenbezogene Angaben melden. */
export function ereignis(name: string, werte: Werte = {}): void {
  if (!analytikEingeschaltet()) return
  window.plausible?.(name, { props: werte })
  anPostHog(name, werte)
}
