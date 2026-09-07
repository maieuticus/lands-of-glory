# Projektanweisungen: Lands of Glory

Die aktuellen Regeln stehen in [docs/decisions.md](../docs/decisions.md), der Umsetzungs- und Prüfstand in [docs/implementation-plan.md](../docs/implementation-plan.md). Die Planungsartefakte unter `specs/002-spec-analysis/` sind historische Entwürfe.

## Architektur

TypeScript mit Strict Mode, npm-Workspaces, PixiJS 7 und Vite. `packages/game-core` entscheidet Regeln und liefert neue immutable Zustände; `apps/prototype` koordiniert Darstellung, Eingaben, Animationen und Undo. Öffentliche Core-API: `packages/game-core/src/index.ts` und `contracts/game-api.ts`. `contracts/renderer-api.ts` ist als historischer Entwurf gekennzeichnet.

Core-Module: `types.ts`, `game.ts`, `board.ts`, `pathfinding.ts`, `rules.ts`, `actions.ts`, `holding.ts`, `combat.ts`, `army-builder.ts`, `rng.ts`, `state.ts`, `scoring.ts` und `errors.ts`. Kein implementiertes `movement.ts`, `persistence.ts` oder `replay.ts` voraussetzen.

## Regeln und Umfang

Lokal 2–4 Spieler, 24 × 24 Grasfelder, Koordinaten 0–23. Armeen mit Standardbudget 50 und maximal 72 Commandern je Spieler. Bogenschützen greifen nur auf Entfernung 2–3 an und erleiden beim eigenen Schuss keine Verluste. Leere Commander gelten effektiv als Kavallerie. Festhalten entscheidet der Infanteriebesitzer unter Figuren des gerade aktiven Spielers. Stärkste Unit zum höchsten natürlichen Wurf, dann Boni addieren. Die vollständigen Tabellen und Grenzfälle stehen in den Entscheidungen.

Nur lokale Optionen werden gespeichert; Speichern/Laden einer Partie, Replay, Audio und Onlinebetrieb sind nicht implementiert. Ereignislog und RNG-Zustand ermöglichen reproduzierbare Abläufe, bilden aber noch kein Replay-Produkt.

## Entwicklung und Prüfung

Vom Repositoryroot: `npm ci`, `npm run verify`, `npm run dev`. Die Prüfkette umfasst Build, Typen einschließlich Core-Vertrag, Lint, Core-Coverage, Integrationstests und Strukturtests. Die unveränderten globalen Core-Coverage-Schwellen betragen jeweils 80 %.

Core-Tests: `packages/game-core/tests/`. Controller-/Ressourcentests ohne Browser: `apps/prototype/tests/`, ausgeführt über `npm run test:integration` mit der vorhandenen Jest-Toolchain. Cypress: `apps/prototype/cypress/e2e/`, Server `npm run dev:e2e`, Suite `npm run test:e2e`. Die abschließende Browserabnahme wurde auf Nutzerwunsch ausgelassen; Testergebnisse, Remote-CI und Performance nur nach tatsächlichem Nachweis behaupten.

Demos stehen unter `examples/`; `npm run demo:dice` demonstriert den aktuellen Core. `alt/` ist nach überprüfter Sicherung entfernt. Wiederherstellung: [docs/alt-comparison.md](../docs/alt-comparison.md).
