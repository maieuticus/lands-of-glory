# Kampfbeispiele

## Zweck

Diese Spec enthält regelrepräsentative Kampfbeispiele für Version 1 des digitalen Brettspiel-Prototyps.

Die Beispiele erklären die Kampf- und Würfelauflösung aus `005-combat-and-dice-resolution.md`, ohne neue Regeln einzuführen.

## Geltungsbereich für Version 1

Version 1 umfasst Kampfbeispiele für:

- Commander gegen Commander
- Infanterie gegen Kavallerie
- Kavallerie gegen Infanterie
- Bogenschützen gegen Commander
- König-Bonus
- natürliche Würfelsortierung vor Bonusaddition
- effektive Würfelwerte über 6
- überzählige Würfel
- automatische Verlustzuordnung
- leere Commander
- leere Könige
- Banner-Einnahme durch Nahkampf
- ungültigen Banner-Beschuss durch Bogenschützen

## Nicht-Ziele

Diese Spec enthält nicht:

- neue Kampftabellen
- neue Truppengattungen
- freiwillige Auswahl teilnehmender Units
- freie Verlustwahl
- Banner-Lebenspunkte
- Fernkampf gegen Banner
- Belagerungskampf
- Mauern
- Katapulte
- Tribock
- Sonderkarten
- alternatives Schlachtfeld
- komplexe Phasenauflösung
- vollständige Übernahme externer Kampfbeispiele aus späteren Quellen

## Begriffe

| Begriff | Bedeutung |
|---|---|
| natürlicher Würfelwert | Würfelwert vor Bonusaddition |
| effektiver Würfelwert | Würfelwert nach Bonusaddition |
| `bonusPoints` | Bonus einer Unit von 0 bis 3 |
| `kingBonus` | Bonus von +1 bei beteiligt kämpfendem König |
| Würfelpaar | Vergleich eines Angriffs- und Verteidigungswürfels |
| überzähliger Würfel | Würfel ohne Vergleichspaar |
| Verlustzuordnung | Automatische Entfernung der unterlegenen zugeordneten Unit |
| leerer Commander | Commander ohne aktive Units |
| leerer König | König ohne aktive Units |

## Regeln

### 1. Beispiele sind erklärend

Die Beispiele in dieser Datei erklären die verbindlichen Kampfregeln.

Sie erweitern die Regeln nicht.

Bei Widersprüchen gilt die Kampfspec `005-combat-and-dice-resolution.md`.

### 2. Sortierung

In allen Beispielen gilt:

```txt
Zuerst natürliche Würfelwerte absteigend sortieren.
Danach Bonuspunkte addieren.
Dann paarweise vergleichen.
```

### 3. Verlustzuordnung

Wenn ein Würfelpaar verloren wird, wird die zu diesem Würfelpaar gehörende unterlegene Unit entfernt.

Der Spieler darf keine andere Unit auswählen.

### 4. Gleichstand

Bei Gleichstand gewinnt der Angreifer nur in dieser Paarung:

```txt
Infanterie als Angreifer gegen Kavallerie als Verteidiger
```

In allen anderen Paarungen reicht Gleichstand für den Angreifer nicht aus.

## Beispiel 1: Infanterie greift Kavallerie mit Gleichstand an

### Ausgangslage

Angreifer:

```txt
TroopType: infantry
1 Unit
bonusPoints: 0
rawDieValue: 4
```

Verteidiger:

```txt
TroopType: cavalry
1 Unit
bonusPoints: 0
rawDieValue: 4
```

### Berechnung

| Seite | Natürlicher Würfelwert | Bonus | Effektiver Wert |
|---|---:|---:|---:|
| Angreifer | 4 | 0 | 4 |
| Verteidiger | 4 | 0 | 4 |

### Ergebnis

Gleichstand.

Da Infanterie als Angreifer gegen Kavallerie verteidigt wird, gewinnt der Angreifer bei Gleichstand.

Die verteidigende Cavalry-Unit wird entfernt.

## Beispiel 2: Kavallerie greift Infanterie mit Gleichstand an

### Ausgangslage

Angreifer:

```txt
TroopType: cavalry
1 Unit
bonusPoints: 0
rawDieValue: 4
```

Verteidiger:

```txt
TroopType: infantry
1 Unit
bonusPoints: 0
rawDieValue: 4
```

### Berechnung

| Seite | Natürlicher Würfelwert | Bonus | Effektiver Wert |
|---|---:|---:|---:|
| Angreifer | 4 | 0 | 4 |
| Verteidiger | 4 | 0 | 4 |

### Ergebnis

Gleichstand.

Kavallerie als Angreifer gewinnt bei Gleichstand gegen Infanterie nicht.

Die angreifende Cavalry-Unit wird entfernt.

## Beispiel 3: Natürliche Sortierung vor Bonusaddition

### Ausgangslage

Angreifer:

```txt
TroopType: cavalry
2 Units

Unit A:
rawDieValue: 3
bonusPoints: 3

Unit B:
rawDieValue: 6
bonusPoints: 0
```

Verteidiger:

```txt
TroopType: cavalry
2 Units

Unit C:
rawDieValue: 5
bonusPoints: 0

Unit D:
rawDieValue: 2
bonusPoints: 0
```

### Schritt 1: Natürliche Sortierung

Angreifer wird nach natürlichem Würfelwert sortiert:

```txt
Unit B: raw 6, bonus 0
Unit A: raw 3, bonus 3
```

Verteidiger wird nach natürlichem Würfelwert sortiert:

```txt
Unit C: raw 5, bonus 0
Unit D: raw 2, bonus 0
```

### Schritt 2: Bonusaddition

| Paar | Angreifer | Effektiv | Verteidiger | Effektiv |
|---|---|---:|---|---:|
| 1 | Unit B: 6 + 0 | 6 | Unit C: 5 + 0 | 5 |
| 2 | Unit A: 3 + 3 | 6 | Unit D: 2 + 0 | 2 |

### Ergebnis

Beide Paare gewinnt der Angreifer.

Wichtig: Unit A mit Bonus 3 wird nicht vor Unit B sortiert, weil die Sortierung vor Bonusaddition erfolgt.

## Beispiel 4: Effektiver Wert über 6

### Ausgangslage

Angreifer:

```txt
Commander ist König: ja
TroopType: infantry
1 Unit
rawDieValue: 6
bonusPoints: 3
kingBonus: 1
```

Verteidiger:

```txt
TroopType: infantry
1 Unit
rawDieValue: 6
bonusPoints: 0
kingBonus: 0
```

### Berechnung

| Seite | Natürlicher Würfelwert | Unit-Bonus | König-Bonus | Effektiver Wert |
|---|---:|---:|---:|---:|
| Angreifer | 6 | 3 | 1 | 10 |
| Verteidiger | 6 | 0 | 0 | 6 |

### Ergebnis

Der Angreifer gewinnt.

Effektive Werte über 6 sind erlaubt.

Die verteidigende Unit wird entfernt.

## Beispiel 5: Überzählige Würfel werden ignoriert

### Ausgangslage

Angreifer:

```txt
TroopType: cavalry
3 aktive Units
rawDieValues: 6, 4, 2
bonusPoints: 0, 0, 0
```

Verteidiger:

```txt
TroopType: cavalry
1 aktive Unit
rawDieValue: 5
bonusPoints: 0
```

### Paarbildung

Es wird nur ein Paar gebildet, weil der Verteidiger nur einen Würfel hat.

| Paar | Angreifer | Verteidiger |
|---|---:|---:|
| 1 | 6 | 5 |

Überzählige Angriffswürfel:

```txt
4
2
```

### Ergebnis

Der Angreifer gewinnt das einzige Würfelpaar.

Die verteidigende Unit wird entfernt.

Die überzähligen Würfel `4` und `2` verursachen keine zusätzlichen Verluste.

## Beispiel 6: Automatische Verlustzuordnung

### Ausgangslage

Angreifer:

```txt
TroopType: infantry
2 Units

Unit A:
rawDieValue: 5
bonusPoints: 0

Unit B:
rawDieValue: 3
bonusPoints: 0
```

Verteidiger:

```txt
TroopType: infantry
2 Units

Unit C:
rawDieValue: 6
bonusPoints: 0

Unit D:
rawDieValue: 2
bonusPoints: 0
```

### Paarvergleich

| Paar | Angreifer | Verteidiger | Ergebnis |
|---|---:|---:|---|
| 1 | Unit A: 5 | Unit C: 6 | Angreifer verliert |
| 2 | Unit B: 3 | Unit D: 2 | Angreifer gewinnt |

### Ergebnis

Unit A wird entfernt.

Der angreifende Spieler darf nicht stattdessen Unit B entfernen.

Unit D wird entfernt.

## Beispiel 7: Leerer Commander kämpft als Kavallerie

### Ausgangslage

Angreifer:

```txt
Commander ohne aktive Units
isKing: false
```

Verteidiger:

```txt
TroopType: infantry
1 Unit
```

### Kampfwerte des Angreifers

```txt
TroopType: cavalry
Würfelanzahl: 1
bonusPoints: 0
kingBonus: 0
```

### Ergebnis

Der leere Commander wird als Kavallerie behandelt.

Wenn der leere Commander sein Würfelpaar verliert, wird er vom Brett entfernt.

## Beispiel 8: Leerer König kämpft als Kavallerie mit König-Bonus

### Ausgangslage

Angreifer:

```txt
Commander ohne aktive Units
isKing: true
```

Verteidiger:

```txt
TroopType: cavalry
1 Unit
```

### Kampfwerte des Angreifers

```txt
TroopType: cavalry
Würfelanzahl: 1
bonusPoints: 0
kingBonus: 1
```

### Ergebnis

Der leere König kämpft als Kavallerie mit +1 König-Bonus.

Wenn der leere König verliert, ist sein Besitzer besiegt.

## Beispiel 9: König gegen König

### Ausgangslage

Angreifer:

```txt
isKing: true
TroopType: infantry
1 Unit
rawDieValue: 4
bonusPoints: 1
```

Verteidiger:

```txt
isKing: true
TroopType: infantry
1 Unit
rawDieValue: 5
bonusPoints: 0
```

### Berechnung

| Seite | Natürlicher Würfelwert | Unit-Bonus | König-Bonus | Effektiver Wert |
|---|---:|---:|---:|---:|
| Angreifer | 4 | 1 | 1 | 6 |
| Verteidiger | 5 | 0 | 1 | 6 |

### Ergebnis

Gleichstand.

Infanterie gegen Infanterie gewinnt der Angreifer bei Gleichstand nicht.

Die angreifende Unit wird entfernt.

## Beispiel 10: Banner wird durch Nahkampf eingenommen

### Ausgangslage

Angreifer:

```txt
TroopType: cavalry
Banner in Nahkampfreichweite
```

Ziel:

```txt
Gegnerisches Banner
status: standing
```

### Aktion

Der Cavalry-Commander führt einen erfolgreichen Nahkampfangriff auf das Banner aus.

### Ergebnis

```txt
Banner status: captured
Besitzer des Banners: defeated
```

Alle Units und Figuren des besiegten Spielers werden in Version 1 entfernt oder deaktiviert.

## Beispiel 11: Bogenschütze darf Banner nicht zerstören

### Ausgangslage

Angreifer:

```txt
TroopType: archer
Gegnerisches Banner in Reichweite 2
```

Ziel:

```txt
Gegnerisches Banner
status: standing
```

### Aktion

Der Archer-Commander versucht, das Banner zu beschießen.

### Ergebnis

Der Angriff ist ungültig.

Das Banner ist für Bogenschützen in Version 1 kein gültiges Zerstörungsziel.

## Beispiel 12: Bogenschütze greift Commander an

### Ausgangslage

Angreifer:

```txt
TroopType: archer
Angriffsreichweite: 2
1 Unit
rawDieValue: 5
bonusPoints: 1
```

Verteidiger:

```txt
TroopType: infantry
1 Unit
rawDieValue: 4
bonusPoints: 0
```

### Berechnung

| Seite | Natürlicher Würfelwert | Bonus | Effektiver Wert |
|---|---:|---:|---:|
| Angreifer | 5 | 1 | 6 |
| Verteidiger | 4 | 0 | 4 |

### Ergebnis

Der Archer-Commander gewinnt.

Die verteidigende Infantry-Unit wird entfernt.

## Beispiel 13: Commander stirbt nicht solange Units vorhanden sind

### Ausgangslage

Verteidiger:

```txt
Commander mit 2 aktiven Units
Eine Unit verliert ein Würfelpaar
```

### Ergebnis

Nur die unterlegene Unit wird entfernt.

Der Commander bleibt auf dem Brett, weil er noch aktive Units hat.

## Beispiel 14: Zwei Verluste in einem Kampf

### Ausgangslage

Angreifer:

```txt
TroopType: cavalry
2 Units
rawDieValues: 6, 1
bonusPoints: 0, 0
```

Verteidiger:

```txt
TroopType: cavalry
2 Units
rawDieValues: 5, 2
bonusPoints: 0, 0
```

### Paarvergleich

| Paar | Angreifer | Verteidiger | Ergebnis |
|---|---:|---:|---|
| 1 | 6 | 5 | Verteidiger verliert |
| 2 | 1 | 2 | Angreifer verliert |

### Ergebnis

Eine verteidigende Unit wird entfernt.

Eine angreifende Unit wird entfernt.

Die Verluste werden automatisch aus den jeweiligen Würfelpaaren abgeleitet.

## Datenmodell-Auswirkung

Diese Beispiele benötigen keine zusätzlichen Datenmodelle.

Sie beziehen sich auf:

- `GameState`
- `Commander`
- `Unit`
- `Banner`
- `Player`
- `TroopType`

Kampfnahe Werte wie Würfelpaare, effektive Werte und Verlustzuordnung können aus dem `GameState` und den Würfelergebnissen abgeleitet werden.

## UI-Auswirkung

Die UI sollte Kampfbeispiele nachvollziehbar unterstützen durch Anzeige von:

- beteiligten Commandern
- beteiligten Units
- natürlichen Würfelwerten
- Sortierung
- Bonuspunkten
- König-Bonus
- effektiven Werten
- Würfelpaaren
- Gewinnern je Paar
- entfernten Units
- entfernten leeren Commandern
- besiegten Spielern
- eingenommenen Bannern

## Akzeptanzkriterien

Diese Spec ist erfüllt, wenn:

- alle Beispiele den Regeln aus der Kampfspec entsprechen
- keine neuen Regeln eingeführt werden
- natürliche Sortierung vor Bonusaddition dargestellt wird
- effektive Werte über 6 dargestellt werden
- Gleichstand korrekt erklärt wird
- überzählige Würfel ignoriert werden
- automatische Verlustzuordnung dargestellt wird
- leere Commander korrekt als Kavallerie dargestellt werden
- leere Könige korrekt mit König-Bonus dargestellt werden
- Banner-Einnahme durch Nahkampf dargestellt wird
- ungültiger Banner-Beschuss durch Bogenschützen dargestellt wird

## Given/When/Then-Testfälle

### Testfall 1: Infanterie gewinnt Gleichstand gegen Kavallerie

Given Infanterie greift Kavallerie an  
And beide effektiven Werte sind gleich  
When das Würfelpaar ausgewertet wird  
Then gewinnt die Infanterie als Angreifer.

### Testfall 2: Kavallerie gewinnt Gleichstand gegen Infanterie nicht

Given Kavallerie greift Infanterie an  
And beide effektiven Werte sind gleich  
When das Würfelpaar ausgewertet wird  
Then gewinnt die Kavallerie als Angreifer nicht.

### Testfall 3: Sortierung vor Bonus

Given ein niedriger natürlicher Würfelwert hat hohe Bonuspunkte  
And ein höherer natürlicher Würfelwert hat keine Bonuspunkte  
When sortiert wird  
Then entscheidet zuerst der natürliche Würfelwert über die Reihenfolge.

### Testfall 4: Effektiver Wert über 6

Given eine Unit würfelt `6`  
And hat `bonusPoints: 3`  
And erhält `kingBonus: 1`  
When der effektive Wert berechnet wird  
Then beträgt er `10`.

### Testfall 5: Überzähliger Würfel

Given eine Seite hat mehr Würfel als die andere  
When Würfelpaare gebildet werden  
Then werden überzählige Würfel ignoriert.

### Testfall 6: Automatische Verlustzuordnung

Given ein Würfelpaar ist verloren  
When der Verlust angewendet wird  
Then wird die diesem Würfelpaar zugeordnete unterlegene Unit entfernt.

### Testfall 7: Leerer Commander

Given ein Commander hat keine aktiven Units  
When er kämpft  
Then wird er als Kavallerie mit einem Würfel und Bonus 0 behandelt.

### Testfall 8: Leerer König

Given ein König hat keine aktiven Units  
When er kämpft  
Then wird er als Kavallerie mit einem Würfel, Bonus 0 und König-Bonus 1 behandelt.

### Testfall 9: Banner-Nahkampf

Given ein Infantry- oder Cavalry-Commander greift ein Banner erfolgreich im Nahkampf an  
When der Angriff aufgelöst wird  
Then wird das Banner eingenommen  
And der Besitzer wird besiegt.

### Testfall 10: Banner-Fernkampf ungültig

Given ein Archer-Commander hat ein Banner in Reichweite  
When er das Banner beschießen will  
Then ist der Angriff ungültig.

## Offene spätere Erweiterungen

Spätere Versionen können ergänzen:

- zusätzliche Kampfbeispiele aus separaten PDF-/Bildquellen
- komplexere Mehrparteienbeispiele
- Kampfprotokoll-Beispiele
- UI-Mockups für Kampfauflösung
- Beispiele mit gemischten Truppengattungen
- Beispiele mit Belagerungswaffen
- Beispiele mit Banner-Lebenspunkten
- Beispiele mit Sonderkarten
- Beispiele mit alternativem Schlachtfeld
- Beispiele für serverautoritär validierte Kampfauflösung

Diese Erweiterungen sind nicht Teil von Version 1.
