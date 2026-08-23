import { useEffect, useState } from 'react'
import { href, metaAnwenden, metaFuer, routeFuer, type Route } from './seo'
import { FAQ } from './faq'

// Sehr kleiner Router für echte Pfade (nicht Hash), damit jede Ratgeberseite
// eine eigene Adresse, einen eigenen Titel und eigene strukturierte Daten hat.
// Ausgeliefert werden die Seiten als fertiges HTML (npm run prerender);
// im Browser übernimmt danach dieselbe Anwendung.

const WECHSEL = 'seitenwechsel'

export function navigiere(pfad: string): void {
  history.pushState({}, '', href(pfad))
  window.dispatchEvent(new Event(WECHSEL))
}

/** Fängt Klicks auf interne Links ab, damit kein voller Neuladevorgang nötig ist. */
export function interneLinksAbfangen(): () => void {
  const beiKlick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = (e.target as HTMLElement | null)?.closest?.('a')
    if (!link) return
    const ziel = link.getAttribute('href') ?? ''
    if (!ziel.startsWith('/') || link.target === '_blank') return
    if (/\.(html|pdf|xml|txt|json)$/.test(ziel)) return
    e.preventDefault()
    history.pushState({}, '', ziel)
    window.dispatchEvent(new Event(WECHSEL))
  }
  document.addEventListener('click', beiKlick)
  return () => document.removeEventListener('click', beiKlick)
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => routeFuer())

  useEffect(() => {
    const aktualisieren = () => {
      setRoute(routeFuer())
      // Trägt die Adresse einen Anker, gehört der Sprung dorthin – auch wenn
      // der Abschnitt erst nach dem Seitenwechsel gezeichnet wird.
      const anker = location.hash
      if (!anker) {
        window.scrollTo({ top: 0 })
        return
      }
      let versuche = 0
      const springen = () => {
        const ziel = document.querySelector(anker)
        if (ziel) {
          ziel.scrollIntoView()
        } else if (versuche++ < 10) {
          requestAnimationFrame(springen)
        }
      }
      requestAnimationFrame(springen)
    }
    window.addEventListener('popstate', aktualisieren)
    window.addEventListener(WECHSEL, aktualisieren)
    const aufraeumen = interneLinksAbfangen()
    return () => {
      window.removeEventListener('popstate', aktualisieren)
      window.removeEventListener(WECHSEL, aktualisieren)
      aufraeumen()
    }
  }, [])

  useEffect(() => {
    metaAnwenden(metaFuer(route, FAQ))
  }, [route])

  return route
}
