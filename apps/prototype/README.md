# Prototype-App

Die Vite/PixiJS-App unter `apps/prototype` ist die lokale Oberfläche. Sie besitzt keine eigene Regelautorität: Der Controller ruft `@lands-of-glory/game-core` auf, der Renderer zeigt den zurückgegebenen `GameState` und `CombatResult`.

```bash
npm ci
npm run build --workspace=lands-of-glory-prototype
npm run dev
```

Alle oben genannten Befehle werden vom Repositoryroot ausgeführt. Die App läuft auf Port 3000. `npm run test:integration` prüft Controller und Ressourcenfreigabe ohne Browser mit der vorhandenen Core-Jest-Toolchain. Für E2E: `npm run dev:e2e` in einem Terminal und `npm run test:e2e` in einem zweiten. Die Testbrücke wird bei vorhandenem URL-Parameter `e2e` (üblicherweise `?e2e=1`) angelegt und bietet nur Zustandslesung, Drop, Zugende, Undo und Animation-Abschluss. Abschließende Browserläufe wurden auf Nutzerwunsch ausgelassen.

Die UI zeigt aktiven Spieler, Runde, Core-Protokoll, Einheiteninfo, Fehlerfeedback und Festhalte-Auswahl. Der Infanteriebesitzer kann bestehende Festhaltungen über die entsprechend beschrifteten Schaltflächen lösen. `D`, `E`, `Esc`, `Strg+Z`, Rechtsklick-Panning und Mausrad-Zoom sind verfügbar. Audio ist derzeit nicht implementiert und der Soundschalter wird nicht angeboten.
