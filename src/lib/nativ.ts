import { Capacitor } from '@capacitor/core'

// Kleine Anpassungen, die nur in der App (App Store / Play Store) greifen.
// Im Browser passiert hier nichts.

export function istApp(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * In der App sollen Links auf fremde Seiten (RIS, wien.gv.at, laerminfo …) im
 * System-Browser aufgehen und nicht die App selbst überschreiben.
 * mailto: bleibt dem Betriebssystem überlassen, das die Mail-App öffnet.
 */
export function externeLinksAbfangen(): () => void {
  if (!istApp()) return () => {}

  const beiKlick = (e: MouseEvent) => {
    const ziel = e.target as HTMLElement | null
    const link = ziel?.closest?.('a')
    if (!link) return
    const href = link.getAttribute('href') ?? ''
    if (!/^https?:/i.test(href)) return
    e.preventDefault()
    void import('@capacitor/browser').then(({ Browser }) => Browser.open({ url: href }))
  }

  document.addEventListener('click', beiKlick)
  return () => document.removeEventListener('click', beiKlick)
}

/** Statusleiste an das gewählte Design anpassen. */
export async function statusleisteAnpassen(dunkel: boolean): Promise<void> {
  if (!istApp()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: dunkel ? Style.Dark : Style.Light })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: dunkel ? '#17130f' : '#f5f1ea' })
    }
  } catch {
    // Ohne Statusleisten-Plugin einfach das Standardverhalten belassen.
  }
}
