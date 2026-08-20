# Haftung und Versicherung

## Wo Haftung entstehen kann

Eine falsche Einschätzung führt beim Verkauf zu Vermögensschäden, nicht zu
Personen- oder Sachschäden: eine zu niedrig angesetzte Bandbreite kostet
Mieteinnahmen, eine zu hohe führt zu einem verlorenen Verfahren und zur
Rückzahlung samt Kosten. Genau diese Fälle deckt eine gewöhnliche
Betriebshaftpflicht **nicht** ab – nötig ist die Erweiterung um
**Vermögensschäden**.

## Empfohlene Deckung

| Punkt | Empfehlung |
|---|---|
| Art | Betriebshaftpflicht für IT-Dienstleister mit Vermögensschadendeckung |
| Deckungssumme | mindestens 1 Mio. € pauschal, Vermögensschäden mindestens 250.000 € |
| Rückwirkung | Deckung auch für vor Vertragsbeginn begangene, noch unbekannte Pflichtverletzungen |
| Nachhaftung | mindestens 3 Jahre nach Vertragsende |
| Räumlich | EU, besser weltweit ohne USA/Kanada |
| Zusätze | Datenschutz-Haftpflicht (Ansprüche wegen Verletzung der DSGVO), Cyber-Baustein für Betriebsunterbrechung und Wiederherstellung |
| Ausschlüsse prüfen | wissentliche Pflichtverletzung, Erfüllungsansprüche, Ansprüche aus zugesagten Eigenschaften |

Angebote sind bei Versicherern mit IT- und Beratungssparten einzuholen; die
Prämie hängt am Umsatz und an der Deckungssumme. Bevor der erste kostenpflichtige
Zugang verkauft wird, soll die Polizze laufen.

## Haftungsbegrenzung in den AGB

Gegenüber **Verbrauchern** sind Freizeichnungen eng begrenzt: Der Ausschluss für
Personenschäden ist unzulässig; bei leichter Fahrlässigkeit ist ein Ausschluss
nur eingeschränkt und nur bei ausgewogener Gestaltung haltbar (§ 6 Abs 1 Z 9
KSchG, § 879 Abs 3 ABGB). Deshalb steht in den AGB die Einschränkung „soweit
gesetzlich zulässig“, und Personenschäden sind ausgenommen.

Gegenüber **Unternehmen** ist eine betragliche Begrenzung zulässig: begrenzt auf
das in den letzten zwölf Monaten für die betroffene Leistung bezahlte Entgelt,
ohne entgangenen Gewinn, mittelbare Schäden und Folgeschäden.

Beides ist in `public/agb.html` Ziffer 11 umgesetzt und Teil der anwaltlichen
Prüfung.

## Flankierende Maßnahmen

Der Haftungshinweis erscheint an jeder Stelle, an der ein Ergebnis entsteht:
Oberfläche, PDF-Bericht, Schnittstellenantwort, eingebetteter Rechner. Jede
Ausgabe trägt Zeitstempel und Version der Rechenlogik, damit später
nachvollziehbar bleibt, auf welchem Stand ein Ergebnis beruhte. Änderungen an
den hinterlegten Werten (Richtwert, Kategoriebeträge, Lagezuschlag) werden mit
Datum und Quelle dokumentiert.
