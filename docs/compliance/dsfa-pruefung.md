# Datenschutz-Folgenabschätzung: Schwellwertprüfung (Art. 35 DSGVO)

Anlass: Über die Schnittstelle und den CSV-Import werden Daten Dritter
verarbeitet – Anschriften mit Bezug zu bestehenden Mietverhältnissen, Fläche,
Vertragsdatum und vereinbarter Mietzins. Solche Daten lassen Rückschlüsse auf
Wohnverhältnisse und wirtschaftliche Lage zu.

## Ausgangslage

| Verarbeitung | Rolle | Ort der Verarbeitung |
|---|---|---|
| CSV-Import in der Oberfläche | Auftragsverarbeiter, faktisch ohne Datenzugang | Browser des Kunden, keine Übermittlung |
| Schnittstelle `/v1/bestand` und `/v1/einschaetzung` | Auftragsverarbeiter | Server in der EU |
| Prüfbericht PRO für Verbraucher | Verantwortliche | Browser, Server nur für Freischaltung |

## Prüfung anhand der Kriterien (WP 248 rev.01)

| Kriterium | Trifft zu | Begründung |
|---|---|---|
| Bewerten oder Einstufen (Scoring, Profiling) | teilweise | Es wird ein Objekt eingestuft, keine Person bewertet. Es entsteht kein Persönlichkeitsprofil. |
| Automatisierte Entscheidung mit Rechtswirkung | nein | Das Ergebnis ist unverbindliche Information; Entscheidungen trifft der Mensch. |
| Systematische Überwachung | nein | Keine Beobachtung von Verhalten, kein öffentlich zugänglicher Bereich. |
| Besondere Datenkategorien (Art. 9) | nein | Keine Gesundheits-, Herkunfts- oder ähnlichen Daten. |
| Datenverarbeitung in großem Umfang | möglich | Bestände von Hausverwaltungen können mehrere tausend Einheiten umfassen. |
| Abgleich oder Zusammenführung von Datensätzen | teilweise | Verknüpfung der Objektdaten mit offenen Daten der Stadt Wien (Baujahr, Lage). |
| Daten schutzbedürftiger Personen | möglich | Mieterinnen und Mieter stehen im Abhängigkeitsverhältnis zur Vermieterseite. |
| Neuartige Technologie | nein | Regelbasierte Berechnung, keine Profilbildung mit maschinellem Lernen. |
| Verhinderung der Ausübung eines Rechts oder Nutzung einer Leistung | möglich | Ergebnisse können Grundlage für Mieterhöhungen sein. |

## Ergebnis

Zwei bis drei Kriterien können zutreffen, sobald Bestände in größerem Umfang
über die **Schnittstelle** verarbeitet werden. Nach der Praxis der
Aufsichtsbehörden gilt ab zwei erfüllten Kriterien ein hohes Risiko als
wahrscheinlich. Daraus folgt:

1. Für den Betrieb ohne Unternehmenszugang (Rechner, Prüfbericht, CSV-Import im
   Browser) ist **keine** Folgenabschätzung erforderlich: Es findet keine
   Übermittlung an uns statt, die Verarbeitung bleibt im Endgerät.
2. Vor dem Start der Schnittstelle mit echten Beständen wird eine
   Folgenabschätzung **durchgeführt**, mit den Punkten: systematische
   Beschreibung, Notwendigkeit und Verhältnismäßigkeit, Risiken für die
   Betroffenen, Abhilfemaßnahmen.
3. Zusätzlich ist die österreichische Verordnung über Verarbeitungen, für die
   eine Folgenabschätzung durchzuführen ist (DSFA-V), sowie die Ausnahmeliste
   (DSFA-AV) auf einschlägige Punkte zu prüfen – das steht noch aus.

## Geplante Abhilfemaßnahmen

Datenminimierung in der Schnittstelle: Anschrift ist optional, Bezirk genügt für
die Berechnung. Keine Namen von Mieterinnen und Mietern in der Schnittstelle –
sie sind für die Prüfung nicht nötig und werden im Vertrag ausgeschlossen.
Kurze Protokollfristen (30 Tage). Mandantentrennung. Verschlüsselung.
Auftragsverarbeitungsvertrag mit klarer Weisungsbindung. Möglichkeit, Bestände
pseudonymisiert mit interner Objektnummer statt Anschrift zu übergeben.
