# Bewegung, Festhalten und Aktionen
Stand: 2026-09-06. Grundlage: bestätigte [R03, R05 und R08](../docs/decisions.md).

## Bewegung

Acht Richtungen, Diagonalkosten 1. Auf dem Grasbrett bewegt sich Infanterie 1, Kavallerie 2 und Bogenschützen 1 Feld. Leere Commander bewegen sich unabhängig vom Ursprungstyp als Kavallerie.

Eine Bewegung wird als gültiger Pfad geprüft. Eigene Figuren dürfen Zwischenfelder sein, aber niemals Zielfelder. Gegner und stehende Banner blockieren. Der Pfad muss innerhalb der Reichweite liegen; kein eigener, unbelegter Startpunkt darf als Nullbewegung eine Aktion verbrauchen. Sichtlinien enthalten das Zielfeld, aber nicht den Ursprung.

## Aktionen

Ein Commander besitzt eine Aktion pro eigenem Zug: Bewegung, Nahkampfangriff, Schuss oder Banner-Einnahme. Nach Verwendung gilt `hasActedThisTurn`. Die ausführende Core-API prüft Spielstatus, aktiven Spieler, Besitzer, Existenz, Koordinaten, Aktionsverbrauch, Ziel und Pfad.

Öffentlicher Einstieg: `applyCommand` mit `move`, `attack`, `capture`, `hold`, `endTurn`. Die Einzeloperationen führen dieselben Prüfungen aus. Ungültige Aktionen verändern weder Zustand noch Würfelfolge. Fremde Spieler dürfen keine normalen Aktionen ausführen.

## Festhalten

Nur Infanterie mit aktiven Units hält. Ihr Besitzer darf genau eine benachbarte gegnerische Figur des gerade aktiven Spielers wählen. Auch leere Commander sind zulässige Ziele. Ziele anderer momentan nicht aktiver Spieler sind ausgeschlossen. Kein Ziel wird doppelt gehalten.

`getPendingHoldingChoices` liefert nötige Reaktionen; `setHoldingTarget` nimmt Auswahl oder Verzicht (`null`) entgegen. Reaktionen werden in Spielerreihenfolge, dann nach Commander-ID aufgelöst. Vor der nächsten normalen Aktion und vor Zugende müssen die offenen Antworten entschieden sein. Auswahl und Verzicht verbrauchen keine Aktion des Halters.

Eine gewählte Festhaltung bleibt gültig, solange die Stellung und die beteiligten Figuren geeignet sind. Der Besitzer kann lösen. Ein Verzicht gilt bis zur Änderung der Nachbarschaft. Nach Spielerwechsel wird neu gewählt. Nach einer ausgeführten Aktion kann eine neue Nachbarschaft eine neue Reaktion erfordern.

Die gehaltene Figur darf sich nicht bewegen und nur den Halter angreifen. Ein Bogenschützen-Commander mit Units darf seinen benachbarten Halter nicht angreifen; er kann nur verteidigen. Ein leerer ehemaliger Bogenschützen-Commander ist effektive Kavallerie und darf den Halter im Nahkampf angreifen.

## Angriffe und Banner

Infanterie greift aus Entfernung 1 an. Kavallerie aus Entfernung bis 2 benötigt einen gültigen Anmarsch auf ein freies Nachbarfeld; sie darf dabei maximal einen Bewegungsschritt zurücklegen. Ein blockierter Anmarsch verwirft die ganze Aktion. Nach Niederlage des Verteidiger-Commanders rückt ein überlebender Nahkampfangreifer auf dessen Feld.

Bogenschützen mit Units schießen auf Entfernung 2–3 und bewegen sich dabei nicht. Sie können weder aus Entfernung 1 angreifen noch ein Banner einnehmen. Leere Commander verwenden Kavallerie-Regeln. Ein stehendes Banner wird mit gültigem Nahkampfanmarsch ohne Würfeln eingenommen; das Feld wird anschließend betreten.

## Zugfolge und Abnahme

Zugende überspringt ausgeschiedene Spieler; beim Umlauf über den Beginn der Spielerreihenfolge steigt die Runde. Die Commander des neu aktiven Spielers sind wieder handlungsfähig. Beendete Spiele akzeptieren keine Aktionen.

Tests prüfen Diagonalen, eigene/feindliche Zwischenfelder, Bannerblockaden, Reichweiten, ungültige Akteure, Festhalte-Auswahl durch den richtigen Besitzer, leere Ziele, fehlende Nahkampfangriffe von Bogenschützen, Verzicht und Zugwechsel.
