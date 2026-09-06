# Kampf und Würfelauflösung
Stand: 2026-09-06. Grundlage: bestätigte [R03, R04, R07 und R08](../docs/decisions.md).

## Würfelzuordnung

Alle aktiven Units nehmen teil, jeweils mit einem W6. Bei einem leeren Commander wird ein W6 für die Figur verwendet; effektive Gattung Kavallerie, Bonus 0.

Für jede Seite werden die natürlichen Würfe absteigend sortiert. Die stärkste Unit erhält den höchsten Wurf, die zweitstärkste den zweithöchsten usw. Bei gleichen Boni entscheidet der Slotindex. Erst danach werden Unit-Bonus und gegebenenfalls Königsbonus +1 addiert. Effektive Werte über 6 sind erlaubt.

Höchster Wurf gegen höchsten Wurf, zweitgrößter gegen zweitgrößten usw.; überzählige Würfel verursachen keine Verluste. Nach der Zuordnung bleiben Würfel und Unit für Paarvergleich und Verlustzuordnung verbunden.

## Paarvergleich

Der größere effektive Wert gewinnt. Bei Gleichstand gilt:

| Angreifer | Verteidiger | Angreifer gewinnt Gleichstand |
|---|---|---|
| Infanterie | Infanterie | Nein |
| Infanterie | Kavallerie | Ja |
| Infanterie | Bogenschützen | Ja |
| Kavallerie | Infanterie | Nein |
| Kavallerie | Kavallerie | Nein |
| Kavallerie | Bogenschützen | Ja |
| Bogenschützen | Infanterie/Kavallerie/Bogenschützen | Nein |

Die Tabelle verwendet effektive Gattungen: ein leerer ehemaliger Bogenschützen-Commander zählt als Kavallerie.

## Verluste

Jedes verlorene Paar entfernt automatisch seine zugeordnete Unit. Keine freie Opferwahl. Ausnahme: Beim Schuss eines Bogenschützen-Commanders erleidet der Angreifer keine Verluste. Verliert dieser ein Paar, entsteht auf beiden Seiten dieses Paares kein Verlust.

Der Verlust der letzten unterstellten Unit entfernt den Commander noch nicht. Ein bereits leerer Commander wird entfernt, wenn sein eigener Würfel verliert. Ein leerer König erhält weiterhin +1; seine Niederlage eliminiert den Spieler sofort.

## Validierung und Anwendung

`canAttack` prüft Status, Eigentümer, aktive Partei, Aktionsverbrauch, Ziel, Reichweite, Festhalten und Anmarsch. `resolveCombat` validiert vor dem Würfeln und erstellt eine Vorschau. `applyCombatResult` akzeptiert nur ein zum Ausgangszustand passendes Ergebnis und prüft Würfel, Paarvergleich sowie RNG-Fortsetzung. Veraltete oder manipulierte Ergebnisse werden abgewiesen.

`attackCommander` führt Vorschau und Anwendung zusammen aus. Der Core markiert die Aktion als verbraucht, wendet Anmarsch und Vorrücken an, synchronisiert Belegung/Units, protokolliert Rohwürfe, Paare, Verluste und Positionen und prüft Niederlage/Sieg unmittelbar.

Vorgegebene Würfe müssen exakt zur Anzahl aktiver Units beziehungsweise leerer Commander passen und ganzzahlig 1–6 sein. Ohne Vorgabe verwendet der Zustand einen fortsetzbaren Seeded-RNG. Abgewiesene Aktionen verbrauchen keinen Zufall.

## Abnahme

Alle neun Gattungspaarungen bei Gleichstand, höchster Wurf zur stärksten Unit, König-Boni, Fernkampf ohne Angreiferverluste, leere Commander, überzählige Würfel, Verlust der letzten Unit, Anmarsch/Vorrücken, stale Ergebnisse und wiederholte Ausführung werden automatisiert geprüft.
