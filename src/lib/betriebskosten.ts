// Betriebskosten-Prüfer nach § 21 MRG.
//
// Das Gesetz zählt abschließend auf, was als Betriebskosten auf die Mieterseite
// überwälzt werden darf. Alles, was nicht in dieser Liste steht – allen voran
// Erhaltung und Reparaturen – gehört nicht in die Abrechnung.

export interface BkPosten {
  key: string
  label: string
  /** Zulässig nach § 21 MRG? */
  zulaessig: boolean
  fundstelle: string
  hinweis?: string
}

export const BK_KATALOG: BkPosten[] = [
  { key: 'wasser', label: 'Wasserversorgung und Abwasser', zulaessig: true, fundstelle: '§ 21 Abs 1 Z 1 MRG' },
  { key: 'rauchfang', label: 'Rauchfangkehrung, Kanalräumung, Unratabfuhr, Schädlingsbekämpfung', zulaessig: true, fundstelle: '§ 21 Abs 1 Z 2 MRG' },
  { key: 'beleuchtung', label: 'Beleuchtung der allgemeinen Teile', zulaessig: true, fundstelle: '§ 21 Abs 1 Z 3 MRG' },
  {
    key: 'versicherung',
    label: 'Versicherung gegen Feuer, Haftpflicht und Leitungswasserschaden',
    zulaessig: true,
    fundstelle: '§ 21 Abs 1 Z 4–5 MRG',
    hinweis: 'Weitere Versicherungen nur mit Zustimmung der Mehrheit der Mieter:innen.',
  },
  { key: 'abgaben', label: 'Öffentliche Abgaben, insbesondere Grundsteuer', zulaessig: true, fundstelle: '§ 21 Abs 1 Z 6 MRG' },
  {
    key: 'hausbetreuung',
    label: 'Hausbetreuung (Reinigung, Schneeräumung, Gartenpflege)',
    zulaessig: true,
    fundstelle: '§ 21 Abs 1 Z 8 MRG',
    hinweis: 'Nur die tatsächliche Betreuung; Reparaturen zählen nicht dazu.',
  },
  {
    key: 'verwaltung',
    label: 'Verwaltungshonorar (Pauschale je Quadratmeter)',
    zulaessig: true,
    fundstelle: '§ 22 MRG',
    hinweis: 'Nur bis zur gesetzlichen Pauschale; Mehrkosten sind nicht überwälzbar.',
  },
  {
    key: 'lift',
    label: 'Betrieb von Lift und Gemeinschaftsanlagen',
    zulaessig: true,
    fundstelle: '§ 24 MRG',
    hinweis: 'Getrennt abzurechnen; Erneuerung der Anlage gehört zur Erhaltung.',
  },

  { key: 'reparatur', label: 'Reparaturen und Erhaltungsarbeiten', zulaessig: false, fundstelle: '§ 3 MRG', hinweis: 'Erhaltung zahlt die Vermieterseite aus dem Hauptmietzins.' },
  { key: 'ruecklage', label: 'Instandhaltungsrücklage', zulaessig: false, fundstelle: '§ 21 MRG (nicht genannt)', hinweis: 'Sache der Eigentümergemeinschaft, keine Betriebskosten.' },
  { key: 'zinsen', label: 'Kreditzinsen und Finanzierungskosten', zulaessig: false, fundstelle: '§ 21 MRG (nicht genannt)' },
  { key: 'sanierung', label: 'Sanierung, Modernisierung, Neuanschaffungen', zulaessig: false, fundstelle: '§ 3 MRG' },
  { key: 'anwalt', label: 'Rechts- und Beratungskosten der Vermieterseite', zulaessig: false, fundstelle: '§ 21 MRG (nicht genannt)' },
  { key: 'leerstand', label: 'Kosten leerstehender Wohnungen', zulaessig: false, fundstelle: '§ 21 Abs 1 MRG', hinweis: 'Trägt die Vermieterseite; sie darf nicht auf die übrigen Mieter:innen umgelegt werden.' },
]

export interface BkEingabe {
  /** Betrag je Position und Jahr für das ganze Haus. */
  betraege: Record<string, number>
  /** Gesamte Nutzfläche des Hauses in m². */
  hausflaeche: number
  /** Nutzfläche der eigenen Wohnung in m². */
  wohnungsflaeche: number
  /** Tatsächlich vorgeschriebene Betriebskosten der Wohnung pro Monat. */
  vorschreibung: number
}

export interface BkErgebnis {
  zulaessigJahr: number
  unzulaessigJahr: number
  /** Anteil der Wohnung pro Monat, nur aus zulässigen Posten. */
  anteilMonat: number
  proM2Monat: number
  /** Differenz zur Vorschreibung (positiv = zu viel vorgeschrieben). */
  differenz: number | null
  beanstandet: { posten: BkPosten; betrag: number }[]
}

export function pruefeBetriebskosten(e: BkEingabe): BkErgebnis {
  let zulaessig = 0
  let unzulaessig = 0
  const beanstandet: BkErgebnis['beanstandet'] = []

  for (const posten of BK_KATALOG) {
    const betrag = e.betraege[posten.key] ?? 0
    if (betrag <= 0) continue
    if (posten.zulaessig) zulaessig += betrag
    else {
      unzulaessig += betrag
      beanstandet.push({ posten, betrag })
    }
  }

  const anteil = e.hausflaeche > 0 ? e.wohnungsflaeche / e.hausflaeche : 0
  const anteilMonat = Math.round(((zulaessig * anteil) / 12) * 100) / 100
  const proM2Monat = e.wohnungsflaeche > 0 ? Math.round((anteilMonat / e.wohnungsflaeche) * 100) / 100 : 0
  const differenz = e.vorschreibung > 0 ? Math.round((e.vorschreibung - anteilMonat) * 100) / 100 : null

  return {
    zulaessigJahr: Math.round(zulaessig * 100) / 100,
    unzulaessigJahr: Math.round(unzulaessig * 100) / 100,
    anteilMonat,
    proM2Monat,
    differenz,
    beanstandet,
  }
}
