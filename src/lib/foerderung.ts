import type { BaubewilligungGebaeude, FoerderungProgramm, MietzinsArt, MrgAnwendung, Tilgungsstatus } from './types'
import { GESETZ, type Gesetzeslink } from './gesetze'

// Datensätze aus der Unterlage "Förderungen": je Förderungsprogramm und
// Tilgungsstatus ergibt sich Anwendungsbereich und Mietzinsart. Die
// Begründungstexte sind bewusst in Alltagssprache gehalten – die genauen
// Paragraphen stehen hinter den Gesetzes-Links.

export interface FoerderungOutcome {
  mietzinsArt: MietzinsArt
  anwendung: MrgAnwendung
  gesetze: Gesetzeslink[]
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
  offen: 'Förderungsdarlehen läuft noch / wird noch zurückgezahlt',
  getilgt_wgg: 'Planmäßig zurückgezahlt',
  rbg1971: 'Vorzeitig zurückgezahlt (bis Ende 1982)',
  rbg1987: 'Vorzeitig zurückgezahlt (bis Ende 1988)',
}

export function statusRelevant(programm: FoerderungProgramm): boolean {
  return programm === 'wwg1948' || programm === 'wfg1968' || programm === 'wfg1984'
}

/**
 * Nur die Förderungen anbieten, die zum Baualter passen: der
 * Wohnhauswiederaufbaufonds betrifft kriegsbeschädigte Altbauten, die
 * späteren Wohnbauförderungen nur Neubauten ab ihrer Einführung.
 */
export function foerderungenFuer(baujahr: BaubewilligungGebaeude): FoerderungProgramm[] {
  if (baujahr === 'vor_1945') return ['keine', 'wwg1948']
  if (baujahr === '1945_1953') return ['keine', 'wwg1948', 'gr_beschluss', 'wgg']
  return ['keine', 'wfg1954', 'gr_beschluss', 'wfg1968', 'wfg1984', 'wwfsg1989', 'wgg']
}

const teilFrei = (text: string, hinweise: string[] = []): FoerderungOutcome => ({
  mietzinsArt: 'frei',
  anwendung: 'teil',
  gesetze: [GESETZ.mrg(), GESETZ.abgb()],
  begruendung: [text],
  hinweise,
})

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
        gesetze: [GESETZ.wgg(), GESETZ.mrg()],
        begruendung: [
          'Die Wohnung gehört einer gemeinnützigen Bauvereinigung (Genossenschaft). Dafür gelten eigene, meist günstigere Miet-Obergrenzen statt der normalen Regeln.',
        ],
        hinweise: ['Den genauen Betrag nennt dir die Bauvereinigung (er setzt sich u.a. aus Grund-, Bau- und Erhaltungskosten zusammen).'],
      }

    case 'wfg1954':
      return teilFrei(
        'Das Haus wurde 1954 gefördert. Für die Miethöhe gibt es hier keine gesetzliche Obergrenze – der Preis ist frei vereinbar. Ein Kündigungsschutz besteht aber.',
      )

    case 'gr_beschluss':
      return teilFrei(
        'Das Haus wurde über eine Wohnbauaktion der Stadt Wien gefördert. Für die Miethöhe gibt es keine gesetzliche Obergrenze – der Preis ist frei vereinbar. Ein Kündigungsschutz besteht aber.',
      )

    case 'wwfsg1989':
      return teilFrei(
        'Das Haus wurde 1989 oder später gefördert. Für die Miethöhe gibt es keine feste Obergrenze – der Preis ist frei vereinbar. Ein Kündigungsschutz besteht aber.',
        ['Solange die Förderung läuft (Schutzfrist bzw. Rückzahlungsdauer), kann eine Vermietung zu Nachteilen bei der Förderung führen.'],
      )

    case 'wwg1948':
      switch (status) {
        case 'offen':
          return {
            mietzinsArt: 'foerderungsrechtlich',
            anwendung: 'voll',
            gesetze: [GESETZ.mrg(), GESETZ.wfg()],
            begruendung: [
              'Das Haus wurde nach dem Krieg mit öffentlicher Hilfe wieder aufgebaut und diese läuft noch. Die Miethöhe richtet sich nach den Förderungsregeln.',
            ],
            hinweise: [],
          }
        case 'getilgt_wgg':
          return {
            mietzinsArt: 'richtwert',
            anwendung: 'voll',
            gesetze: [GESETZ.mrg(), GESETZ.richtwertgesetz()],
            begruendung: [
              'Das Haus wurde nach dem Krieg mit öffentlicher Hilfe aufgebaut, die inzwischen zurückgezahlt ist. Für die Miete gilt eine gesetzliche Obergrenze (Richtwert).',
            ],
            hinweise: [],
          }
        case 'rbg1971':
          return {
            mietzinsArt: 'frei',
            anwendung: 'voll',
            gesetze: [GESETZ.mrg(), GESETZ.rbg()],
            begruendung: [
              'Die öffentliche Hilfe wurde vorzeitig (bis Ende 1982) zurückgezahlt. Die Miethöhe ist dadurch frei vereinbar, ein Kündigungsschutz besteht aber.',
            ],
            hinweise: [],
          }
        case 'rbg1987':
          return {
            mietzinsArt: 'angemessen',
            anwendung: 'voll',
            gesetze: [GESETZ.mrg(), GESETZ.rbg()],
            begruendung: [
              'Die öffentliche Hilfe wurde vorzeitig (bis Ende 1988) zurückgezahlt. Die Miete darf hier so hoch sein wie bei vergleichbaren Wohnungen üblich ("angemessen").',
            ],
            hinweise: [],
          }
      }
      break

    case 'wfg1968':
      switch (status) {
        case 'offen':
          if (eigentumswohnung) {
            return {
              mietzinsArt: 'angemessen',
              anwendung: 'voll',
              gesetze: [GESETZ.mrg()],
              begruendung: [
                'Es handelt sich um eine geförderte Eigentumswohnung (Förderung von 1968). Die Miete darf so hoch sein wie bei vergleichbaren Wohnungen üblich ("angemessen").',
              ],
              hinweise: [],
            }
          }
          return {
            mietzinsArt: 'wgg',
            anwendung: 'voll',
            gesetze: [GESETZ.mrg(), GESETZ.wwfsg()],
            begruendung: [
              'Das Haus wurde 1968 gefördert und die Förderung läuft noch. Für die Miete gilt eine Obergrenze, die sich nach der Ausstattung richtet (Kategorie).',
            ],
            hinweise: [],
          }
        case 'getilgt_wgg':
          return {
            mietzinsArt: 'angemessen',
            anwendung: 'voll',
            gesetze: [GESETZ.mrg()],
            begruendung: [
              'Die Förderung von 1968 ist planmäßig zurückgezahlt. Die Miete darf so hoch sein wie bei vergleichbaren Wohnungen üblich ("angemessen").',
            ],
            hinweise: [],
          }
        case 'rbg1971':
          return {
            mietzinsArt: 'frei',
            anwendung: 'voll',
            gesetze: [GESETZ.mrg(), GESETZ.rbg()],
            begruendung: [
              'Die Förderung wurde vorzeitig (bis Ende 1982) zurückgezahlt. Die Miethöhe ist frei vereinbar, ein Kündigungsschutz besteht aber.',
            ],
            hinweise: [],
          }
        case 'rbg1987':
          return {
            mietzinsArt: 'angemessen',
            anwendung: 'voll',
            gesetze: [GESETZ.mrg(), GESETZ.rbg()],
            begruendung: [
              'Die Förderung wurde vorzeitig (bis Ende 1988) zurückgezahlt. Die Miete darf so hoch sein wie bei vergleichbaren Wohnungen üblich ("angemessen").',
            ],
            hinweise: [],
          }
      }
      break

    case 'wfg1984':
      if (status === 'offen' && !eigentumswohnung) {
        return {
          mietzinsArt: 'wgg',
          anwendung: 'voll',
          gesetze: [GESETZ.mrg(), GESETZ.wwfsg()],
          begruendung: [
            'Das Haus wurde 1984 gefördert und die Förderung läuft noch. Für die Miete gilt eine Obergrenze, die sich nach der Ausstattung richtet (Kategorie).',
          ],
          hinweise: [],
        }
      }
      return teilFrei(
        'Das Haus wurde 1984 gefördert. Für die Miethöhe gibt es keine feste Obergrenze – der Preis ist frei vereinbar. Ein Kündigungsschutz besteht aber.',
      )
  }

  return null
}
