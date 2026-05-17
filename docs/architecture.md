# Architektur

## Zweck

Dieses Dokument beschreibt die technische Architektur für Version 1 des digitalen Brettspiel-Prototyps.

Die Architektur trennt bewusst Darstellung, UI-Zustand und regelrelevante Spiellogik.

## Grundsatz

```txt
PixiJS zeigt.
game-core entscheidet.
GameState ist die Wahrheit.
Specs beschreiben.
Tests kontrollieren.
GitHub organisiert.
```

## Version-1-Ziel

Version 1 ist ein lokaler Browser-Prototyp mit PixiJS.

Der Prototyp soll:

- ein 24 × 24 Brett darstellen
- Gras-/Wiesenfelder rendern
- Rasterlinien sichtbar halten
- Kamera-Panning ermöglichen
- Zoom ermöglichen
- Drag-and-Drop als Hauptbedienung nutzen
- regelvalidierte Bewegung vorbereiten
- Kampf und Würfelauflösung regelkonform ausführen
- Debug-Informationen anzeigen und abschaltbar machen
- spätere Multiplayer-Fähigkeit architektonisch vorbereiten

## Nicht-Ziele für Version 1

Version 1 enthält nicht:

- echten Online-Multiplayer
- Serverlogik
- Login
- Datenbank
- Ranking
- Colyseus-Server
- persistente Spielstände
- serverautoritär validierte Spielzüge
- komplexes Phasenmodell
- formales Action-/Command-Modell

## Architekturübersicht

```txt
apps/prototype/
└─ PixiJS-Anwendung
   ├─ Rendering
   ├─ Kamera
   ├─ Zoom
   ├─ Drag-and-Drop
   ├─ visuelles Feedback
   └─ PrototypeUiState

packages/game-core/
└─ Regelkern
   ├─ GameState
   ├─ Bewegungsvalidierung
   ├─ Kampfvalidierung
   ├─ Würfelauflösung
   ├─ Verlustzuordnung
   ├─ Siegbedingungen
   └─ regelnahe Tests
```

## PixiJS-Verantwortung

PixiJS ist zuständig für:

- Darstellung des Boards
- Darstellung von Tiles
- Darstellung des sichtbaren Rasters
- Darstellung von Commander-Figuren
- Darstellung von Unit-Slots
- Darstellung von Einheitenmarkern
- Darstellung von König-Markierungen
- Darstellung von Bannern
- Kamera-Panning
- Zoom
- Drag-and-Drop
- Snap-to-Grid
- Hover-Zustände
- Auswahlzustände
- gültige und ungültige Zielmarkierungen
- Debug-Overlay
- UI-Toggle für Debug-Modus

PixiJS darf regelrelevante Entscheidungen visualisieren, aber nicht dauerhaft selbst besitzen.

## game-core-Verantwortung

`game-core` ist zuständig für:

- `GameState`
- Board-Datenmodell
- Player-Datenmodell
- Commander-Datenmodell
- Unit-Datenmodell
- Banner-Datenmodell
- aktive Spielerlogik über `activePlayerId`
- Bewegungsvalidierung
- Angriffsvalidierung
- Festhalten durch Infanterie
- Kampfentscheidung
- Würfelauflösung
- natürliche Würfelsortierung vor Bonusaddition
- automatische Verlustzuordnung
- König-Siegbedingung
- Banner-Siegbedingung
- regelnahe Testbarkeit

## GameState

Der `GameState` ist die regelrelevante Wahrheit.

Er enthält nur Daten, die für Regeln, Validierung, Kampf, Siegbedingungen oder spätere Synchronisierung relevant sind.

Vorläufiges Modell:

```ts
export type GameState = {
  board: Board;
  players: Player[];
  commanders: Commander[];
  units: Unit[];
  banners: Banner[];
  activePlayerId: string;
  turnNumber: number;
};
```

## PrototypeUiState

Temporäre UI-Zustände werden getrennt vom `GameState` geführt.

Beispiele:

```ts
export type PrototypeUiState = {
  selectedCommanderId?: string;
  hoveredTile?: Position;
  draggedCommanderId?: string;
  currentDragTarget?: Position;
  debugEnabled: boolean;
};
```

Der `PrototypeUiState` enthält insbesondere:

- ausgewählten Commander
- Hover-Feld
- gezogenen Commander
- aktuelles Drag-Ziel
- Debug-Status
- UI-Markierungen
- temporäre Feedback-Zustände

## Board-Modell

Das Board verwendet in Version 1:

- 24 Spalten
- 24 Zeilen
- flache Tile-Liste
- ausschließlich `grass` als Terrain
- Koordinaten über `x` und `y`

```ts
export type Board = {
  cols: number;
  rows: number;
  tiles: Tile[];
};

export type TerrainType = 'grass';

export type Tile = {
  x: number;
  y: number;
  terrainType: TerrainType;
};
```

Im Code werden `x` und `y` verwendet.

In deutschen Erklärungen bedeuten:

- `x` = Spalte
- `y` = Zeile

Der Ursprung liegt bei `(1, 1)` oben links.

## Figurenmodell

Version 1 unterscheidet:

- `Commander`
- `Unit`
- `Banner`

Nur Commander stehen als militärische Figuren auf dem Brett.

Einheiten haben keine eigene dauerhafte Brettposition. Sie befinden sich in Commander-Slots oder sind entfernt.

## Commander

Ein Commander besitzt:

- `id`
- `ownerId`
- `position`
- `isKing`
- `troopType`
- vier Unit-Slots
- `hasActedThisTurn`

```ts
export type Commander = {
  id: string;
  ownerId: string;
  position: Position;
  isKing: boolean;
  troopType: TroopType;
  unitSlots: [string | null, string | null, string | null, string | null];
  hasActedThisTurn: boolean;
};
```

## Unit

Eine Unit besitzt:

- `id`
- `ownerId`
- `troopType`
- `bonusPoints`
- `commanderId`
- `slotIndex`
- `status`

```ts
export type Unit = {
  id: string;
  ownerId: string;
  troopType: TroopType;
  bonusPoints: 0 | 1 | 2 | 3;
  commanderId: string;
  slotIndex: 0 | 1 | 2 | 3;
  status: 'active' | 'removed';
};
```

## Banner

Das Banner ist ein Gebäude beziehungsweise Zielobjekt.

Es ist kein Commander.

```ts
export type Banner = {
  id: string;
  ownerId: string;
  position: Position;
  status: 'standing' | 'captured';
};
```

## Occupancy

Tile-Belegung wird nicht dauerhaft im Tile gespeichert.

Regelrelevante Belegung wird aus dem `GameState` abgeleitet.

Für Version 1 gilt:

- Commander blockieren ihr Feld.
- Banner blockieren ihr Feld.
- Pro Feld darf maximal eine normale Figur stehen.
- Units blockieren keine eigenen Brettfelder, weil sie in Commander-Slots liegen.

## Multiplayer-Vorbereitung

Version 1 implementiert keinen echten Multiplayer.

Die Architektur soll spätere Multiplayer-Fähigkeit vorbereiten durch:

- klaren `GameState`
- getrennte Player-Daten
- `ownerId` an Commander, Unit und Banner
- `activePlayerId`
- möglichst serialisierbare Datenstrukturen
- flache Tile-Liste
- Trennung von Regelkern und Rendering

Ein späterer serverautoritärer Multiplayer kann auf dem `GameState` und den Regeln aus `game-core` aufbauen.

## Debug-Architektur

Debug gehört zum `PrototypeUiState`, nicht zum `GameState`.

Debug wird aktiviert über:

- Taste `D`
- sichtbaren UI-Toggle

Debug-Anzeigen können enthalten:

- Koordinaten
- IDs
- Bewegungsreichweite
- geprüfter Pfad
- kontrollierte Felder
- Angriffsreichweite
- aktive Spieler-ID
- relevante GameState-Ausschnitte
- Kampfberechnung
- Würfe
- Boni
- entfernte Einheiten

## Architekturentscheidungen

Für Version 1 gelten folgende Architekturentscheidungen:

- PixiJS rendert, entscheidet aber nicht dauerhaft über Regeln.
- `game-core` enthält die regelrelevanten Entscheidungen.
- `GameState` ist die einzige regelrelevante Wahrheit.
- `PrototypeUiState` enthält temporäre UI-Zustände.
- Commander speichern ihre Brettposition.
- Units speichern ihre Zuordnung zu Commander und Slot.
- Tiles speichern keine dauerhafte Figurenbelegung.
- Multiplayer wird vorbereitet, aber nicht implementiert.
- Server, Login, Datenbank und Ranking bleiben spätere Erweiterungen.
