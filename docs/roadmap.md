# Roadmap

## Zweck

Dieses Dokument beschreibt die geplante Entwicklung des digitalen Brettspiel-Prototyps in aufeinander aufbauenden Versionen.

Die Roadmap trennt verbindliche Inhalte für Version 1 von späteren Erweiterungen.

## Grundsatz

Version 1 priorisiert einen lokal spielbaren, verständlichen und testbaren Prototyp.

Spätere Versionen können zusätzliche Spielsysteme, technische Infrastruktur und Multiplayer-Fähigkeit ergänzen.

## Version 1: Lokaler spielbarer PixiJS-Prototyp

### Ziel

Version 1 soll die Kernmechaniken des Spiels lokal im Browser spielbar demonstrieren.

### Enthalten

- lokaler Browser-Prototyp
- PixiJS-Rendering
- 24 × 24 Spielfeld
- 128 × 128 px Tile-Größe
- nur Gras/Wiese als Terrain
- sichtbares Raster
- Kamera-Panning
- Zoom
- Drag-and-Drop als Hauptbedienung
- Commander auf dem Brett
- Units in Commander-Slots
- genau vier Slots pro Commander
- genau eine Truppengattung pro Commander
- Truppengattungen `infantry`, `cavalry`, `archer`
- König als Commander mit `isKing: true`
- Banner als Zielobjekt
- regelvalidierte Bewegung
- diagonale Bewegung mit Kosten 1
- aktive Spielerlogik über `activePlayerId`
- Festhalten durch Infanterie
- spielbarer Kampf
- Würfelauflösung
- natürliche Würfelsortierung vor Bonusaddition
- automatische Verlustzuordnung
- leere Commander kämpfen als Kavallerie
- Siegbedingung über König
- Siegbedingung über Banner
- Debug-Modus über Taste `D`
- Debug-Modus über UI-Toggle

### Nicht enthalten

- echter Online-Multiplayer
- Server
- Login
- Datenbank
- Ranking
- Colyseus
- Entdeckung
- Handel
- Rohstoffe
- zusätzliche Gebäude außer Banner
- formales Action-/Command-Modell
- komplexes Phasenmodell

### Erfolgskriterien

Version 1 gilt als erfolgreich, wenn:

- das Brett sichtbar und bedienbar ist
- Commander bewegt werden können
- ungültige Bewegungen blockiert werden
- Kampf spielbar aufgelöst wird
- Verluste automatisch entfernt werden
- König- und Banner-Siegbedingungen funktionieren
- Debug-Informationen sichtbar und abschaltbar sind
- die Architektur spätere Multiplayer-Fähigkeit nicht verhindert

## Version 2: Stärkere Modularisierung von game-core

### Ziel

Die regelrelevante Spiellogik wird stärker von der PixiJS-Anwendung getrennt.

### Mögliche Inhalte

- klarere Modulstruktur in `packages/game-core/`
- reine Funktionen für Bewegungsvalidierung
- reine Funktionen für Kampfauflösung
- zentrale Regelwerte
- bessere Trennung von Datenmodell und UI
- vorbereitete Schnittstellen zwischen Prototype-App und Regelkern

### Weiterhin nicht zwingend enthalten

- echter Server
- Login
- Datenbank
- Ranking

## Version 3: Ausgebautes Regeltestsystem

### Ziel

Die Regeln werden umfassender testbar gemacht.

### Mögliche Inhalte

- Tests für Bewegungsregeln
- Tests für belegte Zielfelder
- Tests für diagonale Bewegung
- Tests für Bogenschützen-Aktionen
- Tests für Festhalten
- Tests für Kampfauflösung
- Tests für König-Bonus
- Tests für Banner-Einnahme
- Tests für Siegbedingungen
- Tests für kontrollierbare Startaufstellungen
- Tests mit festem Seed für zufällige Startzuordnung

### Erwarteter Nutzen

- weniger Regelregressionen
- klarere Implementierungsgrenzen
- bessere Grundlage für späteren Multiplayer
- stabilere Weiterentwicklung

## Version 4: Weitere Geländearten und Entdeckung

### Ziel

Das bisher reine Gras-/Wiesenbrett kann um weitere Tile-Typen und Entdeckungsmechaniken erweitert werden.

### Mögliche Inhalte

- Wald
- Straße
- Lehmgrube
- Hütten
- Wasser
- Erzberg
- verdeckte Felder
- Entdeckung
- Landschaftsplättchensäckchen
- spezielle Bewegungs- oder Blockaderegeln für Terrain

### Voraussetzung

Diese Version sollte erst beginnen, wenn Version 1 stabil ist und Board-, Tile- und Bewegungsmodell belastbar sind.

## Version 5: Handel, Gebäude und Rohstoffe

### Ziel

Wirtschaftliche und infrastrukturelle Spielsysteme werden ergänzt.

### Mögliche Inhalte

- Rohstoffe
- Marktbereich
- Hauptstraße
- Objektpreise
- Handelsfiguren
- Handelswagen
- zusätzliche Gebäude
- Ressourcenproduktion
- Ressourcenverbrauch
- Bau- oder Kaufregeln

### Abgrenzung

Diese Inhalte sind nicht Bestandteil von Version 1 und dürfen dort keine verdeckten Regelabhängigkeiten erzeugen.

## Version 6: Server- und Colyseus-Anbindung

### Ziel

Die lokale Spielstruktur wird in Richtung echter Multiplayer-Fähigkeit erweitert.

### Mögliche Inhalte

- Server-Anbindung
- Colyseus-Integration
- serverautoritärer `GameState`
- Validierung von Spieleraktionen auf dem Server
- Synchronisierung zwischen Clients
- getrennte Spielerperspektiven
- Umgang mit Verbindungsabbrüchen
- Match-Erstellung

### Voraussetzung

Die lokale Regelvalidierung in `game-core` sollte vorher stabil und testbar sein.

## Version 7: Login, Datenbank und Ranking

### Ziel

Persistenz, Nutzerverwaltung und wettbewerbsorientierte Funktionen werden ergänzt.

### Mögliche Inhalte

- Login-System
- Nutzerkonten
- Datenbank
- gespeicherte Spielstände
- Match-Historie
- Ranking
- Statistiken
- langfristige Spielerprofile

### Abgrenzung

Diese Version liegt klar außerhalb des Version-1-Scopes.

## Spätere mögliche Regelmodule

Die folgenden Inhalte sind bewusst spätere Erweiterungen:

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

## Roadmap-Regel

Neue Versionen dürfen den Version-1-Scope nicht nachträglich verwässern.

Für jede Erweiterung gilt:

- zuerst dokumentieren
- dann Datenmodell-Auswirkung prüfen
- dann UI-Auswirkung prüfen
- dann Akzeptanzkriterien ergänzen
- dann Tests ergänzen
- erst danach implementieren
