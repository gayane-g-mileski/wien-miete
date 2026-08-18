import { evaluateMrg } from './mrgEngine'
import { leereMerkmale, bezirkAusAnschrift } from './pricingData'
import type { Kategorie, MietobjektInput, MrgErgebnis } from './types'

// CSV-Import für die Prüfung ganzer Bestände. Alles läuft im Browser – die
// Liste verlässt das Gerät nicht.

export interface PortfolioZeile {
  nr: number
  bezeichnung: string
  flaeche: number
  istMiete: number | null
  ergebnis: MrgErgebnis
  /** Ist-Miete über der oberen Grenze der Einschätzung? */
  ueberGrenze: boolean
  /** Differenz zur Obergrenze pro Monat (positiv = darüber). */
  differenz: number | null
  /** Fehlt eine Angabe, die das Ergebnis wesentlich beeinflusst? */
  unsicher: string[]
}

export interface PortfolioErgebnis {
  zeilen: PortfolioZeile[]
  fehler: string[]
}

/** Zerlegt eine CSV-Zeile; Trennzeichen wird automatisch erkannt. */
function zerlege(zeile: string, trenner: string): string[] {
  const felder: string[] = []
  let feld = ''
  let inAnf = false
  for (let i = 0; i < zeile.length; i++) {
    const c = zeile[i]
    if (c === '"') {
      if (inAnf && zeile[i + 1] === '"') {
        feld += '"'
        i++
      } else inAnf = !inAnf
    } else if (c === trenner && !inAnf) {
      felder.push(feld)
      feld = ''
    } else feld += c
  }
  felder.push(feld)
  return felder.map((f) => f.trim())
}

function zahl(text: string): number | null {
  const roh = text.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '')
  const n = Number(roh.replace(',', '.'))
  return Number.isFinite(n) && n !== 0 ? n : null
}

function kategorie(text: string): Kategorie {
  const t = text.trim().toUpperCase()
  if (t.startsWith('B')) return 'B'
  if (t.startsWith('C')) return 'C'
  if (t.startsWith('D')) return t.includes('UNBRAUCH') ? 'D_unbrauchbar' : 'D_brauchbar'
  return 'A'
}

function baubewilligung(text: string): MietobjektInput['baubewilligungGebaeude'] {
  const jahr = Number((text.match(/\b(1[6-9]\d{2}|20\d{2})\b/) ?? [])[1])
  if (Number.isFinite(jahr)) {
    if (jahr <= 1945) return 'vor_1945'
    if (jahr <= 1953) return '1945_1953'
    return 'nach_1953'
  }
  const t = text.toLowerCase()
  if (t.includes('altbau')) return 'vor_1945'
  if (t.includes('neubau')) return 'nach_1953'
  return 'vor_1945'
}

function datum(text: string): string {
  const t = text.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return ''
}

/** Spaltenzuordnung über Schlagwörter in der Kopfzeile. */
const SPALTEN: { feld: string; woerter: string[] }[] = [
  { feld: 'bezeichnung', woerter: ['anschrift', 'adresse', 'objekt', 'einheit', 'top', 'bezeichnung'] },
  { feld: 'flaeche', woerter: ['fläche', 'flaeche', 'nutzfläche', 'm2', 'm²', 'qm'] },
  { feld: 'kategorie', woerter: ['kategorie', 'ausstattung'] },
  { feld: 'baujahr', woerter: ['baujahr', 'baubewilligung', 'bauperiode'] },
  { feld: 'vertragsdatum', woerter: ['vertrag', 'mietbeginn', 'beginn', 'abschluss'] },
  { feld: 'istMiete', woerter: ['miete', 'hauptmietzins', 'nettomiete', 'ist-miete'] },
  { feld: 'befristet', woerter: ['befristet', 'befristung'] },
]

function spaltenIndex(kopf: string[]): Record<string, number> {
  const zu: Record<string, number> = {}
  kopf.forEach((name, i) => {
    const n = name.toLowerCase()
    for (const s of SPALTEN) {
      if (zu[s.feld] === undefined && s.woerter.some((w) => n.includes(w))) zu[s.feld] = i
    }
  })
  return zu
}

const JA = /^(ja|j|yes|y|true|wahr|x|1)$/i

export function pruefePortfolio(text: string): PortfolioErgebnis {
  const zeilen = text.split(/\r?\n/).filter((z) => z.trim())
  const fehler: string[] = []
  if (zeilen.length < 2) return { zeilen: [], fehler: ['Die Datei enthält keine Datenzeilen.'] }

  const trenner = (zeilen[0].match(/;/g)?.length ?? 0) >= (zeilen[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const kopf = zerlege(zeilen[0], trenner)
  const idx = spaltenIndex(kopf)
  if (idx.flaeche === undefined) {
    return { zeilen: [], fehler: ['Es fehlt eine Spalte mit der Fläche (z.B. „Nutzfläche m²“).'] }
  }

  const ergebnisse: PortfolioZeile[] = []
  zeilen.slice(1).forEach((zeile, i) => {
    const f = zerlege(zeile, trenner)
    const hole = (feld: string) => (idx[feld] !== undefined ? (f[idx[feld]] ?? '') : '')
    const flaeche = zahl(hole('flaeche'))
    if (flaeche == null) {
      fehler.push(`Zeile ${i + 2}: keine gültige Fläche.`)
      return
    }
    const bezeichnung = hole('bezeichnung') || `Einheit ${i + 1}`
    const unsicher: string[] = []
    if (idx.kategorie === undefined) unsicher.push('Kategorie')
    if (idx.baujahr === undefined) unsicher.push('Baujahr')
    if (idx.vertragsdatum === undefined || !datum(hole('vertragsdatum'))) unsicher.push('Vertragsdatum')

    const input: MietobjektInput = {
      objektart: 'wohnung',
      baubewilligungGebaeude: baubewilligung(hole('baujahr')),
      dgAusbauNachStichtag: true,
      zubauNachStichtag: true,
      anschrift: bezeichnung,
      anschriftBezirk: bezirkAusAnschrift(bezeichnung),
      anschriftKoords: null,
      gemeindebau: false,
      flaeche,
      bezirk: bezirkAusAnschrift(bezeichnung) ?? 1,
      eigentumswohnung: false,
      befristet: JA.test(hole('befristet')),
      vertragsdatum: datum(hole('vertragsdatum')),
      gruenderzeitviertel: 'unbekannt',
      denkmalschutzAufwand: false,
      kriegsschadenWiederaufbau: false,
      foerderungProgramm: 'keine',
      tilgungsstatus: 'offen',
      kategorie: kategorie(hole('kategorie')),
      zustandHaus: 'durchschnittlich',
      heizung: 'zentral_etage',
      stockwerk: 'normal',
      merkmale: leereMerkmale(),
    }

    const ergebnis = evaluateMrg(input)
    const istMiete = zahl(hole('istMiete'))
    const grenze = ergebnis.preisschutz ? (ergebnis.preis?.monatlichMax ?? null) : null
    const differenz = istMiete != null && grenze != null ? Math.round((istMiete - grenze) * 100) / 100 : null

    ergebnisse.push({
      nr: i + 1,
      bezeichnung,
      flaeche,
      istMiete,
      ergebnis,
      ueberGrenze: differenz != null && differenz > 0,
      differenz,
      unsicher,
    })
  })

  return { zeilen: ergebnisse, fehler }
}

/** Ergebnisliste als CSV zum Weiterarbeiten. */
export function portfolioAlsCsv(zeilen: PortfolioZeile[]): string {
  const kopf = [
    'Bezeichnung',
    'Flaeche',
    'Mietzinsart',
    'Anwendung',
    'Obergrenze/Monat',
    'Ist-Miete',
    'Differenz',
    'Ueber Grenze',
    'Offene Angaben',
  ]
  const zeile = (z: PortfolioZeile) =>
    [
      z.bezeichnung,
      z.flaeche,
      z.ergebnis.mietzinsArtLabel,
      z.ergebnis.anwendungLabel,
      z.ergebnis.preisschutz ? (z.ergebnis.preis?.monatlichMax ?? '') : 'keine Obergrenze',
      z.istMiete ?? '',
      z.differenz ?? '',
      z.ueberGrenze ? 'ja' : 'nein',
      z.unsicher.join(' / '),
    ]
      .map((w) => `"${String(w).replace(/"/g, '""')}"`)
      .join(';')
  return [kopf.map((h) => `"${h}"`).join(';'), ...zeilen.map(zeile)].join('\r\n')
}

/** Beispieldatei zum Ausprobieren. */
export const BEISPIEL_CSV = [
  'Anschrift;Nutzfläche m²;Kategorie;Baujahr;Vertragsdatum;Hauptmietzins netto;befristet',
  'Fillgradergasse 13/5, 1060 Wien;68;A;1899;01.09.2021;780;nein',
  'Fillgradergasse 13/12, 1060 Wien;54;B;1899;15.03.1990;240;nein',
  'Praterstraße 24/3, 1020 Wien;96;A;1962;01.06.2019;1450;ja',
  'Löblichgasse 13/8, 1090 Wien;132;A;1901;01.02.2023;2100;nein',
].join('\n')
