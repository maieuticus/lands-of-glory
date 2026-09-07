# Terminologie

| Deutsch | Code | Bedeutung |
|---|---|---|
| Spielzustand | `GameState` | Regelrelevante Wahrheit |
| UI-Zustand | `UIState` | Auswahl, Drag, Hover und Debug |
| Commander | `Commander` | Einzige militärische Brettfigur |
| Einheit | `Unit` | Trupp in einem von vier Commander-Slots |
| König | `Commander` mit `isKing: true` | Commander mit König-Bonus und Siegbezug |
| Banner | `Banner` | Zielobjekt eines Spielers |
| Infanterie | `infantry` | Bewegung 1; kann passive Halteentscheidungen anbieten |
| Kavallerie | `cavalry` | Bewegung/Angriff effektiv 2 |
| Bogenschütze | `archer` | Bewegung 1; Fernkampf nur Entfernung 2–3 |
| Festhalten | `holding` | Passive Entscheidung des Infanteriebesitzers |
| natürlicher Würfelwert | `naturalValue` | Wert vor Boni und Sortierung |
| effektiver Wert | `effectiveValue` | Natürlicher Wert plus Unit-/König-Boni |
| Verlust | `casualty` | Entfernte Unit oder besiegter leerer Commander |

Koordinaten sind nullbasiert: `x` ist die Spalte, `y` die Zeile, Ursprung `(0,0)` liegt oben links. Eine Unit besitzt keine eigene Brettposition. Der König ist kein separater Datentyp; ein Banner ist kein Commander. Debug bleibt UI-Zustand.
