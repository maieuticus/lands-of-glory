# Spec-Index

Stand: 2026-09-06. Verbindliche Grundlage sind die vom Benutzer bestätigten [Regeln R01–R09](../docs/decisions.md). Frühere Entwürfe dürfen diese Entscheidungen nicht überschreiben.

| Datei | Zuständigkeit |
|---|---|
| [001](001-version-1-scope.md) | Lokaler Modus für 2–4 Spieler und Abgrenzung |
| [002](002-board-rendering-input.md) | Koordinaten, Belegung, Darstellung und Core-Anbindung |
| [003](003-commanders-units-king-banner.md) | Figuren, Kosten, Startbereiche und Eliminierung |
| [004](004-movement-holding-actions.md) | Bewegung, Reaktionen zum Festhalten und Aktionsprüfung |
| [005](005-combat-and-dice-resolution.md) | Würfelzuordnung, Gleichstände, Verluste und Anwendung |
| [006](006-combat-examples.md) | Konkrete bestätigte Kampfbeispiele |
| [099](099-later-expansions-and-open-points.md) | Spätere Erweiterungen und offene Übergaben |

## Verwendung

Zuerst die Entscheidungen lesen, dann die betroffene Fachspec und ihre verlinkten Tests. Die aktuelle Fachfassung fasst Regeln, Auswirkungen und Abnahmefälle nach Thema zusammen. Konkrete automatisierte Szenarien stehen in `packages/game-core/tests/`.

Die Dokumente in `002-spec-analysis/` sind gekennzeichnete historische Planungsartefakte. Ihr Datenmodell, ihre Statusaussagen und offenen Fragen sind keine aktuelle Regelbasis. Den Abschlussstand einschließlich Abnahme-Ausnahmen beschreibt der [Implementierungsplan](../docs/implementation-plan.md).

PixiJS zeigt; der Core entscheidet. `GameState` enthält den Regelzustand. Anzeige, Auswahl und Animationen bleiben UI-Zustand.

Regeländerungen müssen in Entscheidungen, betroffenen Fachspecs und Tests übereinstimmen. Ein Königverlust beendet bei 3–4 Spielern nicht automatisch die Partie, sondern eliminiert zunächst den Besitzer. Höchste natürliche Würfe erhalten die stärksten Units; erst danach werden Boni angewendet.

## Abnahmegrenzen

Block 2 prüft die Core-Regeln und den tatsächlich exportierten Vertrag. Block 3 bindet Controller, Festhalte-Auswahl und Animationen an diese API und prüft Browserabläufe. Block 4 aktualisiert die übrigen Projektberichte. Der aktuelle Fortschritt steht im [Implementierungsplan](../docs/implementation-plan.md).
