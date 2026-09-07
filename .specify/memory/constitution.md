# Lands of Glory Constitution

## Grundsätze

1. **Core entscheidet.** Regelrelevante Entscheidungen gehören in `packages/game-core`; die UI rendert und koordiniert nur.
2. **GameState ist immutable.** Aktionen liefern neue Zustände. Undo und Vorschauen dürfen keine versteckten Mutationen erzeugen.
3. **Entscheidungen werden dokumentiert.** Verbindliche Regeln stehen in `docs/decisions.md` und den betroffenen Specs.
4. **Prüfbarkeit vor Behauptung.** Build, Typprüfung, Lint, Core-Tests, Coverage, Strukturtests und Browserprüfungen werden getrennt ausgewiesen; ungeprüfte Läufe bleiben ungeprüft.
5. **Version-1-Grenzen bleiben sichtbar.** Onlinebetrieb, Persistenz, Audio und spätere Spielsysteme werden nicht stillschweigend in den Prototyp aufgenommen.

## Arbeitsregeln

Neue Core-Regeln erhalten passende Tests. UI-Änderungen müssen den Core-Vertrag verwenden und Lifecycle-Ressourcen bereinigen. Dokumentation darf nur nachgewiesene Testzahlen, Statusangaben und Funktionsumfang nennen.

## Governance

Diese Constitution ergänzt Specs und Entscheidungen; bei einem fachlichen Widerspruch haben die zuletzt ausdrücklich bestätigten Entscheidungen Vorrang. Änderungen werden in `docs/decisions.md` und dem Implementierungsplan nachvollziehbar vermerkt. Sie führt keine zusätzlichen Freigabe- oder Organisationspflichten ein.

**Version:** 1.0 | **Ratified:** 2026-09-07 | **Last amended:** 2026-09-07
