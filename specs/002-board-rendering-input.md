# Board, Rendering und Input

## Zweck

Diese Spec beschreibt Board, Tiles, Rendering, Kamera, Zoom, Drag-and-Drop und Debug-Input für Version 1 des digitalen Brettspiel-Prototyps.

Sie legt fest, was PixiJS darstellen und bedienen soll, ohne PixiJS zur regelrelevanten Wahrheit zu machen.

## Geltungsbereich für Version 1

Version 1 umfasst:

- 24 × 24 Spielfeld
- Tile-Größe 128 × 128 px
- ausschließlich Gras-/Wiesenfelder
- sichtbares Raster
- flache Tile-Liste
- Koordinaten über `x` und `y`
- Kamera-Panning per rechter Maustaste
- Zoom, bevorzugt per Mausrad
- Drag-and-Drop als Hauptbedienung
- Snap-to-Grid für Commander
- visuelles Feedback für gültige und ungültige Ziele
- blockierter Drop bei ungültigem Ziel
- Debug-Modus per Taste `D`
- Debug-Modus per UI-Toggle

## Nicht-Ziele

Version 1 enthält nicht:

- unterschiedliche Terrain-Typen außer `grass`
- Entdeckung
- verdeckte Felder
- Landschaftsplättchensäckchen
- Wald
- Straßen
- Lehmgrube
- Hütten
- Wasser
- Erzberg
- finale Tile-Grafiken
- Sprite-Sheets
- Animationen
- hochauflösende Assets
- serverseitige Input-Validierung
- echtes Multiplayer-Input-System
- formales Action-/Command-Modell

## Begriffe

| Begriff | Bedeutung |
|---|---|
| `Board` | Gesamtes Spielfeld |
| `Tile` | Einzelnes Feld auf dem Board |
| `Position` | Koordinatenpaar aus `x` und `y` |
| `x` | Spalte im Code |
| `y` | Zeile im Code |
| `TerrainType` | Geländeart eines Tiles |
| `grass` | Einziger Terrain-Typ in Version 1 |
| `Commander` | Bewegliche militärische Brettfigur |
| `GameState` | Regelrelevante Wahrheit |
| `PrototypeUiState` | Temporärer UI-Zustand |
| Drag-and-Drop | Hauptbedienung für Commander-Bewegung |
| Snap-to-Grid | Einrasten auf definierte Feldposition |
| Debug-Modus | Abschaltbare Anzeige von Entwicklungs- und Regelinformationen |

## Regeln

### 1. Board-Größe

Version 1 verwendet verbindlich:

```txt
24 × 24 Felder
```

Das Datenmodell soll spätere flexible Brettgrößen erlauben.

Initialwerte:

```txt
cols = 24
rows = 24
```

### 2. Tile-Größe

Ein Tile wird digital mit folgender Größe dargestellt:

```txt
128 × 128 px
```

### 3. Koordinaten

Im Code werden Koordinaten als `x` und `y` geführt.

In deutschen Erklärungen gilt:

- `x` = Spalte
- `y` = Zeile
- `(1, 1)` liegt oben links

### 4. Terrain

Version 1 kennt genau einen Terrain-Typ:

```ts
export type TerrainType = 'grass';
```

Alle Tiles sind Gras-/Wiesenfelder.

### 5. Tile-Speicherung

Das Board speichert Tiles als flache Liste.

```ts
export type Board = {
  cols: number;
  rows: number;
  tiles: Tile[];
};
```

Die Tile-Liste ist keine verschachtelte Matrix.

### 6. Tile-Modell

```ts
export type Tile = {
  x: number;
  y: number;
  terrainType: TerrainType;
};
```

Tiles speichern keine dauerhafte Figurenbelegung.

### 7. Occupancy

Ob ein Feld belegt ist, wird aus dem `GameState` abgeleitet.

Für Version 1 blockieren:

- Commander
- Banner

Units blockieren keine eigenen Board-Felder, weil sie nur in Commander-Slots existieren.

### 8. Raster

Rasterlinien sind in Version 1 immer sichtbar.

Es gibt keine Ausblendoption für das Raster.

### 9. Rendering-Grundsatz

Version 1 startet mit einfachen PixiJS-Primitive-Formen.

Nicht erforderlich sind:

- finale Tile-Grafiken
- Sprites
- Sprite-Sheets
- Animationen
- hochauflösende Assets

### 10. Kamera-Panning

Kamera-Panning erfolgt per rechter Maustaste.

Das Panning verändert nur die Ansicht, nicht den `GameState`.

### 11. Zoom

Der Prototyp unterstützt Zoom.

Empfehlung:

- Mausrad-Zoom
- Zoom am Mauszeiger orientiert

Zoom verändert nur die Ansicht, nicht den `GameState`.

### 12. Drag-and-Drop

Drag-and-Drop ist die Hauptbedienung für Commander.

Während des Drags soll sichtbar sein:

- welches Ziel aktuell geprüft wird
- ob das Ziel gültig ist
- ob das Ziel ungültig ist
- welche Reichweite gilt
- welcher Pfad geprüft wird

### 13. Snap-to-Grid

Commander rasten auf Feldpositionen ein.

Ziel ist die definierte Feldposition, in der Regel die Feldmitte.

### 14. Gültiger Drop

Ein Drop ist gültig, wenn die regelrelevante Validierung eine gültige Bewegung oder Aktion erlaubt.

PixiJS zeigt das Ergebnis an, entscheidet aber nicht dauerhaft selbst.

### 15. Ungültiger Drop

Bei ungültigem Drop gilt:

- Drop wird blockiert
- Ziel wird rot markiert
- Bewegung wird nicht in den `GameState` übernommen
- Commander kehrt visuell zurück oder bleibt an seiner ursprünglichen Position

### 16. Debug-Modus

Debug wird aktiviert oder deaktiviert über:

- Taste `D`
- sichtbaren UI-Toggle

Debug gehört zum `PrototypeUiState`.

Debug ist nicht Teil der regelrelevanten Wahrheit.

### 17. Debug-Inhalte

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

### 18. Input und aktiver Spieler

Input muss `activePlayerId` respektieren.

Nur der aktive Spieler darf eigene Commander bewegen oder Angriffe mit ihnen ausführen.

## Datenmodell-Auswirkung

### Board

```ts
export type Board = {
  cols: number;
  rows: number;
  tiles: Tile[];
};
```

### TerrainType

```ts
export type TerrainType = 'grass';
```

### Tile

```ts
export type Tile = {
  x: number;
  y: number;
  terrainType: TerrainType;
};
```

### Position

```ts
export type Position = {
  x: number;
  y: number;
};
```

### GameState-Bezug

Der `GameState` enthält:

```ts
board: Board;
commanders: Commander[];
banners: Banner[];
activePlayerId: string;
```

Tile-Belegung wird aus `commanders` und `banners` abgeleitet.

### PrototypeUiState-Bezug

```ts
export type PrototypeUiState = {
  selectedCommanderId?: string;
  hoveredTile?: Position;
  draggedCommanderId?: string;
  currentDragTarget?: Position;
  debugEnabled: boolean;
};
```

Zusätzliche UI-nahe Informationen können später ergänzt werden, wenn sie nicht regelrelevant sind.

## UI-Auswirkung

Die UI muss in Version 1 darstellen:

- 24 × 24 Board
- Gras-/Wiesenfelder
- sichtbares Raster
- Commander auf Feldpositionen
- Banner auf Feldpositionen
- Drag-Ziel
- gültige Ziele
- ungültige Ziele
- geprüfte Pfade im Debug-Modus
- Bewegungsreichweiten im Debug-Modus
- Angriffsreichweiten im Debug-Modus
- aktive Spieler-ID im Debug-Modus

Die UI muss ermöglichen:

- Kamera-Panning
- Zoom
- Drag-and-Drop von Commander-Figuren
- Snap-to-Grid
- Debug-Umschaltung per Taste `D`
- Debug-Umschaltung per UI-Toggle

## Akzeptanzkriterien

Diese Spec ist erfüllt, wenn:

- ein Board mit `cols: 24` und `rows: 24` erzeugt wird
- das Board genau 576 Tiles enthält
- jedes Tile `terrainType: 'grass'` besitzt
- jedes Tile `x` und `y` besitzt
- `x` und `y` im Bereich 1 bis 24 liegen
- die Tiles als flache Liste gespeichert werden
- Rasterlinien sichtbar dargestellt werden
- die Tile-Größe 128 × 128 px beträgt
- Kamera-Panning per rechter Maustaste funktioniert
- Zoom funktioniert
- Drag-and-Drop für Commander verfügbar ist
- Commander auf Feldpositionen einrasten
- gültige Ziele visuell erkennbar sind
- ungültige Ziele rot markiert werden
- ungültige Drops blockiert werden
- ungültige Drops den `GameState` nicht verändern
- Debug per Taste `D` ein- und ausgeschaltet werden kann
- Debug per UI-Toggle ein- und ausgeschaltet werden kann
- Debug-Status im `PrototypeUiState` liegt
- Tiles keine dauerhafte Figurenbelegung speichern
- Occupancy aus `GameState` abgeleitet wird
- Input `activePlayerId` respektiert

## Given/When/Then-Testfälle

### Testfall 1: Board wird korrekt erzeugt

Given ein neues Version-1-Board  
When das Board initialisiert wird  
Then hat es `cols: 24`  
And es hat `rows: 24`  
And es enthält 576 Tiles.

### Testfall 2: Alle Tiles sind Gras

Given ein neues Version-1-Board  
When alle Tiles geprüft werden  
Then hat jedes Tile `terrainType: 'grass'`.

### Testfall 3: Koordinatenbereich

Given ein initialisiertes Board  
When die Tile-Koordinaten geprüft werden  
Then liegt jedes `x` zwischen 1 und 24  
And jedes `y` liegt zwischen 1 und 24.

### Testfall 4: Flache Tile-Liste

Given ein initialisiertes Board  
When die Tiles gespeichert werden  
Then werden sie als `Tile[]` gespeichert  
And nicht als verschachtelte Matrix.

### Testfall 5: Raster sichtbar

Given das Board wird gerendert  
When die Anwendung angezeigt wird  
Then sind Rasterlinien sichtbar.

### Testfall 6: Kamera-Panning

Given das Board ist sichtbar  
When der Nutzer mit der rechten Maustaste zieht  
Then verschiebt sich die Kameraansicht  
And der `GameState` bleibt unverändert.

### Testfall 7: Zoom

Given das Board ist sichtbar  
When der Nutzer zoomt  
Then ändert sich die Ansichtsskalierung  
And der `GameState` bleibt unverändert.

### Testfall 8: Gültiger Drop

Given ein aktiver Spieler zieht einen eigenen Commander  
And das Ziel ist regelkonform erreichbar  
When der Commander auf das Ziel gedroppt wird  
Then wird die Bewegung übernommen  
And der Commander rastet auf dem Zielfeld ein.

### Testfall 9: Ungültiger Drop

Given ein aktiver Spieler zieht einen eigenen Commander  
And das Ziel ist nicht regelkonform erreichbar  
When der Commander auf das Ziel gedroppt wird  
Then wird der Drop blockiert  
And das Ziel wird rot markiert  
And der `GameState` bleibt unverändert.

### Testfall 10: Fremder Commander

Given `activePlayerId` verweist auf Player 1  
And ein Commander gehört Player 2  
When Player 1 versucht, diesen Commander zu ziehen  
Then wird die Aktion nicht erlaubt.

### Testfall 11: Debug per Taste

Given `debugEnabled` ist `false`  
When die Taste `D` gedrückt wird  
Then wird `debugEnabled` auf `true` gesetzt.

### Testfall 12: Debug per UI-Toggle

Given der Debug-Toggle ist sichtbar  
When der Nutzer den Toggle betätigt  
Then wird der Debug-Modus umgeschaltet  
And der Zustand liegt im `PrototypeUiState`.

### Testfall 13: Tile speichert keine Occupancy

Given ein Commander steht auf einem Tile  
When das Tile-Modell geprüft wird  
Then enthält das Tile keine dauerhafte Commander-ID  
And die Belegung wird aus dem `GameState` abgeleitet.

## Offene spätere Erweiterungen

Spätere Versionen können ergänzen:

- weitere Terrain-Typen
- verdeckte Tiles
- Entdeckung
- Landschaftsplättchensäckchen
- Wald
- Straßen
- Wasser
- Erzberg
- Lehmgrube
- Hütten
- echte Tile-Grafiken
- Sprite-Sheets
- Animationen
- optimiertes Kamera- und Zoomverhalten
- Touch-Input
- serverseitige Input-Validierung
- Multiplayer-spezifische Eingaberechte
- formales Action-/Command-Modell

Diese Erweiterungen sind nicht Teil von Version 1.
