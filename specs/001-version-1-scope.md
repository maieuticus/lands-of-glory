# Version-1-Scope

## Zweck

Diese Spec definiert den verbindlichen Funktionsumfang von Version 1 des digitalen Brettspiel-Prototyps.

Sie grenzt klar ab, welche Inhalte in Version 1 enthalten sind und welche Inhalte bewusst späteren Versionen vorbehalten bleiben.

## Geltungsbereich für Version 1

Version 1 ist ein lokal spielbarer Browser-Prototyp mit PixiJS.

Version 1 enthält:

- lokaler Browser-Prototyp
- PixiJS für Darstellung, Input, Kamera und visuelles Feedback
- 24 × 24 Spielfeld
- Tile-Größe 128 × 128 px
- ausschließlich Gras-/Wiesenfelder
- immer sichtbares Raster
- Kamera-Panning
- Zoom
- Drag-and-Drop als Hauptbedienung
- Commander als einzige militärische Figuren auf dem Brett
- Units ausschließlich in Commander-Slots oder aus dem Spiel entfernt
- genau vier Slots pro Commander
- genau eine Truppengattung pro Commander
- Truppengattungen `infantry`, `cavalry`, `archer`
- König als Commander mit `isKing: true`
- Banner als Gebäude/Zielobjekt
- regelvalidierte Bewegung
- diagonale Bewegung mit Kosten 1
- aktive Spielerlogik über `activePlayerId`
- Festhalten durch Infanterie
- spielbarer Kampf
- Würfelauflösung
- natürliche Würfelsortierung vor Bonusaddition
- automatische Verlustzuordnung
- leere Commander kämpfen als Kavallerie
- König-Siegbedingung
- Banner-Siegbedingung
- Debug-Modus über Taste `D`
- Debug-Modus über UI-Toggle
- strukturelle Vorbereitung für spätere Multiplayer-Fähigkeit

## Nicht-Ziele

Version 1 enthält nicht:

```txt
- echter Online-Multiplayer mit Server
- Login-System mit Backend
- Datenbank
- Ranking
- Colyseus-Server
- Entdeckung
- verdeckte Felder
- Landschaftsplättchensäckchen
- Handel
- Handelsfiguren
- Handelswagen
- Schiffe
- Wald
- Straßen
- Lehmgrube
- Hütten
- Wasser
- Erzberg
- Rohstoffe
- Marktbereich
- Hauptstraße
- Objektpreise
- Gebäude außer Banner
- Mauern
- Katapulte
- Tribock
- Belagerungswaffen
- Sonderkarten
- Vasallen
- Lehnsherren
- Ultimatum
- GloryPoints
- Goldvermögen
- alternatives Schlachtfeld
- komplexes Phasenmodell
- formales Action-/Command-Modell
- mehrstufige Kommandos über mehrere Runden
```

Begriffe aus späteren Modulen dürfen dokumentiert werden, erzeugen aber keine Version-1-Mechanik.

## Begriffe

| Begriff | Bedeutung |
|---|---|
| `GameState` | Regelrelevante Wahrheit des Spiels |
| `PrototypeUiState` | Temporärer UI-Zustand für Auswahl, Hover, Drag und Debug |
| `Board` | Gesamtes Spielfeld |
| `Tile` | Einzelnes Feld |
| `Commander` | Militärische Brettfigur mit Slots |
| `Unit` | Einheit innerhalb eines Commander-Slots |
| `Banner` | Zielobjekt beziehungsweise Gebäude |
| `Player` | Spieler einer Partie |
| `activePlayerId` | ID des Spielers, der aktuell handeln darf |
| `TroopType` | Truppengattung eines Commanders oder einer Unit |
| `infantry` | Infanterie |
| `cavalry` | Kavallerie |
| `archer` | Bogenschützen |
| `isKing` | Kennzeichnung eines Commanders als König |

## Regeln

### 1. Lokaler Prototyp

Version 1 läuft lokal im Browser.

Es gibt keinen echten Serverbetrieb, keine persistente Datenhaltung und kein Login-System.

### 2. PixiJS-Verantwortung

PixiJS ist zuständig für:

- Rendering
- Kamera
- Zoom
- Drag-and-Drop
- visuelles Feedback
- Debug-Anzeigen
- UI-nahe Zustände

PixiJS ist nicht die dauerhafte Regelautorität.

### 3. game-core-Verantwortung

`game-core` ist perspektivisch zuständig für:

- Bewegungsvalidierung
- Kampfauflösung
- Würfelauflösung
- Verlustzuordnung
- Siegbedingungen
- aktive Spielerlogik
- regelnahe Tests

### 4. GameState

Der `GameState` enthält die regelrelevante Wahrheit.

Er enthält unter anderem:

- Board
- Player
- Commander
- Unit
- Banner
- `activePlayerId`
- `turnNumber`

### 5. PrototypeUiState

Der `PrototypeUiState` enthält temporäre UI-Zustände.

Dazu gehören:

- ausgewählter Commander
- Hover-Feld
- gezogener Commander
- aktuelles Drag-Ziel
- Debug-Aktivierung

### 6. Board

Version 1 verwendet ein 24 × 24 Board mit ausschließlich Gras-/Wiesenfeldern.

Alle Felder sind sichtbar. Es gibt keine Entdeckung und keine verdeckten Felder.

### 7. Commander und Units

Nur Commander stehen als militärische Figuren auf dem Brett.

Units befinden sich ausschließlich:

- in einem Commander-Slot, oder
- außerhalb des Spiels, wenn sie entfernt wurden.

### 8. König

Der König ist ein Commander mit:

```ts
isKing: true
```

Wird der König besiegt, ist der zugehörige Spieler besiegt.

### 9. Banner

Das Banner ist ein Gebäude beziehungsweise Zielobjekt.

Wird das Banner eines Spielers durch erfolgreichen Nahkampfangriff eingenommen, ist dieser Spieler besiegt.

### 10. Bewegung

Bewegung wird regelvalidiert.

Auch wenn der Spieler per Drag-and-Drop direkt ein Zielfeld ansteuert, muss geprüft werden, ob eine gültige Schrittfolge existiert.

Diagonale Bewegung ist erlaubt und kostet 1 Bewegungspunkt.

### 11. Aktionen

Ein Commander kann pro Runde beziehungsweise Zug genau eine Aktion ausführen.

Eine Aktion kann sein:

- Bewegung
- Angriff
- Schuss mit Bogenschützen

Bogenschützen dürfen sich bewegen oder schießen, aber nicht beides in derselben Aktion.

### 12. Festhalten

Infanterie kann gegnerische Figuren in angrenzenden Feldern passiv festhalten.

Festhalten ist keine aktive Aktion.

### 13. Kampf

Kampf ist in Version 1 spielbar.

Kampf umfasst:

- Angriff durch Commander
- Teilnahme aller verfügbaren Units des beteiligten Commanders
- Würfelauflösung
- Bonusaddition
- automatische Verlustzuordnung
- Entfernung besiegter Units
- Entfernung besiegter leerer Commander
- König- und Banner-Siegbedingungen

### 14. Debug

Debug ist Teil des `PrototypeUiState`.

Debug wird aktiviert oder deaktiviert über:

- Taste `D`
- sichtbaren UI-Toggle

## Datenmodell-Auswirkung

Version 1 benötigt mindestens folgende Datenmodelle:

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

```ts
export type PrototypeUiState = {
  selectedCommanderId?: string;
  hoveredTile?: Position;
  draggedCommanderId?: string;
  currentDragTarget?: Position;
  debugEnabled: boolean;
};
```

Weitere betroffene Modelle:

- `Board`
- `Tile`
- `Position`
- `Player`
- `Commander`
- `Unit`
- `Banner`
- `TroopType`

## UI-Auswirkung

Die UI von Version 1 muss darstellen oder ermöglichen:

- 24 × 24 Board
- Gras-/Wiesenfelder
- sichtbares Raster
- Commander
- vier Slots pro Commander
- Units in Slots
- Bonuspunkte von Units
- König-Markierung
- Banner
- Spielerfarben
- aktiver Spieler
- Drag-and-Drop
- gültige Ziele
- ungültige Ziele
- Kamera-Panning
- Zoom
- Debug-Toggle
- Debug-Anzeigen

Ungültige Drops müssen blockiert und rot markiert werden.

## Akzeptanzkriterien

Version 1 erfüllt diese Scope-Spec, wenn:

- der Prototyp lokal im Browser läuft
- PixiJS für Darstellung, Input und Kamera verwendet wird
- ein 24 × 24 Board sichtbar ist
- alle Tiles als Gras/Wiese dargestellt werden
- Rasterlinien sichtbar sind
- Kamera-Panning funktioniert
- Zoom funktioniert
- Commander sichtbar sind
- Units nur in Commander-Slots dargestellt werden
- jeder Commander genau vier Slots besitzt
- jeder Commander genau eine Truppengattung führt
- ein König als Commander mit besonderer Markierung existiert
- ein Banner als Zielobjekt existiert
- `activePlayerId` beachtet wird
- nur der aktive Spieler seine Commander bewegen oder angreifen lassen kann
- Bewegung regelvalidiert wird
- diagonale Bewegung Kosten 1 hat
- ungültige Drops blockiert und rot markiert werden
- Festhalten durch Infanterie berücksichtigt wird
- Kampf spielbar aufgelöst wird
- Würfel erst natürlich sortiert und danach mit Boni verrechnet werden
- Verluste automatisch zugeordnet werden
- besiegte Units entfernt werden
- leere Commander als Kavallerie kämpfen
- besiegte leere Commander entfernt werden
- besiegter König den Spieler besiegt
- eingenommenes Banner den Spieler besiegt
- Debug über Taste `D` und UI-Toggle aktivierbar ist
- kein Server, Login, keine Datenbank und kein Ranking benötigt werden

## Given/When/Then-Testfälle

### Testfall 1: Lokaler Start

Given ein Version-1-Prototyp  
When die Anwendung im Browser geöffnet wird  
Then wird ein lokales 24 × 24 Board angezeigt  
And es ist kein Server-Login erforderlich.

### Testfall 2: Board-Scope

Given das Board wird initialisiert  
When die Tiles erzeugt werden  
Then entstehen 24 × 24 Felder  
And jedes Feld hat `terrainType: 'grass'`.

### Testfall 3: Commander-Scope

Given ein Commander wird erzeugt  
When seine Slots geprüft werden  
Then besitzt er genau vier Slots  
And jeder Slot ist leer oder enthält genau eine Unit.

### Testfall 4: Unit-Scope

Given eine Unit ist aktiv  
When ihr Zustand geprüft wird  
Then befindet sie sich in einem Commander-Slot  
And sie besitzt keine eigene dauerhafte Brettposition.

### Testfall 5: König-Scope

Given ein Commander besitzt `isKing: true`  
When der Commander gerendert wird  
Then wird er als König erkennbar markiert.

### Testfall 6: Banner-Scope

Given ein Banner gehört einem Spieler  
When das Banner auf dem Board dargestellt wird  
Then ist es als Zielobjekt erkennbar  
And es ist kein Commander.

### Testfall 7: Aktiver Spieler

Given `activePlayerId` verweist auf Player 1  
When Player 2 versucht, einen eigenen Commander zu bewegen  
Then wird die Aktion abgelehnt.

### Testfall 8: Nicht-Scope Server

Given Version 1 wird gestartet  
When eine Partie lokal ausgeführt wird  
Then ist kein echter Online-Multiplayer erforderlich  
And es wird keine Datenbank benötigt.

## Offene spätere Erweiterungen

Spätere Versionen können ergänzen:

- echter Online-Multiplayer
- serverautoritärer `GameState`
- Colyseus-Anbindung
- Login
- Datenbank
- Ranking
- weitere Terrain-Typen
- Entdeckung
- verdeckte Felder
- Handel
- Rohstoffe
- zusätzliche Gebäude
- Belagerungswaffen
- Sonderkarten
- komplexes Phasenmodell
- formales Action-/Command-Modell

Diese Erweiterungen dürfen Version 1 nicht verdeckt erweitern.
