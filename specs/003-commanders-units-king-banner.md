# Commander, Units, König und Banner
Stand: 2026-09-06. Diese Fassung ersetzt widersprechende frühere Startpositions- und Lebenspunkteentwürfe. Grundlage: [R01, R02, R06, R09](../docs/decisions.md).

## Figuren und Units

Nur Commander stehen als militärische Figuren auf dem Brett. Jede Figur besitzt vier Slots, die leer oder mit einer Unit belegt sind. Aktive Units haben dieselbe Truppengattung wie ihr Commander und Bonus 0, 1, 2 oder 3. Units haben keine eigene Brettposition.

Ein Commander ohne aktive Units verwendet effektiv Kavallerie: Bewegung und Nahkampfreichweite 2, ein Würfel, Bonus 0. Erst die Niederlage dieses leeren Commanders entfernt ihn. Der Verlust seiner letzten Unit lässt ihn auf dem Brett. Das vorhandene Commander-`health`-Feld ist ein Kompatibilitätsfeld, kein zusätzliches Schadenssystem.

Jede Armee enthält genau einen König (`isKing`). Der Standardkönig führt Infanterie. Der Armee-Editor darf wie bisher die Truppengattung konfigurieren. König-Bonus: +1 je beteiligtem Würfel, auch bei leerem König.

## Aufbau und Kosten

Hauptmann: 1 Gold; König: 0; gekaufte Unit: 1 plus Bonuspunkte. Nur Infanterie mit genau drei gekauften Units bekommt eine vierte mit dem kleinsten gekauften Bonus kostenlos, einschließlich Infanteriekönig. Eine explizit gekaufte vierte Unit wird berechnet.

Standardarmee: ein Infanteriekönig mit 0/0/0/0; zwei Infanterie-, ein Kavallerie- und zwei Bogenschützen-Hauptleute mit je 0/0/1/3. Gesamtpreis 49 bei Standardbudget 50. Alle Spieler werden gegen das gewählte Budget geprüft. Ungültige Typen, Slots, Bonuswerte, Budgets und doppelte Positionen werden abgewiesen.

## Startaufstellung

Vier disjunkte Startstreifen enthalten je 72 Felder:
- oben: x 6–17, y 0–5;
- rechts: x 18–23, y 6–17;
- unten: x 6–17, y 18–23;
- links: x 0–5, y 6–17.

Zwei Spieler belegen oben/unten, drei oben/rechts/unten, vier zusätzlich links. Banner stehen davor auf (11,6), (17,11), (12,17), (6,12). Die dem Zentrum nächste Reihe wird zuerst gefüllt. Ohne Seed bestimmt die Konfigurationsreihenfolge die Plätze. Mit Seed werden die ausgewählten Plätze reproduzierbar permutiert. Maximal 72 Commander pro Armee.

## Banner und Niederlage

Ein Banner ist ein eigenständiges Zielobjekt mit Besitzer, Position und Status. Ein stehendes Banner blockiert. Nur eine gültige Nahkampfaktion nimmt es ohne Würfeln ein; der Angreifer betritt danach das Feld.

Bei Königverlust oder Banner-Einnahme scheidet der Besitzer sofort aus. Alle seine Commander verschwinden, Units werden als entfernt geführt und Banner blockieren nicht mehr. Das gilt auch, wenn der König bereits aus der Commander-Map gelöscht wurde. Ausgeschiedene Spieler werden in der Zugfolge übersprungen. Nur der letzte Überlebende gewinnt.

Sieggrund und Gewinner werden im Zustand gespeichert. Eine wiederholte Abschlussprüfung fügt kein zweites Endereignis hinzu. Ergebnisse zählen verbliebene Units + 3 je verbliebenem Commander + verbleibende Unit-Boni. Diese Punkte erzeugen keinen weiteren Sieg.

## Abnahme

Tests prüfen minimale, Standard- und maximale Armeen für 2–4 Spieler, kollisionsfreie Startpositionen, 49-Gold-Standardkosten, Gratis-/Kaufeinheiten, ungültige Eingaben, König-/Banner-Eliminierung, übersprungene Spieler und idempotenten Spielabschluss.
