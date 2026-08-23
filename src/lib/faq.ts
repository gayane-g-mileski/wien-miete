// Fragen und Antworten – einmal für die Anzeige, einmal für die
// strukturierten Daten (FAQPage). Beide Texte müssen übereinstimmen.
// Gefragt wird aus Sicht der Verwaltung, nicht aus Sicht einer Mietpartei.

export interface FaqEintrag {
  frage: string
  antwort: string
}

export const FAQ: FaqEintrag[] = [
  {
    frage: 'Wie wird der Lagezuschlag angesetzt?',
    antwort:
      'Der Lagezuschlag gilt je Liegenschaft, nicht je Bezirk: Er setzt eine überdurchschnittliche Lage voraus und muss der Mietpartei spätestens bei Vertragsabschluss schriftlich samt den maßgeblichen Umständen bekanntgegeben werden. Die Stadt Wien veröffentlicht dafür seit 1994 eine Lagezuschlagskarte. Dieses Werkzeug rechnet mit einer dokumentierten Bandbreite je Bezirk, weist die Herleitung Schritt für Schritt aus und verlinkt die amtliche Karte, damit der Wert für die konkrete Liegenschaft geprüft werden kann. In Gründerzeitvierteln nach § 2 Abs 3 RichtWG ist ein Zuschlag ausgeschlossen.',
  },
  {
    frage: 'Gilt für diese Einheit der Richtwert?',
    antwort:
      'Der Richtwert gilt in der Vollanwendung des Mietrechtsgesetzes für Hauptmietverträge ab dem 1. März 1994 – vor allem in Häusern mit einer Baubewilligung vor dem 9. Mai 1945. Für Verträge vom 1. Jänner 1982 bis 28. Februar 1994 richtet sich die Obergrenze nach der Ausstattungskategorie, davor bleibt der damals vereinbarte Mietzins maßgeblich. Im freifinanzierten Neubau, bei geförderten Objekten, bei Ein- und Zweifamilienhäusern sowie in weiteren Ausnahmefällen gilt kein Richtwert. Das Werkzeug prüft diese Reihenfolge und nennt den Grund für die Einordnung.',
  },
  {
    frage: 'Um wie viel darf 2027 erhöht werden?',
    antwort:
      'Richtwert und Kategoriebeträge werden seit dem Mieten-Wertsicherungsgesetz jährlich angepasst; für 2027 lässt das Gesetz höchstens 2 % zu. Der endgültige Betrag steht erst mit der Kundmachung fest, die hinterlegten Werte werden danach aktualisiert. Unabhängig davon braucht eine Erhöhung im laufenden Vertrag eine Grundlage – etwa eine Wertsicherungsklausel – und muss der Mietpartei rechtzeitig schriftlich angekündigt werden; bei Kategoriemietzinsen verlangt § 16 Abs 9 MRG ein Erhöhungsbegehren spätestens 14 Tage vor dem nächsten Zinstermin.',
  },
  {
    frage: 'Wie lange kann eine überhöhte Mietzinsvereinbarung aufgerollt werden?',
    antwort:
      'Nach § 16 Abs 8 MRG ist die Geltendmachung befristet: Bei unbefristeten Verträgen läuft die Frist drei Jahre ab Abschluss der Vereinbarung, bei befristeten endet sie frühestens sechs Monate nach Ende oder Umwandlung des Mietverhältnisses. Entschieden wird über die Schlichtungsstelle der Stadt Wien (MA 50) oder das Bezirksgericht. Für die Verwaltung heißt das: Neuvermietungen der letzten drei Jahre sind der Bereich, in dem eine Prüfung wirtschaftlich am meisten bringt.',
  },
  {
    frage: 'Taugt das Ergebnis als Nachweis gegenüber Eigentümern oder der Schlichtungsstelle?',
    antwort:
      'Der Prüfbericht dokumentiert Rechenweg, Fundstellen, Herleitung des Lagezuschlags, Zeitstempel und Version der Rechenlogik und eignet sich damit als nachvollziehbare Unterlage für den Akt, für Eigentümerinnen und Eigentümer und als Beilage im Verfahren. Er bleibt eine automatisierte Ersteinschätzung: kein Gutachten im Sinne des Liegenschaftsbewertungsgesetzes, keine Rechtsauskunft und keine Entscheidung der Schlichtungsstelle.',
  },
]
