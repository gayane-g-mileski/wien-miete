import type { ReactNode } from 'react'

// Zeichensatz der Seite: schlanke Strichsymbole, alle im selben Raster
// (24 × 24, Strichstärke 1.8, currentColor). Sie sind Schmuck neben dem Text,
// nie sein Ersatz – deshalb durchgehend aria-hidden.

const GEMEINSAM = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

type Eigenschaften = { className?: string }

function Grundform({ className = 'h-5 w-5', children }: Eigenschaften & { children: ReactNode }) {
  return (
    <svg {...GEMEINSAM} className={className}>
      {children}
    </svg>
  )
}

/** Wohnung, Mietgegenstand. */
export function IconWohnung(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </Grundform>
  )
}

/** Gebäude, Haus im Bestand. */
export function IconGebaeude(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V20" />
      <path d="M15 10h3.5A1.5 1.5 0 0 1 20 11.5V20" />
      <path d="M3 20h18" />
      <path d="M7 8h1.5M11 8h1.5M7 12h1.5M11 12h1.5M7 16h1.5M11 16h1.5" />
    </Grundform>
  )
}


/** Preisbandbreite: Spanne zwischen zwei Werten. */
export function IconBandbreite(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M4 12h16" />
      <path d="M7 9v6M17 9v6" />
      <path d="M4 5v2M20 5v2M4 17v2M20 17v2" />
    </Grundform>
  )
}

/** Wertsicherung: Anpassung nach oben. */
export function IconWertsicherung(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M4 18 9.5 12l3.5 3.5L20 8" />
      <path d="M15 8h5v5" />
    </Grundform>
  )
}

/** Rendite: Ertrag in Prozent. */
export function IconRendite(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 14.5 14.5 9.5" />
      <circle cx="9.6" cy="9.6" r="1.1" />
      <circle cx="14.4" cy="14.4" r="1.1" />
    </Grundform>
  )
}

/** Betriebskosten: laufende Abrechnung. */
export function IconBetriebskosten(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </Grundform>
  )
}

/** Prüfbericht, PDF für den Akt. */
export function IconBericht(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M13.5 3.5H7.5A2 2 0 0 0 5.5 5.5v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5Z" />
      <path d="M13.5 3.5V8.5h5" />
      <path d="M9 13h6M9 16.5h4" />
    </Grundform>
  )
}

/** Liste, ganzer Bestand. */
export function IconListe(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </Grundform>
  )
}

/** Hochladen, CSV einlesen. */
export function IconHochladen(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M12 15V4" />
      <path d="M8 7.5 12 3.5l4 4" />
      <path d="M4.5 14v4.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V14" />
    </Grundform>
  )
}

/** Team, mehrere Zugänge. */
export function IconTeam(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 14.8c1.9.6 3 2.4 3 4.7" />
    </Grundform>
  )
}

/** Schnittstelle, Anbindung an eigene Software. */
export function IconSchnittstelle(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M9 8 5 12l4 4" />
      <path d="M15 8l4 4-4 4" />
      <path d="M13.5 5.5 10.5 18.5" />
    </Grundform>
  )
}

/** White-Label: eigenes Erscheinungsbild. */
export function IconMarke(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M12 3.5 4.5 6.5v5.2c0 4.2 3 7.4 7.5 8.8 4.5-1.4 7.5-4.6 7.5-8.8V6.5Z" />
      <path d="M9.5 12.2 11.4 14l3.3-3.6" />
    </Grundform>
  )
}

/** Suche, Einheit prüfen. */
export function IconSuche(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Grundform>
  )
}

/** Rechner, kostenlose Einzelprüfung. */
export function IconRechner(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <rect x="5.5" y="3" width="13" height="18" rx="2" />
      <path d="M8.5 7h7" />
      <path d="M9 11.5h.01M12 11.5h.01M15 11.5h.01M9 15h.01M12 15h.01M15 15h.01M12 18h.01M9 18h.01M15 18h.01" />
    </Grundform>
  )
}

/** Post, Anfrage an ein Amt. */
export function IconPost(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m4 7 8 5.5L20 7" />
    </Grundform>
  )
}

/** Rechtlicher Hinweis, Warnung. */
export function IconHinweis(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M12 3.8 21 19.5H3Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Grundform>
  )
}

/** Verweis nach außen, fremde Quelle. */
export function IconExtern(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <path d="M13.5 4.5H19.5V10.5" />
      <path d="m19.5 4.5-8 8" />
      <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </Grundform>
  )
}


/** Konto, angemeldete Person. */
export function IconKonto(p: Eigenschaften) {
  return (
    <Grundform {...p}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </Grundform>
  )
}

