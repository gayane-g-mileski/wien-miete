# Löschkonzept

Grundsatz: Daten werden gelöscht, sobald der Zweck erfüllt ist und keine
gesetzliche Aufbewahrungspflicht entgegensteht (Art. 5 Abs 1 lit e DSGVO).

## Fristen

| Datenart | Frist | Auslöser | Umsetzung |
|---|---|---|---|
| Server-Protokolle des Hosters | 14 Tage | Zeitablauf | Voreinstellung des Hosters, dokumentieren |
| Protokolle der Schnittstelle (Schlüsselkennung, Zeit, Endpunkt) | 30 Tage | Zeitablauf | Ablaufzeit im Speicher des Workers gesetzt |
| Anmelde-Token (Magic-Link) | 15 Minuten, danach ungültig; Eintrag nach Verwendung sofort gelöscht | Verwendung oder Zeitablauf | Ablaufzeit im Speicher, Einmalverwendung |
| Sitzungen | 30 Tage ohne Nutzung | Zeitablauf | Ablaufzeit im Token |
| Konto (E-Mail, Firmendaten) | 30 Tage nach Kündigung | Kündigung | Löschauftrag im Server, danach anonymisierte Kennzahlen |
| Rechnungen und Zahlungsbelege | 7 Jahre ab Ende des Kalenderjahres | § 132 BAO | keine vorzeitige Löschung, auch nicht auf Antrag – Hinweis an die Person |
| Nachweis der Zustimmung zum sofortigen Beginn | 3 Jahre | Vertragsende | zusammen mit dem Kauf gespeichert |
| Kontaktanfragen | 6 Monate nach Erledigung | Erledigung | Postfach-Regel, halbjährliche Durchsicht |
| Bestandsdaten aus der Schnittstelle | nach Weisung, längstens 30 Tage | Ende des Zugangs | Löschlauf, schriftliche Bestätigung |
| Verlauf im Endgerät | jederzeit durch die Person | „Verlauf leeren“ | lokaler Speicher, kein Serverbezug |

## Ablauf

Der Server führt die Fristen über Ablaufzeiten im Datenspeicher; abgelaufene
Einträge werden nicht mehr ausgeliefert und beim nächsten Zugriff entfernt.
Einmal im Quartal wird stichprobenweise geprüft, ob die Fristen tatsächlich
greifen; das Ergebnis wird hier vermerkt.

Bei einem Löschantrag wird geprüft, ob eine Aufbewahrungspflicht besteht.
Betrifft die Pflicht nur einen Teil (etwa die Rechnung), werden die übrigen
Daten gelöscht und die verbleibenden gesperrt, also nur noch für den
Aufbewahrungszweck verwendet.

## Sicherungen

Sicherungen werden nach 30 Tagen überschrieben. Wird ein Datensatz gelöscht,
verschwindet er aus den Sicherungen spätestens mit deren Ablauf; eine
Wiederherstellung aus einer älteren Sicherung wird um zwischenzeitliche
Löschungen bereinigt.
