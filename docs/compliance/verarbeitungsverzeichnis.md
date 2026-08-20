# Verzeichnis der Verarbeitungstätigkeiten (Art. 30 Abs 1 DSGVO)

Verantwortliche: Gayane G. Mileski, [Anschrift ergänzen], Wien,
gayane.mileski@gmail.com. Datenschutzbeauftragte nicht bestellt (Art. 37 DSGVO
nach derzeitiger Einschätzung nicht einschlägig; bei Ausweitung neu prüfen).

Stand: August 2026. Änderungen werden in diesem Dokument nachgeführt.

## V1 – Bereitstellung der Website

| Feld | Inhalt |
|---|---|
| Zweck | Auslieferung der Seiten, Abwehr von Angriffen, Fehlersuche |
| Betroffene | Besucherinnen und Besucher |
| Datenarten | IP-Adresse, Zeitpunkt, angeforderte Datei, Browserkennung |
| Rechtsgrundlage | Art. 6 Abs 1 lit f – berechtigtes Interesse an sicherem Betrieb |
| Empfänger | GitHub Pages (Hosting), bei Nutzung des Servers zusätzlich Cloudflare |
| Drittland | USA (GitHub) – Data Privacy Framework, ergänzend Standardvertragsklauseln |
| Löschfrist | Protokolle spätestens nach 14 Tagen |
| TOM | TLS, keine eigenen Protokolle über den Hoster hinaus |

## V2 – Adresssuche und Gebäudedaten

| Feld | Inhalt |
|---|---|
| Zweck | Adressvorschläge, Baujahr, Bezirk und Lage zur eingegebenen Anschrift |
| Betroffene | Nutzende; mittelbar Bewohnerinnen und Bewohner der Anschrift |
| Datenarten | eingegebene Zeichenfolge, IP-Adresse gegenüber der Stadt Wien |
| Rechtsgrundlage | Art. 6 Abs 1 lit b – ausdrücklich angeforderte Funktion |
| Empfänger | Stadt Wien, offene Datenschnittstellen (eigenverantwortlich) |
| Drittland | nein |
| Löschfrist | keine Speicherung bei der Verantwortlichen |
| TOM | Abfrage nur nach Eingabe, keine Protokollierung der Suchbegriffe |

## V3 – Ergebnisverlauf im Endgerät

| Feld | Inhalt |
|---|---|
| Zweck | Wiederaufnahme geprüfter Objekte, Design-Wahl |
| Betroffene | Nutzende |
| Datenarten | Objektangaben, Anschrift, Farbschema |
| Rechtsgrundlage | Art. 6 Abs 1 lit b; Speicherung im Endgerät ist für den gewünschten Dienst erforderlich (§ 165 Abs 3 TKG 2021) |
| Empfänger | keine – Daten verlassen das Gerät nicht |
| Löschfrist | bis zur Löschung durch die Person („Verlauf leeren“) |
| TOM | ausschließlich lokaler Speicher, keine Übermittlung |

## V4 – Konto und Anmeldung ohne Passwort

| Feld | Inhalt |
|---|---|
| Zweck | Zugang zu kostenpflichtigen Leistungen, Zuordnung der Käufe |
| Betroffene | Kundinnen und Kunden |
| Datenarten | E-Mail-Adresse, Zeitpunkt der Anmeldung, Sitzungskennung, Anmelde-Token (gehasht) |
| Rechtsgrundlage | Art. 6 Abs 1 lit b – Vertragserfüllung |
| Empfänger | Cloudflare (Betrieb), Mailversender für den Anmeldelink |
| Drittland | nein, sofern EU-Region gewählt |
| Löschfrist | Konto bis Kündigung, danach 30 Tage; Anmelde-Token 15 Minuten |
| TOM | Token nur als Hash gespeichert, kurze Gültigkeit, Einmalverwendung, TLS |

## V5 – Kostenpflichtige Leistungen, Zahlung, Rechnung

| Feld | Inhalt |
|---|---|
| Zweck | Verkauf, Zahlungsabwicklung, Rechnungslegung, Buchführung |
| Betroffene | Kundinnen und Kunden |
| Datenarten | Name bzw. Firma, Rechnungsanschrift, UID, Kaufgegenstand, Betrag, Zahlungskennung, Nachweis der Zustimmung zum sofortigen Beginn |
| Rechtsgrundlage | Art. 6 Abs 1 lit b (Vertrag) und lit c (§ 132 BAO, § 11 UStG) |
| Empfänger | Stripe Payments Europe (eigenverantwortlich für die Zahlung), Steuerberatung |
| Drittland | nein |
| Löschfrist | 7 Jahre ab Ende des Kalenderjahres (§ 132 BAO); Zustimmungsnachweis 3 Jahre |
| TOM | keine Speicherung von Kartendaten, Zahlungsdaten ausschließlich bei Stripe |

## V6 – Kontaktformular

| Feld | Inhalt |
|---|---|
| Zweck | Beantwortung von Anfragen, Warteliste |
| Betroffene | Anfragende |
| Datenarten | Name, E-Mail-Adresse, Nachricht |
| Rechtsgrundlage | Art. 6 Abs 1 lit b bzw. lit f |
| Empfänger | FormSubmit (Zustellung), E-Mail-Anbieter |
| Drittland | ja – Standardvertragsklauseln; Alternative in EU prüfen |
| Löschfrist | bis Erledigung, danach 6 Monate |
| TOM | TLS, keine Weitergabe, keine Werbenutzung |

## V7 – Reichweitenmessung

| Feld | Inhalt |
|---|---|
| Zweck | Erkennen, welche Inhalte gefunden und genutzt werden |
| Betroffene | Besucherinnen und Besucher |
| Datenarten | Seitenpfad, Verweisquelle, grobe Herkunft, Ereignisnamen ohne Inhalt |
| Rechtsgrundlage | Art. 6 Abs 1 lit f; Einwilligung, soweit im Endgerät gespeichert wird |
| Empfänger | Plausible bzw. PostHog EU |
| Drittland | nein (EU-Region) |
| Löschfrist | Rohdaten nach 90 Tagen, danach nur Kennzahlen |
| TOM | keine Cookies, keine dauerhafte Kennung, Beachtung von „Do Not Track“, Widerspruch jederzeit |

## V8 – Verarbeitung im Auftrag von Unternehmen (Schnittstelle, White-Label)

| Feld | Inhalt |
|---|---|
| Zweck | Mietzinsprüfung für Bestände der Auftraggeber |
| Betroffene | Mieterinnen, Mieter, Eigentümerinnen, Eigentümer der geprüften Einheiten |
| Datenarten | Anschrift, Nutzfläche, Vertragsdatum, vereinbarter Mietzins, Ausstattung |
| Rechtsgrundlage | Art. 28 DSGVO – Verarbeitung im Auftrag; Rechtsgrundlage verantwortet der Auftraggeber |
| Empfänger | Cloudflare als Unterauftragsverarbeiter |
| Drittland | nein |
| Löschfrist | nach Weisung; Protokolle 30 Tage; nach Vertragsende 30 Tage |
| TOM | Mandantentrennung über den Schlüssel, Protokollierung, Verschlüsselung, siehe `public/avv.html` |
