# Spec-Index

## Zweck

Dieses Dokument ist der zentrale Einstiegspunkt für alle fachlichen und technischen Specs des digitalen Brettspiel-Prototyps.

Es beschreibt die Reihenfolge, Zuständigkeit und Abhängigkeiten der Spec-Dateien.

## Grundsatz

Die Specs beschreiben Version 1 des Prototyps präzise, prüfbar und ohne Vermischung mit späteren Erweiterungen.

Leitlinie:

```txt
PixiJS zeigt.
game-core entscheidet.
GameState ist die Wahrheit.
Specs beschreiben.
Tests kontrollieren.
GitHub organisiert.
```

## Spec-Struktur

```txt
specs/
├─ 000-spec-index.md
├─ 001-version-1-scope.md
├─ 002-board-rendering-input.md
├─ 003-commanders-units-king-banner.md
├─ 004-movement-holding-actions.md
├─ 005-combat-and-dice-resolution.md
├─ 006-combat-examples.md
└─ 099-later-expansions-and-open-points.md
```

## Empfohlene Lesereihenfolge

1. `000-spec-index.md`
2. `001-version-1-scope.md`
3. `002-board-rendering-input.md`
4. `003-commanders-units-king-banner.md`
5. `004-movement-holding-actions.md`
6. `005-combat-and-dice-resolution.md`
7. `006-combat-examples.md`
8. `099-later-expansions-and-open-points.md`

## Spec-Übersicht

| Datei | Zweck |
|---|---|
| `000-spec-index.md` | Zentrale Übersicht über alle Specs |
| `001-version-1-scope.md` | Verbindlicher Scope und Nicht-Scope für Version 1 |
| `002-board-rendering-input.md` | Board, Tiles, Rendering, Kamera, Zoom und Drag-and-Drop |
| `003-commanders-units-king-banner.md` | Commander, Units, Slots, König und Banner |
| `004-movement-holding-actions.md` | Bewegung, Aktionen, aktiver Spieler und Festhalten |
| `005-combat-and-dice-resolution.md` | Kampf, Würfelauflösung, Boni, Verluste und Siegbedingungen |
| `006-combat-examples.md` | Regelrepräsentative Kampfbeispiele |
| `099-later-expansions-and-open-points.md` | Spätere Erweiterungen und offene Punkte |

## Abhängigkeiten

| Datei | Hängt ab von | Wird genutzt von |
|---|---|---|
| `001-version-1-scope.md` | Vorbereitungsspec, README, Architekturentscheidungen | Alle anderen Specs |
| `002-board-rendering-input.md` | `001-version-1-scope.md` | Bewegung, UI, Debug, Startzustand |
| `003-commanders-units-king-banner.md` | `001-version-1-scope.md`, Terminologie | Bewegung, Kampf, Siegbedingungen |
| `004-movement-holding-actions.md` | Board-Spec, Commander-Spec | Kampf-Spec, Tests |
| `005-combat-and-dice-resolution.md` | Commander-Spec, Bewegungs-/Aktionsspec | Kampfbeispiele, Tests |
| `006-combat-examples.md` | Kampf-Spec | Testverständnis, manuelle Prüfung |
| `099-later-expansions-and-open-points.md` | Alle vorherigen Specs | spätere Versionen |

## Verbindliche Struktur fachlicher Specs

Jede fachliche Spec-Datei muss mindestens folgende Abschnitte enthalten:

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

## Qualitätsregeln

Für alle Specs gelten folgende Regeln:

- Keine neuen Spielregeln ohne Grundlage in der Vorbereitungsspec.
- Version-1-Inhalte und spätere Erweiterungen strikt trennen.
- Regelrelevante Aussagen prüfbar formulieren.
- Akzeptanzkriterien konkret und testbar schreiben.
- Given/When/Then-Testfälle für regelrelevante Inhalte ergänzen.
- Begriffe konsistent mit `docs/terminology.md` verwenden.
- Code-Bezeichnungen auf Englisch schreiben.
- Deutsche Erklärungen mit „Spalte“ und „Zeile“ formulieren.
- Im Code-Kontext `x` und `y` verwenden.
- `GameState` als regelrelevante Wahrheit behandeln.
- `PrototypeUiState` von `GameState` trennen.
- PixiJS nicht als Regelautorität beschreiben.
- Bewusst vertagte Inhalte klar als spätere Erweiterung markieren.

## Version-1-Kernbereiche

Version 1 deckt diese Kernbereiche ab:

- lokaler Browser-Prototyp
- PixiJS-Rendering
- 24 × 24 Board
- 128 × 128 px Tiles
- nur Gras/Wiese als Terrain
- sichtbares Raster
- Kamera-Panning
- Zoom
- Drag-and-Drop
- Commander als Brettfiguren
- Units in Commander-Slots
- König als Commander mit `isKing: true`
- Banner als Zielobjekt
- regelvalidierte Bewegung
- aktive Spielerlogik über `activePlayerId`
- Festhalten durch Infanterie
- spielbarer Kampf
- Würfelauflösung
- automatische Verluste
- Siegbedingung über König
- Siegbedingung über Banner
- Debug-Modus

## Nicht-Scope von Version 1

Nicht Teil von Version 1 sind insbesondere:

- echter Online-Multiplayer
- Server
- Login
- Datenbank
- Ranking
- Colyseus-Server
- Entdeckung
- verdeckte Felder
- Handel
- Rohstoffe
- Gebäude außer Banner
- Mauern
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

## Testorientierung

Regelrelevante Specs müssen Given/When/Then-Testfälle enthalten.

Mindestens abzudecken sind:

- gültige Bewegung innerhalb der Reichweite
- ungültige Bewegung außerhalb der Reichweite
- belegtes Zielfeld
- diagonale Bewegung mit Kosten 1
- Angriff nach gültiger Reichweitenprüfung
- Bogenschützen: Bewegung oder Schuss, aber nicht beides
- Banner kann nicht durch Bogenschützen zerstört werden
- Banner kann durch Nahkampf eingenommen werden
- besiegter König beendet die Partie
- natürliche Würfelsortierung vor Bonusaddition
- automatische Verlustzuordnung
- überzählige Würfel werden ignoriert
- leere Commander kämpfen als Kavallerie

## Änderungskontrolle

Wenn eine Spec geändert wird, müssen geprüft werden:

- Auswirkungen auf Version-1-Scope
- Auswirkungen auf Datenmodell
- Auswirkungen auf UI
- Auswirkungen auf Akzeptanzkriterien
- Auswirkungen auf Given/When/Then-Testfälle
- Auswirkungen auf spätere Erweiterungen

Keine Spec soll stillschweigend Regeln erweitern.

## Offene Punkte

Offene oder bewusst vertagte Punkte werden zentral in `099-later-expansions-and-open-points.md` gesammelt.

Fachliche Details sollen nicht doppelt gepflegt werden. Die zentrale Datei verweist auf betroffene Specs oder Themenbereiche.
