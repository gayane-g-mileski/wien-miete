# Umsatzsteuer, Rechnung und Kassenpflicht

Arbeitsstand ohne steuerliche Vertretung. Die Punkte sind mit einer
Steuerberatung abzuklären, bevor die erste Rechnung ausgestellt wird.

## Kleinunternehmer oder Regelbesteuerung

Die Kleinunternehmerregelung (§ 6 Abs 1 Z 27 UStG) befreit bis zu einer
Umsatzgrenze; seit 2025 gilt eine erhöhte Grenze samt Toleranzregel, und die
Befreiung kann unter Voraussetzungen auch grenzüberschreitend in Anspruch
genommen werden. Wer befreit ist, darf **keine Umsatzsteuer ausweisen** und hat
keinen Vorsteuerabzug; ein Ausweis würde nach § 11 Abs 12 UStG kraft
Rechnungslegung geschuldet.

Folgen für das Produkt: Solange die Kleinunternehmerregelung gilt, muss auf der
Preisseite und in der Bestellmaske der Hinweis „umsatzsteuerbefreiter
Kleinunternehmer, keine Umsatzsteuer ausgewiesen“ stehen statt „inkl. 20 % USt“.
Die Texte liegen zentral in `src/lib/tarife.ts` und sind an einer Stelle
umzustellen. Bei Verzicht auf die Befreiung (Regelbesteuerungsantrag) bleibt es
beim aktuellen Stand.

## Leistungsort

Elektronisch erbrachte Dienstleistungen an **Verbraucher** werden dort besteuert,
wo die Verbraucherin oder der Verbraucher ansässig ist (§ 3a Abs 13 UStG). Für
Umsätze innerhalb der EU über der Kleinstunternehmerschwelle ist das
**EU-OSS-Verfahren** über FinanzOnline zu nutzen: eine Registrierung, eine
quartalsweise Erklärung, Abfuhr der jeweiligen Landessteuersätze. Bis zur
Schwelle darf mit österreichischer Umsatzsteuer abgerechnet werden.

An **Unternehmen** im EU-Ausland mit gültiger UID geht die Steuerschuld über
(Reverse Charge, § 19 Abs 1 UStG); die Rechnung trägt den Hinweis „Steuerschuld
geht auf den Leistungsempfänger über“ und beide UID-Nummern. Die UID ist über
das Bestätigungsverfahren (Stufe 2) zu prüfen und die Prüfung zu dokumentieren.
An Kundschaft außerhalb der EU: nicht steuerbar in Österreich.

## Rechnungsmerkmale (§ 11 UStG)

Name und Anschrift der Leistenden und der Empfängerin; Menge und Bezeichnung der
Leistung; Tag der Leistung oder Leistungszeitraum; Entgelt; Steuersatz und
Steuerbetrag oder Hinweis auf die Befreiung; Ausstellungsdatum; fortlaufende
Rechnungsnummer; UID der Leistenden (soweit vorhanden) und – ab 10.000 € – die
UID der Empfängerin. Bei Kleinbetragsrechnungen bis 400 € genügen die
erleichterten Angaben.

Umsetzung: Die Rechnung erzeugt Stripe als Beleg; die fortlaufende Nummer, der
Leistungszeitpunkt und die Hinweise auf Reverse Charge bzw. auf die
Kleinunternehmerbefreiung sind dort in der Rechnungsvorlage zu hinterlegen.

## Registrierkasse und Beleg

Die Belegerteilungspflicht (§ 132a BAO) gilt für Barumsätze; als Barumsatz
gelten auch Zahlungen mit Bankomat- oder Kreditkarte **vor Ort**. Reine
Online-Zahlungen über einen Zahlungsdienstleister gelten nach der herrschenden
Auslegung nicht als Barumsatz, weshalb die Registrierkassenpflicht (§ 131b BAO)
in der Regel nicht ausgelöst wird. Das ist mit der Steuerberatung zu bestätigen,
weil daran die Anschaffung einer Registrierkasse hängt. Unabhängig davon wird zu
jedem Kauf ein Beleg als PDF bereitgestellt.

## Aufbewahrung

Rechnungen und Belege sieben Jahre (§ 132 BAO). Diese Pflicht geht einem
Löschbegehren vor; die betroffene Person wird darauf hingewiesen.

## Checkliste vor der ersten Rechnung

1. Entscheidung Kleinunternehmer oder Regelbesteuerung, dokumentiert.
2. Bei Regelbesteuerung: UID beantragen.
3. EU-OSS-Registrierung, sobald an Verbraucher im EU-Ausland verkauft wird.
4. Rechnungsvorlage in Stripe mit allen Merkmalen des § 11 UStG.
5. Nummernkreis festlegen, lückenlos und fortlaufend.
6. Klärung Registrierkasse mit der Steuerberatung, Ergebnis hier festhalten.
