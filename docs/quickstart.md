# Quickstart

```bash
npm ci
npm run verify
npm run dev
```

Browser: <http://localhost:3000>.

Im Startmenü kann zwischen Schnellstart und Armee-Editor gewählt werden. Der Editor prüft jede Armee gegen das gemeinsame Budget und akzeptiert maximal 72 Commander. Nach einem Kampf muss die Animation angeklickt werden; erst danach wird das Core-Ergebnis angewandt. Bei einer offenen Festhalte-Auswahl wählt der Besitzer der haltenden Infanterie ein Ziel oder „Nicht festhalten“.

Bestehende Festhaltungen kann der Infanteriebesitzer über „Festhaltung … lösen“ aufheben.

`npm run verify` kombiniert Build, Typprüfung, Linting, Core-Coverage, Controller-/Ressourcentests und Strukturtests. Die Controller-/Ressourcentests laufen einzeln über `npm run test:integration` ohne Browser. Cypress verwendet `npm run dev:e2e` und `npm run test:e2e`; die abschließenden Browserläufe bleiben auf Nutzerwunsch ausgelassen. Demos: [examples.md](examples.md), ausführbares Core-Beispiel: `npm run demo:dice`.
