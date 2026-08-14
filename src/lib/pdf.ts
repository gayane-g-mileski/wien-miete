import { jsPDF } from 'jspdf'
import type { MrgErgebnis } from './types'

// Erzeugt aus einem Ergebnis ein sauber gesetztes PDF im Druckformat (A4),
// kein Screenshot – echter Text, auswähl- und durchsuchbar.

function euro(n: number): string {
  return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ACCENT: [number, number, number] = [0x60, 0x74, 0x56]
const INK: [number, number, number] = [0x22, 0x1d, 0x19]
const SOFT: [number, number, number] = [0x57, 0x4d, 0x45]
const FAINT: [number, number, number] = [0x8a, 0x7e, 0x73]
const COFFEE: [number, number, number] = [0x6f, 0x4e, 0x37]

export function dateiname(adresse: string): string {
  const base = adresse.trim() || 'Mietzins-Einschaetzung'
  return (
    'Mietzins_' +
    base
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60)
  )
}

export function ergebnisPdf(ergebnis: MrgErgebnis, adresse: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const mL = 18
  const mR = 18
  const contentW = pageW - mL - mR
  let y = 22

  const ensure = (space: number) => {
    if (y + space > pageH - 22) {
      doc.addPage()
      y = 22
    }
  }
  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])

  const heading = (t: string) => {
    ensure(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    setColor(FAINT)
    doc.text(t.toUpperCase(), mL, y)
    y += 6
  }
  const value = (t: string, size = 15, color = INK) => {
    ensure(size * 0.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    setColor(color)
    for (const line of doc.splitTextToSize(t, contentW)) {
      ensure(size * 0.5)
      doc.text(line, mL, y)
      y += size * 0.5
    }
  }
  const para = (t: string, color = SOFT, size = 10) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    setColor(color)
    for (const line of doc.splitTextToSize(t, contentW)) {
      ensure(5)
      doc.text(line, mL, y)
      y += 5
    }
  }
  const bullet = (t: string, color = SOFT) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    setColor(color)
    const lines = doc.splitTextToSize(t, contentW - 5)
    lines.forEach((line: string, i: number) => {
      ensure(5)
      if (i === 0) {
        setColor(ACCENT)
        doc.text('•', mL, y)
        setColor(color)
      }
      doc.text(line, mL + 5, y)
      y += 5
    })
  }
  const gap = (h = 4) => {
    y += h
  }

  // ---- Kopf: kleine Zeile "Mietzins-Ersteinschätzung", darunter groß die Adresse ----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setColor(ACCENT)
  doc.text('MIETZINS-ERSTEINSCHÄTZUNG WIEN', mL, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(21)
  setColor(INK)
  for (const line of doc.splitTextToSize(adresse.trim() || 'Mietobjekt ohne Anschrift', contentW)) {
    doc.text(line, mL, y)
    y += 9
  }
  y += 1
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setColor(FAINT)
  const datum = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Erstellt am ${datum}`, mL, y)
  y += 4
  doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2])
  doc.setLineWidth(0.4)
  doc.line(mL, y, pageW - mR, y)
  y += 9

  // ---- Mietzinsart ----
  heading('Mietzinsart')
  value(ergebnis.mietzinsArtLabel, 16)
  gap()

  // ---- Schutz & Preisgrenze ----
  heading('Schutz & Preisgrenze')
  value(ergebnis.anwendungLabel, 15, ACCENT)
  gap(1)
  para(
    `Kündigungsschutz: ${ergebnis.kuendigungsschutz ? 'ja' : 'nein'}    |    ` +
      `Gesetzliche Preisgrenze: ${ergebnis.preisschutz ? 'ja' : 'nein'}`,
  )
  gap()

  // ---- Preisbandbreite ----
  heading('Preisbandbreite')
  if (ergebnis.preis) {
    value(`${euro(ergebnis.preis.proM2Min)} – ${euro(ergebnis.preis.proM2Max)} EUR / m² monatlich, netto`, 14, COFFEE)
    value(`${euro(ergebnis.preis.monatlichMin)} – ${euro(ergebnis.preis.monatlichMax)} EUR / Monat gesamt`, 12, INK)
    if (ergebnis.preis.bestandteile && ergebnis.preis.bestandteile.length > 0) {
      gap(1)
      para('Aufschlüsselung (EUR/m²):', FAINT, 9)
      for (const b of ergebnis.preis.bestandteile) {
        bullet(`${b.label}: ${b.wert > 0 ? '+' : ''}${euro(b.wert)}`)
      }
    }
  } else {
    para('Keine Preisschätzung verfügbar.')
  }
  gap()

  // ---- Was bedeutet das? ----
  if (ergebnis.begruendung.length > 0) {
    heading('Was bedeutet das?')
    for (const b of ergebnis.begruendung) bullet(b)
    gap()
  }

  // ---- Lage ----
  heading('Lage')
  para(ergebnis.lage.text)
  gap()

  // ---- Zu beachten ----
  if (ergebnis.hinweise.length > 0) {
    heading('Zu beachten')
    for (const h of ergebnis.hinweise) bullet(h)
    gap()
  }

  // ---- Gesetze ----
  if (ergebnis.gesetze.length > 0) {
    heading('Gesetze zum Nachlesen')
    for (const g of ergebnis.gesetze) {
      bullet(`${g.label}: ${g.url}`)
    }
    gap()
  }

  // ---- Fußzeile auf jeder Seite ----
  const seiten = doc.getNumberOfPages()
  for (let i = 1; i <= seiten; i++) {
    doc.setPage(i)
    doc.setDrawColor(0xe5, 0xdd, 0xd1)
    doc.setLineWidth(0.3)
    doc.line(mL, pageH - 18, pageW - mR, pageH - 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setColor(FAINT)
    const fuss = doc.splitTextToSize(
      'Richtwert Wien seit 1.4.2026: 6,74 EUR/m². Kein Rechtsrat – automatisierte Ersteinschätzung auf Basis ' +
        'vereinfachter Regeln und grober Marktmiet-Näherungen je Bezirk. Ersetzt keine rechtliche oder ' +
        'immobilienwirtschaftliche Beratung im Einzelfall.',
      contentW - 12,
    )
    doc.text(fuss, mL, pageH - 14)
    doc.text(`${i}/${seiten}`, pageW - mR, pageH - 14, { align: 'right' })
  }

  return doc
}

/** PDF als Blob (für ZIP-Bündelung). */
export function ergebnisPdfBlob(ergebnis: MrgErgebnis, adresse: string): Blob {
  return ergebnisPdf(ergebnis, adresse).output('blob')
}
