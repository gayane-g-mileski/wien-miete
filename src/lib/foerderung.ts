import type { FoerderungProgramm, MietzinsArt, MrgAnwendung, Tilgungsstatus } from './types'

// Datensätze aus der Unterlage "Förderungen": je Förderungsprogramm und
// Tilgungsstatus des Förderungsdarlehens ergibt sich Anwendungsbereich und
// Mietzinsart. Programme, die keine Mietzinsbildungsregeln enthalten, führen
// unabhängig vom Tilgungsstatus in den Teilanwendungsbereich (freier Mietzins).

export interface FoerderungOutcome {
  mietzinsArt: MietzinsArt
  anwendung: MrgAnwendung
  rechtsgrundlagen: string[]
  begruendung: string[]
  hinweise: string[]
}

export const FOERDERUNG_PROGRAMM_LABEL: Record<FoerderungProgramm, string> = {
  keine: 'Keine öffentliche Förderung (frei finanziert)',
  wwg1948: 'Wohnhauswiederaufbaufonds (WWG 1948)',
  wfg1954: 'Wohnbauförderung 1954 (WFG 1954)',
  gr_beschluss: 'Wohnbauaktionen der Stadt Wien (bis 1969 sowie 2011/2015)',
  wfg1968: 'Wohnbauförderung 1968 (WFG 1968)',
  wfg1984: 'Wohnbauförderung 1984 (WFG 1984)',
  wwfsg1989: 'Wohnbauförderung 1989 (WWFSG 1989)',
  wgg: 'Gemeinnützige Bauvereinigung (WGG-Miete)',
}

export const TILGUNGSSTATUS_LABEL: Record<Tilgungsstatus, string> = {
  offen: 'Förderungsdarlehen offen / in Tilgung',
  getilgt_wgg: 'Tilgung laut Plan erfolgt bzw. begünstigt nach dem WGG',
  rbg1971: 'Begünstigt getilgt nach RBG 1971 (Ansuchen bis 30.1.1982, Tilgung bis 31.12.1982)',
  rbg1987: 'Begünstigt getilgt nach RBG 1987',
}

/** Programme ohne Tilgungsstatus-Abhängigkeit (Auswahl wird ausgeblendet). */
export function statusRelevant(programm: FoerderungProgramm): boolean {
  return programm === 'wwg1948' || programm === 'wfg1968'
}

const TEIL_FREI = (grundlage: string, text: string, hinweise: string[] = []): FoerderungOutcome => ({
  mietzinsArt: 'frei',
  anwendung: 'teil',
  rechtsgrundlagen: [grundlage],
  begruendung: [text],
  hinweise,
})

/**
 * Ermittelt das Förderungs-Ergebnis. Gibt null zurück, wenn keine Förderung
 * vorliegt (dann greift die reguläre Baualters-Logik der MRG-Engine).
 */
export function evaluateFoerderung(
  programm: FoerderungProgramm,
  status: Tilgungsstatus,
  eigentumswohnung: boolean,
): FoerderungOutcome | null {
  switch (programm) {
    case 'keine':
      return null

    case 'wgg':
      return {
        mietzinsArt: 'wgg',
        anwendung: 'voll',
        rechtsgrundlagen: ['§ 13–14 WGG', '§ 1 MRG (subsidiär anwendbare Bestimmungen)'],
        begruendung: [
          'Vermietung durch eine gemeinnützige Bauvereinigung: kein § 16 MRG, stattdessen WGG-Mietzinsobergrenzen (Entgeltrichtlinien); andere MRG-Bestimmungen (z.B. zwingender Betriebskostenbegriff) bleiben anwendbar.',
        ],
        hinweise: [
          'Der konkrete Betrag ist bei der Bauvereinigung zu erfragen (Grundkosten-, Kapital- und Erhaltungs-/Verbesserungsbeitrag).',
        ],
      }

    case 'wfg1954':
      return TEIL_FREI(
        '§ 1 Abs 4 Z 3 MRG (WFG 1954)',
        'Wohnbauförderung 1954: keine Mietzinsbildungsregeln und kein Verweis auf das MRG – Teilanwendungsbereich, freier Mietzins nach ABGB-Regeln.',
      )

    case 'gr_beschluss':
      return TEIL_FREI(
        '§ 1 Abs 4 Z 3 MRG (Wohnbauaktionen der Stadt Wien)',
        'Diverse Wohnbauaktionen der Stadt Wien (bis 1969 sowie 2011/2015): keine Mietzinsbildungsregeln – Teilanwendungsbereich, freier Mietzins nach ABGB-Regeln.',
      )

    case 'wwfsg1989':
      return TEIL_FREI(
        '§ 1 Abs 4 Z 3 MRG (WWFSG 1989)',
        'Wohnbauförderung 1989: keine Mietzinsbildungsregeln für Eigentumswohnungen und kein Verweis auf das MRG – Teilanwendungsbereich, freier Mietzins nach ABGB-Regeln.',
        [
          'Achtung: förderungsrechtliche Sanktionen bei Vermietung während der Schutzfrist (20 bzw. 40 Jahre) oder während der Tilgungsdauer – Kündigung des Förderungsdarlehens bzw. Rückzahlung des Baukostenzuschusses.',
        ],
      )

    case 'wwg1948':
      switch (status) {
        case 'offen':
          return {
            mietzinsArt: 'foerderungsrechtlich',
            anwendung: 'voll',
            rechtsgrundlagen: ['§ 15 WWG idjF iVm § 58 Abs 4 MRG'],
            begruendung: [
              'Wohnhauswiederaufbaufonds, Förderungsdarlehen offen: Mietzinsbildung gemäß § 15 WWG in der jeweiligen Fassung.',
            ],
            hinweise: ['Bei Wiedervermietung gilt § 33 Abs 4 StEmG.'],
          }
        case 'getilgt_wgg':
          return {
            mietzinsArt: 'richtwert',
            anwendung: 'voll',
            rechtsgrundlagen: ['§ 16 Abs 2 MRG', 'ggf. § 16 Abs 1 Z 2–5 MRG'],
            begruendung: [
              'Wohnhauswiederaufbaufonds, Tilgung laut Plan/WGG erfolgt: Richtwertmietzins gemäß § 16 Abs 2 MRG bzw. angemessener Hauptmietzins gemäß § 16 Abs 1 Z 2–5 MRG, wenn die Voraussetzungen vorliegen.',
            ],
            hinweise: [],
          }
        case 'rbg1971':
          return {
            mietzinsArt: 'frei',
            anwendung: 'voll',
            rechtsgrundlagen: ['§ 12 Abs 3 RBG 1971'],
            begruendung: [
              'Wohnhauswiederaufbaufonds, begünstigte Tilgung nach RBG 1971: Vollanwendungsbereich MRG, jedoch freier, nach ABGB-Kriterien zu vereinbarender Mietzins.',
            ],
            hinweise: [],
          }
        case 'rbg1987':
          return {
            mietzinsArt: 'angemessen',
            anwendung: 'voll',
            rechtsgrundlagen: ['§ 9 Abs 4 RBG 1987'],
            begruendung: [
              'Wohnhauswiederaufbaufonds, begünstigte Tilgung nach RBG 1987: angemessener Mietzins.',
            ],
            hinweise: [],
          }
      }
      break

    case 'wfg1968':
      switch (status) {
        case 'offen':
          if (eigentumswohnung) {
            // "bei Eigentumswohnungen wie nach Tilgung"
            return {
              mietzinsArt: 'angemessen',
              anwendung: 'voll',
              rechtsgrundlagen: ['§ 16 Abs 1 Z 2 MRG'],
              begruendung: [
                'Wohnbauförderung 1968, Eigentumswohnung: Behandlung wie nach Tilgung – angemessener Mietzins.',
              ],
              hinweise: [],
            }
          }
          return {
            mietzinsArt: 'wgg',
            anwendung: 'voll',
            rechtsgrundlagen: ['§ 32 Abs 1 WFG 1968', '§ 68 Abs 2 WWFSG 1989 (Kategoriemietzins)'],
            begruendung: [
              'Wohnbauförderung 1968, Mietwohnung, Darlehen offen: Vollanwendungsbereich MRG, Kategoriemietzins gemäß § 68 Abs 2 WWFSG 1989 (siehe auch OGH 28.9.2004, 5 Ob 192/04b).',
            ],
            hinweise: [],
          }
        case 'getilgt_wgg':
          return {
            mietzinsArt: 'angemessen',
            anwendung: 'voll',
            rechtsgrundlagen: ['§ 16 Abs 1 Z 2 MRG'],
            begruendung: ['Wohnbauförderung 1968, Tilgung laut Plan/WGG erfolgt: angemessener Mietzins.'],
            hinweise: [],
          }
        case 'rbg1971':
          return {
            mietzinsArt: 'frei',
            anwendung: 'voll',
            rechtsgrundlagen: ['§ 12 Abs 3 RBG 1971 idF BGBl 520/1982'],
            begruendung: [
              'Wohnbauförderung 1968, begünstigte Tilgung nach RBG 1971: freier, nach ABGB-Kriterien zu vereinbarender Mietzins.',
            ],
            hinweise: [],
          }
        case 'rbg1987':
          return {
            mietzinsArt: 'angemessen',
            anwendung: 'voll',
            rechtsgrundlagen: ['§ 9 Abs 4 RBG 1987'],
            begruendung: ['Wohnbauförderung 1968, begünstigte Tilgung nach RBG 1987: angemessener Mietzins.'],
            hinweise: [],
          }
      }
      break

    case 'wfg1984':
      // "offen": Mietwohnung -> Kategoriemietzins; Eigentumswohnung wie nach Tilgung.
      // Übrige Status: kein Verweis auf MRG -> Teilanwendung, freier Mietzins.
      if (status === 'offen' && !eigentumswohnung) {
        return {
          mietzinsArt: 'wgg',
          anwendung: 'voll',
          rechtsgrundlagen: ['§ 68 Abs 2 WWFSG 1989 (Kategoriemietzins)'],
          begruendung: [
            'Wohnbauförderung 1984, Mietwohnung, Darlehen offen: Kategoriemietzins gemäß § 68 Abs 2 WWFSG 1989.',
          ],
          hinweise: [],
        }
      }
      return TEIL_FREI(
        '§ 1 Abs 4 Z 3 MRG (WFG 1984)',
        'Wohnbauförderung 1984: kein Verweis auf das MRG – Teilanwendungsbereich, freier Mietzins nach ABGB-Regeln.',
      )
  }

  return null
}
