# Verbraucherrecht: FAGG und KSchG

Betroffen ist jeder Verkauf an Verbraucherinnen und Verbraucher über die
Website (Fernabsatz). Für Unternehmen gelten diese Pflichten nicht, die
Preisangabe erfolgt dort trotzdem transparent.

## Informationspflichten vor der Bestellung (§ 4 FAGG)

| Pflichtangabe | Wo umgesetzt |
|---|---|
| Wesentliche Eigenschaften der Leistung | Bestellmaske und Preisabschnitt: „automatisierte Ersteinschätzung als digitaler Inhalt“ |
| Name, Anschrift, E-Mail der Unternehmerin | Impressum, verlinkt aus der Bestellmaske |
| Gesamtpreis inklusive Steuern und aller Nebenkosten | Bestellmaske: Bruttopreis, Nettobetrag, „keine weiteren Kosten“ |
| Zahlung, Leistung, Erfüllungszeit | Bestellmaske: sofortige Bereitstellung nach Zahlung |
| Bestehen und Bedingungen des Rücktrittsrechts | Rücktrittsbelehrung, verlinkt und in der Bestellmaske bestätigt |
| Muster-Rücktrittsformular | `public/widerruf.html` |
| Laufzeit, Mindestdauer, Kündigung | Preisabschnitt und Bestellmaske je Tarif |
| Funktionsweise und Kompatibilität digitaler Inhalte | Browserbasiert, PDF-Ausgabe, keine Installation |
| Gewährleistung | AGB |
| Streitbeilegung | AGB (Internet Ombudsstelle; die EU-Plattform wurde im Juli 2025 eingestellt) |

## Kostenfalle vermeiden (§ 8 FAGG)

Die Bestellschaltfläche trägt ausschließlich die Beschriftung
**„Zahlungspflichtig bestellen“**. Unmittelbar darüber stehen Leistung,
Gesamtpreis, Laufzeit und Kündigung. Fehlt diese Kennzeichnung, ist die
Verbraucherin oder der Verbraucher nicht gebunden – deshalb darf die
Beschriftung nicht in „Weiter“, „Jetzt starten“ oder Ähnliches geändert werden.

## Rücktrittsrecht bei digitalen Inhalten (§ 11, § 18 FAGG)

Vierzehn Tage ab Vertragsabschluss. Das Recht erlischt vorzeitig nur, wenn
kumulativ vorliegen:

1. ausdrückliches Verlangen, vor Fristablauf mit der Ausführung zu beginnen,
2. Kenntnisnahme, dass damit das Rücktrittsrecht verloren geht,
3. tatsächlicher Beginn der Ausführung durch uns,
4. Bestätigung des Vertrags samt dieser Zustimmung auf dauerhaftem Datenträger.

Umsetzung: zwei getrennte Bestätigungen in der Bestellmaske (nicht vorausgewählt,
nicht in den AGB versteckt); der Zeitpunkt wird zum Kauf gespeichert; die
Bestätigungsmail wiederholt beide Punkte. Ohne Zustimmung wird die Leistung erst
nach Ablauf der Frist bereitgestellt – der Server bildet beide Wege ab.

## Laufzeit und automatische Verlängerung (§ 6 Abs 1 Z 1 und Z 2 KSchG)

Verträge mit laufendem Entgelt laufen einen Monat und verlängern sich monatlich.
Die Kündigung ist jederzeit zum Monatsende möglich, formlos. Eine
stillschweigende Verlängerung ist nur wirksam, wenn sie deutlich angezeigt wird;
sie steht deshalb in der Bestellmaske, im Preisabschnitt und in den AGB. Für
Verbraucher gilt keine Bindung über einen Monat hinaus.

## Preisauszeichnung

Angegeben werden Endpreise inklusive Umsatzsteuer (Preisauszeichnungsgesetz).
Der Nettobetrag steht daneben, weil Unternehmen ihn brauchen; die Reihenfolge
bleibt: Bruttopreis zuerst und deutlich hervorgehoben.

## Bestätigung des Vertrags

Nach der Zahlung wird eine E-Mail versendet mit: Leistungsbeschreibung,
Gesamtpreis, Rechnung als PDF, Rücktrittsbelehrung, Hinweis auf das vorzeitige
Erlöschen samt der beiden bestätigten Punkte und dem Zeitpunkt der Zustimmung.
