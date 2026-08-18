// Renditerechner für Vorsorgewohnungen.
//
// Gerechnet wird vor und nach Steuer. Steuerlich berücksichtigt sind die
// Absetzung für Abnutzung (1,5 % der Anschaffungskosten des Gebäudes,
// § 16 Abs 1 Z 8 EStG) und die Verteilung von Instandsetzungsaufwand auf
// fünfzehn Jahre (§ 28 Abs 2 EStG). Ergebnis ist eine Orientierung, keine
// Steuerberatung.

/** Grunderwerbsteuer und Eintragungsgebühr in Österreich. */
export const GREST = 0.035
export const EINTRAGUNG = 0.011
/** Anteil des Gebäudes am Kaufpreis (Rest = Grundanteil, nicht abschreibbar). */
export const GEBAEUDEANTEIL = 0.6
/** Abschreibungssatz für vermietete Wohngebäude. */
export const AFA_SATZ = 0.015
/** Verteilungszeitraum für Instandsetzungen nach § 28 Abs 2 EStG. */
export const INSTANDSETZUNG_JAHRE = 15

export interface RenditeEingabe {
  kaufpreis: number
  /** Makler, Vertragserrichtung, Bewertung – ohne GrESt und Eintragung. */
  nebenkosten: number
  flaeche: number
  /** Netto-Hauptmietzins pro Monat. */
  mieteMonat: number
  /** Erwarteter Leerstand in Prozent der Jahresmiete. */
  leerstand: number
  /** Nicht überwälzbare Bewirtschaftungskosten pro Jahr. */
  bewirtschaftung: number
  /** Zuführung zur Instandhaltungsrücklage pro Jahr (IHR). */
  ruecklage: number
  /** Einmaliger Instandsetzungsaufwand, verteilt auf 15 Jahre. */
  instandsetzung: number
  /** Persönlicher Grenzsteuersatz in Prozent. */
  steuersatz: number
  /** Fremdkapital und Zinssatz für den Cashflow. */
  kredit: number
  zinssatz: number
}

export interface RenditeErgebnis {
  gesamtkosten: number
  kaufpreisProM2: number
  jahresmieteBrutto: number
  jahresmieteNachLeerstand: number
  bruttorendite: number
  nettorendite: number
  afaJahr: number
  instandsetzungJahr: number
  steuerBemessung: number
  steuer: number
  ueberschussNachSteuer: number
  renditeNachSteuer: number
  zinsenJahr: number
  cashflowJahr: number
  schritte: { was: string; ergebnis: string; quelle: string }[]
}

function euro(n: number): string {
  return `${n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function prozent(n: number): string {
  return `${(n * 100).toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

export function berechneRendite(e: RenditeEingabe): RenditeErgebnis {
  const rund = (n: number) => Math.round(n * 100) / 100

  const kaufnebenkosten = e.kaufpreis * (GREST + EINTRAGUNG) + e.nebenkosten
  const gesamtkosten = rund(e.kaufpreis + kaufnebenkosten)
  const jahresmieteBrutto = rund(e.mieteMonat * 12)
  const jahresmieteNachLeerstand = rund(jahresmieteBrutto * (1 - e.leerstand))

  const laufend = e.bewirtschaftung + e.ruecklage
  const ueberschuss = rund(jahresmieteNachLeerstand - laufend)

  const bruttorendite = gesamtkosten > 0 ? jahresmieteBrutto / gesamtkosten : 0
  const nettorendite = gesamtkosten > 0 ? ueberschuss / gesamtkosten : 0

  // Steuer: AfA auf den Gebäudeanteil, Instandsetzung auf 15 Jahre verteilt.
  const afaJahr = rund(e.kaufpreis * GEBAEUDEANTEIL * AFA_SATZ)
  const instandsetzungJahr = rund(e.instandsetzung / INSTANDSETZUNG_JAHRE)
  const zinsenJahr = rund(e.kredit * e.zinssatz)
  // Die Rücklage ist erst bei Verausgabung absetzbar und bleibt hier außen vor.
  const bemessung = rund(jahresmieteNachLeerstand - e.bewirtschaftung - afaJahr - instandsetzungJahr - zinsenJahr)
  const steuer = rund(Math.max(0, bemessung) * e.steuersatz)
  const ueberschussNachSteuer = rund(ueberschuss - steuer)
  const renditeNachSteuer = gesamtkosten > 0 ? ueberschussNachSteuer / gesamtkosten : 0
  const cashflowJahr = rund(ueberschussNachSteuer - zinsenJahr)

  const schritte: RenditeErgebnis['schritte'] = [
    {
      was: 'Gesamtkosten des Erwerbs',
      ergebnis: `${euro(gesamtkosten)} (Kaufpreis ${euro(e.kaufpreis)} + ${euro(rund(kaufnebenkosten))} Nebenkosten)`,
      quelle: `Grunderwerbsteuer ${prozent(GREST)}, Eintragungsgebühr ${prozent(EINTRAGUNG)}`,
    },
    {
      was: 'Jahresmiete nach Leerstand',
      ergebnis: `${euro(jahresmieteNachLeerstand)} (${prozent(e.leerstand)} Leerstand angenommen)`,
      quelle: 'Netto-Hauptmietzins ohne Betriebskosten',
    },
    {
      was: 'Laufende Kosten',
      ergebnis: `${euro(rund(laufend))} pro Jahr (davon ${euro(e.ruecklage)} Instandhaltungsrücklage)`,
      quelle: 'nicht überwälzbare Bewirtschaftung und IHR',
    },
    {
      was: 'Absetzung für Abnutzung',
      ergebnis: `${euro(afaJahr)} pro Jahr (${prozent(AFA_SATZ)} von ${prozent(GEBAEUDEANTEIL)} des Kaufpreises)`,
      quelle: '§ 16 Abs 1 Z 8 EStG',
    },
    {
      was: 'Instandsetzung',
      ergebnis: instandsetzungJahr > 0 ? `${euro(instandsetzungJahr)} pro Jahr über ${INSTANDSETZUNG_JAHRE} Jahre` : 'keine angesetzt',
      quelle: '§ 28 Abs 2 EStG',
    },
    {
      was: 'Steuer',
      ergebnis: `${euro(steuer)} bei ${prozent(e.steuersatz)} auf ${euro(bemessung)} Bemessungsgrundlage`,
      quelle: 'persönlicher Grenzsteuersatz',
    },
  ]

  return {
    gesamtkosten,
    kaufpreisProM2: e.flaeche > 0 ? rund(e.kaufpreis / e.flaeche) : 0,
    jahresmieteBrutto,
    jahresmieteNachLeerstand,
    bruttorendite,
    nettorendite,
    afaJahr,
    instandsetzungJahr,
    steuerBemessung: bemessung,
    steuer,
    ueberschussNachSteuer,
    renditeNachSteuer,
    zinsenJahr,
    cashflowJahr,
    schritte,
  }
}
