# Lands of Glory

Lands of Glory ist ein lokaler Browser-Prototyp eines taktischen Brettspiels. PixiJS rendert Brett und Animationen; `packages/game-core` entscheidet alle regelrelevanten Aktionen. `GameState` ist die einzige Regelwahrheit.

## Version-1-Umfang

- 24 × 24 Grasbrett mit Raster, Zoom und Kamera-Panning
- 2–4 lokale Spieler
- ein König, Banner und bis zu 72 Commander je Spieler
- vier Unit-Slots je Commander; Infanterie, Kavallerie oder Bogenschützen
- regelvalidierte Bewegung, Festhalten, Nah- und Fernkampf, Banner-Einnahme
- Würfelzuordnung nach natürlichem Wert, Boni erst danach; Core-Ereignislog und Ergebnisanzeige
- Armee-Editor mit gemeinsamem Budget von standardmäßig 50 Gold

Bogenschützen greifen ausschließlich auf Entfernung 2–3 an und erleiden beim eigenen Schuss keine Verluste. Gleichstände folgen der in `docs/decisions.md` festgehaltenen Tabelle. Online-Multiplayer, Login, Datenbank, Persistenz, Audio und spätere Gelände-/Handelssysteme sind nicht Bestandteil dieser Version.

## Schnellstart

```bash
npm ci
npm run verify
npm run dev
```

Danach `http://localhost:3000` öffnen. Die wichtigsten Tasten sind `D` (Debug), `E` (Zugende), `Esc` (Auswahl aufheben), `Strg+Z` (Undo), Linksklick/Ziehen (Aktion), Rechtsklick-Ziehen (Panning) und Mausrad (Zoom).

Weitere Hinweise stehen in [`docs/quickstart.md`](docs/quickstart.md) und [`SETUP.md`](SETUP.md). Die fachliche Übergabe und der geprüfte Stand stehen in [`docs/implementation-plan.md`](docs/implementation-plan.md). Zweck der historischen Demos und der Vergleich mit `alt` sind in [`docs/examples.md`](docs/examples.md) und [`docs/alt-comparison.md`](docs/alt-comparison.md) festgehalten.

## Struktur

`packages/game-core/` enthält immutable Regeln und Jest-Tests. `apps/prototype/` enthält Vite/PixiJS-Oberfläche, Controller-/Ressourcentests und Cypress-Flows. `specs/` beschreibt den fachlichen Umfang; `docs/` enthält Architektur, Begriffe, Entscheidungen und Prüfprotokolle. Demos liegen unter `examples/`; `npm run demo:dice` führt das aktuelle Core-Beispiel aus. `alt` wurde nach geprüfter Sicherung entfernt; Wiederherstellung siehe [Altvergleich](docs/alt-comparison.md).

## Nachweis und Grenzen

`npm run verify` prüft Build, Typen, Lint, Core-Coverage, Integrationstests ohne Browser und Strukturtests. Block 5 bestand 149 Core-, 6 Integrations- und 8 Strukturtests. Der abschließende Cypress-Lauf sowie ein manueller Browserdurchlauf bleiben auf Nutzerwunsch ausgelassen. Es gibt keine belastbare Aussage „produktionsreif“ und keinen Nachweis für Remote-CI, Performance oder Browserabdeckung außerhalb der genannten Läufe.
