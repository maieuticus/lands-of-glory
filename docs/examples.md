# Beispiele und Demos

Die vier ehemaligen Root-Demos liegen seit Block 5 unter [examples/](../examples/). Sie werden von der Prototype-App nicht importiert.

| Datei | Zweck und Status | Ausführung |
|---|---|---|
| [dice-canvas-demo.html](../examples/dice-canvas-demo.html) | Historische PixiJS-Studie für animierte Würfel und Kampfpaare | Direkt im Browser öffnen; lädt PixiJS 7.3.2 von cdnjs |
| [dice-visual-demo.html](../examples/dice-visual-demo.html) | Historische HTML/CSS-/JavaScript-Studie zur Würfeldarstellung | Direkt im Browser öffnen; keine externen Skriptquellen |
| [dice-pairs-demo.ts](../examples/dice-pairs-demo.ts) | Ausführbares Beispiel mit aktuellem Core: Würfelzuordnung, verlustfreier Fernkampf, leere Commander und überzählige Würfel | `npm run demo:dice` vom Projektroot |
| [tile.html](../examples/tile.html) | Historische Tile-/Figurenstudie | Direkt im Browser öffnen; lädt Tailwind und PixiJS von den bereits enthaltenen CDNs |

Die HTML-Studien können ältere Darstellungs- und Regelannahmen enthalten. Die verbindlichen Regeln stehen in [decisions.md](decisions.md); das TypeScript-Beispiel lässt alle Kämpfe durch den aktuellen Core validieren und auswerten. Kompilierte Beispiel-Dateien landen unter `.cache/examples/`.

`npm run demo:dice` wurde erfolgreich ausgeführt. Die HTML-Demos wurden auf lokale Dateiverweise und externe Skriptquellen geprüft; eine erneute visuelle Browserabnahme wurde entsprechend der Nutzerentscheidung ausgelassen.

## Lizenzstatus

Die Paketmetadaten nennen MIT, eine Projekt-Lizenzdatei samt geklärtem Rechteinhaber fehlt jedoch. Die Verschiebung der vorhandenen Quellen erteilt keine zusätzlichen Nutzungsrechte. Herkunft und Nutzungsrechte vor einer Veröffentlichung von Projekt oder Assets klären; keinen Rechteinhaber erfinden.
