import { istApp } from './nativ'

// Dateien speichern – je nach Umgebung auf verschiedenen Wegen:
//  * Browser: Blob-Link mit download-Attribut (klassischer Download)
//  * iPhone/iPad im Browser: dort wird ein Download oft ignoriert, deshalb
//    zusätzlich das Teilen-Menü (Web Share API) als Weg in „Dateien“
//  * App (iOS/Android): Datei in den Cache schreiben und das Teilen-Menü öffnen

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

async function alsBase64(blob: Blob): Promise<string> {
  const puffer = await blob.arrayBuffer()
  let roh = ''
  const bytes = new Uint8Array(puffer)
  const BLOCK = 0x8000
  for (let i = 0; i < bytes.length; i += BLOCK) {
    roh += String.fromCharCode(...bytes.subarray(i, i + BLOCK))
  }
  return btoa(roh)
}

async function inAppSpeichern(blob: Blob, name: string): Promise<void> {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ])
  const { uri } = await Filesystem.writeFile({
    path: name,
    data: await alsBase64(blob),
    directory: Directory.Cache,
  })
  await Share.share({ title: name, url: uri })
}

function istApple(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Speichert die Datei und wirft, wenn das nicht möglich war – die Oberfläche
 * kann die Meldung dann anzeigen, statt einfach nichts zu tun.
 */
export async function dateiSpeichern(blob: Blob, name: string, typ = 'application/pdf'): Promise<void> {
  if (istApp()) {
    await inAppSpeichern(blob, name)
    return
  }

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
