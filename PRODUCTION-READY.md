# Prüfstatus (historischer Dateiname)

Diese Datei ist kein Produktionsfreigabedokument. Der Dateiname stammt aus einer früheren Projektphase; der aktuelle Stand ist ein lokaler Version-1-Prototyp. Verbindliche Angaben stehen in [`docs/implementation-plan.md`](docs/implementation-plan.md) und [`README.md`](README.md).

## Nachgewiesener Umfang

Der Core entscheidet Bewegung, Festhalten, Kampf, Würfelzuordnung, Verluste, Banner-Einnahme, Spielereliminierung, Zugwechsel und Spielende. Die PixiJS-App bindet diese Operationen an Drag-and-drop, Festhalte-Dialog, Kampfanimation, Undo und sichtbares Protokoll.

Die nichtgrafische Abschlussprüfung von Block 5 bestand 149 Core-Tests, 6 Controller-/Ressourcentests und 8 Strukturtests sowie Build, Typprüfung und Lint. Core-Coverage: 97,04 % Statements, 93,63 % Branches, 98,46 % Funktionen und 98,23 % Zeilen. Cypress-Szenarien sind vorhanden; abschließende Cypress- und manuelle Browserläufe bleiben auf Nutzerwunsch ausgelassen.

## Bewusste Grenzen

Kein Online-Spiel, Server, Login, Datenbank, Speichern/Laden, Replay, Audio oder Produktionsbetrieb. Das Bundle enthält eine bekannte Vite-Größenwarnung ohne Buildfehler. Diese Datei darf erst nach einer gesonderten Abnahme wieder als Freigabedokument bezeichnet werden.
