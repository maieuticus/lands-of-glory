# Verbindliche Kampfbeispiele
Stand: 2026-09-06. Diese Beispiele entsprechen den Benutzerentscheidungen zu Block 2.

## Höchster Wurf zur stärksten Unit

Angreifer würfelt in beliebiger Reihenfolge 2/6/3/5. Seine Units besitzen Boni 0/3/1/2.

| Rang | Natürlicher Wurf | Zugeordneter Bonus | Effektiv | Als König |
|---|---:|---:|---:|---:|
| 1 | 6 | 3 | 9 | 10 |
| 2 | 5 | 2 | 7 | 8 |
| 3 | 3 | 1 | 4 | 5 |
| 4 | 2 | 0 | 2 | 3 |

Die Boni sind vor der Sortierung nicht an einzelne Würfel gebunden. Nach der Zuordnung bestimmen die Paare die konkreten Unit-Verluste.

## Gleichstände

Infanterie 5 gegen Kavallerie 5: Angreifer gewinnt.
Infanterie 5 gegen Bogenschützen 5: Angreifer gewinnt.
Kavallerie 5 gegen Bogenschützen 5: Angreifer gewinnt.
Kavallerie 5 gegen Infanterie 5: Verteidiger gewinnt.
Bogenschützen 5 gegen Bogenschützen 5 beim Schuss: Verteidiger gewinnt das Paar, aber keine Unit wird entfernt.

## Fernkampf und leere Commander

Bogenschützen schießen aus Entfernung 2 oder 3. Verliert der Angreifer ein Paar, bleibt seine Unit erhalten. Auf Entfernung 1 darf er nicht angreifen.

Ein leerer ehemaliger Bogenschützen-Commander zählt als Kavallerie: Er kann aus Entfernung 1 angreifen, aber auch selbst sterben. Ein leerer König würfelt mit +1.

## Aktion und Niederlage

Kavallerie auf (10,10) greift einen leeren Gegner auf (12,12) an. (11,11) muss als freies Anmarschfeld erreichbar sein. Bei Wurf 6 gegen 1 wird der Verteidiger entfernt und der Angreifer endet auf (12,12). Ist (11,11) durch einen Gegner blockiert, wird nicht gewürfelt oder bewegt.

War der Verteidiger ein König, scheidet sein Besitzer unmittelbar aus. Bei vier Spielern spielen die drei übrigen weiter. Der letzte Überlebende gewinnt.

Ein erreichbares gegnerisches Banner wird ohne Würfeln durch Nahkampf eingenommen. Der Angreifer endet auf dem Bannerfeld, dessen Besitzer scheidet aus. Bogenschützen mit Units dürfen das nicht.

Automatisierte Nachweise stehen in `tests/combat-rules.test.ts`, `tests/rules.test.ts` und `tests/setup-rules.test.ts` im Core-Workspace.
