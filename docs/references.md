# Referenzen

## Zweck

Dieses Dokument sammelt Referenzen, Bildquellen, Darstellungsnotizen und spätere Asset-Hinweise für den digitalen Brettspiel-Prototyp.

Version 1 benötigt keine finalen Grafiken. Der Prototyp startet mit einfachen PixiJS-Primitive-Formen.

## Grundsatz für Version 1

Für Version 1 gilt:

- keine finalen Tile-Grafiken erforderlich
- keine Sprite-Sheets erforderlich
- keine Animationen erforderlich
- keine hochauflösenden Assets erforderlich
- Darstellung über einfache Formen ist ausreichend
- Lesbarkeit hat Vorrang vor grafischer Qualität
- taktische Übersicht hat Vorrang vor Atmosphäre

## Stilreferenz

Die Darstellung orientiert sich atmosphärisch an klassischen Strategiespielen wie:

- Civilization 1
- Colonization

Diese Referenz ist stilistisch zu verstehen, nicht als Asset- oder Kopiervorlage.

Prioritäten:

- klare Feldzuordnung
- gute Lesbarkeit
- einfache Formen
- eindeutige Spielerfarben
- erkennbare Commander
- erkennbare Unit-Slots
- sichtbare Bonuspunkte
- erkennbare König-Markierung
- erkennbares Banner

## Version-1-Rendering

Version 1 verwendet voraussichtlich PixiJS-Primitive-Formen.

Beispiele:

| Element | Version-1-Darstellung |
|---|---|
| Gras-/Wiesenfeld | einfache grüne Fläche |
| Raster | sichtbare Linien |
| Commander | fast feldgroßes Quadrat |
| Unit | runder Marker im Slot |
| Bonuspunkte | bis zu drei gelbe Punkte |
| König | Commander mit zusätzlichem Balken am zentralen Marker |
| Banner | Zielobjekt/Gebäude mit klarer Banner-Silhouette |
| gültiger Drop | positive visuelle Markierung |
| ungültiger Drop | rote Markierung |
| Debug | Overlay, Panel oder Log-Ausgabe |

## Referenz: 24 × 24-Startaufstellung

Die Startaufstellung basiert auf einer bereitgestellten 24 × 24-Grafik.

Verbindliche Geometrie:

```txt
Player 1:
- Banner B1 auf (13, 9)
- Commander-Startfelder:
  - (10, 9)
  - (11, 9)
  - (12, 9)
  - (14, 9)
  - (15, 9)
  - (16, 9)

Player 2:
- Banner B2 auf (13, 16)
- Commander-Startfelder:
  - (10, 16)
  - (11, 16)
  - (12, 16)
  - (14, 16)
  - (15, 16)
  - (16, 16)
```

Koordinatensystem:

- `x` = Spalte
- `y` = Zeile
- `(1, 1)` liegt oben links

Die frühere abweichende Beispielaufstellung auf weit gegenüberliegenden Brettseiten wird für Version 1 verworfen.

## Referenz: Commander-Darstellung

Ein normaler Commander wird dargestellt als:

- quadratische Figur
- fast feldgroß
- vier sichtbare Slots
- zentraler Spielerfarbmarker beziehungsweise Aktionsstäbchen
- klar einem Spieler zugeordnet

## Referenz: König-Darstellung

Der König ist visuell ein Commander mit besonderer Markierung.

Darstellung:

- quadratische Commander-Grundform
- vier sichtbare Slots
- zentraler Spielerfarbmarker
- zusätzlicher Balken am zentralen Marker
- Balken darf Units nicht verdecken

Technisch ist der König:

```ts
isKing: true
```

Es wird kein separater König-Typ benötigt.

## Referenz: Unit-Darstellung

Units werden dargestellt als:

- runde Marker
- innerhalb der vier Commander-Slots
- farblich dem Spieler zugeordnet
- mit bis zu drei gelben Bonuspunkten

Bonuspunkte:

```txt
0 Punkte = +0
1 Punkt  = +1
2 Punkte = +2
3 Punkte = +3
```

## Referenz: Banner-Darstellung

Das Banner ist kein Commander.

Darstellungsempfehlung:

- steht auf einem Feld
- eindeutig als Zielobjekt erkennbar
- besitzt Spielerzuordnung
- unterscheidet sich klar von Commander-Figuren
- blockiert sein Feld

Version 1 benötigt keine detaillierte Gebäude- oder Banner-Grafik.

## Debug-Referenzen

Debug-Informationen können dargestellt werden als:

- Debug-Panel
- Overlay-UI
- einfache Textanzeige
- Terminal-/Log-Ausgabe

Debug kann anzeigen:

- Koordinaten
- IDs
- Bewegungsreichweite
- geprüfter Pfad
- kontrollierte Felder
- Angriffsreichweite
- aktive Spieler-ID
- relevante `GameState`-Ausschnitte
- Kampfberechnung
- Würfe
- Boni
- entfernte Units

Debug gehört zum `PrototypeUiState`, nicht zum `GameState`.

## Spätere Asset-Hinweise

Spätere Versionen können echte Assets ergänzen.

Mögliche spätere Assets:

- Gras-Tiles
- Wald-Tiles
- Straßen-Tiles
- Wasser-Tiles
- Erzberg-Tiles
- Lehmgruben-Tiles
- Hütten
- Banner-Sprites
- Commander-Sprites
- Unit-Marker
- Belagerungswaffen
- Handelswagen
- Schiffe
- UI-Icons
- Kampfanimationen
- Verlustanimationen

Diese Assets sind nicht Teil von Version 1.

## Asset-Regel für spätere Versionen

Bei späteren Assets muss dokumentiert werden:

- Quelle
- Lizenz
- erlaubte Nutzung
- Bearbeitungsrechte
- Autor oder Herkunft
- Speicherort im Projekt
- Zuordnung zu Spielobjekten

Keine unklar lizenzierten Grafiken dürfen als produktive Assets übernommen werden.

## Aktueller Asset-Status

```txt
Version 1: keine finalen Assets erforderlich
```

Der Prototyp kann vollständig mit PixiJS-Primitives, Farben, Linien, Kreisen, Quadraten und Textmarkierungen umgesetzt werden.

## Offene Referenzpunkte

Noch zu ergänzen, falls verfügbar:

- konkrete Bilddatei der 24 × 24-Startaufstellung
- konkrete Bilddatei der Commander-/König-Darstellung
- spätere Kampfbeispiele aus separaten Referenzen
- spätere Asset-Quellen
- spätere UI-Skizzen
