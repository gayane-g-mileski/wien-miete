import { jsPDF } from 'jspdf'
import type { MrgErgebnis } from './types'
import { ENGINE_VERSION, RICHTWERT_QUELLE } from './version'

// Erzeugt aus einem Ergebnis ein sauber gesetztes PDF im Druckformat (A4),
// kein Screenshot – echter Text, auswähl- und durchsuchbar.
//
// Der Satz ist zweistufig: Zuerst wird der Inhalt als Liste von Blöcken
// beschrieben, dann probeweise gesetzt. Die Abstände werden so weit
// aufgezogen, wie sie auf eine Seite passen – bei viel Inhalt rücken sie
// enger zusammen, statt auf eine zweite Seite zu rutschen.

function euro(n: number): string {
  return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type Farbe = [number, number, number]

const ACCENT: Farbe = [0x60, 0x74, 0x56]
const INK: Farbe = [0x22, 0x1d, 0x19]
const SOFT: Farbe = [0x57, 0x4d, 0x45]
const FAINT: Farbe = [0x8a, 0x7e, 0x73]
const COFFEE: Farbe = [0x6f, 0x4e, 0x37]

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

type Block =
  | { art: 'kicker'; text: string }
  | { art: 'titel'; text: string }
  | { art: 'datum'; text: string }
  | { art: 'linie' }
  | { art: 'heading'; text: string }
  | { art: 'value'; text: string; groesse: number; farbe: Farbe }
  | { art: 'para'; text: string; farbe: Farbe; groesse?: number }
  | { art: 'bullet'; text: string; farbe: Farbe }
  | { art: 'abschnitt' }

/** Zwischen eng (0) und luftig (1) – der Satz sucht sich den größten Wert, der passt. */
function zwischen(eng: number, luftig: number, s: number): number {
  return eng + (luftig - eng) * s
}

const SEITE = { mL: 18, mR: 18, oben: 22, unten: 26 }

interface SatzOptionen {
  luft: number
  schrift: number
  zeichnen: boolean
}

/** Setzt die Blöcke und liefert die Höhe, die sie brauchen. */
function setze(doc: jsPDF, bloecke: Block[], o: SatzOptionen): number {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - SEITE.mL - SEITE.mR
  const maxY = pageH - SEITE.unten
  let y = SEITE.oben

  const farbe = (c: Farbe) => doc.setTextColor(c[0], c[1], c[2])
  const platz = (h: number) => {
    // Notausgang: Passt selbst im engsten Satz nicht alles, lieber umbrechen
    // als übereinander drucken.
    if (o.zeichnen && y + h > maxY) {
      doc.addPage()
      y = SEITE.oben
    }
  }
  const zeilen = (text: string, breite: number) => doc.splitTextToSize(text, breite) as string[]

  const schreibe = (text: string, groesse: number, stil: 'bold' | 'normal', c: Farbe, breite: number, x: number, zeilenhoehe: number) => {
    doc.setFont('helvetica', stil)
    doc.setFontSize(groesse * o.schrift)
    farbe(c)
    for (const zeile of zeilen(text, breite)) {
      platz(zeilenhoehe)
      if (o.zeichnen) doc.text(zeile, x, y)
      y += zeilenhoehe
    }
  }

  for (const b of bloecke) {
    switch (b.art) {
      case 'kicker':
        schreibe(b.text, 11, 'bold', ACCENT, contentW, SEITE.mL, 5 * o.schrift)
        y += zwischen(2.5, 6, o.luft)
        break

      case 'titel':
        schreibe(b.text, 21, 'bold', INK, contentW, SEITE.mL, zwischen(8.4, 10, o.luft) * o.schrift)
        y += zwischen(1, 3, o.luft)
        break

      case 'datum':
        schreibe(b.text, 10, 'normal', FAINT, contentW, SEITE.mL, 4.5 * o.schrift)
        y += zwischen(1.5, 4, o.luft)
        break

      case 'linie':
        if (o.zeichnen) {
          doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2])
          doc.setLineWidth(0.4)
          doc.line(SEITE.mL, y, pageW - SEITE.mR, y)
        }
        y += zwischen(6, 11, o.luft)
        break

      case 'heading':
        platz(10)
        schreibe(b.text.toUpperCase(), 10.5, 'bold', FAINT, contentW, SEITE.mL, 4.4 * o.schrift)
        y += zwischen(1.6, 4, o.luft)
        break

      case 'value':
        schreibe(b.text, b.groesse, 'bold', b.farbe, contentW, SEITE.mL, zwischen(b.groesse * 0.44, b.groesse * 0.56, o.luft) * o.schrift)
        y += zwischen(0.5, 2.5, o.luft)
        break

      case 'para':
        schreibe(b.text, b.groesse ?? 10, 'normal', b.farbe, contentW, SEITE.mL, zwischen(4.3, 5.9, o.luft) * o.schrift)
        break

      case 'bullet': {
        const hoehe = zwischen(4.3, 5.9, o.luft) * o.schrift
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10 * o.schrift)
        const teile = zeilen(b.text, contentW)
        teile.forEach((zeile) => {
          platz(hoehe)
          if (o.zeichnen) {
            farbe(b.farbe)
            doc.text(zeile, SEITE.mL, y)
          }
          y += hoehe
        })
        y += zwischen(0, 1.2, o.luft)
        break
      }

      case 'abschnitt':
        y += zwischen(3, 10, o.luft)
        break
    }
  }

  return y
}

function bloeckeBauen(ergebnis: MrgErgebnis, adresse: string): Block[] {
  const datum = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })
  const b: Block[] = [
    { art: 'kicker', text: 'MIETZINS-ERSTEINSCHÄTZUNG WIEN' },
    { art: 'titel', text: adresse.trim() || 'Mietobjekt ohne Anschrift' },
    { art: 'datum', text: `Erstellt am ${datum}` },
    { art: 'linie' },

    { art: 'heading', text: 'Mietzinsart' },
    { art: 'value', text: ergebnis.mietzinsArtLabel, groesse: 16, farbe: INK },
    { art: 'abschnitt' },

    { art: 'heading', text: 'Schutz & Preisgrenze' },
    { art: 'value', text: ergebnis.anwendungLabel, groesse: 15, farbe: ACCENT },
    {
      art: 'para',
      farbe: SOFT,
      text:
        `Kündigungsschutz: ${ergebnis.kuendigungsschutz ? 'ja' : 'nein'}    |    ` +
        `Gesetzliche Preisgrenze: ${ergebnis.preisschutz ? 'ja' : 'nein'}`,
    },
    { art: 'abschnitt' },

    { art: 'heading', text: 'Preisbandbreite' },
  ]

  if (ergebnis.preis) {
    b.push(
      {
        art: 'value',
        groesse: 14,
        farbe: COFFEE,
        text: `${euro(ergebnis.preis.proM2Min)} – ${euro(ergebnis.preis.proM2Max)} EUR / m² monatlich, netto`,
      },
      {
        art: 'value',
        groesse: 12,
        farbe: INK,
        text:
          `${euro(ergebnis.preis.monatlichMin)} – ${euro(ergebnis.preis.monatlichMax)} EUR / Monat gesamt ` +
          `für ${ergebnis.preis.flaeche.toLocaleString('de-AT')} m²`,
      },
    )
    if (ergebnis.preis.bestandteile && ergebnis.preis.bestandteile.length > 0) {
      b.push({ art: 'para', text: 'Aufschlüsselung (EUR/m²):', farbe: FAINT, groesse: 9 })
      for (const teil of ergebnis.preis.bestandteile) {
        b.push({ art: 'bullet', text: `${teil.label}: ${teil.wert > 0 ? '+' : ''}${euro(teil.wert)}`, farbe: SOFT })
      }
    }
  } else {
    b.push({ art: 'para', text: 'Keine Preisschätzung verfügbar.', farbe: SOFT })
  }
  b.push({ art: 'abschnitt' })

  if (ergebnis.begruendung.length > 0) {
    b.push({ art: 'heading', text: 'Was bedeutet das?' })
    for (const t of ergebnis.begruendung) b.push({ art: 'bullet', text: t, farbe: SOFT })
    b.push({ art: 'abschnitt' })
  }

  b.push({ art: 'heading', text: 'Lage' }, { art: 'para', text: ergebnis.lage.text, farbe: SOFT }, { art: 'abschnitt' })

  if (ergebnis.hinweise.length > 0) {
    b.push({ art: 'heading', text: 'Zu beachten' })
    for (const t of ergebnis.hinweise) b.push({ art: 'bullet', text: t, farbe: SOFT })
    b.push({ art: 'abschnitt' })
  }

  if (ergebnis.preis?.sichten && ergebnis.preis.sichten.length > 0) {
    b.push({ art: 'heading', text: 'Judikatur, Schlichtungsstelle, Markt' })
    for (const si of ergebnis.preis.sichten) {
      b.push({
        art: 'bullet',
        farbe: SOFT,
        text: `${si.titel}: ${euro(si.proM2Min)} – ${euro(si.proM2Max)} EUR/m² (${euro(si.monatlichMin)} – ${euro(si.monatlichMax)} EUR im Monat). ${si.erklaerung}`,
      })
    }
    b.push({ art: 'abschnitt' })
  }

  if (ergebnis.lagezuschlag && ergebnis.lagezuschlag.schritte.length > 1) {
    b.push({ art: 'heading', text: 'Herleitung des Lagezuschlags' })
    for (const sch of ergebnis.lagezuschlag.schritte) {
      b.push({ art: 'bullet', text: `${sch.was}: ${sch.ergebnis} (${sch.quelle})`, farbe: SOFT })
    }
    b.push({ art: 'abschnitt' })
  }

  if (ergebnis.gesetze.length > 0) {
    b.push({ art: 'heading', text: 'Gesetze zum Nachlesen' })
    for (const g of ergebnis.gesetze) b.push({ art: 'bullet', text: `${g.label}: ${g.url}`, farbe: SOFT })
    b.push({ art: 'abschnitt' })
  }

  // Prüfbare Grundlagen: Fundstellen, Datenquellen, Zeitstempel, Version.
  b.push({ art: 'heading', text: 'Grundlagen dieser Einschätzung' })
  for (const t of [
    'Mietzinsbildung: § 16 MRG. Zuschläge und Abschläge nach § 16 Abs 2 MRG in einer Gesamtschau nach der Verkehrsauffassung, nicht als Summe von Einzelposten – OGH RIS-Justiz RS0117881.',
    'Lagezuschlag: § 16 Abs 3 MRG; Ausschluss in Gründerzeitvierteln nach § 2 Abs 3 RichtWG. Verbindlich ist die Lagezuschlagskarte der Stadt Wien (MA 25), abgeleitet aus den Grundkostenanteilen.',
    'Kategoriebeträge: § 15a MRG in der kundgemachten Höhe. Zeitliche Abgrenzung: Verträge ab 1.3.1994 Richtwert, 1.1.1982 bis 28.2.1994 Kategoriemietzins, davor der vereinbarte Mietzins des Altvertrags.',
    'Datenquellen: Adressdienst und Gebäudedaten der Stadt Wien (data.wien.gv.at), Rechtsinformationssystem des Bundes (ris.bka.gv.at), Marktmieten als hinterlegte Näherung je Bezirk.',
    `${RICHTWERT_QUELLE}.`,
    `Erstellt am ${new Date().toLocaleString('de-AT')} · Engine v${ENGINE_VERSION} · automatisierte Ersteinschätzung eines Informationswerkzeugs, keine Rechtsberatung.`,
  ]) {
    b.push({ art: 'bullet', text: t, farbe: SOFT })
  }

  return b
}

/**
 * Sucht die luftigste Einstellung, die noch auf eine Seite passt: erst die
 * Abstände, und nur wenn selbst der engste Satz nicht reicht, die Schriftgröße.
 */
function besteEinstellung(bloecke: Block[], maxY: number): { luft: number; schrift: number } {
  const mess = new jsPDF({ unit: 'mm', format: 'a4' })
  const passt = (luft: number, schrift: number) => setze(mess, bloecke, { luft, schrift, zeichnen: false }) <= maxY

  for (const schrift of [1, 0.95, 0.9, 0.85, 0.8]) {
    if (!passt(0, schrift)) continue
    if (passt(1, schrift)) return { luft: 1, schrift }
    let eng = 0
    let weit = 1
    for (let i = 0; i < 14; i++) {
      const mitte = (eng + weit) / 2
      if (passt(mitte, schrift)) eng = mitte
      else weit = mitte
    }
    return { luft: eng, schrift }
  }
  // Selbst der engste Satz reicht nicht – dann bricht der Text auf Seite 2 um.
  return { luft: 0, schrift: 0.8 }
}

export function ergebnisPdf(ergebnis: MrgErgebnis, adresse: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - SEITE.mL - SEITE.mR

  const bloecke = bloeckeBauen(ergebnis, adresse)
  const { luft, schrift } = besteEinstellung(bloecke, pageH - SEITE.unten)
  setze(doc, bloecke, { luft, schrift, zeichnen: true })

  // ---- Fußzeile auf jeder Seite ----
  const seiten = doc.getNumberOfPages()
  for (let i = 1; i <= seiten; i++) {
    doc.setPage(i)
    doc.setDrawColor(0xe5, 0xdd, 0xd1)
    doc.setLineWidth(0.3)
    doc.line(SEITE.mL, pageH - 18, pageW - SEITE.mR, pageH - 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(FAINT[0], FAINT[1], FAINT[2])
    const fuss = doc.splitTextToSize(
      'Richtwert Wien seit 1.4.2026: 6,74 EUR/m². Automatisierte Ersteinschätzung eines Informationswerkzeugs auf ' +
        'Basis vereinfachter Regeln und hinterlegter Näherungswerte. Kein Rechtsrat – ersetzt keine rechtliche oder ' +
        'immobilienwirtschaftliche Beratung im Einzelfall.',
      contentW - 12,
    )
    doc.text(fuss, SEITE.mL, pageH - 14)
    if (seiten > 1) doc.text(`${i}/${seiten}`, pageW - SEITE.mR, pageH - 14, { align: 'right' })
  }

  return doc
}

/** PDF als Blob (für ZIP-Bündelung). */
export function ergebnisPdfBlob(ergebnis: MrgErgebnis, adresse: string): Blob {
  return ergebnisPdf(ergebnis, adresse).output('blob')
}
