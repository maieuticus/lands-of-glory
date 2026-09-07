# Verbindliche Entscheidungen

Stand: 2026-09-06. Die Antworten des Benutzers zu Block 2 bestätigen R01–R09 mit den unten eingearbeiteten Korrekturen zu Festhalten und Würfelzuordnung. Diese Fassung ersetzt die widersprechenden früheren Festlegungen.

## Regeln

| ID | Verbindliche Festlegung |
|---|---|
| R01 | Lokaler Browsermodus für 2–4 Spieler, Armee-Editor und Ergebnisanzeige. Online-Modus, Backend, Login und Speicherung/Replays als Produkt gehören nicht zu diesem Auftrag. |
| R02 | Verlust des Königs oder Einnahme des Banners eliminiert den Besitzer sofort. Seine Commander und aktiven Units verschwinden, seine Banner blockieren nicht mehr. Ausgeschiedene Spieler werden übersprungen. Der letzte verbleibende Spieler gewinnt. |
| R03 | Bogenschützen mit aktiven Units schießen auf Entfernung 2–3 (Chebyshev-Distanz), erleiden beim eigenen Schuss keine Verluste und dürfen im Nahkampf nicht angreifen, auch wenn sie gehalten werden. Verteidigung bleibt erlaubt. Leere Commander kämpfen unabhängig vom ursprünglichen Typ als Kavallerie. |
| R04 | Bei effektivem Gleichstand gewinnt angreifende Infanterie gegen Kavallerie und Bogenschützen; angreifende Kavallerie gewinnt gegen Bogenschützen. In allen anderen Paarungen gewinnt der Verteidiger. Effektive Truppengattungen leerer Commander beachten. |
| R05 | Infanterie mit aktiven Units darf genau eine angrenzende gegnerische Figur des gerade aktiven Spielers halten. Der Infanteriebesitzer wählt das Ziel und darf verzichten. Auch leere Commander dürfen gehalten werden; leere Infanterie kann selbst nicht halten. Keine doppelte Festhaltung. Gehaltene Figuren dürfen sich nicht bewegen und nur ihren Halter angreifen; Bogenschützen mit Units können somit nur verteidigen. |
| R06 | Nur Infanterie mit genau drei gekauften Units erhält eine kostenlose vierte mit dem kleinsten Bonus der drei. Gilt auch für den König. Vier explizit gekaufte Units werden vollständig bezahlt. Preis: Hauptmann 1 Gold, König 0, jede gekaufte Unit 1 plus ihre Bonuspunkte. |
| R07 | Zuerst natürliche Würfelwerte absteigend sortieren. Dann stärkste Unit dem höchsten Wurf zuordnen, zweitstärkste dem zweithöchsten usw. Bonus und gegebenenfalls Königsbonus +1 addieren. Überzählige Würfel ignorieren. Die einem verlorenen Paar zugeordnete Unit ist der Verlust. |
| R08 | Kavallerie braucht einen gültigen Weg bis auf ein freies Nachbarfeld des Gegners; Anmarsch und Angriff sind zusammen eine Aktion. Fehlt der Weg, wird nichts verändert oder gewürfelt. Ein überlebender Nahkampfangreifer rückt nach Niederlage des verteidigenden Commanders auf dessen Feld. Erreichbare Banner werden ohne Würfeln durch Nahkampf eingenommen, der Angreifer betritt das Feld. |
| R09 | Standardbudget 50; König mit 0/0/0/0 und fünf Hauptleute mit je 0/0/1/3, davon insgesamt drei Infanterie-Commander, ein Kavallerie-Commander und zwei Bogenschützen. Kosten 49 Gold. Punkte sind ausschließlich Ergebnisanzeige: aktive Units + dreifache Anzahl verbliebener Commander + Unit-Bonuspunkte. |

## Gemeinsame Grundlagen

Das Brett hat 24 × 24 Felder, intern ganzzahlige Koordinaten 0–23 und Zugriff `tiles[x][y]`. Das aktive Spiel erzeugt nur Gras. Vorhandene Terrain-Hilfen bleiben verfügbar, erzeugen aber keine zusätzlichen Terrain-Spielmodi.

Bewegung erfolgt in acht Richtungen; auf Gras kostet ein Schritt einschließlich Diagonalen 1. Infanterie/Bogenschützen bewegen sich 1 Feld, Kavallerie und leere Commander 2. Eigene Commander dürfen als Zwischenfeld übersprungen werden, nicht als Endfeld dienen; Gegner und stehende Banner blockieren. Diagonalen haben keine zusätzliche Eckblockaderegel.

Jeder Commander hat vier Slots und pro eigenem Zug eine Aktion. Alle aktiven Units kämpfen mit jeweils einem W6; ein leerer Commander mit einem W6 und Bonus 0, ein leerer König zusätzlich +1. Ein Commander wird erst besiegt, wenn er bereits ohne aktive Units kämpft und sein eigener Würfel verliert. Der Verlust der letzten unterstellten Unit allein entfernt ihn nicht. Das bestehende `health`-Feld bleibt zur App-Kompatibilität erhalten; es wird kein Schadens-/Lebenspunktekampf eingeführt.

## Präzisierungen für eine eindeutige Umsetzung

Diese technischen Präzisierungen setzen die bestätigten Regeln um:

- Festhalten ist eine Reaktion ohne Aktionsverbrauch. Offene Antworten werden in Spielerreihenfolge und innerhalb einer Armee nach Commander-ID bearbeitet. Vor einer normalen Aktion oder dem Zugende muss die erste offene Antwort entschieden werden.
- Die Auswahl bleibt bestehen, solange Halter und Ziel gültig benachbart sind; Verzicht gilt bis zur Änderung der Nachbarschaft. Der Besitzer kann eine bestehende Festhaltung lösen. Bei einem Spielerwechsel wird neu gewählt. Neue Nachbarschaften nach einer Aktion können eine neue Antwort erfordern. Nur Figuren des aktiven Spielers kommen in die Auswahl.
- Bei gleichen Unit-Boni entscheidet der Slotindex über die Würfelzuordnung. Gleiche natürliche Würfe sind numerisch austauschbar. Die Rohwürfe stehen im Log in der Reihenfolge Angreifer, dann Verteidiger.
- Startbereiche sind vier disjunkte Streifen mit je 72 Feldern. Zwei Spieler stehen sich oben/unten gegenüber, drei belegen oben/rechts/unten, vier zusätzlich links. Banner stehen vor diesen Bereichen. Die erste Reihe wird zuerst gefüllt. Größere Armeen als der eigene Bereich werden abgewiesen.
- Ohne Seed gilt die Reihenfolge der Armee-Konfiguration. Ein expliziter Seed mischt die gewählten Startplätze reproduzierbar. Derselbe Seed und dieselben Aktionen ergeben dieselben Würfel und Logeinträge.
- Log-`timestamp` ist eine logische Ereignisnummer, keine Wanduhrzeit. Runde, Spieler, Pfad, Würfel, Verluste und Sieggrund stehen im Zustand beziehungsweise Log.
- Commander-Positionen sind die Belegungsquelle. `Tile.occupant`, Spielerzuordnung und Unit-Register werden nach Zustandsänderungen synchronisiert. Entfernte Units bleiben als `removed` im Register nachvollziehbar.
- Sollte ein extern konstruierter Zustand keine Überlebenden haben, wird er als Patt ohne Gewinner abgeschlossen. Normale Spielaktionen erzeugen diesen Fall nicht.

## Akzeptanzbeispiele

1. Wurfpool 2/6/3/5, Unit-Boni 0/3/1/2: Zuordnung 6+3, 5+2, 3+1, 2+0. Beim König jeweils zusätzlich +1.
2. Kavallerie 5 gegen Bogenschützen 5: Verteidiger verliert die zugeordnete Unit.
3. Bogenschützen 2 gegen Verteidiger 6: kein Verlust auf beiden Seiten dieses Paares.
4. Leerer ehemaliger Bogenschützen-Commander: effektive Kavallerie, kann im Nahkampf angreifen und dabei besiegt werden.
5. Spieler B besitzt Infanterie neben Figuren von A und C; A ist am Zug: B darf nur eine Figur von A halten.
6. Gehaltener Bogenschützen-Commander mit Units: kein Wegziehen und kein Angriff auf den benachbarten Halter; Verteidigung bleibt möglich.
7. Infanterie mit drei gekauften Boni 1/2/3: Kosten für Units 9 Gold, gebaut werden 1/2/3/1. Ein Hauptmann kostet zusätzlich 1 Gold. Kavallerie/Bogenschützen bekommen keine vierte Unit.
8. In einem Viererspiel verliert B seinen König: B scheidet aus; A, C und D spielen weiter. Erst der letzte Überlebende gewinnt.

## Architektur und Übergabe

PixiJS zeigt; `game-core` entscheidet. Regelzustand und UI-Zustand bleiben getrennt. Öffentliche API: `packages/game-core/src/index.ts`; `contracts/game-api.ts` verweist auf dieselben Definitionen.

Abfragen: `canMove`, `getValidMoves`, `canAttack`, `getValidAttacks`, `canCaptureBanner`, `getPendingHoldingChoices`, `getHoldingCommander`.
Zustandsänderungen: `applyCommand` beziehungsweise `moveCommander`, `attackCommander`, `captureBanner`, `setHoldingTarget`, `endTurn`.
Kampf-Vorschau: `resolveCombat`; Anwendung: `applyCombatResult` prüft Ausgangszustand, Ergebnis und Würfel erneut. Ein veraltetes Ergebnis wird abgewiesen.

Die UI-Anbindung wurde in Block 3 umgesetzt und in Block 5 um das Lösen bestehender Festhaltungen und zusätzliche Controller-/Ressourcentests ergänzt. Der Renderer-Vertrag bleibt ein historischer Entwurf; die tatsächliche Darstellung steht in `apps/prototype/src/renderer/`. Prüfstand und die ausgelassene Browserabnahme sind im [Implementierungsplan](implementation-plan.md) dokumentiert.
