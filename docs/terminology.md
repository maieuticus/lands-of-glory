# Terminologie

## Zweck

Dieses Dokument definiert zentrale Begriffe für den digitalen Brettspiel-Prototyp.

Es verbindet deutsche Spielbegriffe mit englischen Code-Bezeichnungen und soll konsistente Sprache in Dokumentation, Specs und späterer Implementierung sichern.

## Grundsatz

- Deutsche Erklärungen verwenden verständliche Spielbegriffe.
- Code, Typen, Properties und Dateinamen verwenden englische Bezeichnungen.
- Koordinaten heißen im Code `x` und `y`.
- In deutschen Erklärungen entspricht `x` der Spalte und `y` der Zeile.
- Der Ursprung `(1, 1)` liegt oben links.

## Zentrale Begriffe

| Deutsch | Code / Englisch | Bedeutung |
|---|---|---|
| Spiel | `Game` | Eine Partie beziehungsweise Spielinstanz |
| Spielzustand | `GameState` | Regelrelevante Wahrheit des Spiels |
| UI-Zustand | `PrototypeUiState` | Temporärer Zustand für Auswahl, Hover, Drag und Debug |
| Spieler | `Player` | Teilnehmer einer Partie |
| aktiver Spieler | `activePlayerId` | Spieler, der aktuell handeln darf |
| Brett | `Board` | Gesamtes Spielfeld |
| Feld | `Tile` | Einzelnes Feld auf dem Brett |
| Spalte | `x` | Horizontale Koordinate im Code |
| Zeile | `y` | Vertikale Koordinate im Code |
| Position | `Position` | Koordinatenpaar aus `x` und `y` |
| Terrain | `TerrainType` | Geländeart eines Feldes |
| Wiese / Gras | `grass` | Einziger Terrain-Typ in Version 1 |
| Figur | `Figure` | Allgemeiner spielerischer Begriff für sichtbare Spielfigur |
| Kommandeur | `Commander` | Militärische Brettfigur mit Slots |
| König | `Commander` mit `isKing: true` | Besonderer Commander mit Siegbedingung |
| Einheit | `Unit` | Truppeneinheit innerhalb eines Commander-Slots |
| Slot | `Slot` / `slotIndex` | Platz für genau eine Unit im Commander |
| Banner | `Banner` / `ObjectiveBuilding` | Zielobjekt beziehungsweise Gebäude |
| Truppengattung | `TroopType` | Typ einer militärischen Einheit oder eines Commanders |
| Infanterie | `infantry` | Truppengattung mit Festhalten |
| Kavallerie | `cavalry` | Truppengattung mit höherer Bewegung |
| Bogenschützen | `archer` | Truppengattung mit Fernkampfreichweite |
| Bonuspunkte | `bonusPoints` | Zusatzwert einer Unit für Würfelauflösung |
| Besitzer | `ownerId` | Spieler-ID, der ein Objekt gehört |
| Runde / Zugnummer | `turnNumber` | Zähler für den Spielverlauf |
| Aktion ausgeführt | `hasActedThisTurn` | Gibt an, ob ein Commander bereits gehandelt hat |
| Entfernt | `removed` | Status einer besiegten Unit |
| Aktiv | `active` | Status einer im Spiel befindlichen Unit |
| Stehend | `standing` | Status eines nicht eingenommenen Banners |
| Eingenommen | `captured` | Status eines eingenommenen Banners |
| Besiegt | `defeated` | Status eines besiegten Spielers |
| Festhalten | `Holding` / `ZoneOfControl` | Passive Kontrolle durch Infanterie |
| Kontrollzone | `ZoneOfControl` | Benachbarte Felder mit Haltewirkung |
| Bewegung | `Movement` | Positionsänderung eines Commanders |
| Angriff | `Attack` | Angriff auf Commander, König oder Banner |
| Schuss | `Shoot` | Fernkampfangriff von Bogenschützen |
| Kampf | `Combat` | Regelauflösung zwischen Angreifer und Ziel |
| Würfel | `Die` | Einzelner Würfelwurf |
| Würfelwert | `rawDieValue` | Natürlicher Wert eines Würfels vor Bonus |
| effektiver Wert | `effectiveValue` | Würfelwert nach Bonusaddition |
| König-Bonus | `kingBonus` | Bonus durch beteiligten König |
| Verlust | `Loss` | Entfernte Unit oder entfernter leerer Commander |
| Siegbedingung | `VictoryCondition` | Bedingung, durch die ein Spieler besiegt wird |
| Debug-Modus | `debugEnabled` | Ein-/ausblendbare Debug-Anzeige |

## Datenmodell-Begriffe

### `GameState`

Der `GameState` ist die regelrelevante Wahrheit.

Er enthält:

- `board`
- `players`
- `commanders`
- `units`
- `banners`
- `activePlayerId`
- `turnNumber`

Nicht enthalten sind temporäre UI-Zustände wie Hover, Auswahl, Drag oder Debug-Aktivierung.

### `PrototypeUiState`

Der `PrototypeUiState` enthält temporäre UI-Informationen.

Beispiele:

- `selectedCommanderId`
- `hoveredTile`
- `draggedCommanderId`
- `currentDragTarget`
- `debugEnabled`

### `Board`

Das `Board` beschreibt das Spielfeld.

Version 1 verwendet:

- `cols: 24`
- `rows: 24`
- `tiles: Tile[]`

### `Tile`

Ein `Tile` ist ein Feld auf dem Board.

Version 1 verwendet:

- `x`
- `y`
- `terrainType: 'grass'`

### `Position`

Eine `Position` ist ein Koordinatenpaar:

```ts
export type Position = {
  x: number;
  y: number;
};
```

## Figurenbegriffe

### Commander

Ein `Commander` ist die einzige militärische Figur, die in Version 1 auf dem Brett steht.

Ein Commander:

- gehört einem Spieler
- besitzt eine Position
- führt genau eine Truppengattung
- hat genau vier Slots
- kann ein König sein
- kann pro Runde/Zug genau eine Aktion ausführen

### Unit

Eine `Unit` ist keine frei bewegliche Brettfigur.

Eine Unit:

- befindet sich in einem Commander-Slot, oder
- ist aus dem Spiel entfernt

Eine Unit besitzt keine eigene dauerhafte Brettposition.

### King

Der König ist kein separater Typ.

Der König ist ein Commander mit:

```ts
isKing: true
```

### Banner

Ein `Banner` ist ein Zielobjekt beziehungsweise Gebäude.

Ein Banner:

- gehört einem Spieler
- steht auf einem Feld
- blockiert sein Feld
- kann durch erfolgreichen Nahkampfangriff eingenommen werden
- kann in Version 1 nicht durch Bogenschützen zerstört werden

## Truppengattungen

Version 1 kennt genau drei Truppengattungen.

| Deutsch | Code | Bewegung | Angriff |
|---|---|---:|---:|
| Infanterie | `infantry` | 1 | 1 |
| Kavallerie | `cavalry` | 2 | 2 |
| Bogenschützen | `archer` | 1 | 2 |

## Slot-Begriffe

Ein Commander hat genau vier Slots.

Im Code werden Slots über `slotIndex` adressiert:

```txt
0
1
2
3
```

In deutschen Erklärungen kann von Slot 1 bis Slot 4 gesprochen werden, wenn dadurch die Darstellung verständlicher ist.

Für die technische Spezifikation gilt:

```txt
Slot 1 entspricht slotIndex 0
Slot 2 entspricht slotIndex 1
Slot 3 entspricht slotIndex 2
Slot 4 entspricht slotIndex 3
```

## Bewegungsbegriffe

| Deutsch | Code / Englisch | Bedeutung |
|---|---|---|
| Bewegung | `Movement` | Regelvalidierte Positionsänderung |
| Schritt | `Step` | Einzelne Bewegung von einem Feld zum Nachbarfeld |
| Bewegungsreichweite | `movementRange` | Maximale Schrittzahl |
| Angriffsreichweite | `attackRange` | Reichweite für Angriff oder Schuss |
| Diagonalbewegung | `diagonalStep` | Schritt in diagonaler Richtung |
| gültiges Ziel | `validTarget` | Ziel, das regelkonform erreicht werden kann |
| ungültiges Ziel | `invalidTarget` | Ziel, das blockiert oder nicht erreichbar ist |
| belegtes Feld | `occupiedTile` | Feld mit blockierendem Commander oder Banner |

## Kampfbegriffe

| Deutsch | Code / Englisch | Bedeutung |
|---|---|---|
| Angreifer | `attacker` | Commander, der den Kampf auslöst |
| Verteidiger | `defender` | Ziel-Commander oder Ziel-König |
| Ziel | `target` | Angegriffener Commander, König oder Banner |
| Nahkampf | `meleeCombat` | Angriff durch Infanterie oder Kavallerie |
| Fernkampf | `rangedCombat` | Angriff durch Bogenschützen |
| Würfelwurf | `dieRoll` | Ergebnis eines einzelnen Würfels |
| natürlicher Würfelwert | `rawDieValue` | Wert vor Bonusaddition |
| Bonuspunkte | `bonusPoints` | Unit-Bonus von 0 bis 3 |
| König-Bonus | `kingBonus` | Bonus von +1 bei beteiligtem König |
| effektiver Würfelwert | `effectiveValue` | `rawDieValue + bonusPoints + kingBonus` |
| Würfelpaar | `diePair` | Vergleich eines Angriffs- und Verteidigungswürfels |
| überzähliger Würfel | `excessDie` | Würfel ohne Vergleichspaar |
| Verlustzuordnung | `lossAssignment` | Automatische Zuordnung des Verlusts zur unterlegenen Unit |

## Siegbegriffe

| Deutsch | Code / Englisch | Bedeutung |
|---|---|---|
| König besiegt | `kingDefeated` | Spieler verliert durch besiegten König |
| Banner eingenommen | `bannerCaptured` | Spieler verliert durch eingenommenes Banner |
| Spieler besiegt | `playerDefeated` | Spielerstatus wird `defeated` |
| Figuren entfernen | `removePlayerPieces` | Entfernen aller Figuren und Einheiten eines besiegten Spielers |

## Debug-Begriffe

Debug-Informationen sind UI-nahe Informationen.

Sie gehören nicht in den `GameState`.

Mögliche Debug-Anzeigen:

- Koordinaten
- IDs
- Bewegungsreichweite
- geprüfter Pfad
- kontrollierte Felder
- Angriffsreichweite
- aktive Spieler-ID
- GameState-Ausschnitte
- Kampfberechnung
- Würfe
- Boni
- entfernte Einheiten

## Spätere Begriffe ohne Version-1-Mechanik

Diese Begriffe dürfen dokumentiert werden, haben aber in Version 1 keine aktive Spielmechanik:

| Deutsch | Mögliche Code-Bezeichnung | Status |
|---|---|---|
| Entdeckung | `Discovery` | Spätere Erweiterung |
| verdecktes Feld | `HiddenTile` | Spätere Erweiterung |
| Landschaftsplättchensäckchen | `TerrainBag` | Spätere Erweiterung |
| Handel | `Trade` | Spätere Erweiterung |
| Handelsfigur | `Trader` | Spätere Erweiterung |
| Handelswagen | `TradeCart` | Spätere Erweiterung |
| Schiff | `Ship` | Spätere Erweiterung |
| Wald | `forest` | Spätere Erweiterung |
| Straße | `road` | Spätere Erweiterung |
| Lehmgrube | `clayPit` | Spätere Erweiterung |
| Hütte | `hut` | Spätere Erweiterung |
| Wasser | `water` | Spätere Erweiterung |
| Erzberg | `oreMountain` | Spätere Erweiterung |
| Rohstoff | `Resource` | Spätere Erweiterung |
| Marktbereich | `MarketArea` | Spätere Erweiterung |
| Hauptstraße | `MainRoad` | Spätere Erweiterung |
| Mauer | `Wall` | Spätere Erweiterung |
| Katapult | `Catapult` | Spätere Erweiterung |
| Tribock | `Trebuchet` | Spätere Erweiterung |
| Belagerungswaffe | `SiegeWeapon` | Spätere Erweiterung |
| Sonderkarte | `SpecialCard` | Spätere Erweiterung |
| Vasall | `Vassal` | Spätere Erweiterung |
| Lehnsherr | `LiegeLord` | Spätere Erweiterung |
| Ultimatum | `Ultimatum` | Spätere Erweiterung |
| GloryPoints | `GloryPoints` | Spätere Erweiterung |
| Goldvermögen | `Gold` | Spätere Erweiterung |
| alternatives Schlachtfeld | `Battlefield` | Spätere Erweiterung |

## Schreibkonventionen

### In Markdown-Dokumenten

- Deutsche Spielbegriffe verwenden.
- Code-Bezeichnungen in Backticks setzen.
- Version-1-Begriffe und spätere Begriffe klar trennen.
- Keine verdeckten Regeln aus späteren Begriffen ableiten.

### Im Code-Kontext

- Englisch verwenden.
- `x` und `y` verwenden.
- `GameState` für regelrelevante Wahrheit verwenden.
- `PrototypeUiState` für temporäre UI-Zustände verwenden.
- `TroopType` auf `infantry`, `cavalry`, `archer` beschränken.

## Verbindliche Begriffsklärung

Für Version 1 gelten folgende Festlegungen verbindlich:

- Ein Commander ist eine Brettfigur.
- Eine Unit ist keine frei bewegliche Brettfigur.
- Der König ist ein Commander mit `isKing: true`.
- Das Banner ist kein Commander.
- Tiles speichern keine dauerhafte Figurenbelegung.
- Commander speichern ihre Position.
- Units speichern Commander- und Slot-Zuordnung.
- Debug ist UI-Zustand.
- Der `GameState` ist die Regelwahrheit.
