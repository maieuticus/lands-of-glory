# Pull Request

## Zweck

Beschreibe kurz, was dieser Pull Request ändert.

```txt
Kurze Zusammenfassung:
-
```

## Art der Änderung

Bitte markieren:

- [ ] Dokumentation
- [ ] Spec-Änderung
- [ ] Regelklarstellung
- [ ] Architekturklarstellung
- [ ] Testfall-Ergänzung
- [ ] Implementierung
- [ ] Refactoring
- [ ] Bugfix
- [ ] Sonstiges

## Betroffene Bereiche

Bitte markieren:

- [ ] `README.md`
- [ ] `docs/architecture.md`
- [ ] `docs/decisions.md`
- [ ] `docs/roadmap.md`
- [ ] `docs/terminology.md`
- [ ] `docs/references.md`
- [ ] `specs/000-spec-index.md`
- [ ] `specs/001-version-1-scope.md`
- [ ] `specs/002-board-rendering-input.md`
- [ ] `specs/003-commanders-units-king-banner.md`
- [ ] `specs/004-movement-holding-actions.md`
- [ ] `specs/005-combat-and-dice-resolution.md`
- [ ] `specs/006-combat-examples.md`
- [ ] `specs/099-later-expansions-and-open-points.md`
- [ ] `apps/prototype/`
- [ ] `packages/game-core/`
- [ ] `.github/`

## Version-1-Scope geprüft

- [ ] Die Änderung erweitert Version 1 nicht unbeabsichtigt.
- [ ] Spätere Erweiterungen sind klar als spätere Erweiterungen markiert.
- [ ] Keine Server-, Login-, Datenbank- oder Ranking-Funktion wurde für Version 1 eingeführt.
- [ ] Keine neuen Regeln wurden ohne Spec-Grundlage ergänzt.

## Architekturregeln geprüft

- [ ] `GameState` bleibt die regelrelevante Wahrheit.
- [ ] `PrototypeUiState` bleibt vom `GameState` getrennt.
- [ ] PixiJS wird nicht als Regelautorität verwendet.
- [ ] `game-core` bleibt für regelrelevante Entscheidungen vorgesehen.
- [ ] Multiplayer wird höchstens vorbereitet, aber nicht als Version-1-Pflicht umgesetzt.

## Terminologie geprüft

- [ ] Code-Bezeichnungen sind auf Englisch.
- [ ] Deutsche Erklärungen verwenden „Spalte“ und „Zeile“.
- [ ] Code-Kontext verwendet `x` und `y`.
- [ ] Begriffe stimmen mit `docs/terminology.md` überein.

## Spec-Qualität geprüft

Bei fachlichen Specs:

- [ ] Zweck vorhanden
- [ ] Geltungsbereich für Version 1 vorhanden
- [ ] Nicht-Ziele vorhanden
- [ ] Begriffe vorhanden
- [ ] Regeln vorhanden
- [ ] Datenmodell-Auswirkung vorhanden
- [ ] UI-Auswirkung vorhanden
- [ ] Akzeptanzkriterien vorhanden
- [ ] Given/When/Then-Testfälle vorhanden
- [ ] Offene spätere Erweiterungen vorhanden

## Tests und Prüfbarkeit

- [ ] Akzeptanzkriterien sind prüfbar formuliert.
- [ ] Given/When/Then-Testfälle sind verständlich.
- [ ] Positive und negative Fälle wurden berücksichtigt, sofern relevant.
- [ ] Änderungen an Regeln wurden in betroffenen Testfällen berücksichtigt.

## Risiken oder offene Punkte

```txt
Risiken / offene Punkte:
-
```

## Screenshots oder Beispiele

Falls relevant:

```txt
Screenshots / Beispiele:
-
```

## Abschlussprüfung

- [ ] Die Änderung ist widerspruchsarm.
- [ ] Dopplungen wurden vermieden.
- [ ] Version-1-Scope und spätere Erweiterungen bleiben getrennt.
- [ ] Die Änderung ist für spätere Implementierung praktisch nutzbar.
