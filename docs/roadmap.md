# Roadmap

## Erreicht: Blöcke 1–5

Der lokale Prototyp unterstützt 2–4 Spieler, ein 24 × 24 Grasbrett, Armee-Editor, Core-validierte Bewegung und Angriffe, Festhalte-Auswahl samt Lösen bestehender Festhaltungen, Kampfanimation, Banner- und König-Spielende, Undo und Ereignisprotokoll. Die Regeln stehen in [decisions.md](decisions.md), der genaue Prüfstand im [Implementierungsplan](implementation-plan.md).

Dokumentation und Beispiele sind abgeglichen. Der Altbestand wurde erneut geprüft, vollständig gesichert und aus dem Arbeitsbereich entfernt; Details und Wiederherstellung stehen im [Bereinigungsbericht](alt-comparison.md). Demos liegen unter [examples/](../examples/).

## Verbleibende Abnahmegrenzen

Abschließende Cypress- und manuelle Browserläufe wurden auf Nutzerwunsch in dieser Umgebung ausgelassen. Remote-CI und Performance sind nicht nachgewiesen. Die bekannten Bundle-Größenwarnung und fehlende Projekt-Lizenzdatei bleiben dokumentiert. Diese Grenzen sind keine Produktionsfreigabe.

## Optionale nächste Arbeiten

O01 kleines Armee-Preset, O02 Audio und O03 Speichern/Laden beziehungsweise Replay sind im [Implementierungsplan](implementation-plan.md) separat beschrieben. Online-Multiplayer, Server, Login, weitere Geländearten, Entdeckung, Handel, Ressourcen, zusätzliche Gebäude und Kampagnen gehören ebenfalls nicht zum abgeschlossenen Auftrag.
