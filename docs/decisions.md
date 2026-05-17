# Entscheidungen

## Zweck

Dieses Dokument sammelt verbindliche Entscheidungen für Version 1 des digitalen Brettspiel-Prototyps.

Es dient dazu, Scope, technische Grundrichtung und Regelgrenzen stabil zu halten.

## Status

```txt
Gültig für Version 1
```

## Zentrale Leitentscheidung

```txt
PixiJS zeigt.
game-core entscheidet.
GameState ist die Wahrheit.
Specs beschreiben.
Tests kontrollieren.
GitHub organisiert.
```

## Projekt- und Architekturentscheidungen

| Entscheidung | Festlegung |
|---|---|
| Prototyp-Typ | Lokaler Browser-Prototyp |
| Rendering | PixiJS |
| Regelkern | Perspektivisch `packages/game-core/` |
| UI-Zustand | Getrennt als `PrototypeUiState` |
| Regelzustand | `GameState` |
| Multiplayer | Architektonisch vorbereitet, nicht implementiert |
| Backend | Nicht Teil von Version 1 |
| Datenbank | Nicht Teil von Version 1 |
| Login | Nicht Teil von Version 1 |
| Ranking | Nicht Teil von Version 1 |

## Board-Entscheidungen

| Thema | Entscheidung |
|---|---|
| Brettgröße | 24 × 24 Felder |
| Tile-Größe | 128 × 128 px |
| Terrain | Nur Gras/Wiese |
| Terrain-Codewert | `grass` |
| Raster | Immer sichtbar |
| Tile-Speicherung | Flache Liste `Tile[]` |
| Koordinaten im Code | `x`, `y` |
| Deutsche Erklärung | Spalte, Zeile |
| Ursprung | `(1, 1)` oben links |
| Flexible Brettgröße | Datenmodell soll `cols` und `rows` erlauben |

## Rendering-Entscheidungen

| Thema | Entscheidung |
|---|---|
| Startdarstellung | PixiJS-Primitive-Formen |
| Tile-Grafiken | Nicht erforderlich für Version 1 |
| Sprites | Spätere Erweiterung |
| Animationen | Spätere Erweiterung |
| Stilgefühl | Lesbar, taktisch übersichtlich, angelehnt an klassische Strategiespiele |
| Rotationsneutralität | Tiles sollen rotationsneutral bleiben |

## Input- und Kameraentscheidungen

| Thema | Entscheidung |
|---|---|
| Hauptbedienung | Drag-and-Drop |
| Bewegungsauslösung | Commander wird per Drag-and-Drop gezogen |
| Snap-to-Grid | Commander rastet auf Feldposition ein |
| Ungültiger Drop | Wird blockiert und rot markiert |
| Kamera-Panning | Rechte Maustaste |
| Zoom | Unterstützt, bevorzugt per Mausrad |
| Debug-Toggle | Taste `D` und sichtbarer UI-Toggle |

## GameState-Entscheidungen

Der `GameState` enthält nur regelrelevante Daten.

Er enthält insbesondere:

- Board
- Player
- Commander
- Unit
- Banner
- `activePlayerId`
- `turnNumber`

Nicht in den `GameState` gehören:

- Hover-Zustände
- Drag-Zustände
- ausgewählte UI-Elemente
- Debug-Aktivierung
- temporäre Zielmarkierungen
- visuelles Feedback

Diese Daten gehören in den `PrototypeUiState`.

## Figurenentscheidungen

| Thema | Entscheidung |
|---|---|
| Militärische Brettfiguren | Nur Commander |
| Units auf dem Brett | Nicht frei beweglich |
| Unit-Position | Nur über Commander-Slot |
| Slots pro Commander | Genau 4 |
| Slot-Inhalt | Leer oder genau eine Unit |
| Truppengattung pro Commander | Genau eine |
| Gemischte Commander | Nicht in Version 1 |
| Leerer Commander | Kämpft als Kavallerie mit 1 Würfel und Bonus 0 |
| Besiegter leerer Commander | Wird vom Brett entfernt |

## Truppengattungen

Version 1 kennt genau drei Truppengattungen:

```txt
infantry
cavalry
archer
```

Deutsche Begriffe:

| Deutsch | Code |
|---|---|
| Infanterie | `infantry` |
| Kavallerie | `cavalry` |
| Bogenschützen | `archer` |

## König-Entscheidungen

| Thema | Entscheidung |
|---|---|
| König-Modell | Commander mit `isKing: true` |
| Separater König-Typ | Nicht erforderlich |
| König-Darstellung | Commander mit zusätzlicher Markierung |
| König-Bonus | +1 für beteiligte unterstellte Einheiten |
| König ohne Einheiten | Kämpft als Kavallerie mit +1 |
| Besiegter König | Spieler ist besiegt |
| Ultimatum-Modul | Nicht Teil von Version 1 |

## Banner-Entscheidungen

| Thema | Entscheidung |
|---|---|
| Banner-Typ | Gebäude/Zielobjekt |
| Banner ist Commander | Nein |
| Banner besitzt `ownerId` | Ja |
| Banner besitzt Position | Ja |
| Banner blockiert Feld | Ja |
| Banner-Lebenspunkte | Nicht in Version 1 |
| Einnahme | Nur durch erfolgreichen Nahkampfangriff |
| Bogenschützen gegen Banner | Kein gültiges Zerstörungsziel |
| Eingenommenes Banner | Besitzer ist besiegt |

## Bewegungsentscheidungen

| Thema | Entscheidung |
|---|---|
| Bewegungsvalidierung | Schrittweise |
| Drag-Ziel | Wird auf gültige Schrittfolge geprüft |
| Bewegungsrichtungen | 8 Richtungen |
| Diagonale Bewegung | Erlaubt |
| Diagonalkosten | 1 Bewegungspunkt |
| Eigene Figuren überspringen | Erlaubt, wenn Reichweite ausreicht |
| Gegnerische Figuren überspringen | In Version 1 standardmäßig nicht erlaubt |
| Gegnerische Erlaubnisregel | Dokumentiert, später interaktiv |
| Maximal eine Figur pro Feld | Ja |

## Bewegungsreichweiten

| Truppengattung | Bewegung |
|---|---:|
| `infantry` | 1 |
| `cavalry` | 2 |
| `archer` | 1 |

## Angriffsreichweiten

| Truppengattung | Angriff |
|---|---:|
| `infantry` | 1 |
| `cavalry` | 2 |
| `archer` | 2 |

## Aktionsentscheidungen

| Thema | Entscheidung |
|---|---|
| Aktionen pro Commander | Eine Aktion pro Runde/Zug |
| Mögliche Aktionen | Bewegung, Angriff, Schuss |
| Bogenschützen | Bewegen oder schießen, nicht beides |
| Aktiver Spieler | Über `activePlayerId` |
| Fremde Commander bewegen | Nicht erlaubt |
| Formales Command-Modell | Nicht in Version 1 |

## Festhalten-Entscheidungen

| Thema | Entscheidung |
|---|---|
| Festhalten | Passive Spielsituation |
| Voraussetzung | Commander führt `infantry` |
| Kontrollbereich | Acht benachbarte Felder |
| Maximal festgehaltene Figuren pro Infanterie-Commander | Eine |
| Doppelte Festhaltung | Nicht erlaubt |
| Festgehaltene Figur | Darf sich nicht normal weiterbewegen |
| Angriff auf festhaltenden Commander | Erlaubt |
| Festhalten verzichtbar | Ja |

## Kampfentscheidungen

| Thema | Entscheidung |
|---|---|
| Kampf in Version 1 | Spielbar |
| Angreifende Figuren | Commander |
| Ziele | Gegnerische Commander, König, Banner |
| Teilnehmende Units | Alle verfügbaren Units des beteiligten Commanders |
| Freiwillig weniger Units | Nicht erlaubt |
| Maximal Units pro Seite | 4 |
| Leerer Commander | 1 Würfel als Kavallerie |
| Kampf gegen Banner | Nur Nahkampf für Einnahme |
| Bogenschützen gegen Commander | Erlaubt nach Fernkampfregel |
| Bogenschützen gegen Banner | Nicht erlaubt |

## Würfelentscheidungen

| Thema | Entscheidung |
|---|---|
| Würfel pro Unit | 1 |
| Maximal Würfel pro Commander | 4 |
| Leerer Commander | 1 Würfel |
| Würfe | Effektiv gleichzeitig |
| Sortierung | Erst natürlicher Würfelwert absteigend |
| Bonusaddition | Nach der Sortierung |
| Effektive Werte über 6 | Möglich |
| Überzählige Würfel | Werden ignoriert |
| Verlustzuordnung | Automatisch |
| Freie Opferwahl | Nicht erlaubt |

## Kampftabellen-Entscheidung

Der höhere effektive Würfelwert gewinnt.

Bei Gleichstand gewinnt der Angreifer nur in folgender Paarung:

```txt
Infanterie als Angreifer gegen Kavallerie als Verteidiger
```

In allen anderen Paarungen reicht Gleichstand für den Angreifer nicht aus.

## Siegbedingungen

Ein Spieler ist in Version 1 besiegt, wenn:

- sein König besiegt wird, oder
- sein Banner durch erfolgreichen Nahkampfangriff eingenommen wird.

Wenn ein Spieler besiegt ist:

- werden alle Figuren und Einheiten dieses Spielers entfernt
- bleibt kein zusätzliches Ultimatum-Modul aktiv

## Demo-Startzustand

Version 1 verwendet einen festen Demo-Startzustand.

Pro Spieler:

- 1 Banner
- 6 Commander
- 3 Infanterie-Commander
- 1 Kavallerie-Commander
- 2 Bogenschützen-Commander

Der König ist einer der Infanterie-Commander.

König-Ausstattung:

```txt
0, 0, 0, 0
```

Normale Commander-Ausstattung:

```txt
0, 0, 1, 3
```

## Startpositionen

Player 1:

```txt
Banner B1: (13, 9)

Commander-Startfelder:
(10, 9)
(11, 9)
(12, 9)
(14, 9)
(15, 9)
(16, 9)
```

Player 2:

```txt
Banner B2: (13, 16)

Commander-Startfelder:
(10, 16)
(11, 16)
(12, 16)
(14, 16)
(15, 16)
(16, 16)
```

Die Reihenfolge der Commander-Typen auf den Startfeldern ist zufällig.

Für Tests muss die Zufälligkeit kontrollierbar sein, zum Beispiel durch:

- festen Test-Seed
- explizite Testaufstellung ohne Zufall

## Ausdrücklich vertagte Inhalte

Die folgenden Inhalte sind nicht Teil von Version 1:

- echter Online-Multiplayer
- Login
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

## Änderungsregel

Neue Regeln oder Scope-Erweiterungen dürfen nicht stillschweigend ergänzt werden.

Jede Änderung muss:

- als neue Entscheidung dokumentiert werden
- Auswirkungen auf bestehende Specs prüfen
- Version-1-Scope und spätere Erweiterungen getrennt halten
- Akzeptanzkriterien und Tests bei Regeländerungen aktualisieren
