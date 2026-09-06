# Brett, Darstellung und Eingaben
Stand: 2026-09-06; Grundlage: [Entscheidungen](../docs/decisions.md).

## Brett und Koordinaten

Das Brett besitzt 24 Spalten und 24 Zeilen. Interne Koordinaten sind ganzzahlig von 0 bis 23, Ursprung oben links. Tiles werden mit `tiles[x][y]` angesprochen. Startterrain ist Gras. Nichtganzzahlige, unendliche und außerhalb liegende Koordinaten sind ungültig.

Commander-Positionen bestimmen die Belegung. `Tile.occupant` ist ein synchronisierter Cache. Stehende Banner blockieren zusätzlich ihr Feld; sie sind eigenständige Objekte. Entfernte Figuren blockieren nicht.

## Darstellung und Bedienung

PixiJS zeichnet den Zustand. Kamera-Panning, Zoom, Hover, Auswahl, Drag-Ziel und Debug-Anzeige sind UI-Zustand. Tile-Pixelgröße und UI-Skalierung ändern keine Brettkoordinaten. Vorhandene Textur- und Rasteroptionen bleiben verfügbar.

Drag-and-Drop fragt `getValidMoves`, `getValidAttacks` und `canCaptureBanner` ab und löst eine Core-Aktion aus. Ein ungültiger Drop wird sichtbar abgewiesen und verändert den Spielzustand nicht. Rechte Maustaste verschiebt die Kamera; Mausrad steuert Zoom.

Bei `getPendingHoldingChoices` zeigt die App zuerst dem benannten Infanteriebesitzer Zielauswahl und Verzicht. Normale Aktionen müssen bis zur Antwort warten. Die UI darf nicht eigenständig einen Halter oder ein Ziel bestimmen.

Kampfanimationen zeigen das Core-Ergebnis einschließlich Paargewinner und Verlusten. Ein verzögerter Callback darf kein Ergebnis auf einen anderen Zustand anwenden. Umsetzung und interaktive Abnahme dieser Browserabläufe erfolgen in Block 3.
