# Altvergleich und Bereinigung

Stand: 2026-09-07, Block 5 abgeschlossen. Entfernt wurde ausschließlich `C:/Git/lands-of-glory/alt`. Der Altbestand ist vollständig im lokalen Sicherungsarchiv erhalten.

## Ursprüngliche fünf Dateiabweichungen

Der Vergleich von Alt-HEAD `80e9528` mit dem damaligen aktiven Stand `58eed19` ergibt genau diese fünf Dateien. Die in Block 4 verwendeten „fünf fachlichen Abweichungsgruppen“ waren keine korrekte Wiedergabe dieses Vergleichs und sind hiermit ersetzt.

| Datei | Unterschied im damaligen aktiven Projekt | Entscheidung |
|---|---|---|
| `apps/prototype/vite.config.ts` | Host explizit gesetzt, automatisches Browseröffnen deaktiviert | Aktuelle Vite-Konfiguration behalten |
| `packages/game-core/src/army-builder.ts` | Budget 20 → 50; vier → sechs Commander; Hauptleute erhalten vier gekaufte Units mit 0/0/1/3 | Bestätigtes 49-Gold-Standardheer behalten |
| `packages/game-core/tests/army-builder.test.ts` | Erwartungen an Kosten und sechs Commander angeglichen | Aktuelle Regressionstests behalten |
| `packages/game-core/tests/combat.test.ts` | Commander-IDs typisiert, veränderliches Test-Fixture korrigiert | Aktuelle Tests behalten |
| `packages/game-core/tests/game.test.ts` | Veraltete Sonderausstattung des ersten Bogenschützen entfernt, Commander-ID typisiert | Aktuelle Tests behalten |

Die frühere kleine Armee: Infanterie-König mit 0/0/0/0, je ein Infanterie-, Kavallerie- und Bogenschützen-Hauptmann mit drei gekauften Units 0/0/1. Kosten: 19 Gold bei 20 Gold Budget. Ein entsprechendes Preset bleibt O01; die kostenlose vierte Unit dürfte nach den bestätigten Regeln nur Infanterie erhalten. Dieses Preset wurde nicht zusätzlich implementiert.

## Erneute Prüfung vor der Entfernung

- 148 Projektdateien außerhalb des alten `.git`: Beim Vergleich vor den Demo-Verschiebungen waren 90 byte-identisch und 58 durch die bisherigen Blöcke verändert. Jeder Altpfad war im aktiven Projekt vorhanden.
- Alter HEAD: `80e9528d888d5c5a60e2806eb9926b502019d30b`. Lokaler Branch `main` und Remote-Refs `origin/main`, `origin/HEAD` verweisen darauf; `origin/002-spec-analysis` auf `4ee1f2d`.
- Alle 33 über alte Refs erreichbaren Commits und alle Reflog-Ziele sind auch in der aktiven Git-Historie vorhanden.
- Keine uncommitteten, untracked oder ignorierten Dateien im Alt-Repository; keine Stashes. `git fsck --full --no-reflogs` meldete weder Fehler noch unerreichbare zusätzliche Objekte.
- Keine Verknüpfungen/Reparse-Points im zu entfernenden Unterordner gefunden. Keine einzigartige aktive Implementierung musste nachgezogen werden.
- Die vier Demos sind unter [examples/](../examples/) erhalten. Das TypeScript-Beispiel verwendet jetzt gültige Szenarien und die aktuelle Core-API.

## Sicherung und Wiederherstellung

Archiv: `.cache/alt-backups/block5-20260907/alt.tar.gz` relativ zum Projektroot. Es enthält alle 176 Dateien einschließlich der vollständigen alten Git-Datenbank, Refs und Konfiguration.

SHA-256: `19E5004DE20807C1A75C18A5044194C64DFE9045EDEE0DB049D779DE131BE1A1`.

Das Archiv wurde testweise entpackt. Jede wiederhergestellte Datei stimmte per SHA-256 mit dem Original überein; `git fsck --full` in der wiederhergestellten Kopie bestand. Anschließend wurden der aufgelöste Zielordner `C:/Git/lands-of-glory/alt` und die temporäre Prüfkopie entfernt. Das Archiv bleibt lokal erhalten und ist über die vorhandene `.cache/`-Regel von Git ausgeschlossen.

Zur Wiederherstellung bei weiterhin fehlendem `alt` vom Projektroot aus:

```powershell
tar -xzf .cache/alt-backups/block5-20260907/alt.tar.gz -C .
```

Die Entfernung des bisher als Gitlink erfassten `alt/lands-of-glory` erscheint als lokale Löschung im Git-Status. Es wurde kein Commit angelegt.
