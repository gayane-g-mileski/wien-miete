// Fragen und Antworten – einmal für die Anzeige, einmal für das FAQPage-Schema
// in index.html. Beide Texte müssen übereinstimmen.

export interface FaqEintrag {
  frage: string
  antwort: string
}

export const FAQ: FaqEintrag[] = [
  {
    frage: 'Was ist der Lagezuschlag?',
    antwort:
      'Der Lagezuschlag ist ein Aufschlag auf den Richtwert für Wohnungen in einer überdurchschnittlichen Lage. Er wird nicht pauschal je Bezirk bestimmt, sondern gilt für die einzelne Liegenschaft; die Stadt Wien veröffentlicht dafür seit 1994 eine Lagezuschlagskarte. Dieses Werkzeug rechnet mit einem Bezirksmittel und verlinkt die amtliche Karte, damit der Wert für die konkrete Adresse geprüft werden kann. Ohne besondere Lage gibt es keinen Zuschlag.',
  },
  {
    frage: 'Gilt der Richtwert für meine Wohnung?',
    antwort:
      'Der Richtwert gilt für Wohnungen in der Vollanwendung des Mietrechtsgesetzes, deren Hauptmietvertrag ab dem 1. März 1994 abgeschlossen wurde – das sind vor allem Altbauwohnungen mit einer Baubewilligung vor dem 9. Mai 1945. Bei Verträgen vom 1. Jänner 1982 bis 28. Februar 1994 richtet sich die Obergrenze nach der Ausstattungskategorie, davor bleibt der damals vereinbarte Mietzins maßgeblich. In einem Neubau, bei geförderten Objekten, bei Ein- und Zweifamilienhäusern und in weiteren Ausnahmefällen gilt kein Richtwert.',
  },
  {
    frage: 'Um wie viel darf 2027 erhöht werden?',
    antwort:
      'Der Richtwert und die Kategoriebeträge werden gesetzlich an die Inflation angepasst; der neue Betrag wird vom zuständigen Ministerium kundgemacht und gilt ab dem im Gesetz vorgesehenen Stichtag. Wie hoch die Anpassung 2027 ausfällt, steht daher erst mit dieser Kundmachung fest – die hinterlegten Werte werden hier danach aktualisiert. Unabhängig davon braucht eine Erhöhung im laufenden Vertrag eine Grundlage im Mietvertrag, etwa eine Wertsicherungsklausel, und muss der Mieterin oder dem Mieter rechtzeitig schriftlich angekündigt werden.',
  },
  {
    frage: 'Wie lange kann ich zu viel bezahlte Miete zurückfordern?',
    antwort:
      'Eine überhöhte Mietzinsvereinbarung kann nach § 16 Abs 8 MRG nur befristet geltend gemacht werden: Bei unbefristeten Verträgen läuft die Frist drei Jahre ab Abschluss der Vereinbarung, bei befristeten Verträgen endet sie frühestens sechs Monate nach Ende oder Umwandlung des Mietverhältnisses. Zurückgefordert wird über die Schlichtungsstelle der Stadt Wien (MA 50) oder das Bezirksgericht. Weil es dabei auf den Einzelfall ankommt, ersetzt diese Angabe keine Rechtsberatung – die Mietervereinigung, die Arbeiterkammer und die Schlichtungsstelle beraten dazu kostenlos.',
  },
]
