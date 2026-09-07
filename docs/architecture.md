# Architektur

## Verantwortlichkeiten

`packages/game-core` ist eine immutable, UI-freie Regelbibliothek. Sie enthält `GameState`, Board-/Pfadlogik, Armeeaufbau, Aktionen, Festhalten, Kampf, RNG, Siegprüfung und Wertung. Öffentliche Aktionspfade sind `applyCommand`, `canMove`, `canAttack`, `canCaptureBanner`, `resolveCombat`, `applyCombatResult` und `setHoldingTarget`.

`apps/prototype` ist ein Vite/PixiJS-Client. `GameController` übersetzt Eingaben in Core-Aufrufe, verwaltet UI-Phase, Undo-Historie und Lifecycle. `GameRenderer` zeichnet Brett und Ziele und bezieht gültige Zielmengen aus dem Core. `CombatDiceAnimation` zeigt ein unveränderliches Vorschauergebnis; der Controller wendet es nur an, wenn Token und Ausgangszustand noch identisch sind.

## Zustände

Der `GameState` enthält Board, Spieler, Commander, Units, Banner, `activePlayerId`, Rundenzähler, Status, Ereignislog, RNG-Zustand und Festhalteentscheidungen. UI-Auswahl, Drag-Ziel und Debug gehören ausschließlich zum `UIState`. Undo speichert vollständige immutable Zustandsreferenzen, einschließlich Log, RNG und Spielerstatus.

## Regeln als Architekturgrenzen

Bewegung wird über `getValidMoves`/`moveCommander`, Angriffe über `getValidAttacks`/`resolveCombat`/`applyCombatResult` und Banner über `canCaptureBanner`/`captureBanner` geprüft. Festhalten wird als passive Core-Entscheidung modelliert. Bogenschützen dürfen nur aus Entfernung 2–3 schießen und nicht im Nahkampf angreifen. Weitere Systeme bleiben außerhalb von Version 1.

## Prüfung

Core-Regeln werden mit Jest geprüft. Controller-Integration und rekursive Pixi-Ressourcenfreigabe sind über `npm run test:integration` ohne Browser geprüft; für gerenderte Abläufe existieren Cypress-E2E-Flows. Die CI-Konfiguration umfasst Build, Typen, Lint, Core-Coverage, Integration und Strukturtests unter Linux und Windows sowie einen separaten Linux-Browserjob. Nicht ausgeführte Browser- oder Remote-Prüfungen werden nicht als Nachweis gewertet.
