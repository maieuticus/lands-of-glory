# Implementierungsliste mit Modellzuordnung

Stand: 2026-09-06. Grundlage: Konsistenzprüfung des Projekts und Vergleich von `alt/lands-of-glory` mit dem aktuellen Repository.

Status: Block 1 und Block 2 abgeschlossen. Die bestätigten Regeln stehen in `docs/decisions.md`; Block 3 ist die nächste Umsetzung. `alt` bleibt bis Block 5 im Arbeitsbereich.

## Modelle und Arbeitsweise

Die lokale Codex-Modellliste vom 2026-09-06 führt GPT-6 Astra, GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna und GPT-5.5 als sichtbar. Sie enthält auch GPT-5.4 Mini; laut aktueller offizieller Dokumentation wurde dieses Modell für Codex mit ChatGPT-Anmeldung am 2026-08-31 eingestellt. Es wird deshalb nicht eingeplant. Die tatsächliche Auswahl hängt von Client, Anmeldung und Freischaltung ab. Siehe [Codex-Modelle und Verfügbarkeit](https://learn.chatgpt.com/docs/models).

Die Modellzuordnung ist eine projektspezifische Empfehlung aus der Analyse; sie ist kein Benchmark dieses Repositories. Die offiziellen Profile unterscheiden Astra für besonders anspruchsvolle Aufgaben, Sol für komplexe Arbeit, Terra für alltägliche Umsetzung und Luna für klar vorgegebene, wiederholbare Aufgaben. Siehe [offizielle Modellübersicht](https://developers.openai.com/api/docs/models).

| Modell | Verwendung in dieser Liste | Abwägung |
|---|---|---|
| GPT-6 Astra (`gpt-6-astra`) | Regelentscheidungen, zentrale Spiellogik, abschließende Prüfung | Hier hängen mehrere Regeln und Zustandsübergänge zusammen; Fehler wirken sich auf das ganze Spiel aus. |
| GPT-5.6 Sol (`gpt-5.6-sol`) | UI-Integration, Animationen, Browserabläufe und Testintegration | Mehrere Schichten müssen zusammenpassen, die Regeln stehen zu diesem Zeitpunkt bereits fest. |
| GPT-5.6 Terra (`gpt-5.6-terra`) | Installation, TypeScript, Linting und Build | Gut abgegrenzte technische Korrekturen mit direkt ausführbaren Prüfungen. |
| GPT-5.6 Luna (`gpt-5.6-luna`) | Dokumentation nach beschlossenen Regeln und geprüftem Code | Die fachlichen Entscheidungen werden übernommen; dieser Block führt keine neuen Regeln ein. |
| GPT-5.5 (`gpt-5.5`) | Alternative bei fehlender Verfügbarkeit der vorgesehenen Modelle | Für diese neue Arbeitsfolge entsteht durch einen zusätzlichen Wechsel auf GPT-5.5 kein klarer Vorteil. |

Modell und Denktiefe werden vor jedem Block vom Benutzer eingestellt. In der App erfolgt dies über die Modellauswahl, in der CLI über `/model`. Höhere Denktiefe benötigt mehr Zeit und Tokens. Die unten genannten Einstellungen sind Startempfehlungen, keine Voraussetzung für korrekte Ergebnisse. Siehe [Modellauswahl und Denktiefe](https://learn.chatgpt.com/docs/models).

Für die gesamte Umsetzung gilt:

- Ein Block wird mit dem vom Benutzer eingestellten Modell bearbeitet. Kein eigenständiger Modellwechsel und keine Delegation an andere Modelle.
- Aufgaben innerhalb eines Blocks in der angegebenen Reihenfolge ausführen. Abhängige Blöcke erst nach den Abschlusskriterien ihrer Vorgänger beginnen.
- Ein Auftrag wie „Setze Block 1 um“ umfasst Implementierung, passende Tests, Korrekturen aus diesen Tests und Aktualisierung des Fortschritts in dieser Datei.
- Nach einem Block beenden und den nächsten Block samt Modell nennen. Nicht automatisch in den nächsten Modellblock wechseln.
- Nur erledigte und überprüfte Aufgaben abhaken. Bei einer teilweise erledigten Aufgabe verbleibende Arbeit und Prüfresultate notieren.
- Bestehende Benutzeränderungen erhalten. Keine Commits, Pushes oder Veröffentlichungen allein aufgrund dieser Liste ausführen.
- Offene fachliche Entscheidungen gezielt klären. Technische Korrekturen ohne Abhängigkeit von einer offenen Entscheidung dürfen weiterlaufen.

## Reihenfolge

| Block | Aufgaben | Modell | Denktiefe | Voraussetzung | Ergebnis |
|---|---|---|---|---|---|
| 1 | T01–T04: Technische Grundlage | GPT-5.6 Terra | Medium | Keine | Installation, Build, Typprüfung und Linting funktionieren. |
| 2 | T05–T12: Regeln und Regelkern | GPT-6 Astra | High | Block 1; betroffene Regelentscheidungen geklärt | Eine gemeinsame, getestete Regelautorität im Core. |
| 3 | T13–T19: Oberfläche und Integration | GPT-5.6 Sol | High | Block 2 | Spielbare Browserabläufe, passende Anzeigen, End-to-End-Tests und CI. |
| 4 | T20–T22: Dokumentation und Übergabe | GPT-5.6 Luna | Medium | Block 3 | Dokumentation beschreibt den überprüften Stand. |
| 5 | T23–T25: Abnahme und Entfernung von `alt` | GPT-6 Astra | High | Block 4 | Gesamtabnahme, behobene Restfehler und geprüfte Bereinigung. |

Damit sind vier Modellwechsel nötig: Terra → Astra → Sol → Luna → Astra. Astra wird am Ende erneut benötigt, weil die Abnahme alle zuvor veränderten Bereiche verbindet. Wer keine Modellwechsel möchte, kann alle Blöcke mit Astra ausführen; die Aufteilung oben nutzt kleinere Modelle für klar abgegrenzte Arbeit.

## Block 1: Technische Grundlage

Modell für alle Aufgaben dieses Blocks: **GPT-5.6 Terra, Medium**.

- [x] **T01 – Installation reproduzierbar machen.** Erledigt: Das rekursive Install-Skript ist entfernt, `package-lock.json` wird versioniert, TypeScript ist auf 5.9.3 vereinheitlicht und die Voraussetzungen sind dokumentiert.
  - Dateien: `package.json`, Workspace-`package.json`, `.gitignore`, `package-lock.json`, `SETUP.md`.
  - Fertig: Eine saubere Installation läuft ohne Rekursion; Workspace-Abhängigkeiten werden aufgelöst. Installation möglichst in einer temporären Kopie prüfen, ohne die bestehende Umgebung zu löschen.
- [x] **T02 – Build und Typprüfung reparieren.** Erledigt: `GameOptions`, `turnNumber` und die unveränderliche Kameraposition sind korrigiert; Core und App bauen und typprüfen erfolgreich.
  - Dateien: `apps/prototype/src/main.ts`, `apps/prototype/src/renderer/game-renderer.ts`, TypeScript-Konfigurationen und Skripte.
  - Fertig: `npm.cmd run build` und `npm.cmd run type-check` bestehen, auch aus einem Zustand ohne vorherigen Core-Build entsprechend dem dokumentierten Ablauf.
- [x] **T03 – Linting tatsächlich ausführbar machen.** Erledigt: Core-Tests sind über eine separate ESLint-TS-Konfiguration einbezogen, der fehlende App-Testpfad ist entfernt und Linting ist ohne Regeldeaktivierung grün.
  - Dateien: `.eslintrc.root.json`, Workspace-ESLint-/TypeScript-Konfigurationen, betroffene Quellen und Tests.
  - Fertig: `npm.cmd run lint` besteht; Parserfehler verschwinden und bestehende Regeln bleiben sinnvoll wirksam.
- [x] **T04 – Verlässliche Prüfbefehle bereitstellen.** Erledigt: Dedizierte CI-/Coverage-Skripte sind dokumentiert; der Strukturtest prüft keine nachgebildeten Spielkonstanten mehr und ist klar als Strukturtest gekennzeichnet.
  - Dateien: Root-/Workspace-Skripte, `packages/game-core/tests/run-tests.js`, `packages/game-core/jest.config.js`.
  - Fertig: Die vorhandenen 60 Tests bestehen oder fachlich begründete spätere Änderungen sind nachvollziehbar. Build, Typprüfung und Linting sind grün. Die bestehende Coverage-Lücke darf hier noch offen sein; Schwellen werden nicht abgesenkt.

**Prüfprotokoll (2026-09-06):** Eine isolierte temporäre Kopie bestand `npm.cmd ci` einschließlich Core-Build. Zusätzlich waren `npm.cmd install --package-lock-only --ignore-scripts`, `npm.cmd run build`, `npm.cmd run type-check`, `npm.cmd run lint`, `npm.cmd test` (60 Tests) und `npm.cmd run test:structure` (8 Strukturtests) erfolgreich. `npm.cmd run test:coverage` bleibt für Block 2 offen; die unveränderten 80-%-Schwellen werden derzeit noch nicht erreicht.

## Bestätigte Regeln für Block 2

Der Benutzer hat R01–R09 am 2026-09-06 bestätigt und Festhalten sowie Würfelzuordnung konkretisiert. Verbindliche Details und Beispiele: [docs/decisions.md](decisions.md).

| ID | Beschlossene Regel |
|---|---|
| R01 | Lokal 2–4 Spieler, Armee-Editor und Ergebnisanzeige. |
| R02 | König-/Bannerverlust eliminiert den Spieler samt Armee; letzter Überlebender gewinnt. |
| R03 | Bogenschützen: Entfernung 2–3, beim eigenen Schuss verlustfrei; kein Nahkampfangriff, auch nicht auf einen Halter. |
| R04 | Angreifer gewinnt Gleichstand: Infanterie gegen Kavallerie/Bogenschützen, Kavallerie gegen Bogenschützen. |
| R05 | Infanteriebesitzer wählt höchstens eine Figur des aktiven Spielers; auch leere Commander sind haltbar. Keine doppelte Festhaltung, Verzicht möglich. |
| R06 | Kostenlose vierte Unit nur für Infanterie mit drei gekauften Units, einschließlich König; Bonus wie schwächste gekaufte Unit. Vier explizit gekaufte Units sind kostenpflichtig. |
| R07 | Höchster natürlicher Wurf zur stärksten Unit, dann absteigend. Boni erst nach dieser Zuordnung anwenden. |
| R08 | Gültiger Kavallerie-Anmarsch erforderlich; Nahkampfangreifer rückt nach Commander-Niederlage vor. Banner ohne Würfeln einnehmen und Feld betreten. |
| R09 | Budget 50, Standardarmee mit sechs Commandern (49 Gold), Punkte nur Ergebnisanzeige. Getrennte Startbereiche, optional reproduzierbare Seed-Aufstellung. |

## Block 2: Regeln und Regelkern

Modell für alle Aufgaben dieses Blocks: **GPT-6 Astra, High**.

- [x] **T05 – Verbindliche Regeln und API festlegen.** R01–R09 klären, eine konsistente Regeltabelle mit Beispielen erstellen und widersprechende Specs aktualisieren. Den öffentlichen Core-Vertrag auf das tatsächliche Datenmodell ausrichten. Entwurfsfunktionen als Entwurf kennzeichnen oder durch die beschlossene API ersetzen. Kein Lebenspunktesystem allein wegen veralteter Entwürfe ergänzen.
  - Erledigt: Benutzerantworten eingearbeitet; Fachspecs 000–006/099 synchronisiert; Core-Vertrag re-exportiert die tatsächliche API und wird typgeprüft. Renderer-Vertrag ausdrücklich als historischer Entwurf markiert.
  - Dateien: `docs/decisions.md`, fachliche Specs, `packages/game-core/src/types.ts`, `packages/game-core/src/index.ts`, `contracts/`.
  - Fertig: Regeln, Datentypen und Akzeptanzfälle sind eindeutig; spätere Modelle müssen keine fachlichen Annahmen treffen.
- [x] **T06 – Gemeinsame Regelabfragen und Zustandsänderungen einführen.** Bewegung, Angriffe, Banner-Einnahme und Zugwechsel über den Core validieren und anwenden. Spielstatus, aktiven Spieler, Besitzer, Existenz, Aktionsverbrauch und gültige Koordinaten prüfen. Eine effektive Truppengattung für leere Commander ableiten. Tile-Belegung entweder aus Figuren ableiten oder konsistent synchronisieren; keine widersprüchlichen Wahrheiten behalten.
  - Dateien: `packages/game-core/src/actions.ts`, `types.ts`, `board.ts`, `game.ts`, `combat.ts`, `index.ts`.
  - Fertig: Ungültige Aktionen verändern weder Zustand noch Würfelablauf. Auch direkte API-Aufrufe können keine fremden Figuren oder beendete Spiele verändern.
- [x] **T07 – Startaufstellung korrigieren.** Commander und Banner kollisionsfrei platzieren. Aufstellungen für zwei, drei und vier Spieler sowie kleine und große gültige Armeen prüfen. Die Anzahl der Figuren auf verfügbare Startflächen abstimmen.
  - Dateien: `packages/game-core/src/game.ts`, `army-builder.ts`, zugehörige Tests.
  - Fertig: Kein überlappendes oder außerhalb des Bretts liegendes Objekt; alle Zuordnungen und Belegungsabfragen stimmen überein.
- [x] **T08 – Bewegung und Festhalten zentralisieren.** Acht Bewegungsrichtungen, Diagonalkosten, erlaubtes Überspringen, blockierende Zwischenfelder, Banner und Festhalten gemäß beschlossenen Regeln implementieren. Die Pfadsuche an die tatsächlich verwendeten Bewegungsregeln anbinden.
  - Dateien: `packages/game-core/src/board.ts`, `pathfinding.ts`, Core-Aktions-/Bewegungsfunktionen und Tests.
  - Fertig: Angezeigte Möglichkeiten und ausführbare Aktionen können dieselben Core-Abfragen verwenden; Grenz- und Blockadefälle sind getestet.
- [x] **T09 – Kampf vereinheitlichen.** Reichweiten, Gleichstände, leere Commander/Könige, Boni, Würfelzuordnung, Fernkampfverluste und Vorrücken gemäß R03–R08 umsetzen. Das Ergebnis enthält alle für Darstellung, Verluste und Fortsetzung nötigen Informationen.
  - Dateien: `packages/game-core/src/combat.ts`, `rng.ts`, `types.ts`, Kampf- und Aktionstests.
  - Fertig: Beschlossene Kampfbeispiele mit vorgegebenen Würfen stimmen exakt; gleiche Ausgangslage und kontrollierter Zufall erzeugen gleiche regelrelevante Ergebnisse.
- [x] **T10 – Niederlagen, Sieg und Ergebniswertung konsolidieren.** Entfernte Könige erkennen, Banner-Einnahme unmittelbar auswerten, ausgeschiedene Spieler korrekt behandeln und Zugreihenfolge aktualisieren. Sieggrund und Gewinner eindeutig speichern. Punkte konsistent aus dem Endzustand ermitteln.
  - Dateien: `packages/game-core/src/game.ts`, `combat.ts`, `scoring.ts`, `types.ts`, Tests.
  - Fertig: König-/Banner-Niederlagen bei 2–4 Spielern, Wiederholung der Abschlussprüfung sowie Aktionen nach Spielende sind abgesichert; keine falsche Patt-Anzeige.
- [x] **T11 – Armeeaufbau und Kosten abgleichen.** Gratiseinheiten, bezahlte Einheiten, Bonuskosten, Königsvorgaben, Budget und zulässige Aufstellung konsistent validieren. Alle Spielerarmeen gegen das tatsächlich gewählte Budget prüfen.
  - Dateien: `packages/game-core/src/army-builder.ts`, `game.ts`, `tests/army-builder.test.ts`.
  - Fertig: Vorschau, Kosten und gebaute Armee stimmen für sämtliche Truppengattungen und Budgetgrenzen überein.
- [x] **T12 – Ereignisse und Regressionstests vervollständigen.** Bewegung, Kampf, Einnahme, Zugwechsel und Spielende nachvollziehbar im Core protokollieren. Zufallswerte beziehungsweise nötigen RNG-Zustand erfassen, soweit sie für reproduzierbare Aktionen erforderlich sind. Tests für alle reproduzierten Fehler ergänzen und relevante Coverage-Lücken schließen.
  - Dateien: Core-Aktions-/Log-/RNG-Strukturen und `packages/game-core/tests/`.
  - Fertig: Bestehende globale 80-%-Coverage-Schwellen bestehen, zusätzlich sind die wichtigen Spielabläufe ausdrücklich geprüft. Kein vollständiges Speicher-/Replay-Produkt als Nebenaufgabe bauen.

Block 2 ist abgeschlossen, wenn der Core die beschlossenen Regeln vollständig entscheidet und seine Tests sowie die Prüfungen aus Block 1 bestehen. Die App darf bis zur Integration in Block 3 noch funktionale Altpfade haben; offene Anpassungen werden ausdrücklich übergeben, ohne den Build zu brechen.

### Abschlussprotokoll Block 2 (2026-09-06)

T05–T12 sind umgesetzt und geprüft. Neue Module `rules.ts`, `holding.ts` und `state.ts` trennen Aktionsabfragen, passive Auswahl und Zustandssynchronisierung. Bewegung, Kampf, Banner-Einnahme, Eliminierung und Zugwechsel sind über die Core-API ausführbar. Der Core prüft auch direkte Aufrufe; Kampf-Vorschauen sind an ihren Ausgangszustand gebunden.

- 148 Tests in acht Suites bestanden, einschließlich der bisherigen 60 Tests mit fachlich gültigen Kampf-Fixtures und der Board-Korrekturen.
- Globale Coverage: Statements 97,04 %, Branches 93,63 %, Funktionen 98,46 %, Zeilen 98,23 %. Alle unveränderten 80-%-Schwellen bestanden.
- `npm.cmd run test:coverage` erfolgreich; abschließender Lauf mit `npm.cmd --workspace=@lands-of-glory/game-core run test -- --coverage --runInBand`.
- `npm.cmd run build`, `npm.cmd run type-check`, `npm.cmd run lint` und `npm.cmd run test:structure` (8 Strukturtests) erfolgreich. Die Typprüfung baut den Core vor der App-Prüfung und prüft zusätzlich `contracts/game-api.ts`.
- Besondere Regressionen: Zielfeld in Sichtlinien, ungültige Koordinaten, freie Einheiten nur für Infanterie, überlappende Startarmeen, leere Bogenschützen als Kavallerie, stärkste Unit zum höchsten Wurf, ausgeschiedene Spieler, veraltete Kampfergebnisse und RNG-Fortsetzung nach dem internen Generator-Umlauf.
- Bestehende Vite-Warnung zum Bundle über 500 kB bleibt; kein Buildfehler. Interaktive Browserabnahme ist weiterhin Teil von Block 3.

### Konkrete Übergabe an Block 3

1. Controller-Regeln durch `applyCommand` oder die entsprechenden Core-Operationen ersetzen; gültige Ziele ausschließlich aus `canMove/getValidMoves`, `canAttack/getValidAttacks` und `canCaptureBanner` beziehen.
2. `getPendingHoldingChoices(state)[0]` anzeigen: Nur dessen `playerId` entscheidet über `holderId` und `targetId` oder Verzicht (`null`). Danach Zustand mit `setHoldingTarget` übernehmen und erneut prüfen. Die aktuelle UI hat diesen Reaktionsdialog noch nicht.
3. Kampf über `resolveCombat`/Animation/`applyCombatResult` oder atomar `attackCommander` ausführen. Während einer Vorschau den Ausgangszustand erhalten. Alte Controller-Vorbewegungen, eigenes Setzen von `hasActedThisTurn` oder Zugwechsel zwischen Vorschau und Anwendung erzeugen absichtlich ein ungültiges/veraltetes Ergebnis.
4. Paargewinner, Verluste, Anmarsch, effektive Gattung, Eliminierung und `finishReason` direkt aus dem Core übernehmen. Undo muss `rngState`, `holdingDecisions`, Spielerstatus und Ereignislog zusammen wiederherstellen.
5. Armee-UI: gemeinsame Budget-/Gratisregeln und maximal 72 Commander beachten. Neue kollisionsfreie Startbereiche ersetzen die alten überlappenden Koordinaten.
6. Der Renderer-Vertrag bleibt Entwurf bis T13–T19. UI-Verhalten ist noch nicht vollständig integriert; erfolgreicher Build ist keine Browser-Spielabnahme.

Nächster Block: **3 – GPT-5.6 Sol, High**. Nicht automatisch begonnen.


## Block 3: Oberfläche und Integration

Modell für alle Aufgaben dieses Blocks: **GPT-5.6 Sol, High**.

- [ ] **T13 – Controller auf den Core umstellen.** Doppelte Regeln für Bewegung, Festhalten, Angriffe und Sieg aus dem Controller entfernen. Auswahl, Zugrecht und Drag-and-Drop an dieselben validierten Aktionen anbinden. Abgewiesene Aktionen lassen die Darstellung in einem gültigen Zustand zurück.
  - Dateien: `apps/prototype/src/controller/game-controller.ts`, `main.ts`.
  - Fertig: Bedienung und direkte Core-Aktion liefern dieselben Ergebnisse; der Controller enthält keine zweite Kampftabelle oder Siegermittlung.
- [ ] **T14 – Kampfanimation und Eingaben synchronisieren.** Ausstehende Auflösung explizit behandeln. Währenddessen keine inkompatiblen Aktionen, Zugwechsel oder Undo zulassen. Veraltete Callbacks nach Abbruch/Neustart verhindern. Wiederholte Eingaben dürfen keine zusätzliche Aktion auslösen.
  - Dateien: `controller/game-controller.ts`, `renderer/combat-animation.ts`, `main.ts`.
  - Fertig: Der reproduzierte Wechsel in eine neue Runde während einer alten Kampfauflösung ist ausgeschlossen; Fehler und Abbruch hinterlassen keinen dauerhaft gesperrten Zustand.
- [ ] **T15 – Darstellung aus Regelergebnissen ableiten.** Gültige Ziele, Festhalten, effektive Truppengattung und Reichweite vom Core beziehen. Würfelpaarsieger und Verlustmarker direkt aus `CombatResult` lesen. Spielerfarben in Brett, Armee-Editor, Infopanel und Kampf gleich darstellen.
  - Dateien: `renderer/game-renderer.ts`, `renderer/combat-animation.ts`, `renderer/dice-renderer.ts`, `main.ts`.
  - Fertig: Gleichstände, leere Commander und Bogenschützen werden ohne Abweichung vom tatsächlichen Ergebnis angezeigt.
- [ ] **T16 – Menü und Armee-Editor reparieren.** Beim Abbruch des Editors das Startmenü wiederherstellen. Budgetänderungen gegen alle Armeen prüfen; ungültigen Spielstart nachvollziehbar verhindern. Gespeicherte Optionen validieren und mit vollständigen Defaults laden.
  - Dateien: `army-builder-screen.ts`, `army-builder-ui.ts`, `start-screen.ts`, `main.ts`.
  - Fertig: Start → Editor → Abbruch → Start und komplette Konfiguration für 2–4 Spieler funktionieren mehrfach hintereinander.
- [ ] **T17 – Spielinformationen und Ressourcenpflege fertigstellen.** Aktiven Spieler, Runde, Zugende, Debug-Toggle, Fehlerfeedback und Kampfprotokoll sichtbar anbinden. Canvas-/UI-Schichtung, Skalierung und Undo-Anzeige korrigieren. Den funktionslosen Soundschalter bis zur gesondert gewünschten Audiofunktion ausblenden. Controller, Animationen und Renderer mit eindeutiger Bereinigung versehen; große Klassen entlang dieser Verantwortlichkeiten aufteilen, soweit es die Korrekturen erleichtert.
  - Dateien: `main.ts`, `style.css`, Controller, Renderer, Animationen und Startbildschirm.
  - Fertig: Bedienung benötigt keine Entwicklerkonsole; Wiederholung/Neustart und Größenänderung erzeugen keine doppelten Listener oder weiterlaufenden Timer. Bestehendes Undo bleibt konsistent mit Spielstatus, Log und Anzeige.
- [ ] **T18 – Browserabläufe automatisiert prüfen.** Die vorhandene Cypress-Konfiguration passend zur Vite-/Pixi-App korrigieren. Start, Armee-Editor, Drag-and-Drop, ungültige Aktionen, Kampf, Animationseingaben, Zugwechsel und Spielende prüfen. Reproduzierbare Spielszenarien für die Tests bereitstellen.
  - Dateien: `apps/prototype/cypress.config.ts`, App-Testverzeichnis, Testskripte und gegebenenfalls eng begrenzte Testhilfen.
  - Fertig: End-to-End-Tests laufen mit definiert gestarteter App; entscheidende 2-/3-/4-Spieler-Fälle sind abgedeckt. Ergebnisse eines zusätzlichen manuellen Browserdurchlaufs festhalten.
- [ ] **T19 – Automatische Qualitätsprüfung einrichten.** CI für Installation, Build, Typprüfung, Linting, Core-Tests mit Coverage und Browsertests ergänzen. Eine passende Windows-Prüfung für den lokalen Arbeitsablauf berücksichtigen. Erforderliche Testserver zuverlässig starten und beenden.
  - Dateien: `.github/workflows/`, Paket-Skripte und Testkonfigurationen.
  - Fertig: Prüfablauf funktioniert lokal; CI-Konfiguration ist überprüft. Ein tatsächlich gelaufener Remote-CI-Status wird nur behauptet, wenn ein autorisierter Remote-Lauf vorliegt.

## Block 4: Dokumentation und Übergabe

Modell für alle Aufgaben dieses Blocks: **GPT-5.6 Luna, Medium**.

- [ ] **T20 – Einstieg und Status korrigieren.** README, Setup und Workspace-Anleitungen auf den nachgewiesenen Funktionsumfang und die tatsächlich geprüften Befehle bringen. Unbelegte Aussagen wie „produktionsreif“, „0 bekannte Bugs“ oder alte Testzahlen entfernen beziehungsweise durch nachgewiesene Angaben ersetzen.
  - Dateien: `README.md`, `SETUP.md`, `PRODUCTION-READY.md`, Workspace-READMEs, `docs/quickstart.md`.
  - Fertig: Neue Entwickler können dem dokumentierten Ablauf folgen; lokale und noch nicht ausgeführte Remote-Prüfungen sind klar bezeichnet.
- [ ] **T21 – Fachliche Dokumentation synchronisieren.** Architektur, Datenmodell, Terminologie, Roadmap und Planungsartefakte an T05 und den fertigen Code angleichen. Historische Phasenberichte eindeutig kennzeichnen. Die leere Projekt-Constitution nur mit bereits beschlossenen Projektregeln füllen; keine neuen Freigabepflichten oder Prozessregeln erfinden.
  - Dateien: `docs/`, `specs/`, `.github/copilot-instructions.md`, `.github/pull_request_template.md`, `.specify/memory/constitution.md`.
  - Fertig: Keine parallelen widersprüchlichen Aussagen zu Regelbasis, API, Koordinaten, Spielumfang oder Projektstatus. Neu entdeckte fachliche Konflikte an Block 5 melden statt eigenständig entscheiden.
- [ ] **T22 – Beispiele und Bereinigung vorbereiten.** Zweck der vorhandenen Würfel-/Tile-Demos dokumentieren und ihre späteren Zielpfade unter `examples/` festhalten. Den Altvergleich mit den fünf Abweichungen und der optionalen kleinen Armee dokumentieren. Fehlende Lizenzdatei als konkreten offenen Punkt erfassen; Rechteinhaber nicht erfinden.
  - Dateien: Dokumentation der Beispiele und `alt`, diese Implementierungsliste.
  - Fertig: Es ist klar, welche Beispiele bleiben, welche Dateien verschoben werden sollen und dass „alt“ keine einzigartige Implementierung enthält. Die eigentliche Verschiebung und Löschung erfolgen in Block 5.

## Block 5: Abnahme und Entfernung von `alt`

Modell für alle Aufgaben dieses Blocks: **GPT-6 Astra, High**.

- [ ] **T23 – Gesamtabnahme mit Fehlerkorrekturen.** Beschlossene Regeln gegen Core, UI, Tests und Dokumentation prüfen. Besondere Aufmerksamkeit: Mehrspieler-Niederlage, leere Commander, Festhalten, Gleichstände, Gratiseinheiten, Undo, Animationseingaben, Ergebniswertung und unveränderte Zustände nach ungültigen Aktionen. Dabei gefundene Fehler im Rahmen des beschlossenen Umfangs beheben und passend nachprüfen.
  - Fertig: Keine offenen blockierenden Fehler; verbleibende nicht blockierende Einschränkungen sind konkret dokumentiert. Browser-/Performance-Aussagen beruhen auf tatsächlichen Prüfungen.
- [ ] **T24 – Altvergleich erneuern und Bereinigung durchführen.** Vor der Löschung den Zustand von `alt/lands-of-glory` erneut prüfen, einschließlich uncommitteter Änderungen, Branches, Stashes und zusätzlicher Historie. Seit dem ersten Vergleich entstandene einzigartige Inhalte zunächst sichern oder integrieren. Referenzen auf `alt` prüfen. Freigegebene Demos nach `examples/` verschieben und Verweise aktualisieren. Erst bei abgeschlossenem Vergleich ausschließlich den aufgelösten Projektunterordner `C:/Git/lands-of-glory/alt` entfernen; eine wiederherstellbare Entfernung bevorzugen.
  - Fertig: Keine einzigartige Datei oder Git-Historie geht verloren; das aktive Projekt benötigt `alt` nicht. Bericht nennt entfernten Pfad und Wiederherstellungsmöglichkeit. Die Beauftragung dieses Blocks umfasst diese konkret beschriebene Bereinigung; bei neuen unklaren Inhalten wird gezielt nachgefragt.
- [ ] **T25 – Abschlussprüfung und Übergabe.** Nach relevanten Codekorrekturen und Dateiverschiebungen Build, Typprüfung, Linting, Unit-Tests mit Coverage, Strukturtests und Browsertests ausführen. Betroffene Dokumentationslinks prüfen und Fortschritt abschließen.
  - Fertig: Prüfresultate, bekannte Einschränkungen und endgültiger Stand sind dokumentiert. Ein nicht ausgeführter Test bleibt ausdrücklich ungeprüft. Keine unnötigen Testwiederholungen, wenn seit einem erfolgreichen Lauf keine relevante Änderung erfolgte.

## Optionale Erweiterungen

Diese Punkte gehören nicht automatisch zu T01–T25 und sind für das Entfernen von `alt` nicht erforderlich.

| ID | Erweiterung | Modell / Denktiefe | Voraussetzung |
|---|---|---|---|
| O01 | 20-Gold-Preset „Kleines Gefecht“ mit der früheren Vier-Commander-Konfiguration | GPT-5.6 Terra / Medium | T11 abgeschlossen; Preset gegen die beschlossene Gratiseinheitenregel validieren. |
| O02 | Echte Soundeffekte und funktionierender Soundschalter | GPT-5.6 Sol / Medium | UI-Lebenszyklus stabil; Audioquellen und gewünschte Ereignisse festgelegt. |
| O03 | Vollständiges Speichern/Laden und deterministisches Replay | GPT-6 Astra / High | Ereignis-/RNG-Modell stabil; eigener Funktionsumfang und Speicherformat beschlossen. |

## Startauftrag pro Block

Nach Einstellen des Modells diesen Auftrag mit der passenden Blocknummer senden:

```text
Lies docs/implementation-plan.md und setze Block 1 vollständig um.
Bearbeite alle Aufgaben dieses Blocks mit dem aktuell eingestellten Modell,
einschließlich der erforderlichen Tests und Fehlerkorrekturen.
Beachte Abhängigkeiten und bereits getroffene Regelentscheidungen.
Aktualisiere Aufgabenstatus und Übergaben in der Datei.
Beende danach den Block und nenne den nächsten Block samt Modell.
```

Für spätere Blöcke lediglich die Nummer ersetzen. Bei einem neuen Chat dient diese Datei gemeinsam mit dem aktuellen Repository als Übergabe. Zusätzliche Benutzerentscheidungen deshalb hier oder in `docs/decisions.md` festhalten.

## Fortschritt und Übergaben

| Block | Status | Ergebnisse / offene Übergabe |
|---|---|---|
| 1 | Abgeschlossen | Installation in temporärer Kopie, Build, Typprüfung, Linting und bestehende Tests geprüft; siehe Prüfprotokoll oben. |
| 2 | Abgeschlossen | R01–R09 umgesetzt; 148 Tests, alle Coverage-Schwellen, Build/Typprüfung/Linting/Strukturtests bestanden. UI-Anbindung und Festhalte-Dialog siehe Übergabe an Block 3. |
| 3 | Offen | Keine vorhandenen End-to-End-Testdateien und kein vollständiger interaktiver Browserdurchlauf aus der Ausgangsprüfung. |
| 4 | Offen | Widersprüchliche Projektstände in README, Specs, API-Entwürfen und Phasenberichten. |
| 5 | Offen | Ausgangsvergleich: 148 Altdateien außerhalb `.git`, 143 identisch, fünf ältere Varianten, keine einzigartigen Projektdateien oder fehlenden alten Commits gefunden. |
