# Boardgame Digital Prototype

## Zweck des Projekts

Dieses Projekt beschreibt und vorbereitet einen ersten spielbaren digitalen Prototyp eines taktischen Brettspiels.

Der Prototyp läuft in Version 1 lokal im Browser. PixiJS übernimmt Darstellung, Kamera, Input, Drag-and-Drop und visuelles Feedback. Die regelrelevante Spiellogik wird konzeptionell getrennt davon im späteren `game-core` vorbereitet.

Die zentrale technische Leitlinie lautet:

```txt
PixiJS zeigt.
game-core entscheidet.
GameState ist die Wahrheit.
Specs beschreiben.
Tests kontrollieren.
GitHub organisiert.
```

## Ziel von Version 1

Version 1 soll einen lokal spielbaren Prototyp bereitstellen, der die Kernmechaniken des Spiels demonstriert.

Version 1 umfasst:

- ein 24 × 24 Spielfeld
- ausschließlich Gras-/Wiesenfelder
- sichtbares Raster
- Kamera-Panning
- Zoom
- Drag-and-Drop als Hauptbedienung
- Kommandeure als einzige militärische Figuren auf dem Brett
- Einheiten in Kommandeur-Slots
- genau vier Slots pro Kommandeur
- genau eine Truppengattung pro Kommandeur
- Truppengattungen `infantry`, `cavalry` und `archer`
- König als besonderer Commander mit `isKing: true`
- Banner als Zielobjekt/Gebäude
- regelvalidierte Bewegung
- spielbaren Kampf
- Würfelauflösung
- automatische Verlustzuordnung
- Siegbedingungen über König oder Banner
- Debug-Modus mit Taste `D` und UI-Toggle
- aktive Spielerlogik über `activePlayerId`

## Nicht-Ziele von Version 1

Version 1 ist kein vollständiges Online-Spiel.

Nicht enthalten sind insbesondere:

- echter Online-Multiplayer mit Server
- Login-System
- Datenbank
- Ranking
- Colyseus-Server
- Entdeckung
- verdeckte Felder
- Handel
- Handelsfiguren
- Handelswagen
- Schiffe
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

Spätere Erweiterungen dürfen dokumentiert werden, müssen aber klar vom Version-1-Scope getrennt bleiben.

## Technische Grundidee

Das Projekt folgt einer klaren Trennung zwischen Darstellung und Spiellogik.

### PixiJS

PixiJS ist zuständig für:

- Rendering des Bretts
- Rendering von Kommandeuren, Einheiten, König und Banner
- Kamera-Panning
- Zoom
- Drag-and-Drop
- visuelles Feedback
- Debug-Overlays
- UI-nahe Zustände

### game-core

`game-core` ist perspektivisch zuständig für:

- regelvalidierte Bewegung
- Kampfentscheidung
- Würfelauflösung
- automatische Verlustzuordnung
- Siegbedingungen
- aktive Spielerlogik
- prüfbare Regeltests

### GameState

Der `GameState` ist die regelrelevante Wahrheit.

Er enthält unter anderem:

- Board
- Player
- Commander
- Unit
- Banner
- `activePlayerId`
- `turnNumber`

Temporäre UI-Zustände wie Auswahl, Hover, Drag-Ziel oder Debug-Anzeige gehören nicht in den `GameState`, sondern in einen separaten `PrototypeUiState`.

## Geplante Projektstruktur

```txt
boardgame-digital/
├─ README.md
├─ docs/
│  ├─ architecture.md
│  ├─ decisions.md
│  ├─ roadmap.md
│  ├─ terminology.md
│  └─ references.md
├─ specs/
│  ├─ 000-spec-index.md
│  ├─ 001-version-1-scope.md
│  ├─ 002-board-rendering-input.md
│  ├─ 003-commanders-units-king-banner.md
│  ├─ 004-movement-holding-actions.md
│  ├─ 005-combat-and-dice-resolution.md
│  ├─ 006-combat-examples.md
│  └─ 099-later-expansions-and-open-points.md
├─ apps/
│  └─ prototype/
├─ packages/
│  └─ game-core/
└─ .github/
   ├─ ISSUE_TEMPLATE/
   └─ pull_request_template.md
```

## Dokumentation

Die Dokumentation liegt unter `docs/`.

Wichtige Dokumente:

- `docs/architecture.md` beschreibt die technische Architektur.
- `docs/decisions.md` sammelt verbindliche Entscheidungen.
- `docs/roadmap.md` beschreibt geplante Entwicklungsstufen.
- `docs/terminology.md` definiert deutsche Begriffe und englische Code-Bezeichnungen.
- `docs/references.md` sammelt Referenzen, Bildquellen und spätere Asset-Hinweise.

## Specs

Die fachlichen und technischen Specs liegen unter `specs/`.

Jede regelrelevante Spec soll mindestens folgende Abschnitte enthalten:

1. Zweck
2. Geltungsbereich für Version 1
3. Nicht-Ziele
4. Begriffe
5. Regeln
6. Datenmodell-Auswirkung
7. UI-Auswirkung
8. Akzeptanzkriterien
9. Given/When/Then-Testfälle
10. Offene spätere Erweiterungen

## Startanleitung

Für Version 1 ist zunächst ein lokaler Browser-Prototyp vorgesehen.

Die spätere technische Umsetzung soll voraussichtlich unter folgendem Pfad liegen:

```txt
apps/prototype/
```

Die regelrelevante Logik soll perspektivisch unter folgendem Pfad vorbereitet werden:

```txt
packages/game-core/
```

Dieses Repository enthält zunächst die Markdown-Spec-Umgebung. Implementierungscode wird erst ergänzt, wenn die Specs ausreichend stabil sind.

## Status

Aktueller Status:

```txt
Spec-Vorbereitung
```

Die Projektstruktur und die Markdown-Specs werden schrittweise aufgebaut.

## Wichtiger Hinweis

Dieses Projekt beschreibt zunächst einen lokalen PixiJS-Prototyp. Es handelt sich nicht um ein fertiges Online-Spiel.

Version 1 soll spielbare Kernmechaniken demonstrieren und eine spätere Multiplayer-fähige Architektur vorbereiten, aber keinen echten Serverbetrieb, kein Login-System und keine persistente Datenhaltung implementieren.
