// Dateien im Browser speichern.
//
//  * Regelfall: Blob-Link mit download-Attribut (klassischer Download)
//  * iPhone/iPad: dort wird ein Download häufig ignoriert, deshalb zusätzlich
//    das Teilen-Menü (Web Share API) als Weg in „Dateien“

function blobLink(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function istApple(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Speichert die Datei und wirft, wenn das nicht möglich war – die Oberfläche
 * kann die Meldung dann anzeigen, statt einfach nichts zu tun.
 */
export async function dateiSpeichern(blob: Blob, name: string, typ = 'application/pdf'): Promise<void> {
  // Auf iPhone/iPad führt der Download-Link oft ins Leere: dort das
  // Teilen-Menü anbieten, über das die Datei in „Dateien“ landet.
  if (istApple() && typeof navigator.share === 'function') {
    try {
      const datei = new File([blob], name, { type: typ })
      if (navigator.canShare?.({ files: [datei] })) {
        await navigator.share({ files: [datei], title: name })
        return
      }
    } catch (e) {
      // Abbruch durch die nutzende Person ist kein Fehler.
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }

  blobLink(blob, name)
}
