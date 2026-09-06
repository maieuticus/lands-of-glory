# Spätere Erweiterungen und offene Punkte

Stand: 2026-09-06. Diese Datei erweitert nicht die bestätigten [Regeln](../docs/decisions.md).

## Bereits entschieden und im Core enthalten

Lokales Spiel für 2–4 Spieler, Armee-Budget, zentrale Commands, Festhalte-Reaktionen, Spielereleminierung, Ereignislog, reproduzierbare Würfel und optionale Seed-Startaufstellung gehören zum aktuellen Regelkern. Sie sind keine ungeklärten späteren Features mehr. Interne Koordinaten beginnen bei (0,0).

Die Benutzerentscheidungen zu Reichweiten, Gleichständen, Festhalten, Gratiseinheiten, Würfelzuordnung, Banner-Einnahme und Sieg stehen zentral in `docs/decisions.md`.

## Spätere Erweiterungen außerhalb dieses Auftrags

- Online-Multiplayer: Serverautorität, Lobby, Matchmaking, Reconnect, private Perspektiven und Anti-Cheat.
- Konten und Persistenz: Login, Datenbank, Ranking, Match-Historie, langfristige Profile.
- Vollständiges Speichern/Laden und Replay als Produkt; vorhandene Core-Logs sind dessen technische Grundlage, kein fertiges Speicherformat.
- Terrain-Spielmodi: Entdeckung, verdeckte Felder, Landschaftsplättchen, Wald, Wasser, Erzberge, Straßen und rotierende Tiles. Vorhandene generische Terrain-Hilfen erzeugen keinen solchen Modus.
- Wirtschaft: Handel, Wagen, Schiffe, Rohstoffe, Produktion, Lagerung, Markt und Gebäudehandel. Das vorhandene Armee-Budget bleibt davon getrennt.
- Gebäude und Belagerung: Mauern, Hütten, Markt, Produktionsgebäude, Banner-Lebenspunkte, Katapulte, Tribock, Fernkampf gegen Banner.
- Weitere Kampfmodule: freiwillige Unit-Auswahl, freie Verlustwahl, Karten, alternatives Schlachtfeld, komplexe Phasen.
- Herrschaft: Vasallen, Lehnsherren, Ultimatum, GloryPoints, Diplomatie, Kampagnen.
- Interaktive Erlaubnis zum Überspringen gegnerischer Figuren. Gegenwärtig bleiben gegnerische Zwischenfelder blockiert.
- Audiofunktion und optionales kleines Armee-Preset gemäß Implementierungsplan.

Jede Erweiterung benötigt eine gesonderte fachliche Beschreibung, Umfang, Datenmodell, UI-Verhalten und Tests.

## Übergaben in den bestehenden Implementierungsplan

Block 3: Core-Aktionen statt doppelter Controller-Regeln; Auswahl und Verzicht beim Festhalten durch den Infanteriebesitzer; veraltete Kampfcallbacks abweisen; UI-Anzeigen, Undo und Browser-Tests angleichen.

Block 4: README, Architektur, Datenmodell, Terminologie und historische Berichte aktualisieren. Referenzgrafiken und Asset-Lizenzen dokumentieren; fehlende Lizenzangaben bleiben organisatorische offene Punkte.

Block 5: Gesamtprüfung, erneuter Altvergleich und überprüfte Bereinigung. Einzigartige Dateien und Historie vor einer Löschung sichern.

Die Browserabnahme ist kein Ergebnis allein der erfolgreichen Core-Tests.
