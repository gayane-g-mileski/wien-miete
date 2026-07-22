// Links zu den Gesetzestexten im Rechtsinformationssystem des Bundes (RIS).
// Die Erklärungen im Ergebnis bleiben menschlich – die juristischen Details
// stehen hinter diesen Links.

export interface Gesetzeslink {
  label: string
  url: string
}

const GESNR = {
  mrg: 10002531,
  wgg: 10011533,
  richtwertgesetz: 10003338,
  abgb: 10001622,
}

function ris(gesnr: number): string {
  return `https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=${gesnr}`
}

function risSuche(worte: string): string {
  return `https://www.ris.bka.gv.at/Ergebnis.wxe?Abfrage=Gesamtabfrage&Suchworte=${encodeURIComponent(worte)}`
}

export const GESETZ = {
  mrg: (): Gesetzeslink => ({ label: 'Mietrechtsgesetz (MRG)', url: ris(GESNR.mrg) }),
  richtwertgesetz: (): Gesetzeslink => ({ label: 'Richtwertgesetz', url: ris(GESNR.richtwertgesetz) }),
  wgg: (): Gesetzeslink => ({ label: 'Wohnungsgemeinnützigkeitsgesetz (WGG)', url: ris(GESNR.wgg) }),
  abgb: (): Gesetzeslink => ({ label: 'Allgemeines bürgerliches Gesetzbuch (ABGB)', url: ris(GESNR.abgb) }),
  rbg: (): Gesetzeslink => ({ label: 'Rückzahlungsbegünstigungsgesetz (RBG)', url: risSuche('Rückzahlungsbegünstigungsgesetz') }),
  wfg: (): Gesetzeslink => ({ label: 'Wohnbauförderungsgesetz', url: risSuche('Wohnbauförderungsgesetz') }),
  wwfsg: (): Gesetzeslink => ({ label: 'Wiener Wohnbauförderungsgesetz (WWFSG)', url: risSuche('Wiener Wohnbauförderungs- und Wohnhaussanierungsgesetz') }),
}
