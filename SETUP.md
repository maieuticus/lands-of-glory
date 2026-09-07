# Entwicklungsumgebung

## Voraussetzungen

Node.js 20 LTS und npm 10 oder neuer werden empfohlen. Git wird zum Klonen benötigt.

```bash
git clone https://github.com/maieuticus/lands-of-glory.git
cd lands-of-glory
npm ci
```

## Lokaler Ablauf

```bash
npm run build       # Core und Prototype bauen
npm run type-check  # einschließlich contracts/
npm run lint
npm test            # Core-Regeltests
npm run test:coverage
npm run test:integration # Controller und Pixi-Ressourcen ohne Browser
npm run test:structure
npm run verify      # komplette nichtgrafische Qualitätskette
npm run dev         # Vite auf http://localhost:3000
```

Cypress benötigt zusätzlich eine installierte Browser-Laufzeit. Der Testserver für E2E wird mit `npm run dev:e2e` gestartet; die Suite verwendet `npm run test:e2e`. Der abschließende Browserlauf ist im aktuellen Block-3-Protokoll als ungeprüft vermerkt.

## Bedienung

| Eingabe | Wirkung |
|---|---|
| Ziehen mit linker Maustaste | Commander bewegen, angreifen oder Banner erobern |
| Rechtsklick + Ziehen | Kamera verschieben |
| Mausrad | Zoom |
| `E` | Zug beenden |
| `D` | Debug-Anzeige umschalten |
| `Esc` | Auswahl aufheben |
| `Strg+Z` | letzten Zustand wiederherstellen |

Während einer Kampfanimation und einer offenen Festhalte-Auswahl sind Zugende, Undo und weitere Aktionen gesperrt. Die Festhalte-Auswahl entscheidet ausschließlich der Besitzer der Infanterie; Verzicht ist eine gültige Antwort. Bestehende Festhaltungen kann ihr Besitzer über die mit seinem Namen beschriftete Schaltfläche „Festhaltung … lösen“ aufheben.

Die Beispiele liegen unter [examples/](examples/). `npm run demo:dice` kompiliert das Core-Beispiel nach `.cache/examples/` und führt vier Kampfszenarien aus. Unter `.cache/alt-backups/` liegt außerdem die geprüfte Alt-Sicherung; Wiederherstellung siehe [Bereinigungsbericht](docs/alt-comparison.md). Diese Sicherung beim Leeren von Caches gegebenenfalls vorher aufbewahren.

## Fehlerbehebung

Bei Änderungen am Core zuerst `npm run build` ausführen. Bei einem belegten Port kann Vite mit `--port <port>` gestartet werden. Generierte Verzeichnisse wie `dist/`, `coverage/` und Cypress-Screenshots sind nicht Teil der Quellen und können nach einem fehlgeschlagenen Lauf entfernt werden. Neue fachliche Regeln gehören zuerst in `docs/decisions.md` und die betroffenen Specs.
