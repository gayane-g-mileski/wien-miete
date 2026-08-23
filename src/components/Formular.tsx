import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { MerkmalKey, MietobjektInput, MietzinsArt } from '../lib/types'
import {
  BAUBEWILLIGUNG_LABEL,
  KATEGORIE_LABEL,
  OBJEKTART_GRUPPEN,
  STOCKWERK_LABEL,
  ZUSTAND_HAUS_LABEL,
  zeigeAusstattung,
  zeigeBaujahr,
  zeigeFoerderung,
  zeigeKategorie,
} from '../lib/labels'
import { FOERDERUNG_PROGRAMM_LABEL, TILGUNGSSTATUS_LABEL, foerderungenFuer, statusRelevant } from '../lib/foerderung'
import { BEZIRKE, MERKMAL_GRUPPEN, MERKMAL_KATALOG, bezirkAusAnschrift } from '../lib/pricingData'
import { bauperiodenLink } from '../lib/geo'
import type { BaujahrInfo } from '../lib/geo'
import { Checkbox, Collapsible, DateField, NumberField, Section, SelectField } from './ui'
import { AnschriftFeld } from './AnschriftFeld'
import { Ma25Anfrage } from './Ma25Anfrage'
import { WwafHinweis } from './WwafHinweis'
import { RueckzahlungAnfrage } from './RueckzahlungAnfrage'

interface Props {
  value: MietobjektInput
  // Nimmt auch Updater-Funktionen an – nötig, damit die zwei parallelen
  // Adress-Abfragen (Gemeindebau, Baujahr) sich nicht gegenseitig überschreiben.
  onChange: Dispatch<SetStateAction<MietobjektInput>>
  mietzinsArt: MietzinsArt
  /** Erhöht sich, wenn die Anschrift außerhalb des Formulars gewechselt wurde. */
  adressWechsel?: number
}

export function Formular({ value, onChange, mietzinsArt, adressWechsel = 0 }: Props) {
  const [ma25Offen, setMa25Offen] = useState(false)
  const [rueckzahlungUnbekannt, setRueckzahlungUnbekannt] = useState(false)
  const [anschriftFehler, setAnschriftFehler] = useState(false)
  // Keine Vorauswahl: Das Baujahr gilt erst als gesetzt, wenn es gewählt
  // (oder ausnahmsweise automatisch erkannt) wurde.
  const [baujahrOffen, setBaujahrOffen] = useState(true)
  // Baujahr laut Wiener Gebäudedaten – reine Information zur Adresse.
  const [baujahrQuelle, setBaujahrQuelle] = useState<BaujahrInfo | null>(null)

  // Neue Adresse aus dem Hero: Baujahr-Auswahl und gefundene Angabe verwerfen.
  useEffect(() => {
    if (adressWechsel === 0) return
    setBaujahrOffen(true)
    setBaujahrQuelle(null)
  }, [adressWechsel])

  const heute = new Date().toISOString().slice(0, 10)
  const istRichtwert = mietzinsArt === 'richtwert'
  // Die Ausstattungskategorie zählt auch beim Kategoriemietzins – dort bestimmt
  // sie sogar direkt den Betrag.
  const zeigeKat = istRichtwert || mietzinsArt === 'kategorie' || mietzinsArt === 'kategorie_d'
  const befristungWirkt = zeigeKat
  // Große Altbauwohnung der Kategorie A/B: Der Richtwert entfällt. Die Kategorie
  // bleibt trotzdem wählbar, weil sie über diese Ausnahme mitentscheidet.
  // Die Eigentumswohnung wirkt sich nur bei laufendem Förderungsdarlehen
  // der WFG 1968 bzw. 1984 auf das Ergebnis aus.
  const eigentumswohnungRelevant =
    (value.foerderungProgramm === 'wfg1968' || value.foerderungProgramm === 'wfg1984') &&
    value.tilgungsstatus === 'offen'
  // Wirken sich Kategorie, Zustand und Merkmale auf das Ergebnis aus?
  // (Definition unten, sobald ueber130 feststeht.)
  const ueber130 =
    value.baubewilligungGebaeude === 'vor_1945' &&
    value.flaeche > 130 &&
    (value.kategorie === 'A' || value.kategorie === 'B') &&
    mietzinsArt === 'angemessen'
  const ausstattungWirkt = zeigeAusstattung(value.objektart) && !baujahrOffen && (zeigeKat || ueber130)

  // Bezirk aus der Anschrift (gewählte Adresse oder erkannte PLZ)
  const bezirkErkannt = value.anschriftBezirk ?? bezirkAusAnschrift(value.anschrift)

  const set = <K extends keyof MietobjektInput>(key: K, v: MietobjektInput[K]) => onChange({ ...value, [key]: v })
  const setMerkmal = (key: MerkmalKey, v: boolean) => onChange({ ...value, merkmale: { ...value.merkmale, [key]: v } })

  return (
    // Mehrspaltig: jeder Abschnitt eine Zelle, jede behält ihre eigene Höhe.
    <div className="grid grid-cols-1 items-start gap-9 md:grid-cols-2">
      {/* Linke Spalte: der Mietgegenstand und, was daran zu- oder abschlägt */}
      <div className="space-y-9">
      {/* --- Mietobjekt / Angaben --- */}
      <section>
        <h3 className="mb-5 px-1 text-sm font-semibold text-ink-faint">Mietgegenstand</h3>
        <div className="space-y-8 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <SelectField
          label="Art des Mietgegenstands"
          id="objektart"
          value={value.objektart}
          onChange={(e) => set('objektart', e.target.value as MietobjektInput['objektart'])}
        >
          {OBJEKTART_GRUPPEN.map((gruppe) => (
            <optgroup key={gruppe.label} label={gruppe.label}>
              {gruppe.optionen.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>

        {/* Bezirk links, Anschrift rechts + gemeinsamer Hinweis */}
        <div>
          <div className="grid grid-cols-1 gap-5">
            <SelectField
              label="Bezirk"
              id="bezirk"
              value={bezirkErkannt ?? value.bezirk}
              disabled={bezirkErkannt != null}
              onChange={(e) => set('bezirk', Number(e.target.value))}
            >
              {BEZIRKE.map((b) => (
                <option key={b.nr} value={b.nr}>
                  {b.nr}. {b.name}
                </option>
              ))}
            </SelectField>
            <AnschriftFeld
              value={value.anschrift}
              onBaujahrGefunden={setBaujahrQuelle}
              onChange={(text, bezirk, koords) => {
                setBaujahrOffen(true)
                setBaujahrQuelle(null)
                onChange((prev) => ({
                  ...prev,
                  anschrift: text,
                  anschriftBezirk: bezirk,
                  anschriftKoords: koords,
                  gemeindebau: false,
                }))
              }}
              onGemeindebau={(detected) => onChange((prev) => ({ ...prev, gemeindebau: detected }))}
              onBaujahr={(periode) => {
                if (periode == null) {
                  setBaujahrOffen(true)
                  return
                }
                setBaujahrOffen(false)
                onChange((prev) => {
                  const erlaubt = foerderungenFuer(periode)
                  const prog = erlaubt.includes(prev.foerderungProgramm) ? prev.foerderungProgramm : 'keine'
                  return { ...prev, baubewilligungGebaeude: periode, foerderungProgramm: prog }
                })
              }}
              onFehlerChange={setAnschriftFehler}
            />
          </div>
          <p className="mt-1 px-1 text-[12px] text-ink-faint">
            {anschriftFehler
              ? 'Adresssuche gerade nicht erreichbar – die Adresse lässt sich trotzdem eintippen (mit Wiener PLZ wird die Lage erkannt).'
              : 'Nach dem 3. Zeichen erscheinen Vorschläge für die Anschrift. Ohne Anschrift wird die Lage nicht berücksichtigt.'}
          </p>
        </div>

        <NumberField
          label="Nutzfläche (m²)"
          id="flaeche"
          min={1}
          step={1}
          value={value.flaeche}
          onChange={(e) => set('flaeche', Math.max(0, Number(e.target.value)))}
        />

        <DateField
          label="Abschluss des Mietvertrags"
          id="vertragsdatum"
          value={value.vertragsdatum}
          max={heute}
          hint="Entscheidet über die Obergrenze: ab 1.3.1994 Richtwert, vom 1.1.1982 bis 28.2.1994 Kategoriemietzins, davor der Mietzins des Altvertrags."
          onChange={(e) => set('vertragsdatum', e.target.value)}
        />

        <div className="space-y-4">
          {befristungWirkt && (
            <Checkbox checked={value.befristet} onChange={(v) => set('befristet', v)} label="Befristeter Mietvertrag" />
          )}
          </div>

        {/* --- Ausstattung, Zustand & Zu-/Abschläge – immer sichtbar, aber
               zugeklappt. Die Felder erscheinen darin nur, wenn sie etwas
               bewirken: Das Baujahr muss feststehen, und die Mietzinsart muss
               Kategorie, Zustand oder Merkmale überhaupt heranziehen. Sonst
               steht dort, warum gerade nichts zu tun ist. --- */}
        <div className="border-t border-line pt-6">
          <Collapsible title="Ausstattung, Zustand & Zu-/Abschläge">
            {!ausstattungWirkt ? (
              <p className="pt-2 text-sm leading-relaxed text-ink-soft">
                {baujahrOffen
                  ? 'Sobald die Baubewilligung des Gebäudes feststeht, wirken sich Ausstattungskategorie, Erhaltungszustand und die einzelnen Merkmale hier aus.'
                  : 'Bei dieser Einstufung wirken sich Ausstattung, Zustand und Zu- oder Abschläge nicht auf die Obergrenze aus – die Bandbreite folgt dem Markt.'}
              </p>
            ) : (
              <div className="space-y-8 pt-2">
            {ueber130 && (
              <p className="rounded-md bg-surface-2 px-3 py-2 text-sm text-ink-soft">
                Für diese Wohnung gilt <strong className="text-ink">kein Richtwert</strong>: Sie liegt in einem Altbau, ist
                gut ausgestattet (Kategorie A oder B) und mit über 130 m² größer als die gesetzliche Grenze. In diesem Fall
                erlaubt das Gesetz den angemessenen Mietzins – also die ortsübliche Miete vergleichbarer Wohnungen. Zu- und
                Abschläge sind deshalb hier nicht anzugeben; sie stecken bereits im Marktpreis.
              </p>
            )}
            {zeigeKategorie(value.objektart) && (
              <SelectField
                label="Ausstattungskategorie"
                id="kategorie"
                value={value.kategorie}
                onChange={(e) => set('kategorie', e.target.value as MietobjektInput['kategorie'])}
              >
                {(Object.keys(KATEGORIE_LABEL) as (keyof typeof KATEGORIE_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {KATEGORIE_LABEL[k]}
                  </option>
                ))}
              </SelectField>
            )}

            {istRichtwert && (
              <>
                <SelectField
                  label="Erhaltungszustand des Hauses"
                  id="zustand"
                  value={value.zustandHaus}
                  onChange={(e) => set('zustandHaus', e.target.value as MietobjektInput['zustandHaus'])}
                >
                  {(Object.keys(ZUSTAND_HAUS_LABEL) as (keyof typeof ZUSTAND_HAUS_LABEL)[]).map((k) => (
                    <option key={k} value={k}>
                      {ZUSTAND_HAUS_LABEL[k]}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  label="Geschoss"
                  id="stockwerk"
                  value={value.stockwerk}
                  onChange={(e) => set('stockwerk', e.target.value as MietobjektInput['stockwerk'])}
                >
                  {(Object.keys(STOCKWERK_LABEL) as (keyof typeof STOCKWERK_LABEL)[]).map((k) => (
                    <option key={k} value={k}>
                      {STOCKWERK_LABEL[k]}
                    </option>
                  ))}
                </SelectField>
              </>
            )}

            {istRichtwert && (
              <>
                <Checkbox
                  checked={value.heizung === 'zentral_etage'}
                  onChange={(v) => set('heizung', v ? 'zentral_etage' : 'keine')}
                  label="Zentral- oder Etagenheizung"
                />

                {MERKMAL_GRUPPEN.map((gruppe) => {
                  // Gewählte Merkmale der Gruppe: zugeklappt bleiben sie so sichtbar,
                  // und eine Gruppe mit Auswahl steht beim Laden offen.
                  const gewaehlt = MERKMAL_KATALOG.filter((m) => m.gruppe === gruppe && value.merkmale[m.key]).length
                  return (
                  <div key={gruppe}>
                    <Collapsible title={gewaehlt > 0 ? `${gruppe} (${gewaehlt})` : gruppe} defaultOpen={gewaehlt > 0}>
                    <div className="flex flex-col gap-2">
                      {MERKMAL_KATALOG.filter((m) => m.gruppe === gruppe).map((m) => (
                        <div key={m.key}>
                          <Checkbox
                            checked={value.merkmale[m.key]}
                            onChange={(v) => setMerkmal(m.key, v)}
                            label={m.label}
                          />
                          {/* Denkmalschutz kann den Richtwert ganz verdrängen */}
                          {m.key === 'denkmalschutz' && value.merkmale.denkmalschutz && (
                            <div className="mt-3 ml-6">
                              <Checkbox
                                checked={value.denkmalschutzAufwand}
                                onChange={(v) => set('denkmalschutzAufwand', v)}
                                label="Erhebliche eigene Aufwendungen für die Erhaltung (§ 16 Abs 1 Z 3 MRG)"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    </Collapsible>
                  </div>
                  )
                })}
              </>
            )}
              </div>
            )}
          </Collapsible>
        </div>
        </div>
      </section>

      </div>

      {/* --- Gebäude und, sobald das Baujahr feststeht, die Förderung darunter:
             beide in derselben Spalte des Rasters --- */}
      <div className="space-y-9">
      {zeigeBaujahr(value.objektart) && (
        <Section title="Gebäude">
          <div>
            {baujahrOffen && (
              <p className="mb-1 px-1 text-[12px] font-medium text-coffee">
                {baujahrQuelle != null
                  ? 'Bitte Baubewilligung auswählen.'
                  : 'Baubewilligungsjahr nicht automatisch erkannt, bitte auswählen.'}
              </p>
            )}
            {/* Nachschlage-Link steht vor dem Feld (24px Abstand) */}
            <p className="mb-6 px-1 text-[12px] text-ink-faint">
              <a
                className="text-accent underline hover:text-accent-strong"
                href={bauperiodenLink()}
                target="_blank"
                rel="noreferrer"
              >
                Baujahr dieser Adresse nachsehen (Wien Kulturgut, Gebäudedaten)
              </a>
            </p>
            <SelectField
              label="Baubewilligung des Gebäudes"
              id="baubewilligung"
              value={baujahrOffen ? '' : value.baubewilligungGebaeude}
              disabled={ma25Offen}
              onChange={(e) => {
                setBaujahrOffen(false)
                const b = e.target.value as MietobjektInput['baubewilligungGebaeude']
                const erlaubt = foerderungenFuer(b)
                const prog = erlaubt.includes(value.foerderungProgramm) ? value.foerderungProgramm : 'keine'
                onChange({ ...value, baubewilligungGebaeude: b, foerderungProgramm: prog })
              }}
            >
              {/* Leerer Platzhalter: Feld zeigt nur das Label, wenn nichts gewählt ist */}
              <option value="" hidden />
              {(Object.keys(BAUBEWILLIGUNG_LABEL) as (keyof typeof BAUBEWILLIGUNG_LABEL)[]).map((k) => (
                <option key={k} value={k}>
                  {BAUBEWILLIGUNG_LABEL[k]}
                </option>
              ))}
            </SelectField>
            {/* Gefundene Angabe steht unter dem Feld */}
            {baujahrQuelle != null && (
              <p className="mt-1 px-1 text-[12px] text-ink-faint">
                Baujahr laut Gebäudedaten der Stadt Wien:{' '}
                <strong className="text-ink">{baujahrQuelle.text}</strong>
                {baujahrOffen && baujahrQuelle.periode != null && (
                  <>
                    {' – '}
                    <button
                      type="button"
                      className="text-accent underline hover:text-accent-strong"
                      onClick={() => {
                        const periode = baujahrQuelle.periode
                        if (!periode) return
                        setBaujahrOffen(false)
                        onChange((prev) => {
                          const erlaubt = foerderungenFuer(periode)
                          const prog = erlaubt.includes(prev.foerderungProgramm) ? prev.foerderungProgramm : 'keine'
                          return { ...prev, baubewilligungGebaeude: periode, foerderungProgramm: prog }
                        })
                      }}
                    >
                      übernehmen
                    </button>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Gründerzeitviertel: schließt den Lagezuschlag aus (§ 2 Abs 3 RichtWG) */}
          {value.objektart === 'wohnung' && !baujahrOffen && (
            <SelectField
              label="Gründerzeitviertel"
              id="gruenderzeit"
              value={value.gruenderzeitviertel}
              hint="In einem Gründerzeitviertel entfällt der Lagezuschlag. Gemeint sind Gebiete, in denen überwiegend Häuser aus 1870–1917 stehen, die ursprünglich Kleinwohnungen ohne Bad hatten."
              onChange={(e) => set('gruenderzeitviertel', e.target.value as MietobjektInput['gruenderzeitviertel'])}
            >
              <option value="unbekannt">unbekannt</option>
              <option value="ja">ja – Lagezuschlag entfällt</option>
              <option value="nein">nein</option>
            </SelectField>
          )}

          <div className="space-y-4">
            {value.objektart === 'wohnung' && !baujahrOffen && value.baubewilligungGebaeude === 'vor_1945' && (
              <Checkbox
                checked={value.kriegsschadenWiederaufbau}
                onChange={(v) => set('kriegsschadenWiederaufbau', v)}
                label="Haus nach Kriegsschaden mit öffentlichen Mitteln wiederhergestellt (Wiederaufbaufonds)"
              />
            )}
            {value.objektart === 'dg_ausbau' && (
              <Checkbox
                checked={value.dgAusbauNachStichtag}
                onChange={(v) => set('dgAusbauNachStichtag', v)}
                label="Baubewilligung/Mietvertrag nach dem 31.12.2001"
              />
            )}
            {value.objektart === 'zubau' && (
              <Checkbox
                checked={value.zubauNachStichtag}
                onChange={(v) => set('zubauNachStichtag', v)}
                label="Baubewilligung nach dem 30.9.2006"
              />
            )}

            {/* MA25-Anfrage: Baujahr (und bei Wohnungen auch die Förderung) unbekannt */}
            <div>
              <Checkbox
                checked={ma25Offen}
                onChange={setMa25Offen}
                label={
                  zeigeFoerderung(value.objektart)
                    ? 'Baujahr und öffentliche Förderung unbekannt? Kostenlos bei der MA 25 anfragen'
                    : 'Baujahr unbekannt? Kostenlos bei der MA 25 anfragen'
                }
              />
              {ma25Offen && (
                <div className="mt-6">
                  <Ma25Anfrage anschrift={value.anschrift} />
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* --- Förderung: nur bei Wohnungen relevant, und erst wenn das Baujahr feststeht --- */}
      {zeigeFoerderung(value.objektart) && !baujahrOffen && (
        <Section title="Förderung">
          <>
            {value.baubewilligungGebaeude === 'vor_1945' ? (
              <p className="rounded-md bg-surface-2 px-3 py-2 text-sm text-ink-soft">
                Bei einem Altbau (Baubewilligung bis 8.5.1945) ist die öffentliche Förderung für die Einstufung ohne
                Bedeutung.
              </p>
            ) : (
              <>
                <SelectField
                  label="Öffentliche Wohnbauförderung"
                  id="foerderung"
                  hint='Datensätze laut Unterlage „Förderungen".'
                  value={value.foerderungProgramm}
                  disabled={ma25Offen}
                  onChange={(e) => set('foerderungProgramm', e.target.value as MietobjektInput['foerderungProgramm'])}
                >
                  {foerderungenFuer(value.baubewilligungGebaeude).map((k) => (
                    <option key={k} value={k}>
                      {FOERDERUNG_PROGRAMM_LABEL[k]}
                    </option>
                  ))}
                </SelectField>

                {/* Stand der Rückzahlung: Dropdown sofort sichtbar (wenn relevant) */}
                {statusRelevant(value.foerderungProgramm) && !ma25Offen && (
                  <SelectField
                    label="Stand der Rückzahlung"
                    id="tilgung"
                    value={value.tilgungsstatus}
                    disabled={rueckzahlungUnbekannt}
                    onChange={(e) => set('tilgungsstatus', e.target.value as MietobjektInput['tilgungsstatus'])}
                  >
                    {(Object.keys(TILGUNGSSTATUS_LABEL) as (keyof typeof TILGUNGSSTATUS_LABEL)[]).map((k) => (
                      <option key={k} value={k}>
                        {TILGUNGSSTATUS_LABEL[k]}
                      </option>
                    ))}
                  </SelectField>
                )}

              </>
            )}

            {/* Alle Checkboxen dieses Abschnitts in einer Gruppe: 16px Abstand */}
            <div className="space-y-4">
              {/* Nur bei laufender Förderung 1968/1984 ändert die
                  Eigentumswohnung das Ergebnis – sonst ausgeblendet. */}
              {!baujahrOffen && value.baubewilligungGebaeude !== 'vor_1945' && eigentumswohnungRelevant && !ma25Offen && (
                <Checkbox
                  checked={value.eigentumswohnung}
                  onChange={(v) => set('eigentumswohnung', v)}
                  label="Eigentumswohnung"
                />
              )}

              {/* Unbekannter Rückzahlungsstand: Anfrage bei der zuständigen Stelle.
                  WWG 1948 → Bundeswohnbaufonds, Landesförderung → MA 50. */}
              {value.baubewilligungGebaeude !== 'vor_1945' &&
                statusRelevant(value.foerderungProgramm) &&
                !ma25Offen && (
                  <div>
                    <Checkbox
                      checked={rueckzahlungUnbekannt}
                      onChange={setRueckzahlungUnbekannt}
                      label={
                        value.foerderungProgramm === 'wwg1948'
                          ? 'Stand der Rückzahlung unbekannt? Beim Bundeswohnbaufonds anfragen'
                          : 'Stand der Rückzahlung unbekannt? Bei der MA 50 anfragen'
                      }
                    />
                    {rueckzahlungUnbekannt &&
                      (value.foerderungProgramm === 'wwg1948' ? (
                        <div className="mt-6">
                          <WwafHinweis anschrift={value.anschrift} />
                        </div>
                      ) : (
                        <div className="mt-6">
                          <RueckzahlungAnfrage anschrift={value.anschrift} programm={value.foerderungProgramm} />
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </>
        </Section>
      )}
      </div>

    </div>
  )
}
