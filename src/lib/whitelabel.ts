// White-Label: Der Rechner lässt sich unter fremdem Namen einbetten.
//
// Die Gestaltung kommt über Abfrageparameter der eingebetteten Adresse
// (embed.html) oder – bei einem gebuchten Zugang – über den API-Schlüssel, mit
// dem der Server die hinterlegte Gestaltung ausliefert. Ohne Angaben bleibt
// alles beim eigenen Erscheinungsbild.

export interface WhiteLabel {
  /** Kennung des Mandanten (aus dem Unternehmenszugang). */
  mandant?: string
  /** Anzeigename, erscheint statt „Mietzins-Check in Wien“. */
  name?: string
  /** Akzentfarbe als Hex-Wert, z.B. #1f4f82. */
  farbe?: string
  /** Absolute Adresse eines Logos (https). */
  logo?: string
  /** Kontaktadresse für Anfragen aus dem eingebetteten Rechner. */
  kontakt?: string
  /** Dunkles Design erzwingen. */
  thema?: 'hell' | 'dunkel'
  /** Hinweiszeile „Rechenlogik von …“ ausblenden (nur mit Zusatzvereinbarung). */
  ohneHinweis?: boolean
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

function sicherText(wert: string | null, maximal = 60): string | undefined {
  if (!wert) return undefined
  const sauber = wert.replace(/[<>"'`]/g, '').trim()
  return sauber ? sauber.slice(0, maximal) : undefined
}

function sichereUrl(wert: string | null): string | undefined {
  if (!wert) return undefined
  try {
    const url = new URL(wert)
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

export function whiteLabelAusUrl(suche: string = location.search): WhiteLabel {
  const p = new URLSearchParams(suche)
  const farbe = p.get('farbe')
  return {
    mandant: sicherText(p.get('mandant'), 40),
    name: sicherText(p.get('name')),
    farbe: farbe && HEX.test(farbe) ? farbe : undefined,
    logo: sichereUrl(p.get('logo')),
    kontakt: sicherText(p.get('kontakt'), 120),
    thema: p.get('thema') === 'dunkel' ? 'dunkel' : p.get('thema') === 'hell' ? 'hell' : undefined,
    ohneHinweis: p.get('hinweis') === '0',
  }
}

/** Helligkeit nach der üblichen Gewichtung – entscheidet über die Textfarbe. */
function hell(hex: string): boolean {
  const voll = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  const r = parseInt(voll.slice(1, 3), 16)
  const g = parseInt(voll.slice(3, 5), 16)
  const b = parseInt(voll.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62
}

/** Farbe um einen Anteil abdunkeln, für den Hover-Zustand. */
function dunkler(hex: string, anteil = 0.18): string {
  const voll = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  const teile = [1, 3, 5].map((i) => Math.round(parseInt(voll.slice(i, i + 2), 16) * (1 - anteil)))
  return `#${teile.map((t) => t.toString(16).padStart(2, '0')).join('')}`
}

export function whiteLabelAnwenden(wl: WhiteLabel): void {
  const wurzel = document.documentElement
  if (wl.thema) wurzel.dataset.theme = wl.thema === 'dunkel' ? 'dark' : 'light'
  if (wl.farbe) {
    wurzel.style.setProperty('--color-accent', wl.farbe)
    wurzel.style.setProperty('--color-accent-strong', dunkler(wl.farbe))
    wurzel.style.setProperty('--color-on-accent', hell(wl.farbe) ? '#04211f' : '#ffffff')
  }
}

/** Adresse für die Einbettung, wie sie im Unternehmenszugang angezeigt wird. */
export function einbettungsUrl(basis: string, wl: WhiteLabel): string {
  const p = new URLSearchParams()
  if (wl.mandant) p.set('mandant', wl.mandant)
  if (wl.name) p.set('name', wl.name)
  if (wl.farbe) p.set('farbe', wl.farbe)
  if (wl.logo) p.set('logo', wl.logo)
  if (wl.kontakt) p.set('kontakt', wl.kontakt)
  if (wl.thema) p.set('thema', wl.thema)
  if (wl.ohneHinweis) p.set('hinweis', '0')
  const frage = p.toString()
  return frage ? `${basis}?${frage}` : basis
}

export function einbettungsSchnipsel(url: string, name = 'Mietzins-Rechner'): string {
  return `<iframe src="${url}" title="${name}" width="100%" height="1200" style="border:0;max-width:100%"\n  loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
}
