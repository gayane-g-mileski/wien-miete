import type {
  Kategorie,
  MietobjektInput,
  MietzinsArt,
  MrgAnwendung,
  MrgErgebnis,
  Preisbestandteil,
  Preisspanne,
} from './types'
import {
  ABSCHLAG,
  ANGEMESSEN_ABSCHLAG_VON_FREI,
  BEFRISTUNGSABSCHLAG,
  KATEGORIE_FAKTOR,
  KAT_D_HMZ,
  RICHTWERT_WIEN,
  ZUSCHLAG,
  bezirkAusAnschrift,
  getBezirk,
} from './pricingData'
import { evaluateFoerderung } from './foerderung'

const MIETZINS_LABEL: Record<MietzinsArt, string> = {
  richtwert: 'Richtwertmietzins',
  kategorie_d: 'Kategorie-D-Hauptmietzins',
  angemessen: 'Angemessener Hauptmietzins',
  frei: 'Freier Mietzins',
  wgg: 'WGG-/Kategoriemietzins',
  foerderungsrechtlich: 'Förderungsrechtlicher Hauptmietzins',
}

const ANWENDUNG_LABEL: Record<MrgAnwendung, string> = {
  voll: 'Vollanwendung des MRG',
  teil: 'Teilanwendung (Teilausnahme) des MRG',
  ausnahme: 'Vollausnahme vom MRG',
}

function kategorieFaktorABC(k: Kategorie): number {
  if (k === 'A' || k === 'B' || k === 'C') return KATEGORIE_FAKTOR[k]
  return 0.55
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Lagezuschlag in €/m² aus der Anschrift; 0 ohne (verwertbare) Anschrift. */
function lagezuschlagAusAnschrift(input: MietobjektInput): { wert: number; bezirk: number | null } {
  const nr = bezirkAusAnschrift(input.anschrift)
  if (nr == null) return { wert: 0, bezirk: null }
  return { wert: getBezirk(nr).lagezuschlag, bezirk: nr }
}

function marktband(input: MietobjektInput): { min: number; max: number } {
  // Bezirk bevorzugt aus Anschrift, sonst aus Auswahl.
  const nr = bezirkAusAnschrift(input.anschrift) ?? input.bezirk
  const b = getBezirk(nr)
  return { min: b.marktmieteMin, max: b.marktmieteMax }
}

/** Summe der Ausstattungs-/Zustands-Zu- und -Abschläge in €/m² (ohne Lage). */
function ausstattungsBestandteile(input: MietobjektInput): Preisbestandteil[] {
  const teile: Preisbestandteil[] = []
  const add = (label: string, wert: number) => {
    if (wert !== 0) teile.push({ label, wert: round2(wert) })
  }
  if (input.lift) add('Lift', ZUSCHLAG.lift)
  if (input.balkonTerrasse) add('Balkon/Terrasse/Loggia', ZUSCHLAG.balkonTerrasse)
  if (input.garten) add('Eigengarten', ZUSCHLAG.garten)
  if (input.ruhelage) add('Besonders ruhige Lage', ZUSCHLAG.ruhelage)
  if (input.ausblick) add('Guter Ausblick', ZUSCHLAG.ausblick)
  if (input.hochwertigeAusstattung) add('Hochwertige Ausstattung', ZUSCHLAG.hochwertigeAusstattung)
  if (input.heizung === 'zentral_etage') add('Zentral-/Etagenheizung', ZUSCHLAG.heizungZentral)
  if (input.keller) add('Keller/Kellerabteil', ZUSCHLAG.keller)
  if (input.garage) add('Garage/Stellplatz', ZUSCHLAG.garage)
  if (input.gemeinschaft) add('Gemeinschaftseinrichtungen', ZUSCHLAG.gemeinschaft)
  if (input.zustandHaus === 'sehr_gut') add('Sehr guter Erhaltungszustand', ZUSCHLAG.zustandSehrGut)
  if (input.zustandHaus === 'schlecht') add('Schlechter Erhaltungszustand', -ABSCHLAG.zustandSchlecht)
  if (input.stockwerk === 'erdgeschoss') add('Erdgeschoss/Hochparterre', -ABSCHLAG.stockwerkErdgeschoss)
  if (input.stockwerk === 'hoch_ohne_lift') add('Hohes Stockwerk ohne Lift', -ABSCHLAG.stockwerkHochOhneLift)
  if (input.strassenlaerm) add('Straßenlärm/laute Lage', -ABSCHLAG.strassenlaerm)
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
      const teile: Preisbestandteil[] = [{ label: `Richtwert (Kat. ${katKurz(input.kategorie)})`, wert: basis }]
      const lage = lagezuschlagAusAnschrift(input)
      if (lage.wert > 0) teile.push({ label: 'Lagezuschlag', wert: round2(lage.wert) })
      teile.push(...ausstattungsBestandteile(input))
      let proM2 = teile.reduce((s, t) => s + t.wert, 0)
      proM2 = Math.max(proM2, KAT_D_HMZ.brauchbar) // nicht unter Kat-D-Niveau
      if (input.befristet) {
        const abschlag = round2(-proM2 * BEFRISTUNGSABSCHLAG)
        teile.push({ label: 'Befristungsabschlag (25 %)', wert: abschlag })
        proM2 += abschlag
      }
      bestandteile = teile
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

function katKurz(k: Kategorie): string {
  if (k === 'D_brauchbar' || k === 'D_unbrauchbar') return 'D'
  return k
}

function lageHinweisText(input: MietobjektInput, art: MietzinsArt): string | null {
  if (art !== 'richtwert') return null
  const lage = lagezuschlagAusAnschrift(input)
  if (lage.bezirk == null) {
    return 'Ohne Anschrift wird kein Lagezuschlag berücksichtigt. Gib eine Anschrift (mit Wiener PLZ) ein, um eine Lagezuschlag-Schätzung zu erhalten.'
  }
  const b = getBezirk(lage.bezirk)
  if (lage.wert > 0) {
    return `Anschrift im ${lage.bezirk}. Bezirk (${b.name}): geschätzter Lagezuschlag ${lage.wert.toFixed(2).replace('.', ',')} €/m². Der reale Lagezuschlag wird lt. Wiener Lagezuschlagskarte adressgenau (Zählgebiet) bestimmt.`
  }
  return `Anschrift im ${lage.bezirk}. Bezirk (${b.name}): im Bezirksdurchschnitt keine überdurchschnittliche Lage – kein Lagezuschlag angesetzt.`
}

function result(
  mietzinsArt: MietzinsArt,
  anwendung: MrgAnwendung,
  input: MietobjektInput,
  rechtsgrundlagen: string[],
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
    rechtsgrundlagen,
    begruendung,
    hinweise,
    lageHinweis: lageHinweisText(input, mietzinsArt),
  }
}

/**
 * Ermittelt Mietzinsart, MRG-Anwendungsbereich und Preisbandbreite.
 * Prüfreihenfolge: Vollausnahmen (Objektart) → Förderung → sonstige
 * Teilausnahmen → Baualters-abhängige Vollanwendung.
 */
export function evaluateMrg(input: MietobjektInput): MrgErgebnis {
  // ---- 1) Vollausnahmen vom MRG (Objektart) ----
  switch (input.objektart) {
    case 'einfamilienhaus':
    case 'zweifamilienhaus':
      return result(
        'frei',
        'ausnahme',
        input,
        ['§ 1 Abs 2 Z 5 MRG'],
        ['Gebäude mit nicht mehr als zwei selbständigen Objekten (Ein- oder Zweifamilienhaus).'],
        ['Bei Mietvertragsabschluss vor dem 1.1.2002 galt für solche Objekte noch die Teilanwendung des MRG.'],
      )
    case 'dienstwohnung':
      return result('frei', 'ausnahme', input, ['§ 1 Abs 2 Z 2 MRG'], ['Dienst-, Natural- oder Werkswohnung.'])
    case 'karitatives_wohnen':
      return result(
        'frei',
        'ausnahme',
        input,
        ['§ 1 Abs 2 Z 1a MRG'],
        ['Vermietung durch eine karitative/humanitäre Organisation im Rahmen sozialpädagogisch betreuten Wohnens.'],
        ['Gilt für Mietverträge, die nach dem 31.12.2001 geschlossen wurden.'],
      )
    case 'heim_beherbergung':
      return result(
        'frei',
        'ausnahme',
        input,
        ['§ 1 Abs 2 Z 1 MRG'],
        ['Beherbergungsbetrieb oder Heim (z.B. Studenten-, Senioren-, Lehrlingsheim).'],
      )
    case 'zweitwohnung_befristet':
      if (input.kategorie === 'A' || input.kategorie === 'B') {
        return result(
          'frei',
          'ausnahme',
          input,
          ['§ 1 Abs 2 Z 3b MRG'],
          ['Höchstens halbjährig befristete, beruflich bedingte Zweitwohnung der Kategorie A oder B ("Philharmoniker-Wohnung").'],
          ['Zweck muss schriftlich vereinbart sein. Bei Verlängerung über 6 Monate hinaus ist das MRG anzuwenden.'],
        )
      }
      break
    case 'ferienwohnung':
      return result(
        'frei',
        'ausnahme',
        input,
        ['§ 1 Abs 2 Z 4 MRG'],
        ['Ferien-/Freizeitwohnung neben einem gewöhnlichen Aufenthalt (Erstwohnsitz).'],
      )
    case 'pacht':
      return result('frei', 'ausnahme', input, ['Umkehrschluss § 1 Abs 1 MRG'], ['Pachtverhältnis, kein Mietverhältnis im Sinne des MRG.'])
    case 'nebenflaeche_separat':
      return result(
        'frei',
        'ausnahme',
        input,
        ['Umkehrschluss § 1 Abs 1 MRG'],
        ['Separat (nicht mitvermietete) Fläche/neutrales Objekt, z.B. Stellplatz, Garage, Garten, Hobbyraum.'],
      )
    case 'geschaeftsraum_kurzzeit':
      return result('frei', 'ausnahme', input, ['§ 1 Abs 2 Z 3a MRG'], ['Geschäftsräumlichkeit, höchstens ein halbes Jahr befristet vermietet.'])
    default:
      break
  }

  // ---- 2) Förderung (Datensätze aus Unterlage "Förderungen") ----
  const foe = evaluateFoerderung(input.foerderungProgramm, input.tilgungsstatus, input.eigentumswohnung)
  if (foe) {
    return result(foe.mietzinsArt, foe.anwendung, input, foe.rechtsgrundlagen, foe.begruendung, foe.hinweise)
  }

  // ---- 3) Sonstige Teilausnahmen (nur ohne Förderung) ----
  if (input.objektart === 'wirtschaftspark') {
    return result('frei', 'teil', input, ['§ 1 Abs 5 MRG'], ['Mietgegenstand in einem Wirtschaftspark.'])
  }
  if (input.objektart === 'dg_ausbau' && input.dgAusbauNachStichtag) {
    return result(
      'frei',
      'teil',
      input,
      ['§ 1 Abs 4 Z 2 MRG'],
      ['Dachgeschoß-Ausbau/-Aufstockung bzw. Rohdachboden mit Baubewilligung/Mietvertrag nach dem 31.12.2001.'],
    )
  }
  if (input.objektart === 'zubau' && input.zubauNachStichtag) {
    return result(
      'frei',
      'teil',
      input,
      ['§ 1 Abs 4 Z 2a MRG'],
      ['Mietgegenstand durch Zubau auf Grund einer nach dem 30.9.2006 erteilten Baubewilligung neu geschaffen.'],
    )
  }
  const istWohnObjekt = input.objektart === 'wohnung' || input.objektart === 'dg_ausbau' || input.objektart === 'zubau'
  const istGeschaeft = input.objektart === 'geschaeftsraum'
  if ((istWohnObjekt || istGeschaeft) && input.baubewilligungGebaeude === 'nach_1953' && !input.eigentumswohnung) {
    return result(
      'frei',
      'teil',
      input,
      ['§ 1 Abs 4 Z 1 MRG'],
      ['Gebäude frei finanziert (ohne öffentliche Fördermittel) mit Baubewilligung nach dem 30.6.1953.'],
    )
  }
  if (input.objektart === 'wohnung' && input.eigentumswohnung && input.baubewilligungGebaeude === 'nach_1953') {
    return result(
      'frei',
      'teil',
      input,
      ['§ 1 Abs 4 Z 3 MRG'],
      ['Eigentumswohnung in einem Gebäude mit Baubewilligung nach dem 30.6.1953: Teilanwendung, freier Mietzins.'],
      ['Ausnahme: aus Mitteln des Wohnhauswiederaufbaufonds oder des WFG 1968 errichtete Eigentumswohnungen fallen in die Vollanwendung (angemessener Hauptmietzins).'],
    )
  }

  // ---- 4) Vollanwendung (baualtersabhängig) ----
  if (input.objektart === 'geschaeftsraum') {
    return result(
      'angemessen',
      'voll',
      input,
      ['§ 16 Abs 1 Z 1 MRG'],
      ['Geschäftsraum in Vollanwendung des MRG: dient nicht Wohnzwecken – angemessener Hauptmietzins.'],
    )
  }

  if (input.baubewilligungGebaeude === 'vor_1945') {
    if (input.kategorie === 'D_brauchbar' || input.kategorie === 'D_unbrauchbar') {
      return result(
        'kategorie_d',
        'voll',
        input,
        ['§ 16 Abs 5 MRG'],
        ['Wohnung der Ausstattungskategorie D, Gebäude mit Baubewilligung bis 8.5.1945: gesetzlich fixierter Kategorie-D-Hauptmietzins.'],
      )
    }
    return result(
      'richtwert',
      'voll',
      input,
      ['§ 16 Abs 2–4 MRG', 'Richtwertgesetz'],
      ['Wohnung der Kategorie A, B oder C in einem Gebäude mit Baubewilligung bis 8.5.1945 (klassischer Altbau): Richtwertmietzins.'],
    )
  }

  // 1945_1953 (ohne Förderung): mietrechtlicher Neubau -> angemessener HMZ
  return result(
    'angemessen',
    'voll',
    input,
    ['§ 16 Abs 1 Z 2 1. Fall MRG'],
    ['Gebäude mit Baubewilligung zwischen 8.5.1945 und 30.6.1953, ohne öffentliche Fördermittel: "mietrechtlicher Neubau" – angemessener Hauptmietzins.'],
  )
}
