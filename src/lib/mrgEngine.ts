import type { Kategorie, MietobjektInput, MietzinsArt, MrgAnwendung, MrgErgebnis, Preisspanne } from './types'
import {
  ANGEMESSEN_ABSCHLAG_VON_FREI,
  BEFRISTUNGSABSCHLAG,
  KATEGORIE_FAKTOR,
  KAT_D_HMZ,
  RICHTWERT_WIEN,
  getBezirk,
  schaetzeLagezuschlag,
} from './pricingData'

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
  return 0.55 // grobe Näherung, falls Kat. D in untypischen Zweigen (WGG/Förderung) auftritt
}

function marktband(input: MietobjektInput): { min: number; max: number } {
  if (input.marktmieteM2Override != null && input.marktmieteM2Override > 0) {
    return { min: input.marktmieteM2Override, max: input.marktmieteM2Override }
  }
  const b = getBezirk(input.bezirk)
  return { min: b.marktmieteMin, max: b.marktmieteMax }
}

function zustandsFaktor(z: MietobjektInput['zustand']): number {
  switch (z) {
    case 'gut':
      return 0.03
    case 'sanierungsbeduerftig':
      return -0.15
    default:
      return 0
  }
}

function computePreis(input: MietobjektInput, art: MietzinsArt): Preisspanne | null {
  const { flaeche } = input
  const markt = marktband(input)

  let proM2Min: number
  let proM2Max: number

  switch (art) {
    case 'richtwert': {
      const basis = RICHTWERT_WIEN * kategorieFaktorABC(input.kategorie)
      const lage = schaetzeLagezuschlag(input.lagequalitaet)
      const ausstattung = (input.balkonTerrasse ? 0.4 : 0) + (input.lift ? 0.3 : 0)
      let proM2 = basis + lage + ausstattung + basis * zustandsFaktor(input.zustand)
      if (input.befristet) proM2 *= 1 - BEFRISTUNGSABSCHLAG
      proM2Min = proM2 * 0.92
      proM2Max = proM2 * 1.08
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
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
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
  }
}

/**
 * Ermittelt Mietzinsart, MRG-Anwendungsbereich und Preisbandbreite für ein
 * Mietobjekt. Die Reihenfolge der Prüfung folgt bewusst dem Aufbau der
 * Referenzunterlagen: zuerst Vollausnahmen, dann Teilausnahmen, zuletzt die
 * Vollanwendung mit ihren Mietzins-Untertypen.
 */
export function evaluateMrg(input: MietobjektInput): MrgErgebnis {
  // ---- 1) Vollausnahmen vom MRG (§ 1 Abs 2 MRG bzw. Umkehrschluss § 1 Abs 1 MRG) ----
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
      return result(
        'frei',
        'ausnahme',
        input,
        ['§ 1 Abs 2 Z 2 MRG'],
        ['Dienst-, Natural- oder Werkswohnung.'],
      )
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
          ['Höchstens halbjährig befristete, beruflich bedingte Zweitwohnung der Ausstattungskategorie A oder B ("Philharmoniker-Wohnung").'],
          ['Der Zweck (vorübergehende, erwerbsbedingte Zweitwohnung) muss schriftlich vereinbart sein. Bei Verlängerung über 6 Monate hinaus ist das MRG anzuwenden.'],
        )
      }
      break
    case 'ferienwohnung':
      return result(
        'frei',
        'ausnahme',
        input,
        ['§ 1 Abs 2 Z 4 MRG'],
        ['Ferien-/Freizeitwohnung, die nur zur Erholung neben einem gewöhnlichen Aufenthalt (Erstwohnsitz) gemietet wird.'],
      )
    case 'pacht':
      return result(
        'frei',
        'ausnahme',
        input,
        ['Umkehrschluss § 1 Abs 1 MRG'],
        ['Pachtverhältnis, kein Mietverhältnis im Sinne des MRG.'],
      )
    case 'nebenflaeche_separat':
      return result(
        'frei',
        'ausnahme',
        input,
        ['Umkehrschluss § 1 Abs 1 MRG'],
        ['Separat (nicht mitvermietete) Fläche oder neutrales Objekt ohne Wohn-/Geschäftszweck, z.B. Stellplatz, Garage, Garten, Hobbyraum.'],
      )
    case 'geschaeftsraum_kurzzeit':
      return result(
        'frei',
        'ausnahme',
        input,
        ['§ 1 Abs 2 Z 3a MRG'],
        ['Geschäftsräumlichkeit, höchstens ein halbes Jahr befristet vermietet.'],
      )
    default:
      break
  }

  // ---- 2) Teilausnahmen (Teilanwendung) ----
  if (input.foerderung !== 'wgg') {
    if (input.objektart === 'wirtschaftspark') {
      return result(
        'frei',
        'teil',
        input,
        ['§ 1 Abs 5 MRG'],
        ['Mietgegenstand in einem Wirtschaftspark.'],
      )
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
    if ((istWohnObjekt || istGeschaeft) && input.baubewilligungGebaeude === 'nach_1953' && input.foerderung === 'keine') {
      return result(
        'frei',
        'teil',
        input,
        ['§ 1 Abs 4 Z 1 MRG'],
        ['Gebäude frei finanziert (ohne öffentliche Fördermittel) mit Baubewilligung nach dem 30.6.1953.'],
        ['Bei Eigentumswohnungen, die aus Mitteln des Wohnhauswiederaufbaufonds oder des WFG 1968 errichtet wurden, gilt stattdessen Vollanwendung mit angemessenem Hauptmietzins.'],
      )
    }
  }

  // ---- 3) WGG-Miete (gemeinnützige Bauvereinigung) ----
  if (input.foerderung === 'wgg' && (input.objektart === 'wohnung' || input.objektart === 'geschaeftsraum' || input.objektart === 'dg_ausbau' || input.objektart === 'zubau')) {
    return result(
      'wgg',
      'voll',
      input,
      ['§ 13-14 WGG', '§ 1 MRG (subsidiär anwendbare Bestimmungen)'],
      ['Vermietung durch eine gemeinnützige Bauvereinigung: kein § 16 MRG, stattdessen WGG-Mietzinsobergrenzen (Entgeltrichtlinien); andere MRG-Bestimmungen (z.B. zwingender Betriebskostenbegriff) bleiben anwendbar.'],
      ['Der konkrete Betrag ist individuell bei der Bauvereinigung zu erfragen (Grundkosten-, Kapital- und Erhaltungs-/Verbesserungsbeitrag).'],
    )
  }

  // ---- 4) Vollanwendung des MRG ----
  if (input.foerderung === 'gefoerdert_offen') {
    return result(
      'foerderungsrechtlich',
      'voll',
      input,
      ['§ 1 Abs 1 MRG i.V.m. dem jeweiligen Förderungsgesetz (z.B. WGG, WFG 1968, WWFSG 1989)'],
      ['Gebäude mit öffentlichen Fördermitteln errichtet, Förderungsdarlehen noch nicht getilgt: Der Hauptmietzins richtet sich primär nach dem Förderungsvertrag (förderungsrechtlicher Hauptmietzins).'],
      ['Der exakte förderungsrechtliche Mietzins hängt vom jeweiligen Förderungsprogramm und Tilgungsstand ab und ist im Förderungsvertrag bzw. bei der Bautenabteilung zu erfragen.'],
    )
  }
  if (input.foerderung === 'gefoerdert_getilgt') {
    return result(
      'angemessen',
      'voll',
      input,
      ['§ 9 Abs 4 RBG 1987 bzw. § 12 Abs 3 RBG 1971 i.V.m. § 53 MRG'],
      ['Gebäude mit öffentlichen Fördermitteln errichtet, Förderungsdarlehen bereits (begünstigt) getilgt bzw. zurückgezahlt: angemessener Hauptmietzins.'],
    )
  }

  if (input.objektart === 'geschaeftsraum') {
    return result(
      'angemessen',
      'voll',
      input,
      ['§ 16 Abs 1 Z 1 MRG'],
      ['Geschäftsraum in Vollanwendung des MRG: der Mietgegenstand dient nicht Wohnzwecken, daher grundsätzlich angemessener Hauptmietzins statt Richtwertmietzins.'],
    )
  }

  // Wohnung (bzw. Dachgeschoß-/Zubau-Fallback ohne Stichtags-Teilausnahme)
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
      ['§ 16 Abs 2-4 MRG', 'Richtwertgesetz'],
      ['Wohnung der Ausstattungskategorie A, B oder C in einem Gebäude mit Baubewilligung bis 8.5.1945 (klassischer Altbau): Richtwertmietzins.'],
    )
  }

  // 1945_1953 (ohne Förderung): mietrechtlicher Neubau -> angemessener HMZ
  return result(
    'angemessen',
    'voll',
    input,
    ['§ 16 Abs 1 Z 2 1. Fall MRG'],
    ['Gebäude mit Baubewilligung zwischen 8.5.1945 und 30.6.1953, ohne öffentliche Fördermittel: "mietrechtlicher Neubau", daher angemessener statt Richtwertmietzins.'],
    ['Bei Eigentumswohnungen lässt die Grundtabelle für diesen Zeitraum auch Richtwert-/Kategorie-D-Hauptmietzins zu; im Einzelfall genau prüfen.'],
  )
}
