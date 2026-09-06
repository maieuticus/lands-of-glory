# Version 1: Umfang
Stand: 2026-09-06. Verbindliche Grundlage sind die bestätigten [Entscheidungen R01–R09](../docs/decisions.md).

Version 1 ist ein lokaler Browser-Prototyp mit 2–4 Spielern, PixiJS-Darstellung, Armee-Editor, Kampfanimationen und Ergebnisanzeige. Der Core besitzt die Regeln; die App verwaltet Bedienung und Darstellung.

Im Umfang: Brett 24 × 24, Gras als Startterrain, drei Truppengattungen, vier Unit-Slots je Commander, ein König und ein Banner je Spieler, Bewegung, Festhalten, Kampf, Banner-Einnahme, Spielereliminierung und Zugfolge. Das Standardbudget beträgt 50 Gold. Armeen und vorhandene Optionen bleiben konfigurierbar.

Nicht enthalten: Online-Multiplayer, Server, Login, Datenbank, Ranking, Audioimplementierung, Handel, zusätzliche Gebäude oder ein vollständiges Speichern/Laden-/Replay-Produkt. Das Core-Log und kontrollierter Zufall dienen der nachvollziehbaren Regelprüfung.

Die Abnahme des Regelkerns erfolgt in Block 2. Die Umstellung der bestehenden Oberfläche auf diese API, die Auswahl von Festhaltezielen und die Synchronisierung mit Animationen gehören zu Block 3. Historische Phasenberichte belegen keine aktuelle Funktionsabnahme.
