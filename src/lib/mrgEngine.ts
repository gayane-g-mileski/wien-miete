import type {
  Kategorie,
  LageInfo,
  MietobjektInput,
  MietzinsArt,
  MrgAnwendung,
  MrgErgebnis,
  Preisbestandteil,
  Preisspanne,
} from './types'
import {
  ANGEMESSEN_ABSCHLAG_VON_FREI,
  BEFRISTUNGSABSCHLAG,
  HEIZUNG_ZUSCHLAG,
  KATEGORIE_FAKTOR,
  KAT_D_HMZ,
  MERKMAL_KATALOG,
  RICHTWERT_WIEN,
  STOCKWERK_ABSCHLAG,
  ZUSTAND_ABSCHLAG,
  bezirkAusAnschrift,
  getBezirk,
} from './pricingData'
import { evaluateFoerderung } from './foerderung'
import { GESETZ, type Gesetzeslink } from './gesetze'

const MIETZINS_LABEL: Record<MietzinsArt, string> = {
  richtwert: 'Richtwertmietzins',
  kategorie_d: 'Kategorie-D-Hauptmietzins',
  angemessen: 'Angemessener Hauptmietzins',
  frei: 'Freier Mietzins',
  wgg: 'WGG-/Kategoriemietzins',
  foerderungsrechtlich: 'Förderungsrechtlicher Hauptmietzins',
}

const ANWENDUNG_LABEL: Record<MrgAnwendung, string> = {
  voll: 'Volle gesetzliche Mietobergrenze',
  teil: 'Teilweiser Schutz (freie Miete, aber Kündigungsschutz)',
  ausnahme: 'Kein gesetzlicher Schutz (freie Miete)',
}

function kategorieFaktorABC(k: Kategorie): number {
  if (k === 'A' || k === 'B' || k === 'C') return KATEGORIE_FAKTOR[k]
  return 0.55
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

function lagezuschlagWert(input: MietobjektInput): { wert: number; bezirk: number | null } {
  const nr = bezirkVonEingabe(input)
  if (nr == null) return { wert: 0, bezirk: null }
  return { wert: getBezirk(nr).lagezuschlag, bezirk: nr }
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

function computePreis(input: MietobjektInput, art: MietzinsArt): Preisspanne | null {
  const { flaeche } = input
  const markt = marktband(input)

  let proM2Min: number
  let proM2Max: number
  let bestandteile: Preisbestandteil[] | undefined

  switch (art) {
    case 'richtwert': {
      const basis = round2(RICHTWERT_WIEN * kategorieFaktorABC(input.kategorie))
      const teile: Preisbestandteil[] = [{ label: `Grundwert (Kat. ${katKurz(input.kategorie)})`, wert: basis }]
      const lage = lagezuschlagWert(input)
      if (lage.wert > 0) teile.push({ label: 'Lagezuschlag', wert: round2(lage.wert) })
      teile.push(...ausstattungsBestandteile(input))
      let proM2 = teile.reduce((s, t) => s + t.wert, 0)
      proM2 = Math.max(proM2, KAT_D_HMZ.brauchbar)
      if (input.befristet) {
        const abschlag = round2(-proM2 * BEFRISTUNGSABSCHLAG)
        teile.push({ label: 'Abschlag für befristeten Vertrag (25 %)', wert: abschlag })
        proM2 += abschlag
      }
      bestandteile = teile.map((t) => ({ label: t.label, wert: round2(t.wert) }))
      proM2Min = proM2 * 0.94
      proM2Max = proM2 * 1.06
      break
    }
    case 'kategorie_d': {
      let basis = input.kategorie === 'D_unbrauchbar' ? KAT_D_HMZ.unbrauchbar : KAT_D_HMZ.brauchbar
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
      const basis = RICHTWERT_WIEN * kategorieFaktorABC(input.kategorie)
      proM2Min = basis * 0.85
      proM2Max = basis * 1.3
      break
    }
    case 'wgg': {
      const basis = RICHTWERT_WIEN * kategorieFaktorABC(input.kategorie) * 0.85
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
    bestandteile,
  }
}

/** Menschliche Lage-Erklärung (Zuschlag/Abschlag/neutral/unbekannt). */
function lageInfo(input: MietobjektInput, art: MietzinsArt): LageInfo {
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
      text: 'Du hast keine Anschrift angegeben – die Lage fließt daher nicht in die Berechnung ein. Gib eine Wiener Adresse ein, um zu sehen, ob die Lage die Miete erhöht oder senkt.',
    }
  }

  const b = getBezirk(nr)
  const zuschlag = art === 'richtwert' ? b.lagezuschlag : 0

  if (zuschlag > 0) {
    const betrag = zuschlag.toFixed(2).replace('.', ',')
    let text = `Die Adresse liegt in einer gefragten Gegend (${nr}. Bezirk, ${b.name}). Für so eine gute Lage darf die Miete etwas höher sein – hier rund ${betrag} € pro m² zusätzlich.`
    if (laut) text += ' Weil du "laute Lage/Straßenlärm" angehakt hast, wird das mit einem Abzug gegengerechnet.'
    return { status: laut ? 'abschlag' : 'zuschlag', bezirk: nr, koords, adresse, text }
  }

  let text = `Die Adresse liegt im ${nr}. Bezirk (${b.name}). Diese Lage gilt im Schnitt als durchschnittlich – dafür gibt es keinen Aufschlag, aber auch keinen Abzug.`
  if (laut) text = `Die Adresse liegt im ${nr}. Bezirk (${b.name}). Weil du "laute Lage/Straßenlärm" angehakt hast, wird die Miete etwas nach unten korrigiert.`
  return { status: laut ? 'abschlag' : 'neutral', bezirk: nr, koords, adresse, text }
}

function result(
  mietzinsArt: MietzinsArt,
  anwendung: MrgAnwendung,
  input: MietobjektInput,
  gesetze: Gesetzeslink[],
  begruendung: string[],
  hinweise: string[] = [],
): MrgErgebnis {
  return {
    mietzinsArt,
    mietzinsArtLabel: MIETZINS_LABEL[mietzinsArt],
    anwendung,
    anwendungLabel: ANWENDUNG_LABEL[anwendung],
    kuendigungsschutz: anwendung !== 'ausnahme',
    preisschutz: anwendung === 'voll',
    preis: computePreis(input, mietzinsArt),
    begruendung,
    gesetze,
    hinweise,
    lage: lageInfo(input, mietzinsArt),
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

  // ---- 2) Förderung ----
  const foe = evaluateFoerderung(input.foerderungProgramm, input.tilgungsstatus, input.eigentumswohnung)
  if (foe) {
    return result(foe.mietzinsArt, foe.anwendung, input, foe.gesetze, foe.begruendung, foe.hinweise)
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
  const nach1953 =
    input.baubewilligungGebaeude === '1953_2001' ||
    input.baubewilligungGebaeude === '2002_2006' ||
    input.baubewilligungGebaeude === 'nach_2006'
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
    if (input.kategorie === 'D_brauchbar' || input.kategorie === 'D_unbrauchbar') {
      return result(
        'kategorie_d',
        'voll',
        input,
        [GESETZ.mrg()],
        ['Es ist eine einfach ausgestattete Wohnung (Kategorie D) in einem alten Haus. Dafür gibt es eine niedrige, gesetzlich fixe Obergrenze.'],
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
