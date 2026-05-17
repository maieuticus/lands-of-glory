# Spätere Erweiterungen und offene Punkte

## Zweck

Diese Spec sammelt bewusst vertagte Inhalte, spätere Erweiterungen und nicht-blockierende offene Punkte für den digitalen Brettspiel-Prototyp.

Sie verhindert, dass spätere Ideen versehentlich in den Version-1-Scope einfließen.

## Geltungsbereich für Version 1

Version 1 nutzt dieses Dokument nur als Sammel- und Abgrenzungsstelle.

Dieses Dokument:

- sammelt spätere Erweiterungen
- markiert offene Punkte
- trennt Version-1-Scope von späteren Versionen
- verweist auf Themenbereiche, die später eigene Specs benötigen können

Dieses Dokument führt keine neuen Version-1-Regeln ein.

## Nicht-Ziele

Dieses Dokument ist nicht dafür gedacht:

- Version-1-Regeln zu erweitern
- Implementierungscode zu definieren
- spätere Features sofort umzusetzen
- offene Punkte stillschweigend als entschieden zu behandeln
- Server-, Login-, Datenbank- oder Ranking-Funktionen in Version 1 aufzunehmen

## Begriffe

| Begriff | Bedeutung |
|---|---|
| spätere Erweiterung | Inhalt, der bewusst nicht Teil von Version 1 ist |
| offener Punkt | Noch nicht final spezifizierter oder organisatorisch offener Aspekt |
| nicht-blockierend | Punkt, der den Start der Version-1-Specs nicht verhindert |
| Version-1-Scope | Verbindlicher Umfang des ersten lokalen Prototyps |
| späteres Modul | Funktion oder Regelbereich für eine zukünftige Version |

## Regeln

### 1. Version-1-Scope bleibt verbindlich

Version 1 bleibt beschränkt auf den lokal spielbaren PixiJS-Prototyp mit den in `001-version-1-scope.md` beschriebenen Kernmechaniken.

Spätere Inhalte in dieser Datei dürfen Version 1 nicht erweitern.

### 2. Keine verdeckte Regelübernahme

Ein Begriff in dieser Datei erzeugt keine Spielmechanik für Version 1.

Beispiel:

```txt
Wald ist als spätere Erweiterung erwähnt.
Daraus folgt nicht, dass Version 1 Wald-Tiles kennt.
```

### 3. Spätere Features benötigen eigene Specs

Sobald ein vertagtes Thema umgesetzt werden soll, benötigt es mindestens:

- fachliche Beschreibung
- Version-Scope
- Nicht-Ziele
- Datenmodell-Auswirkung
- UI-Auswirkung
- Akzeptanzkriterien
- Given/When/Then-Testfälle

### 4. Offene Punkte nicht doppelt pflegen

Offene Punkte sollen zentral dokumentiert werden.

Fachliche Details gehören in die jeweils betroffene Fachspec, sobald sie konkretisiert werden.

## Bewusst vertagte technische Inhalte

Nicht Teil von Version 1:

- echter Online-Multiplayer
- Server
- Colyseus-Server
- Login-System
- Datenbank
- Ranking
- persistente Spielstände
- Matchmaking
- serverautoritärer Spielzustand
- Nutzerkonten
- Match-Historie
- Statistiken
- langfristige Spielerprofile

## Bewusst vertagte Board- und Terrain-Inhalte

Nicht Teil von Version 1:

- Entdeckung
- verdeckte Felder
- Landschaftsplättchensäckchen
- Wald
- Straßen
- Lehmgrube
- Hütten
- Wasser
- Erzberg
- weitere Geländearten
- Terrain-basierte Bewegungskosten
- Straßenbonus
- rotationsabhängige Tiles

Version 1 verwendet ausschließlich:

```txt
grass
```

## Bewusst vertagte Wirtschafts- und Handelsinhalte

Nicht Teil von Version 1:

- Handel
- Handelsfiguren
- Handelswagen
- Rohstoffe
- Marktbereich
- Hauptstraße
- Objektpreise
- Produktionsregeln
- Kaufregeln
- Ressourcenverbrauch
- Ressourcenlagerung

## Bewusst vertagte Gebäude und Objekte

Nicht Teil von Version 1:

- Gebäude außer Banner
- Mauern
- Hütten als Gebäude
- Marktgebäude
- Produktionsgebäude
- Verteidigungsanlagen
- Banner-Lebenspunkte
- Banner-Zerstörung durch Fernkampf
- Banner-Zerstörung durch Belagerungswaffen

Version 1 kennt nur das Banner als Zielobjekt beziehungsweise Gebäude.

## Bewusst vertagte Kampf- und Belagerungsinhalte

Nicht Teil von Version 1:

- Katapulte
- Tribock
- Belagerungswaffen
- Mauerkampf
- alternatives Schlachtfeld
- komplexe Kampfphasen
- freiwillige Auswahl teilnehmender Units
- freie Verlustwahl
- Kampfkarten
- Sonderkarten
- komplexe Kampfprotokolle
- Banner-Lebenspunkte
- Fernkampf gegen Banner

## Bewusst vertagte Herrschafts- und Fortschrittsinhalte

Nicht Teil von Version 1:

- Vasallen
- Lehnsherren
- Ultimatum
- GloryPoints
- Goldvermögen
- Diplomatie
- langfristige Herrschaftssysteme
- Kampagnenfortschritt

## Bewusst vertagte Aktions- und Command-Inhalte

Version 1 enthält kein formales Action-/Command-Modell.

Spätere Kandidaten:

```txt
MoveCommanderAction
AttackAction
ShootAction
ResolveCombatAction
EndTurnAction
```

Mögliche spätere Erweiterungen:

- formalisiertes Command-Modell
- Undo-/Redo-Fähigkeit
- serverseitig validierbare Commands
- Event-Log
- Replay-Fähigkeit
- deterministische Simulation
- Zughistorie

## Bewusst vertagte Multiplayer-Inhalte

Version 1 bereitet Multiplayer nur architektonisch vor.

Spätere Multiplayer-Themen:

- serverautoritärer `GameState`
- getrennte Spielerperspektiven
- echte Netzwerksynchronisierung
- Zugvalidierung auf dem Server
- Verbindungsabbrüche
- Reconnect
- Match-Erstellung
- Lobby-System
- Spielerzuordnung
- private Informationen
- Anti-Cheat-Grundlagen

## Offener Punkt: Koordinatenbezeichnungen

Entscheidung für Version 1:

- Code: `x`, `y`
- Erklärung: Spalte, Zeile
- Ursprung: `(1, 1)` oben links

Dieser Punkt ist für Version 1 ausreichend entschieden.

Wichtig bleibt, dass alle Dateien diese Bezeichnung konsistent verwenden.

## Offener Punkt: Kampfbeispiele aus späteren Quellen

Kampfbeispiele aus separaten PDF-/Bildquellen sollen später nach Möglichkeit ergänzt werden.

Für Version 1 genügt eine reduzierte, regelrepräsentative Auswahl von Beispielen.

Betroffene Datei:

```txt
specs/006-combat-examples.md
```

Nicht-blockierend für Version 1.

## Offener Punkt: Testfalltiefe

Für Version 1 gilt:

- Jede fachliche Spec enthält Akzeptanzkriterien.
- Jede regelrelevante Spec enthält Given/When/Then-Testfälle.
- Pro Kernregel soll mindestens ein Positivtest und ein Negativtest beschrieben werden.

Spätere Erweiterung:

- vollständige automatisierte Test-Suite
- Testdatenkatalog
- deterministische Kampfbeispiele
- Seed-basierte Startzustände
- Snapshot-Tests für GameState-Änderungen

## Offener Punkt: Referenzgrafiken

Aktuelle Referenzen:

- 24 × 24-Startaufstellung mit `B1`, `B2` und Commander-Startfeldern
- Commander-/König-Darstellung auf Wiesenfeldern

Betroffene Datei:

```txt
docs/references.md
```

Spätere Ergänzungen:

- konkrete Bilddateien
- Asset-Lizenzen
- UI-Skizzen
- Sprite-Referenzen
- Farbdefinitionen

## Offener Punkt: Interaktive Erlaubnis beim Überspringen gegnerischer Figuren

Für Version 1 gilt:

- gegnerische Figuren werden standardmäßig nicht übersprungen
- keine automatische Erlaubnis
- keine vollständige interaktive Umsetzung

Spätere Erweiterung:

- Erlaubnisbutton
- Bestätigung durch nicht aktiven Spieler
- Multiplayer-taugliche Anfrage
- Frist oder Ablehnungsregel
- UI-Feedback bei Erlaubnis oder Ablehnung

Betroffene Datei:

```txt
specs/004-movement-holding-actions.md
```

## Offener Punkt: Serverarchitektur

Version 1 enthält keinen Server.

Spätere Serverarchitektur kann vorbereiten:

- Colyseus
- serverautoritärer Regelkern
- persistente Matches
- Login
- Datenbank
- Ranking
- Spielhistorie

Betroffene Dateien:

```txt
docs/architecture.md
docs/roadmap.md
```

## Offener Punkt: Startzustand-Zufälligkeit

Version 1 verwendet zufällige Zuordnung der Commander-Typen auf die erlaubten Startfelder.

Für Tests muss diese Zufälligkeit kontrollierbar sein.

Mögliche spätere Präzisierung:

- fester Seed
- explizite Testaufstellung
- Debug-Ausgabe der Zuordnung
- reproduzierbare Startgenerierung

Betroffene Datei:

```txt
specs/003-commanders-units-king-banner.md
```

## Offener Punkt: Kampfprotokoll

Version 1 soll Verluste visuell nachvollziehbar machen.

Ein dauerhaftes Kampfprotokoll ist nicht zwingend Teil von Version 1.

Spätere Erweiterung:

- Kampf-Log
- Würfelhistorie
- Verlusthistorie
- Wiederanzeige entfernter Units
- Export von Kampfabläufen für Tests

Betroffene Dateien:

```txt
specs/005-combat-and-dice-resolution.md
specs/006-combat-examples.md
```

## Mögliche spätere Spec-Dateien

Spätere Versionen könnten zusätzliche Specs erhalten:

```txt
007-terrain-and-discovery.md
008-resources-and-trade.md
009-buildings-and-market.md
010-siege-and-walls.md
011-multiplayer-server-authority.md
012-login-persistence-ranking.md
013-action-command-model.md
014-replay-and-event-log.md
015-advanced-combat-modules.md
```

Diese Dateien sind nicht Teil der aktuellen Version-1-Struktur.

## Datenmodell-Auswirkung

Diese Datei führt keine neuen Version-1-Datenmodelle ein.

Spätere Erweiterungen können neue Modelle benötigen, zum Beispiel:

- `Resource`
- `Building`
- `Road`
- `HiddenTile`
- `DiscoveryState`
- `TradeCart`
- `Ship`
- `Wall`
- `SiegeWeapon`
- `Action`
- `Command`
- `EventLogEntry`
- `Match`
- `User`
- `RankingEntry`

Diese Modelle sind nicht Teil von Version 1.

## UI-Auswirkung

Diese Datei führt keine neuen Version-1-UI-Anforderungen ein.

Spätere Erweiterungen können UI benötigen für:

- verdeckte Felder
- Entdeckung
- Ressourcenanzeige
- Handel
- Gebäudeauswahl
- Belagerungswaffen
- Multiplayer-Lobby
- Login
- Ranking
- Event-Log
- Replay
- Erlaubnisdialoge
- Kampfprotokoll

Diese UI-Elemente sind nicht Teil von Version 1.

## Akzeptanzkriterien

Diese Spec ist erfüllt, wenn:

- spätere Erweiterungen klar vom Version-1-Scope getrennt sind
- keine spätere Erweiterung als Version-1-Pflicht beschrieben wird
- offene Punkte als nicht-blockierend markiert sind
- technische spätere Themen gesammelt sind
- fachliche spätere Themen gesammelt sind
- Server, Login, Datenbank und Ranking klar als spätere Inhalte markiert sind
- weitere Terrain-Typen klar als spätere Inhalte markiert sind
- Handel und Rohstoffe klar als spätere Inhalte markiert sind
- Belagerungswaffen klar als spätere Inhalte markiert sind
- formales Action-/Command-Modell klar als spätere Erweiterung markiert ist
- offene Punkte auf betroffene Dateien oder Themenbereiche verweisen
- diese Datei keine neuen Version-1-Regeln einführt

## Given/When/Then-Testfälle

### Testfall 1: Späteres Terrain erweitert Version 1 nicht

Given `forest` ist in dieser Datei als spätere Erweiterung erwähnt  
When Version-1-Tiles erzeugt werden  
Then bleibt `grass` der einzige gültige `TerrainType`.

### Testfall 2: Server bleibt außerhalb Version 1

Given Serverarchitektur ist als spätere Erweiterung dokumentiert  
When Version 1 gestartet wird  
Then ist kein Server erforderlich.

### Testfall 3: Login bleibt außerhalb Version 1

Given Login ist als spätere Erweiterung dokumentiert  
When Version 1 genutzt wird  
Then ist kein Login-System erforderlich.

### Testfall 4: Ranking bleibt außerhalb Version 1

Given Ranking ist als spätere Erweiterung dokumentiert  
When Version 1 genutzt wird  
Then wird kein Ranking benötigt.

### Testfall 5: Handel bleibt außerhalb Version 1

Given Handel ist als spätere Erweiterung dokumentiert  
When Version 1 gespielt wird  
Then gibt es keine Handelsaktion.

### Testfall 6: Belagerungswaffen bleiben außerhalb Version 1

Given Katapulte und Tribock sind als spätere Erweiterungen dokumentiert  
When Version 1 gespielt wird  
Then gibt es keine Belagerungswaffen.

### Testfall 7: Command-Modell bleibt außerhalb Version 1

Given `MoveCommanderAction` ist als späterer Kandidat dokumentiert  
When Version 1 bedient wird  
Then bleibt Drag-and-Drop die Hauptbedienung  
And es ist kein formales Command-Modell erforderlich.

### Testfall 8: Offener Punkt blockiert Version 1 nicht

Given Kampfbeispiele aus späteren Quellen sind noch nicht vollständig übertragen  
When Version-1-Specs erstellt werden  
Then blockiert dieser offene Punkt die Spec-Umgebung nicht.

### Testfall 9: Gegnerisches Überspringen bleibt vereinfacht

Given interaktive Erlaubnis ist als spätere Erweiterung dokumentiert  
When Version 1 eine Bewegung über eine gegnerische Figur prüft  
Then wird das Überspringen standardmäßig nicht erlaubt.

### Testfall 10: Keine neuen Regeln aus dieser Datei

Given ein Feature wird nur in dieser Datei als spätere Erweiterung erwähnt  
When Version-1-Regeln geprüft werden  
Then darf dieses Feature keine Version-1-Regelwirkung haben.

## Offene spätere Erweiterungen

Alle in dieser Datei genannten Themen sind spätere Erweiterungen oder nicht-blockierende offene Punkte.

Sie müssen vor Umsetzung in eigenen oder erweiterten Specs konkretisiert werden.
