import type {
  Kategorie,
  LageInfo,
  MietobjektInput,
  MietzinsArt,
  MrgAnwendung,
  MrgErgebnis,
  Preisbestandteil,
  Preisspanne,
  Sicht,
} from './types'
import {
  ANGEMESSEN_ABSCHLAG_VON_FREI,
  BEFRISTUNGSABSCHLAG,
  HEIZUNG_ZUSCHLAG,
  KATEGORIE_ABSCHLAG,
  KATEGORIE_BETRAG,
  KATEGORIE_ZEITRAUM,
  MERKMAL_KATALOG,
  RICHTWERT_WIEN,
  STOCKWERK_ABSCHLAG,
  ZUSCHLAG_KORRIDOR,
  ZUSTAND_ABSCHLAG,
  bezirkAusAnschrift,
  getBezirk,
} from './pricingData'
import { evaluateFoerderung } from './foerderung'
import { lagezuschlagHerleiten, type LagezuschlagHerleitung } from './lagezuschlag'
import { GESETZ, type Gesetzeslink } from './gesetze'

const MIETZINS_LABEL: Record<MietzinsArt, string> = {
  richtwert: 'Richtwertmietzins',
  kategorie: 'Kategoriemietzins',
  kategorie_d: 'Kategorie-D-Hauptmietzins',
  altvertrag: 'Mietzins des Altvertrags',
  angemessen: 'Angemessener Hauptmietzins',
  frei: 'Freier Mietzins',
  wgg: 'WGG-/Kategoriemietzins',
  foerderungsrechtlich: 'Förderungsrechtlicher Hauptmietzins',
}

type Zeitregime = 'altvertrag' | 'kategorie' | 'richtwert' | 'unbekannt'

/**
 * Das Datum des Hauptmietvertrags entscheidet, welche Obergrenze gilt:
 * bis 31.12.1981 bleibt der damals vereinbarte Mietzins maßgeblich,
 * vom 1.1.1982 bis 28.2.1994 gilt der Kategoriemietzins,
 * ab 1.3.1994 der Richtwert.
 */
function zeitregime(vertragsdatum: string): Zeitregime {
  const tag = vertragsdatum.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tag)) return 'unbekannt'
  if (tag < KATEGORIE_ZEITRAUM.von) return 'altvertrag'
  if (tag <= KATEGORIE_ZEITRAUM.bis) return 'kategorie'
  return 'richtwert'
}

const ANWENDUNG_LABEL: Record<MrgAnwendung, string> = {
  voll: 'Vollanwendung des MRG',
  teil: 'Teilanwendung des MRG',
  ausnahme: 'Vollausnahme vom MRG',
}

/** Richtwert-Grundwert der Wohnung: Normwohnung (Kat. A) minus Kategorieabschlag. */
function grundwertRichtwert(k: Kategorie): { grundwert: number; abschlag: number } {
  const stufe = k === 'B' ? 'B' : k === 'C' ? 'C' : 'A'
  const abschlag = round2(RICHTWERT_WIEN * KATEGORIE_ABSCHLAG[stufe])
  return { grundwert: round2(RICHTWERT_WIEN + abschlag), abschlag }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function katKurz(k: Kategorie): string {
  if (k === 'D_brauchbar' || k === 'D_unbrauchbar') return 'D'
  return k
}

function bezirkVonEingabe(input: MietobjektInput): number | null {
  return input.anschriftBezirk ?? bezirkAusAnschrift(input.anschrift)
}

function marktband(input: MietobjektInput): { min: number; max: number } {
  const nr = bezirkVonEingabe(input) ?? input.bezirk
  const b = getBezirk(nr)
  return { min: b.marktmieteMin, max: b.marktmieteMax }
}

function ausstattungsBestandteile(input: MietobjektInput): Preisbestandteil[] {
  const teile: Preisbestandteil[] = []
  for (const def of MERKMAL_KATALOG) {
    if (input.merkmale[def.key]) teile.push({ label: def.label, wert: def.wert })
  }
  if (input.zustandHaus === 'sehr_gut') teile.push({ label: 'Sehr guter Erhaltungszustand', wert: ZUSTAND_ABSCHLAG.sehr_gut })
  if (input.zustandHaus === 'schlecht') teile.push({ label: 'Schlechter Erhaltungszustand', wert: ZUSTAND_ABSCHLAG.schlecht })
  if (input.stockwerk === 'erdgeschoss') teile.push({ label: 'Erdgeschoss/Hochparterre', wert: STOCKWERK_ABSCHLAG.erdgeschoss })
  if (input.stockwerk === 'hoch_ohne_lift') teile.push({ label: 'Hohes Stockwerk ohne Lift', wert: STOCKWERK_ABSCHLAG.hoch_ohne_lift })
  if (input.heizung === 'zentral_etage') teile.push({ label: 'Zentral-/Etagenheizung', wert: HEIZUNG_ZUSCHLAG })
  return teile
}

/**
 * Richtwert-Rechnung für einen bestimmten Lagezuschlag und einen bestimmten
 * Korridor für die Ausstattungszuschläge. Beides unterscheidet die drei
 * Sichten (Judikatur, Schlichtungsstelle, Markt) voneinander.
 */
function richtwertRechnung(
  input: MietobjektInput,
  korridor: number,
  lageWert: number,
): { proM2: number; teile: Preisbestandteil[] } {
  const { grundwert, abschlag: katAbschlag } = grundwertRichtwert(input.kategorie)
  const teile: Preisbestandteil[] = [{ label: 'Richtwert Wien (Normwohnung, Kat. A)', wert: RICHTWERT_WIEN }]
  if (katAbschlag !== 0) {
    const prozent = Math.round(-KATEGORIE_ABSCHLAG[input.kategorie === 'B' ? 'B' : 'C'] * 100)
    teile.push({ label: `Abschlag Kategorie ${katKurz(input.kategorie)} (${prozent} %, Praxiswert)`, wert: katAbschlag })
  }
  if (lageWert > 0) teile.push({ label: 'Lagezuschlag (§ 16 Abs 3 MRG)', wert: round2(lageWert) })

  // Gesamtschau statt linearer Addition: Die Summe der Ausstattungs-Zu- und
  // -Abschläge bleibt in einem Korridor um den Grundwert (§ 16 Abs 2 MRG,
  // OGH RS0117881).
  const ausstattung = ausstattungsBestandteile(input)
  const summeRoh = ausstattung.reduce((s, t) => s + t.wert, 0)
  const grenze = round2(grundwert * korridor)
  const summe = Math.max(-grenze, Math.min(grenze, summeRoh))
  teile.push(...ausstattung)
  const gedeckelt = round2(summe - summeRoh)
  if (gedeckelt !== 0) {
    teile.push({
      label: `Deckelung nach Gesamtschau (max. ±${Math.round(korridor * 100)} % des Grundwerts)`,
      wert: gedeckelt,
    })
  }

  let proM2 = teile.reduce((s, t) => s + t.wert, 0)
  proM2 = Math.max(proM2, KATEGORIE_BETRAG.D_brauchbar)
  if (input.befristet) {
    const befristung = round2(-proM2 * BEFRISTUNGSABSCHLAG)
    teile.push({ label: 'Abschlag für befristeten Vertrag (25 %)', wert: befristung })
    proM2 += befristung
  }
  return { proM2, teile: teile.map((t) => ({ label: t.label, wert: round2(t.wert) })) }
}

function computePreis(
  input: MietobjektInput,
  art: MietzinsArt,
  lz: LagezuschlagHerleitung,
): Preisspanne | null {
  const { flaeche } = input
  const markt = marktband(input)

  let proM2Min: number
  let proM2Max: number
  let bestandteile: Preisbestandteil[] | undefined

  switch (art) {
    case 'richtwert': {
      // Die Bandbreite kommt aus der Streuung des Lagezuschlags, nicht aus
      // einem pauschalen Zu- und Abschlag.
      const mitte = richtwertRechnung(input, ZUSCHLAG_KORRIDOR, lz.wert)
      const unten = richtwertRechnung(input, ZUSCHLAG_KORRIDOR, lz.min).proM2
      const oben = richtwertRechnung(input, ZUSCHLAG_KORRIDOR, lz.max).proM2
      bestandteile = mitte.teile
      proM2Min = Math.min(unten, oben, mitte.proM2) * 0.98
      proM2Max = Math.max(unten, oben, mitte.proM2) * 1.02
      break
    }
    case 'kategorie': {
      // Vertrag aus der Zeit des Kategoriemietzinses: Obergrenze ist der
      // amtliche Kategoriebetrag, ohne Zu- und Abschläge.
      const betrag = KATEGORIE_BETRAG[input.kategorie]
      const teile: Preisbestandteil[] = [
        { label: `Kategoriebetrag ${katKurz(input.kategorie)} (§ 15a MRG)`, wert: betrag },
      ]
      let proM2 = betrag
      if (input.befristet) {
        const befristung = round2(-proM2 * BEFRISTUNGSABSCHLAG)
        teile.push({ label: 'Abschlag für befristeten Vertrag (25 %)', wert: befristung })
        proM2 += befristung
      }
      bestandteile = teile
      proM2Min = proM2
      proM2Max = proM2
      break
    }
    case 'kategorie_d': {
      let basis = KATEGORIE_BETRAG[input.kategorie === 'D_unbrauchbar' ? 'D_unbrauchbar' : 'D_brauchbar']
      if (input.befristet) basis *= 1 - BEFRISTUNGSABSCHLAG
      proM2Min = basis
      proM2Max = basis
      break
    }
    case 'angemessen': {
      proM2Min = markt.min * (1 - ANGEMESSEN_ABSCHLAG_VON_FREI)
      proM2Max = markt.max * (1 - ANGEMESSEN_ABSCHLAG_VON_FREI)
      break
    }
    case 'frei': {
      proM2Min = markt.min
      proM2Max = markt.max
      break
    }
    case 'foerderungsrechtlich': {
      const basis = grundwertRichtwert(input.kategorie).grundwert
      proM2Min = basis * 0.85
      proM2Max = basis * 1.3
      break
    }
    case 'wgg': {
      const basis = grundwertRichtwert(input.kategorie).grundwert * 0.85
      proM2Min = basis * 0.8
      proM2Max = basis * 1.2
      break
    }
    default:
      return null
  }

  return {
    proM2Min: round2(proM2Min),
    proM2Max: round2(proM2Max),
    monatlichMin: round2(proM2Min * flaeche),
    monatlichMax: round2(proM2Max * flaeche),
    flaeche,
    bestandteile,
  }
}


/**
 * Drei Blickwinkel auf dieselbe Wohnung:
 *  – Judikatur: strenge Gesamtschau, Zuschläge eng gedeckelt, unterer
 *    Lagezuschlag. So rechnen Gerichte, wenn sie Zuschläge zusammenschauen.
 *  – Schlichtungsstelle: der Wert, mit dem hier gerechnet wird.
 *  – Markt: was in dieser Gegend tatsächlich verlangt wird.
 */
function baueSichten(input: MietobjektInput, art: MietzinsArt, lz: LagezuschlagHerleitung): Sicht[] | undefined {
  if (art !== 'richtwert') return undefined
  const markt = marktband(input)
  const streng = richtwertRechnung(input, ZUSCHLAG_KORRIDOR / 2, lz.min).proM2
  const mitte = richtwertRechnung(input, ZUSCHLAG_KORRIDOR, lz.wert).proM2
  const oben = richtwertRechnung(input, ZUSCHLAG_KORRIDOR, lz.max).proM2

  const bau = (
    name: Sicht['name'],
    titel: string,
    erklaerung: string,
    min: number,
    max: number,
  ): Sicht => ({
    name,
    titel,
    erklaerung,
    proM2Min: round2(min),
    proM2Max: round2(max),
    monatlichMin: round2(min * input.flaeche),
    monatlichMax: round2(max * input.flaeche),
  })

  return [
    bau(
      'judikatur',
      'Judikatur-Sicht',
      'Strenge Gesamtschau nach § 16 Abs 2 MRG: Zuschläge werden nicht aufaddiert, sondern zusammen bewertet (OGH RS0117881). Unterer Lagezuschlag.',
      streng * 0.98,
      streng * 1.02,
    ),
    bau(
      'schlichtung',
      'Schlichtungsstellen-Sicht',
      'Der Wert, mit dem hier gerechnet wird: Zuschläge im Korridor um den Grundwert, Lagezuschlag in seiner Bandbreite.',
      Math.min(mitte, oben) * 0.98,
      Math.max(mitte, oben) * 1.02,
    ),
    bau(
      'markt',
      'Marktsicht',
      'Was in dieser Gegend tatsächlich verlangt wird – ohne Rücksicht darauf, was gesetzlich zulässig ist.',
      markt.min,
      markt.max,
    ),
  ]
}

/** Menschliche Lage-Erklärung (Zuschlag/Abschlag/neutral/unbekannt). */
function lageInfo(input: MietobjektInput, art: MietzinsArt, lz: LagezuschlagHerleitung): LageInfo {
  const nr = bezirkVonEingabe(input)
  const koords = input.anschriftKoords
  const adresse = input.anschrift
  const laut = input.merkmale.strassenlaerm

  if (nr == null) {
    return {
      status: 'unbekannt',
      bezirk: null,
      koords,
      adresse,
      text: 'Ohne Anschrift fließt die Lage nicht in die Berechnung ein. Mit einer Wiener Adresse wird sichtbar, ob die Lage den Mietzins hebt oder senkt.',
    }
  }

  const b = getBezirk(nr)
  const zuschlag = art === 'richtwert' ? lz.wert : 0

  if (lz.ausgeschlossen && art === 'richtwert') {
    return {
      status: 'neutral',
      bezirk: nr,
      koords,
      adresse,
      text: `Die Adresse liegt in einem Gründerzeitviertel (${nr}. Bezirk, ${b.name}). Dort ist ein Lagezuschlag nach § 2 Abs 3 RichtWG ausgeschlossen – auch wenn der Bezirk sonst als gute Lage gilt.`,
    }
  }

  if (zuschlag > 0) {
    const spanne = `${lz.min.toFixed(2).replace('.', ',')} bis ${lz.max.toFixed(2).replace('.', ',')}`
    let text = `Die Adresse liegt in einer gefragten Gegend (${nr}. Bezirk, ${b.name}). Für so eine gute Lage darf die Miete höher sein – hier rund ${spanne} € pro m² zusätzlich. Der Zuschlag gilt je Liegenschaft; maßgeblich ist die Lagezuschlagskarte der Stadt Wien.`
    if (laut) text += ' Weil "laute Lage/Straßenlärm" angehakt ist, wird das mit einem Abzug gegengerechnet.'
    return { status: laut ? 'abschlag' : 'zuschlag', bezirk: nr, koords, adresse, text }
  }

  let text = `Die Adresse liegt im ${nr}. Bezirk (${b.name}). Diese Lage gilt im Schnitt als durchschnittlich – dafür gibt es keinen Aufschlag, aber auch keinen Abzug.`
  if (laut) text = `Die Adresse liegt im ${nr}. Bezirk (${b.name}). Weil "laute Lage/Straßenlärm" angehakt ist, wird die Miete etwas nach unten korrigiert.`
  return { status: laut ? 'abschlag' : 'neutral', bezirk: nr, koords, adresse, text }
}

// Objektarten, für die keine Wohnungsmieten hinterlegt sind – die Bandbreite
// ist dort nur ein grober Anhaltspunkt.
const NICHT_WOHNEN: MietobjektInput['objektart'][] = [
  'geschaeftsraum',
  'geschaeftsraum_kurzzeit',
  'nebenflaeche_separat',
  'pacht',
  'wirtschaftspark',
]

function result(
  mietzinsArt: MietzinsArt,
  anwendung: MrgAnwendung,
  input: MietobjektInput,
  gesetze: Gesetzeslink[],
  begruendung: string[],
  hinweise: string[] = [],
): MrgErgebnis {
  const lz = lagezuschlagHerleiten(
    bezirkVonEingabe(input),
    input.gruenderzeitviertel,
    null,
  )
  if (NICHT_WOHNEN.includes(input.objektart)) {
    hinweise = [
      ...hinweise,
      'Die Bandbreite beruht auf Wiener Wohnungsmieten und ist für diese Objektart nur ein grober Anhaltspunkt. Vergleichbare Angebote in der Umgebung sind hier der bessere Maßstab.',
    ]
  }

  // Das Vertragsdatum entscheidet, ob statt des Richtwerts der Kategoriemietzins
  // gilt oder der Mietzins des Altvertrags weiterläuft.
  if (mietzinsArt === 'richtwert') {
    const regime = zeitregime(input.vertragsdatum)
    if (regime === 'kategorie') {
      mietzinsArt = 'kategorie'
      gesetze = [GESETZ.mrg()]
      begruendung = [
        'Der Hauptmietvertrag wurde zwischen 1.1.1982 und 28.2.1994 abgeschlossen. Für solche Verträge richtet sich die Obergrenze nach der Ausstattung der Wohnung – es gilt der Kategoriemietzins, nicht der Richtwert.',
      ]
      hinweise = [
        ...hinweise,
        'Der Kategoriebetrag wird regelmäßig an die Inflation angepasst (Wertsicherung). Maßgeblich ist die Kategorie im Zeitpunkt des Vertragsabschlusses.',
      ]
    } else if (regime === 'altvertrag') {
      mietzinsArt = 'altvertrag'
      gesetze = [GESETZ.mrg()]
      begruendung = [
        'Der Hauptmietvertrag stammt aus der Zeit vor dem 1.1.1982. Dann bleibt grundsätzlich der damals vereinbarte Mietzins maßgeblich; weder Richtwert noch Kategoriebetrag lassen sich darauf anwenden.',
      ]
      hinweise = [
        ...hinweise,
        'Eine Erhöhung ist nur in den gesetzlich vorgesehenen Fällen möglich (z.B. Wertsicherung, Erhaltungs- und Verbesserungsarbeiten, Anhebung nach § 46 MRG bei Eintritt). Eine Preisschätzung ist hier nicht sinnvoll.',
      ]
    } else if (regime === 'unbekannt') {
      hinweise = [
        ...hinweise,
        'Ohne Datum des Mietvertrags wird der Richtwert angenommen. Verträge vom 1.1.1982 bis 28.2.1994 unterliegen dem Kategoriemietzins, ältere dem vereinbarten Mietzins des Altvertrags.',
      ]
    }
  }

  return {
    mietzinsArt,
    mietzinsArtLabel: MIETZINS_LABEL[mietzinsArt],
    anwendung,
    anwendungLabel: ANWENDUNG_LABEL[anwendung],
    kuendigungsschutz: anwendung !== 'ausnahme',
    preisschutz: anwendung === 'voll',
    preis: (() => {
      const p = computePreis(input, mietzinsArt, lz)
      return p ? { ...p, sichten: baueSichten(input, mietzinsArt, lz) } : null
    })(),
    begruendung,
    gesetze,
    hinweise,
    lage: lageInfo(input, mietzinsArt, lz),
    lagezuschlag: lz,
  }
}

/**
 * Ermittelt Mietzinsart, Schutzumfang und Preisbandbreite.
 * Prüfreihenfolge: Vollausnahmen → Förderung → sonstige Teilausnahmen →
 * baualtersabhängige volle Anwendung.
 */
export function evaluateMrg(input: MietobjektInput): MrgErgebnis {
  // ---- 1) Vollausnahmen (kein gesetzlicher Schutz) ----
  switch (input.objektart) {
    case 'einfamilienhaus':
    case 'zweifamilienhaus':
      return result(
        'frei',
        'ausnahme',
        input,
        [GESETZ.mrg()],
        ['Das Gebäude hat höchstens zwei Wohnungen (Ein- oder Zweifamilienhaus). Dafür gelten die Mietregeln nicht – Preis und Kündigung sind frei.'],
        ['Wurde der Vertrag vor 2002 abgeschlossen, kann teilweise doch ein Kündigungsschutz gelten.'],
      )
    case 'dienstwohnung':
      return result('frei', 'ausnahme', input, [GESETZ.mrg()], ['Es ist eine Wohnung, die zum Job gehört (Dienst- oder Werkswohnung). Dafür gelten die Mietregeln nicht.'])
    case 'karitatives_wohnen':
      return result(
        'frei',
        'ausnahme',
        input,
        [GESETZ.mrg()],
        ['Die Wohnung wird von einer sozialen Einrichtung im Rahmen von betreutem Wohnen vermietet. Dafür gelten die Mietregeln nicht.'],
        ['Gilt für Verträge ab 2002.'],
      )
    case 'heim_beherbergung':
      return result('frei', 'ausnahme', input, [GESETZ.mrg()], ['Es ist ein Heim oder Beherbergungsbetrieb (z.B. Studenten- oder Seniorenheim, Pension). Dafür gelten die Mietregeln nicht.'])
    case 'zweitwohnung_befristet':
      if (input.kategorie === 'A' || input.kategorie === 'B') {
        return result(
          'frei',
          'ausnahme',
          input,
          [GESETZ.mrg()],
          ['Es ist eine gut ausgestattete Zweitwohnung, die aus beruflichen Gründen für höchstens ein halbes Jahr gemietet wird. Dafür gelten die Mietregeln nicht.'],
          ['Der berufliche Grund muss schriftlich vereinbart sein. Dauert es länger als 6 Monate, gelten die Mietregeln doch.'],
        )
      }
      break
    case 'ferienwohnung':
      return result('frei', 'ausnahme', input, [GESETZ.mrg()], ['Es ist eine Ferien-/Freizeitwohnung neben einem Hauptwohnsitz. Dafür gelten die Mietregeln nicht.'])
    case 'pacht':
      return result('frei', 'ausnahme', input, [GESETZ.mrg()], ['Es ist eine Pacht, keine Miete. Dafür gelten die Mietregeln nicht.'])
    case 'nebenflaeche_separat':
      return result('frei', 'ausnahme', input, [GESETZ.mrg()], ['Es ist eine einzeln vermietete Nebenfläche (z.B. Garage, Stellplatz, Garten). Dafür gelten die Mietregeln nicht.'])
    case 'geschaeftsraum_kurzzeit':
      return result('frei', 'ausnahme', input, [GESETZ.mrg()], ['Es ist ein Geschäftslokal, das für höchstens ein halbes Jahr vermietet wird. Dafür gelten die Mietregeln nicht.'])
    default:
      break
  }

  // ---- Gemeindebau: immer Richtwert ----
  const istWohnung = input.objektart === 'wohnung' || input.objektart === 'dg_ausbau' || input.objektart === 'zubau'
  if (input.gemeindebau && istWohnung) {
    return result(
      'richtwert',
      'voll',
      input,
      [GESETZ.mrg(), GESETZ.richtwertgesetz()],
      ['Diese Adresse ist ein Gemeindebau der Stadt Wien (Wiener Wohnen). Für Gemeindewohnungen gilt die gesetzliche Miet-Obergrenze nach dem Richtwert – dazu kommen Zu- und Abschläge.'],
    )
  }

  // ---- 2a) Kriegsschaden und Wiederaufbau ----
  // Ein Altbau, der nach Kriegsschaden mit Mitteln des Wohnhaus-Wiederaufbau-
  // fonds wiederhergestellt wurde, folgt den Förderungsregeln – auch wenn die
  // Baubewilligung vor 1945 liegt.
  if (input.objektart === 'wohnung' && input.kriegsschadenWiederaufbau) {
    const foe = evaluateFoerderung('wwg1948', input.tilgungsstatus, input.eigentumswohnung)
    if (foe) {
      return result(
        foe.mietzinsArt,
        foe.anwendung,
        input,
        foe.gesetze,
        [
          'Das Haus wurde nach einem Kriegsschaden mit öffentlichen Mitteln wiederhergestellt (Wohnhaus-Wiederaufbaufonds).',
          ...foe.begruendung,
        ],
        [
          ...foe.hinweise,
          'Maßgeblich ist, ob gerade diese Wohnung mit Fondsmitteln wiederhergestellt wurde. Bei Bewilligungen nach dem 31.8.1952 genügt die Wiederherstellung allgemeiner Teile des Hauses.',
        ],
      )
    }
  }

  // ---- 2b) Förderung (nur für Wohnungen, beim Altbau ohne Bedeutung) ----
  if (input.objektart === 'wohnung' && input.baubewilligungGebaeude !== 'vor_1945') {
    const foe = evaluateFoerderung(input.foerderungProgramm, input.tilgungsstatus, input.eigentumswohnung)
    if (foe) {
      return result(foe.mietzinsArt, foe.anwendung, input, foe.gesetze, foe.begruendung, foe.hinweise)
    }
  }

  // ---- 3) Sonstige Teilausnahmen ----
  if (input.objektart === 'wirtschaftspark') {
    return result('frei', 'teil', input, [GESETZ.mrg()], ['Das Objekt liegt in einem Wirtschaftspark. Die Miethöhe ist frei, ein Kündigungsschutz besteht aber.'])
  }
  if (input.objektart === 'dg_ausbau' && input.dgAusbauNachStichtag) {
    return result(
      'frei',
      'teil',
      input,
      [GESETZ.mrg()],
      ['Es ist ein neuerer Dachgeschoss-Ausbau (ab 2002). Die Miethöhe ist frei, ein Kündigungsschutz besteht aber.'],
    )
  }
  if (input.objektart === 'zubau' && input.zubauNachStichtag) {
    return result(
      'frei',
      'teil',
      input,
      [GESETZ.mrg()],
      ['Es ist ein neuerer Zubau (ab Oktober 2006). Die Miethöhe ist frei, ein Kündigungsschutz besteht aber.'],
    )
  }
  const istWohnObjekt = input.objektart === 'wohnung' || input.objektart === 'dg_ausbau' || input.objektart === 'zubau'
  const istGeschaeft = input.objektart === 'geschaeftsraum'
  const nach1953 = input.baubewilligungGebaeude === 'nach_1953'
  if ((istWohnObjekt || istGeschaeft) && nach1953 && !input.eigentumswohnung) {
    return result(
      'frei',
      'teil',
      input,
      [GESETZ.mrg()],
      ['Das Haus ist ein Neubau (Baubewilligung nach Juni 1953) ohne öffentliche Förderung. Die Miethöhe ist frei, ein Kündigungsschutz besteht aber.'],
    )
  }
  if (input.objektart === 'wohnung' && input.eigentumswohnung && nach1953) {
    return result(
      'frei',
      'teil',
      input,
      [GESETZ.mrg()],
      ['Es ist eine Eigentumswohnung in einem Neubau (nach Juni 1953). Die Miethöhe ist frei, ein Kündigungsschutz besteht aber.'],
      ['Wurde die Wohnung mit bestimmten alten Förderungen gebaut, kann doch eine Obergrenze gelten.'],
    )
  }

  // ---- 4) Volle Anwendung ----
  if (input.objektart === 'geschaeftsraum') {
    return result(
      'angemessen',
      'voll',
      input,
      [GESETZ.mrg()],
      ['Es ist ein Geschäftslokal. Die Miete darf so hoch sein wie bei vergleichbaren Lokalen üblich ("angemessen").'],
    )
  }

  if (input.baubewilligungGebaeude === 'vor_1945') {
    // Denkmalschutz: Hat die Vermieterseite erhebliche eigene Mittel in die
    // Erhaltung des geschützten Gebäudes gesteckt, darf statt des Richtwerts
    // der angemessene Mietzins vereinbart werden.
    if (input.denkmalschutzAufwand && input.merkmale.denkmalschutz) {
      return result(
        'angemessen',
        'voll',
        input,
        [GESETZ.mrg()],
        [
          'Das Gebäude steht unter Denkmalschutz und die Vermieterseite hat dafür erhebliche eigene Mittel aufgewendet. In diesem Fall darf statt des Richtwerts der angemessene Mietzins vereinbart werden (§ 16 Abs 1 Z 3 MRG).',
        ],
        [
          'Die Aufwendungen müssen erheblich und über die laufende Erhaltung hinausgehend sein; im Streitfall ist das nachzuweisen. Öffentliche Förderungen und Zuschüsse zählen dabei nicht als eigene Mittel.',
        ],
      )
    }
    if (input.kategorie === 'D_brauchbar' || input.kategorie === 'D_unbrauchbar') {
      return result(
        'kategorie_d',
        'voll',
        input,
        [GESETZ.mrg()],
        ['Es ist eine einfach ausgestattete Wohnung (Kategorie D) in einem alten Haus. Dafür gibt es eine niedrige, gesetzlich fixe Obergrenze.'],
      )
    }
    // Große Wohnungen der Kategorie A/B über 130 m²: kein Richtwert, sondern
    // angemessener Mietzins (§ 16 Abs 1 Z 4 MRG).
    if (input.flaeche > 130 && (input.kategorie === 'A' || input.kategorie === 'B')) {
      return result(
        'angemessen',
        'voll',
        input,
        [GESETZ.mrg()],
        [
          'Die Wohnung ist gut ausgestattet (Kategorie A oder B) und größer als 130 m². In diesem Fall gilt kein Richtwert – die Miete darf so hoch sein wie bei vergleichbaren Wohnungen üblich ("angemessen").',
        ],
        ['Voraussetzung ist, dass die Wohnung innerhalb von sechs Monaten nach Räumung neu vermietet wird.'],
      )
    }
    return result(
      'richtwert',
      'voll',
      input,
      [GESETZ.mrg(), GESETZ.richtwertgesetz()],
      ['Es ist eine Wohnung in einem alten Haus (Baubewilligung vor Mai 1945). Für die Miete gilt eine gesetzliche Obergrenze (Richtwert), zu der Zu- und Abschläge kommen.'],
    )
  }

  return result(
    'angemessen',
    'voll',
    input,
    [GESETZ.mrg()],
    ['Das Haus stammt aus den Jahren 1945–1953 und wurde ohne öffentliche Förderung gebaut. Die Miete darf so hoch sein wie bei vergleichbaren Wohnungen üblich ("angemessen").'],
  )
}
