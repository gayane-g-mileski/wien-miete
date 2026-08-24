import daten from '../inhalte/seiten.json'

// Auffindbarkeit: Titel, Beschreibung, kanonische Adresse und strukturierte
// Daten je Seite. Dieselben Angaben verwendet das Pre-Rendering
// (scripts/prerender.mjs), damit Suchmaschinen fertiges HTML bekommen.

export const HERKUNFT = 'https://gayane-g-mileski.github.io'
export const BASIS = import.meta.env.BASE_URL
export const MARKE = 'Mietzins-Check in Wien'

export interface Abschnitt {
  ueberschrift: string
  absaetze: string[]
  tabelle?: { kopf: string[]; zeilen: string[][] }
}

export interface GlossarSeite {
  pfad: string
  titel: string
  beschreibung: string
  kicker: string
  h1: string
  einleitung: string
  abschnitte: Abschnitt[]
  faq: { frage: string; antwort: string }[]
  verwandt: string[]
}

export const GLOSSAR: GlossarSeite[] = daten.seiten

export type Route =
  | { art: 'start' }
  | { art: 'glossar'; seite: GlossarSeite }
  | { art: 'glossarIndex' }
  | { art: 'api' }
  | { art: 'widerruf' }

/** Pfad ohne Basis und ohne Schrägstriche, z.B. „richtwert-wien“. */
export function pfadTeil(pfad: string = location.pathname): string {
  const ohneBasis = pfad.startsWith(BASIS) ? pfad.slice(BASIS.length) : pfad.replace(/^\//, '')
  return ohneBasis.replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '')
}

export function routeFuer(pfad: string = location.pathname): Route {
  const teil = pfadTeil(pfad)
  if (teil === '') return { art: 'start' }
  if (teil === 'api') return { art: 'api' }
  if (teil === 'glossar') return { art: 'glossarIndex' }
  if (teil === 'widerruf') return { art: 'widerruf' }
  const seite = GLOSSAR.find((s) => s.pfad === teil)
  if (seite) return { art: 'glossar', seite }
  return { art: 'start' }
}

export interface Meta {
  pfad: string
  titel: string
  beschreibung: string
  /** Strukturierte Daten (JSON-LD) für diese Seite. */
  ld: unknown[]
  /** Rechtstexte gehören nicht in den Index. */
  nichtIndexieren?: boolean
}

const ORGANISATION = {
  '@type': 'Organization',
  '@id': `${HERKUNFT}${BASIS}#organisation`,
  name: MARKE,
  url: `${HERKUNFT}${BASIS}`,
  areaServed: { '@type': 'City', name: 'Wien', addressCountry: 'AT' },
}

function anwendung() {
  return {
    '@type': 'WebApplication',
    '@id': `${HERKUNFT}${BASIS}#anwendung`,
    name: MARKE,
    url: `${HERKUNFT}${BASIS}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'de-AT',
    provider: { '@id': ORGANISATION['@id'] },
    offers: [
      { '@type': 'Offer', name: 'Rechner', price: '0', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Prüfbericht PRO', price: '24.00', priceCurrency: 'EUR' },
    ],
  }
}

function brotkrumen(seite?: GlossarSeite) {
  const glieder = [{ '@type': 'ListItem', position: 1, name: 'Start', item: `${HERKUNFT}${BASIS}` }]
  if (seite) {
    glieder.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Glossar',
      item: `${HERKUNFT}${BASIS}glossar/`,
    })
    glieder.push({
      '@type': 'ListItem',
      position: 3,
      name: seite.kicker,
      item: `${HERKUNFT}${BASIS}${seite.pfad}/`,
    })
  }
  return { '@type': 'BreadcrumbList', itemListElement: glieder }
}

function faqLd(faq: { frage: string; antwort: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.frage,
      acceptedAnswer: { '@type': 'Answer', text: f.antwort },
    })),
  }
}

/** Startseiten-FAQ kommt aus derselben Quelle wie die Oberfläche. */
export function metaFuer(route: Route, startFaq: { frage: string; antwort: string }[] = []): Meta {
  if (route.art === 'glossar') {
    const s = route.seite
    return {
      pfad: `${s.pfad}/`,
      titel: `${s.titel} | ${MARKE}`,
      beschreibung: s.beschreibung,
      ld: [
        ORGANISATION,
        {
          '@type': 'Article',
          headline: s.h1,
          description: s.beschreibung,
          inLanguage: 'de-AT',
          isPartOf: { '@id': anwendung()['@id'] },
          publisher: { '@id': ORGANISATION['@id'] },
        },
        brotkrumen(s),
        faqLd(s.faq),
      ],
    }
  }
  if (route.art === 'api') {
    return {
      pfad: 'api/',
      titel: `Mietzins-API für Wien: REST-Schnittstelle und White-Label | ${MARKE}`,
      beschreibung:
        'REST-Schnittstelle zur Wiener Mietzinsprüfung: Mietzinsart, MRG-Anwendungsbereich, Preisbandbreite und Lagezuschlag als JSON – mit API-Schlüssel, EU-Verarbeitung und Auftragsverarbeitungsvertrag.',
      ld: [ORGANISATION, anwendung(), brotkrumen()],
    }
  }
  if (route.art === 'widerruf') {
    return {
      pfad: 'widerruf/',
      titel: `Rücktrittsrecht und Muster-Rücktrittsformular | ${MARKE}`,
      beschreibung:
        'Rücktrittsbelehrung nach dem Fern- und Auswärtsgeschäfte-Gesetz samt ausfüllbarem Muster-Rücktrittsformular.',
      ld: [ORGANISATION, brotkrumen()],
      nichtIndexieren: true,
    }
  }
  if (route.art === 'glossarIndex') {
    return {
      pfad: 'glossar/',
      titel: `Glossar Mietrecht Wien: Richtwert, Lagezuschlag, Betriebskosten | ${MARKE}`,
      beschreibung:
        'Begriffe für die Praxis der Hausverwaltung: Richtwertmietzins, Lagezuschlag, angemessener Mietzins, Befristung, Betriebskosten nach § 21 MRG, Wertsicherung und die Rendite von Vorsorgewohnungen.',
      ld: [
        ORGANISATION,
        brotkrumen(),
        {
          '@type': 'ItemList',
          itemListElement: GLOSSAR.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: s.titel,
            url: `${HERKUNFT}${BASIS}${s.pfad}/`,
          })),
        },
      ],
    }
  }
  return {
    pfad: '',
    titel: `${MARKE}: Mietzinsprüfung für Hausverwaltungen`,
    beschreibung:
      'Mietzinsprüfung für Hausverwaltungen und Immobilientreuhänder in Wien: Mietzinsart, Anwendungsbereich des MRG und Bandbreite je Einheit – mit Herleitung, Fundstellen, Prüfbericht und Bestandsauswertung.',
    ld: [ORGANISATION, anwendung(), brotkrumen(), ...(startFaq.length ? [faqLd(startFaq)] : [])],
  }
}

function metaTag(auswahl: string, attribut: 'name' | 'property', wert: string, inhalt: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(auswahl)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribut, wert)
    document.head.appendChild(tag)
  }
  tag.content = inhalt
}

/** Setzt Titel, Beschreibung, kanonische Adresse und JSON-LD im Dokument. */
export function metaAnwenden(meta: Meta): void {
  const url = `${HERKUNFT}${BASIS}${meta.pfad}`
  document.title = meta.titel
  metaTag('meta[name="description"]', 'name', 'description', meta.beschreibung)
  metaTag('meta[property="og:title"]', 'property', 'og:title', meta.titel)
  metaTag('meta[property="og:description"]', 'property', 'og:description', meta.beschreibung)
  metaTag('meta[property="og:url"]', 'property', 'og:url', url)
  metaTag('meta[name="twitter:title"]', 'name', 'twitter:title', meta.titel)
  metaTag('meta[name="twitter:description"]', 'name', 'twitter:description', meta.beschreibung)
  metaTag(
    'meta[name="robots"]',
    'name',
    'robots',
    meta.nichtIndexieren ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large',
  )

  let kanonisch = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!kanonisch) {
    kanonisch = document.createElement('link')
    kanonisch.rel = 'canonical'
    document.head.appendChild(kanonisch)
  }
  kanonisch.href = url

  const alt = document.getElementById('ld-seite')
  alt?.remove()
  const skript = document.createElement('script')
  skript.type = 'application/ld+json'
  skript.id = 'ld-seite'
  skript.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': meta.ld })
  document.head.appendChild(skript)
}

/** Interner Link innerhalb der Anwendung (berücksichtigt den Basispfad). */
export function href(pfad: string): string {
  return `${BASIS}${pfad}`
}
