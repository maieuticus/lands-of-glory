# Bewegung, Festhalten und Aktionen

## Zweck

Diese Spec beschreibt Bewegung, Aktionen, aktive Spielerlogik, Angriffsauslösung und Festhalten für Version 1 des digitalen Brettspiel-Prototyps.

Sie legt fest, wie Commander bewegt werden dürfen, wie Drag-and-Drop regelvalidiert wird und wie Infanterie gegnerische Figuren festhalten kann.

## Geltungsbereich für Version 1

Version 1 umfasst:

- Commander-Bewegung per Drag-and-Drop
- regelvalidierte Bewegung
- Schrittvalidierung trotz direktem Drag-Zielfeld
- Bewegung in acht Richtungen
- diagonale Bewegung mit Kosten 1
- Bewegungsreichweiten nach Truppengattung
- Angriffsreichweiten nach Truppengattung
- eine Aktion pro Commander pro Runde beziehungsweise Zug
- aktive Spielerlogik über `activePlayerId`
- eigene Figuren überspringen, wenn Reichweite ausreicht
- gegnerische Figuren standardmäßig nicht überspringen
- maximal eine normale Figur pro Feld
- blockierte ungültige Drops
- Festhalten durch Infanterie
- festgehaltene Figuren dürfen den festhaltenden Commander angreifen
- Bogenschützen dürfen sich bewegen oder schießen, aber nicht beides

## Nicht-Ziele

Version 1 enthält nicht:

- formales Action-/Command-Modell
- mehrstufige Kommandos über mehrere Runden
- komplexes Phasenmodell
- interaktive Erlaubnis beim Überspringen gegnerischer Figuren
- automatische Erlaubnis durch nicht aktive Spieler
- serverseitige Aktionsvalidierung
- verdeckte Bewegung
- Bewegung von Units ohne Commander
- freie Unit-Positionen auf dem Brett
- mehrere Aktionen pro Commander pro Runde
- diagonale Zusatzkosten
- Terrain-basierte Bewegungskosten
- Straßenbonus
- Wasserbewegung
- Schiffsbewegung
- Handelswagenbewegung

## Begriffe

| Begriff | Bedeutung |
|---|---|
| `Commander` | Militärische Brettfigur, die bewegt werden kann |
| `Unit` | Einheit in einem Commander-Slot, nicht frei beweglich |
| `activePlayerId` | Spieler, der aktuell handeln darf |
| `hasActedThisTurn` | Gibt an, ob ein Commander bereits gehandelt hat |
| `Position` | Koordinatenpaar aus `x` und `y` |
| `x` | Spalte im Code |
| `y` | Zeile im Code |
| Bewegung | Positionsänderung eines Commanders |
| Schritt | Bewegung von einem Feld zu einem benachbarten Feld |
| Bewegungsreichweite | Maximale Anzahl erlaubter Schritte |
| Angriffsreichweite | Reichweite, aus der ein Angriff möglich ist |
| Nahkampf | Angriff durch Infanterie oder Kavallerie |
| Schuss | Fernkampfangriff durch Bogenschützen |
| Festhalten | Passive Kontrollwirkung durch Infanterie |
| Kontrollzone | Acht benachbarte Felder eines Infanterie-Commanders |
| gültiger Drop | Regelkonformes Drag-and-Drop-Ziel |
| ungültiger Drop | Nicht regelkonformes Drag-and-Drop-Ziel |

## Regeln

### 1. Nur Commander bewegen sich

In Version 1 bewegen sich nur Commander auf dem Brett.

Units bewegen sich nicht frei. Sie bleiben in Commander-Slots oder sind entfernt.

### 2. Aktiver Spieler

Nur der aktive Spieler darf eigene Commander bewegen oder Angriffe mit ihnen ausführen.

Der aktive Spieler wird über `activePlayerId` bestimmt.

Ein Spieler darf keine gegnerischen Commander bewegen.

### 3. Eine Aktion pro Commander

Jeder Commander kann pro Runde beziehungsweise Zug genau eine Aktion ausführen.

Eine Aktion kann sein:

- Bewegung
- Angriff
- Schuss mit Bogenschützen

Nach einer ausgeführten Aktion wird `hasActedThisTurn` auf `true` gesetzt.

### 4. Keine formalen Commands in Version 1

Version 1 führt noch kein formales Action-/Command-Modell ein.

Drag-and-Drop bleibt die Hauptbedienung.

Spätere Kandidaten für Commands:

```txt
MoveCommanderAction
AttackAction
ShootAction
ResolveCombatAction
EndTurnAction
```

Diese sind in Version 1 nur konzeptionell vorgemerkt.

### 5. Bewegung als Schrittfolge

Bewegung wird immer als Schrittfolge validiert.

Auch wenn der Nutzer per Drag-and-Drop direkt ein Zielfeld ansteuert, muss geprüft werden, ob vom Startfeld zum Zielfeld eine gültige Schrittfolge existiert.

### 6. Nachbarschaft

Ein Schritt kann in acht Richtungen erfolgen:

```txt
oben
unten
links
rechts
oben-links
oben-rechts
unten-links
unten-rechts
```

### 7. Diagonale Bewegung

Diagonale Bewegung ist erlaubt.

Eine diagonale Bewegung kostet:

```txt
1 Bewegungspunkt
```

### 8. Bewegungsreichweiten

| Truppengattung | Bewegungsreichweite |
|---|---:|
| `infantry` | 1 |
| `cavalry` | 2 |
| `archer` | 1 |

### 9. Angriffsreichweiten

| Truppengattung | Angriffsreichweite |
|---|---:|
| `infantry` | 1 |
| `cavalry` | 2 |
| `archer` | 2 |

### 10. Bewegung und Angriff

Ein Angriff verbraucht die Aktion des Commanders.

Nahkampfangriff:

- Infanterie muss das Ziel mit Reichweite 1 erreichen können.
- Kavallerie muss das Ziel mit Reichweite 2 erreichen können.
- Das Zielfeld des Gegners wird nicht betreten.

Bogenschützen:

- können sich bewegen oder schießen
- können nicht in derselben Aktion bewegen und schießen
- schießen auf Reichweite 2

### 11. Eigene Figuren überspringen

Eigene Figuren dürfen übersprungen werden, wenn die Bewegungsreichweite ausreicht.

Das Zielfeld darf trotzdem nicht durch eine blockierende Figur belegt sein.

### 12. Gegnerische Figuren überspringen

Gegnerische Figuren werden in Version 1 standardmäßig nicht übersprungen.

Die Erlaubnisregel wird dokumentiert, aber nicht vollständig interaktiv umgesetzt.

Spätere Regel:

- Wenn eine gegnerische Figur übersprungen werden soll, muss ein Erlaubnisbutton erscheinen.
- Der nicht aktive Spieler kann die Erlaubnis perspektivisch aktiv bestätigen.

Für Version 1 gilt:

```txt
Keine gegnerische Überspring-Erlaubnis wird automatisch erteilt.
```

### 13. Maximal eine normale Figur pro Feld

Auf einem Feld darf maximal eine normale Figur stehen.

Ein Commander darf nicht auf einem Feld enden, das bereits durch eine andere blockierende Figur belegt ist.

Banner blockieren ihr Feld.

### 14. Ungültige Bewegung

Eine Bewegung ist ungültig, wenn:

- der Commander nicht dem aktiven Spieler gehört
- der Commander bereits gehandelt hat
- das Ziel außerhalb des Boards liegt
- keine gültige Schrittfolge existiert
- die Bewegungsreichweite überschritten wird
- das Zielfeld blockiert ist
- eine gegnerische Figur übersprungen werden müsste
- eine Festhalten-Regel die Bewegung verhindert

### 15. Ungültiger Drop

Bei ungültigem Drop gilt:

- Drop wird blockiert
- Ziel wird rot markiert
- Bewegung wird nicht in den `GameState` übernommen
- Commander bleibt regelrelevant auf seiner Startposition

### 16. Festhalten als passive Mechanik

Festhalten ist eine passive Spielsituation, keine aktive Aktion.

Ein Commander kann festhalten, wenn er Infanterie führt.

```txt
Commander mit TroopType infantry -> kann festhalten
Commander mit TroopType cavalry  -> kann nicht festhalten
Commander mit TroopType archer   -> kann nicht festhalten
```

### 17. Kontrollzone

Ein Infanterie-Commander kann gegnerische Figuren in den acht benachbarten Feldern festhalten.

Die Kontrollzone entspricht der direkten Nachbarschaft.

### 18. Maximal eine festgehaltene Figur

Ein Infanterie-Commander kann maximal eine gegnerische Figur festhalten.

Wenn mehrere gegnerische Figuren angrenzen, entscheidet der Spieler, dessen Figuren betroffen sind, welche Figur festgehalten wird beziehungsweise welche weiterziehen darf.

### 19. Festhalten ist verzichtbar

Festhalten entsteht grundsätzlich automatisch, sobald die Stellung besteht.

Der Spieler des Infanterie-Commanders kann aber entscheiden, nicht festzuhalten.

### 20. Keine doppelte Festhaltung

Eine Figur kann nicht doppelt festgehalten werden.

Mehrere eigene Infanterie-Commander können mehrere unterschiedliche gegnerische Figuren festhalten, sofern die jeweiligen Figuren angrenzen.

### 21. Rechte einer festgehaltenen Figur

Eine festgehaltene Figur darf sich nicht normal weiterbewegen.

Sie darf aber den festhaltenden Commander angreifen.

### 22. Ende des Festhaltens

Festhalten gilt so lange, wie die benachbarte Stellung zwischen gegnerischer Figur und Infanterie-Commander besteht.

Es endet erst, wenn sich diese Stellung verändert.

## Datenmodell-Auswirkung

### Commander

`Commander` benötigt:

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

### GameState

Der `GameState` benötigt:

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

### PrototypeUiState

Für Bewegung und Drag-and-Drop relevant:

```ts
export type PrototypeUiState = {
  selectedCommanderId?: string;
  hoveredTile?: Position;
  draggedCommanderId?: string;
  currentDragTarget?: Position;
  debugEnabled: boolean;
};
```

### Abgeleitete Zustände

Folgende Zustände können aus dem `GameState` abgeleitet werden:

- belegte Felder
- gültige Bewegungsziele
- gültige Angriffsziele
- kontrollierte Felder
- festgehaltene Figuren
- blockierte Pfade

Sie müssen nicht dauerhaft auf Tiles gespeichert werden.

## UI-Auswirkung

Die UI muss ermöglichen:

- Commander per Drag-and-Drop zu bewegen
- gültige Bewegungsziele sichtbar zu machen
- ungültige Ziele rot zu markieren
- geprüfte Pfade im Debug-Modus anzuzeigen
- Bewegungsreichweite im Debug-Modus anzuzeigen
- Angriffsreichweite im Debug-Modus anzuzeigen
- kontrollierte Felder im Debug-Modus anzuzeigen
- festgehaltene Figuren erkennbar zu machen
- aktive Spieler-ID sichtbar zu machen, mindestens im Debug-Modus
- `hasActedThisTurn` visuell nachvollziehbar zu machen

Die UI darf keine regelwidrige Bewegung in den `GameState` übernehmen.

## Akzeptanzkriterien

Diese Spec ist erfüllt, wenn:

- nur Commander bewegt werden können
- Units nicht frei auf dem Board bewegt werden können
- nur der aktive Spieler eigene Commander bewegen kann
- gegnerische Commander nicht bewegt werden können
- ein Commander mit `hasActedThisTurn: true` keine weitere Aktion ausführen kann
- Bewegung als Schrittfolge validiert wird
- acht Bewegungsrichtungen unterstützt werden
- diagonale Bewegung erlaubt ist
- diagonale Bewegung Kosten 1 hat
- Infanterie eine Bewegungsreichweite von 1 hat
- Kavallerie eine Bewegungsreichweite von 2 hat
- Bogenschützen eine Bewegungsreichweite von 1 haben
- Infanterie eine Angriffsreichweite von 1 hat
- Kavallerie eine Angriffsreichweite von 2 hat
- Bogenschützen eine Angriffsreichweite von 2 haben
- eigene Figuren übersprungen werden können, wenn Reichweite ausreicht
- gegnerische Figuren standardmäßig nicht übersprungen werden können
- blockierte Zielfelder nicht betreten werden können
- Banner-Felder blockieren
- ungültige Drops blockiert und rot markiert werden
- ungültige Drops den `GameState` nicht ändern
- Bogenschützen sich bewegen oder schießen können, aber nicht beides in einer Aktion
- Infanterie-Commander gegnerische Figuren in benachbarten Feldern festhalten können
- Kavallerie- und Archer-Commander nicht festhalten können
- ein Infanterie-Commander maximal eine gegnerische Figur festhalten kann
- eine Figur nicht doppelt festgehalten werden kann
- eine festgehaltene Figur den festhaltenden Commander angreifen darf
- Festhalten endet, wenn die benachbarte Stellung verändert wird

## Given/When/Then-Testfälle

### Testfall 1: Aktiver Spieler bewegt eigenen Commander

Given `activePlayerId` ist Player 1  
And ein Commander gehört Player 1  
When Player 1 diesen Commander auf ein gültiges Ziel zieht  
Then wird die Bewegung erlaubt.

### Testfall 2: Aktiver Spieler bewegt fremden Commander

Given `activePlayerId` ist Player 1  
And ein Commander gehört Player 2  
When Player 1 diesen Commander ziehen will  
Then wird die Aktion abgelehnt.

### Testfall 3: Commander hat bereits gehandelt

Given ein Commander hat `hasActedThisTurn: true`  
When der Spieler diesen Commander bewegen will  
Then wird die Bewegung abgelehnt.

### Testfall 4: Infanterie bewegt sich ein Feld

Given ein Commander hat `troopType: 'infantry'`  
And steht auf `(10, 9)`  
When er auf ein benachbartes Feld zieht  
Then ist die Bewegung gültig.

### Testfall 5: Infanterie bewegt sich zu weit

Given ein Commander hat `troopType: 'infantry'`  
And steht auf `(10, 9)`  
When er zwei Schritte entfernt gedroppt wird  
Then ist die Bewegung ungültig.

### Testfall 6: Kavallerie bewegt sich zwei Felder

Given ein Commander hat `troopType: 'cavalry'`  
And steht auf `(10, 9)`  
When er über eine gültige Schrittfolge zwei Felder weit zieht  
Then ist die Bewegung gültig.

### Testfall 7: Diagonale Bewegung kostet 1

Given ein Commander steht auf `(10, 9)`  
When er diagonal auf `(11, 10)` zieht  
Then kostet die Bewegung 1 Bewegungspunkt.

### Testfall 8: Bogenschütze bewegt sich ein Feld

Given ein Commander hat `troopType: 'archer'`  
And steht auf `(10, 9)`  
When er ein Feld weit zieht  
Then ist die Bewegung gültig.

### Testfall 9: Bogenschütze bewegt sich und schießt nicht zusätzlich

Given ein Archer-Commander hat sich in diesem Zug bewegt  
When er danach schießen soll  
Then wird der Schuss abgelehnt.

### Testfall 10: Bogenschütze schießt ohne Bewegung

Given ein Archer-Commander hat ein gültiges Ziel in Reichweite 2  
And hat noch nicht gehandelt  
When er schießt  
Then ist die Aktion gültig  
And `hasActedThisTurn` wird auf `true` gesetzt.

### Testfall 11: Eigenes Überspringen

Given ein eigener Commander blockiert ein Zwischenfeld  
And die Bewegungsreichweite reicht aus  
When ein Commander über dieses Feld zieht  
Then darf das eigene Zwischenfeld übersprungen werden.

### Testfall 12: Gegnerisches Überspringen

Given ein gegnerischer Commander blockiert ein Zwischenfeld  
When ein Commander über dieses Feld ziehen soll  
Then ist die Bewegung in Version 1 ungültig.

### Testfall 13: Belegtes Zielfeld

Given ein Zielfeld ist durch einen Commander belegt  
When ein anderer Commander auf dieses Feld ziehen soll  
Then ist die Bewegung ungültig.

### Testfall 14: Banner blockiert Zielfeld

Given ein Banner steht auf `(13, 9)`  
When ein Commander normal auf dieses Feld ziehen soll  
Then ist die Bewegung ungültig.

### Testfall 15: Ungültiger Drop ändert GameState nicht

Given ein Commander steht auf `(10, 9)`  
And das Drop-Ziel ist ungültig  
When der Commander gedroppt wird  
Then bleibt seine Position im `GameState` `(10, 9)`.

### Testfall 16: Infanterie hält fest

Given ein Infantry-Commander steht neben einem gegnerischen Commander  
When Festhalten geprüft wird  
Then kann der Infantry-Commander diesen gegnerischen Commander festhalten.

### Testfall 17: Kavallerie hält nicht fest

Given ein Cavalry-Commander steht neben einem gegnerischen Commander  
When Festhalten geprüft wird  
Then kann der Cavalry-Commander nicht festhalten.

### Testfall 18: Archer hält nicht fest

Given ein Archer-Commander steht neben einem gegnerischen Commander  
When Festhalten geprüft wird  
Then kann der Archer-Commander nicht festhalten.

### Testfall 19: Festgehaltene Figur bewegt sich nicht normal

Given ein Commander ist festgehalten  
When er sich normal wegbewegen soll  
Then wird die Bewegung abgelehnt.

### Testfall 20: Festgehaltene Figur greift Halter an

Given ein Commander ist von einem Infantry-Commander festgehalten  
When er den festhaltenden Commander angreift  
Then ist der Angriff erlaubt, sofern die Angriffsregel erfüllt ist.

### Testfall 21: Keine doppelte Festhaltung

Given ein Commander grenzt an zwei gegnerische Infantry-Commander  
When Festhalten berechnet wird  
Then darf dieser Commander nicht doppelt festgehalten werden.

### Testfall 22: Ende des Festhaltens

Given ein Commander wird von einem benachbarten Infantry-Commander festgehalten  
When die benachbarte Stellung durch eine gültige Regelauflösung endet  
Then endet das Festhalten.

## Offene spätere Erweiterungen

Spätere Versionen können ergänzen:

- formales Action-/Command-Modell
- `MoveCommanderAction`
- `AttackAction`
- `ShootAction`
- `ResolveCombatAction`
- `EndTurnAction`
- serverseitige Aktionsvalidierung
- echte Multiplayer-Zugrechte
- interaktive Erlaubnis beim Überspringen gegnerischer Figuren
- Erlaubnisbutton für nicht aktive Spieler
- komplexes Phasenmodell
- mehrstufige Kommandos
- Terrain-basierte Bewegungskosten
- Straßenbonus
- Wasserbewegung
- Schiffsbewegung
- Handelswagenbewegung
- Spezialbewegungen
- erweiterte Kontrollzonen
- explizite Halte-UI mit Auswahl der betroffenen Figur

Diese Erweiterungen sind nicht Teil von Version 1.
