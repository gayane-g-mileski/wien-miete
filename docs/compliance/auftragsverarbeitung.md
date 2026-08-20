# Auftragsverarbeitung und Übermittlung in Drittländer

Wer im Auftrag verarbeitet, braucht einen Vertrag nach Art. 28 Abs 3 DSGVO,
bevor die erste Verarbeitung läuft. Diese Liste ist der Nachweis darüber.

## Stand je Dienst

| Dienst | Rolle | Verarbeitung | Vertrag | Drittland | Offen |
|---|---|---|---|---|---|
| GitHub Pages (GitHub B.V./Microsoft) | Auftragsverarbeiter (Hosting) | Auslieferung der statischen Seiten, Server-Protokolle | Data Protection Agreement der GitHub-Bedingungen | USA – Data Privacy Framework, ergänzend SCC | Bestätigung ablegen |
| Cloudflare (Workers, KV/D1) | Auftragsverarbeiter | Konto, Zahlungssteuerung, Schnittstelle | Cloudflare DPA, EU-Region wählen | nein bei EU-Region | Vertrag abschließen, Region festlegen |
| Stripe Payments Europe, Ltd. | eigenverantwortlich für die Zahlung, im Übrigen Auftragsverarbeiter | Zahlung, Rechnungsbelege, Betrugserkennung | Stripe Data Processing Agreement | Irland; Übermittlungen innerhalb der Stripe-Gruppe über SCC | Vertrag annehmen, Rolle im Vertrag dokumentieren |
| Plausible Analytics | Auftragsverarbeiter | cookielose Messung | Standard-AVV des Anbieters | EU | Anbieter wählen |
| PostHog EU | Auftragsverarbeiter | Ereignismessung, EU-Instanz | AVV im Konto | EU | nur bei Einsatz |
| FormSubmit | Auftragsverarbeiter | Zustellung der Formularnachrichten | kein AVV bekannt | Drittland | **ersetzen** – EU-Alternative oder eigener Mailversand |
| Mailversand für Anmeldelinks | Auftragsverarbeiter | Zustellung des Magic-Links | AVV je Anbieter | EU anstreben | Anbieter festlegen (Vorschlag: EU-Anbieter mit SMTP) |
| Stadt Wien (data.wien.gv.at) | eigenverantwortlich | Adressvorschläge, Gebäudedaten | kein AVV nötig | nein | – |

## Prüfpunkte je Vertrag (Art. 28 Abs 3)

Gegenstand, Dauer, Art und Zweck; Datenarten und betroffene Personen;
Weisungsbindung; Vertraulichkeit; Maßnahmen nach Art. 32; Regeln für
Unterauftragsverarbeiter; Unterstützung bei Betroffenenrechten und bei
Art. 33–36; Löschung oder Rückgabe am Ende; Nachweis- und Kontrollrechte.

## Übermittlung in Drittländer

Für jede Übermittlung außerhalb des EWR ist festzuhalten: Grundlage
(Angemessenheitsbeschluss oder Standardvertragsklauseln), Modul der SCC,
ergänzende Maßnahmen und eine kurze Risikoabschätzung für das Zielland
(Transfer Impact Assessment). Für GitHub Pages und FormSubmit ist das
nachzuholen; die einfachere Lösung bei FormSubmit ist der Wechsel auf einen
EU-Dienst, dann entfällt die Frage.

## Eigene Rolle gegenüber Unternehmenskunden

Bei Nutzung der Schnittstelle und des eingebetteten Rechners sind wir
Auftragsverarbeiter des Unternehmens. Der Vertrag dazu liegt unter
`public/avv.html` und wird beim Abschluss eines Zugangs unterzeichnet.
Unterauftragsverarbeiter sind dort namentlich genannt; ein Wechsel wird
30 Tage vorher angekündigt.
