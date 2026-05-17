# Kampf und Würfelauflösung

## Zweck

Diese Spec beschreibt Kampf, Würfelauflösung, Bonusberechnung, automatische Verlustzuordnung und kampfbezogene Siegbedingungen für Version 1 des digitalen Brettspiel-Prototyps.

Sie dient als fachliche Grundlage für spätere Implementierung und Tests im `game-core`.

## Geltungsbereich für Version 1

Version 1 umfasst:

- spielbaren Kampf
- Angriffe durch Commander
- Angriffe auf gegnerische Commander
- Angriffe auf gegnerische Könige
- Nahkampfangriffe auf Banner
- Fernkampfangriffe durch Bogenschützen gegen Commander
- keine Banner-Zerstörung durch Bogenschützen
- Teilnahme aller verfügbaren Units eines beteiligten Commanders
- maximal vier Units pro Commander
- leere Commander kämpfen als Kavallerie
- Würfelanzahl abhängig von teilnehmenden Units
- natürliche Würfelsortierung vor Bonusaddition
- Unit-Bonuspunkte
- König-Bonus
- paarweiser Würfelvergleich
- Ignorieren überzähliger Würfel
- automatische Verlustzuordnung
- Entfernung besiegter Units
- Entfernung besiegter leerer Commander
- Spieler-Niederlage durch besiegten König
- Spieler-Niederlage durch eingenommenes Banner

## Nicht-Ziele

Version 1 enthält nicht:

- freiwillige Auswahl weniger Units im Kampf
- freie Opferwahl durch Spieler
- gemischte Truppengattungen innerhalb eines Commanders
- mehrere Kampfphasen
- alternatives Schlachtfeld
- Belagerungskampf
- Mauern
- Katapulte
- Tribock
- Belagerungswaffen
- Banner-Lebenspunkte
- Banner-Zerstörung durch Bogenschützen
- Kampfkarten
- Sonderkarten
- GloryPoints
- Goldvermögen
- Ultimatum
- Vasallen
- Lehnsherren
- komplexes Phasenmodell
- formales `ResolveCombatAction`-Modell

## Begriffe

| Begriff | Bedeutung |
|---|---|
| Angreifer | Commander, der den Angriff auslöst |
| Verteidiger | Angegriffener Commander oder König |
| Ziel | Angegriffener Commander, König oder Banner |
| Nahkampf | Angriff durch `infantry` oder `cavalry` |
| Fernkampf | Angriff durch `archer` |
| beteiligter Commander | Angreifender oder verteidigender Commander |
| beteiligte Unit | Aktive Unit eines beteiligten Commanders |
| leerer Commander | Commander ohne aktive Units |
| Würfel | Einzelner Wurf |
| natürlicher Würfelwert | Würfelwert vor Bonusaddition |
| effektiver Würfelwert | Würfelwert nach Bonusaddition |
| `bonusPoints` | Unit-Bonus von 0 bis 3 |
| `kingBonus` | Bonus von +1 bei beteiligt kämpfendem König |
| Würfelpaar | Vergleich eines Angriffs- und Verteidigungswürfels |
| überzähliger Würfel | Würfel ohne Vergleichspaar |
| Verlustzuordnung | Automatische Bestimmung der entfernten Unit oder Figur |

## Regeln

### 1. Kampf ist spielbar

Kampf ist in Version 1 Teil der spielbaren Kernmechanik.

Die Kampfregeln müssen so beschrieben sein, dass sie später im `game-core` testbar umgesetzt werden können.

### 2. Angreifende Figuren

In Version 1 greifen nur Commander an.

Das umfasst:

- Commander mit Units
- leere Commander
- Könige mit Units
- Könige ohne Units

### 3. Gültige Angriffsziele

Gültige Angriffsziele in Version 1:

- gegnerische Commander
- gegnerische Könige
- gegnerische Banner im Nahkampf

Nicht gültige Angriffsziele:

- eigene Commander
- eigene Banner
- sonstige Gebäude
- Units ohne Commander
- Mauern
- Schiffe
- Handelswagen

### 4. Nahkampf

Nahkampfangriffe können ausgeführt werden durch:

- `infantry`
- `cavalry`

Nahkampfangriffe können sich richten gegen:

- gegnerische Commander
- gegnerische Könige
- gegnerische Banner

Das Zielfeld des Gegners wird beim Angriff nicht betreten.

### 5. Fernkampf

Fernkampfangriffe werden durch `archer` ausgeführt.

Bogenschützen können gegnerische Commander und Könige nach Reichweitenregel angreifen.

Bogenschützen können das Banner in Version 1 nicht zerstören oder einnehmen.

### 6. Bewegung oder Schuss bei Bogenschützen

Ein Archer-Commander darf in einer Aktion entweder:

- sich bewegen, oder
- schießen

Er darf nicht in derselben Aktion bewegen und schießen.

### 7. Kampfteilnahme

In Version 1 nehmen immer alle verfügbaren aktiven Units des beteiligten Commanders am Kampf teil.

Ein Spieler darf nicht freiwillig mit weniger Units kämpfen.

### 8. Maximal vier Units

Ein Commander hat maximal vier Slots.

Damit kämpfen maximal vier Units pro Commander.

### 9. Leerer Commander im Kampf

Wenn ein Commander keine aktiven Units hat, kämpft der Commander selbst.

Ein leerer Commander kämpft als:

```txt
TroopType: cavalry
Würfelanzahl: 1
bonusPoints: 0
```

Wenn ein leerer Commander verliert, wird er vom Brett entfernt.

### 10. Leerer König im Kampf

Ein leerer König kämpft als Kavallerie mit:

```txt
TroopType: cavalry
Würfelanzahl: 1
bonusPoints: 0
kingBonus: 1
```

Wenn ein leerer König verliert, ist der Spieler besiegt.

### 11. Würfelanzahl

```txt
1 beteiligte Unit = 1 Würfel
maximal 4 Würfel pro Seite
leerer Commander = 1 Würfel
```

### 12. Gleichzeitigkeit

Würfe gelten effektiv als gleichzeitig.

Der Angreifer kann zuerst würfeln, aber die Reihenfolge hat keinen spielmechanischen Einfluss.

### 13. Natürliche Sortierung

Die Würfel werden zuerst nach ihrem natürlichen Würfelwert absteigend sortiert.

Erst danach werden Bonuspunkte addiert.

Wichtig:

```txt
Sortierung vor Bonusaddition.
```

### 14. Bonuspunkte

Effektiver Wert:

```ts
const effectiveValue = rawDieValue + unitBonusPoints + kingBonus;
```

Gültige Unit-Bonuspunkte:

```txt
0 | 1 | 2 | 3
```

### 15. König-Bonus

Wenn ein König am Kampf beteiligt ist, erhalten alle beteiligten unterstellten Units dieses Königs +1.

Gilt:

- König greift an
- König wird angegriffen
- König gegen König

Wenn ein König ohne Units kämpft, erhält der König selbst ebenfalls +1.

### 16. Effektive Werte über 6

Effektive Würfelwerte können durch Boni über 6 steigen.

Das ist erlaubt.

### 17. Zuordnung von Würfeln zu Units

Die stärksten Units werden zuerst in den Kampf gestellt.

Die höchsten Bonuspunkte korrespondieren mit den zuerst verglichenen Würfeln.

Die Zuordnung bleibt relevant, weil ein verlorenes Würfelpaar zur Entfernung der zugeordneten unterlegenen Unit führt.

### 18. Paarvergleich

Nach Sortierung werden Würfel paarweise verglichen:

```txt
höchster Angriffswürfel gegen höchsten Verteidigungswürfel
zweithöchster gegen zweithöchsten
usw.
```

Es werden nur so viele Paare gebildet, wie die Seite mit weniger Würfeln Würfel besitzt.

### 19. Überzählige Würfel

Überzählige Würfel werden ignoriert.

Sie verursachen keine zusätzlichen Verluste.

### 20. Verlustbestimmung

Der niedrigere effektive Würfelwert verliert das jeweilige Würfelpaar.

Die zugehörige unterlegene Unit wird entfernt.

Spieler wählen nicht frei, welche Unit entfernt wird.

### 21. Gleichstand

Bei Gleichstand entscheidet die Kampftabelle.

Der Angreifer gewinnt bei Gleichstand nur in folgender Paarung:

```txt
Infanterie als Angreifer gegen Kavallerie als Verteidiger
```

In allen anderen Paarungen reicht Gleichstand für den Angreifer nicht aus.

### 22. Kampftabelle

| Angreifer | Verteidiger | Angreifer gewinnt, wenn |
|---|---|---|
| Kavallerie | Kavallerie | Angreifer > Verteidiger |
| Infanterie | Kavallerie | Angreifer >= Verteidiger |
| Bogenschütze | Kavallerie | Angreifer > Verteidiger |
| Kavallerie | Infanterie | Angreifer > Verteidiger |
| Infanterie | Infanterie | Angreifer > Verteidiger |
| Bogenschütze | Infanterie | Angreifer > Verteidiger |
| Kavallerie | Bogenschütze | Angreifer > Verteidiger |
| Infanterie | Bogenschütze | Angreifer > Verteidiger |
| Bogenschütze | Bogenschütze | Angreifer > Verteidiger |

### 23. Commander-Verluste

Ein Commander kann nicht sterben, solange er noch aktive Units hat.

Zuerst kämpfen und sterben die Units.

Ein Commander kämpft selbst erst, wenn er keine aktiven Units mehr hat.

### 24. Besiegte Units

Wenn eine Unit verliert:

- wird sie entfernt oder als `removed` markiert
- bleibt sie nicht auf dem Brett liegen
- soll der Verlust visuell nachvollziehbar angezeigt werden

### 25. Besiegter leerer Commander

Wenn ein leerer Commander verliert:

- wird er vom Brett entfernt
- seine Figur ist nicht mehr aktiv auf dem Board

### 26. Besiegter leerer König

Wenn ein leerer König verliert:

- wird der Besitzer des Königs besiegt
- alle Units und Figuren dieses Spielers werden in Version 1 entfernt oder deaktiviert
- es gibt kein zusätzliches Ultimatum-Modul

### 27. Banner als Ziel

Das Banner ist ein Zielobjekt.

Es kann durch erfolgreichen Nahkampfangriff eingenommen werden.

### 28. Banner und Nahkampf

Infanterie und Kavallerie können ein gegnerisches Banner im Nahkampf einnehmen.

Wenn das Banner eingenommen wird:

- erhält es `status: 'captured'`
- der Besitzer des Banners wird besiegt

### 29. Banner und Bogenschützen

Bogenschützen können das Banner in Version 1 nicht zerstören.

Ein Archer-Commander darf gegnerische Commander gemäß Fernkampfregel angreifen, aber das Banner ist für Bogenschützen kein gültiges Zerstörungsziel.

## Datenmodell-Auswirkung

### Unit

```ts
export type Unit = {
  id: string;
  ownerId: string;
  troopType: TroopType;
  bonusPoints: 0 | 1 | 2 | 3;
  commanderId: string;
  slotIndex: 0 | 1 | 2 | 3;
  status: 'active' | 'removed';
};
```

### Commander

```ts
export type Commander = {
  id: string;
  ownerId: string;
  position: Position;
  isKing: boolean;
  troopType: TroopType;
  unitSlots: [string | null, string | null, string | null, string | null];
  hasActedThisTurn: boolean;
};
```

### Banner

```ts
export type Banner = {
  id: string;
  ownerId: string;
  position: Position;
  status: 'standing' | 'captured';
};
```

### Player

```ts
export type Player = {
  id: string;
  name: string;
  color: string;
  status: 'active' | 'defeated';
};
```

### Kampfnahe abgeleitete Werte

Folgende Werte können aus dem `GameState` abgeleitet werden:

- aktive Units eines Commanders
- Würfelanzahl
- Kampf-Truppengattung
- Unit-Bonuswerte
- König-Bonus
- natürliche Würfelsortierung
- effektive Würfelwerte
- Würfelpaare
- unterlegene Units
- besiegter leerer Commander
- besiegter König
- eingenommenes Banner

## UI-Auswirkung

Die UI muss Kampf nachvollziehbar darstellen.

Mindestens erforderlich:

- angegriffenes Ziel
- beteiligter Angreifer
- beteiligter Verteidiger
- beteiligte Units
- Würfe
- natürliche Sortierung
- Bonusaddition
- effektive Werte
- Ergebnis der Würfelpaare
- entfernte Units
- entfernter leerer Commander
- besiegter König
- eingenommenes Banner
- besiegter Spieler

Verluste sollen visuell nachvollziehbar angezeigt werden, bevor sie dauerhaft nicht mehr sichtbar sind.

## Akzeptanzkriterien

Diese Spec ist erfüllt, wenn:

- nur Commander Angriffe ausführen können
- gegnerische Commander gültige Angriffsziele sind
- gegnerische Könige gültige Angriffsziele sind
- Banner nur durch Nahkampf eingenommen werden können
- Bogenschützen Banner nicht zerstören können
- alle aktiven Units eines beteiligten Commanders am Kampf teilnehmen
- Spieler nicht freiwillig weniger Units einsetzen können
- pro Unit genau ein Würfel verwendet wird
- pro Commander maximal vier Würfel verwendet werden
- leere Commander mit 1 Würfel als Kavallerie kämpfen
- leere Könige mit 1 Würfel als Kavallerie und `kingBonus: 1` kämpfen
- Würfel zunächst nach natürlichem Wert absteigend sortiert werden
- Boni erst nach der Sortierung addiert werden
- effektive Werte über 6 möglich sind
- Würfel paarweise verglichen werden
- überzählige Würfel ignoriert werden
- Gleichstand nur bei Infanterie-Angreifer gegen Kavallerie-Verteidiger zugunsten des Angreifers zählt
- Verluste automatisch anhand der Würfelpaar-Zuordnung bestimmt werden
- Spieler keine freie Opferwahl haben
- besiegte Units entfernt oder als `removed` markiert werden
- Commander nicht sterben, solange sie aktive Units haben
- leere besiegte Commander vom Brett entfernt werden
- besiegte leere Könige den Besitzer besiegen
- eingenommene Banner den Besitzer besiegen
- besiegte Spieler ihre Figuren und Units verlieren oder deaktiviert bekommen
- Kampfdetails im Debug-Modus nachvollziehbar sind

## Given/When/Then-Testfälle

### Testfall 1: Commander greift Commander an

Given ein aktiver Commander hat einen gegnerischen Commander in Angriffsreichweite  
When der aktive Commander angreift  
Then wird ein Kampf ausgelöst.

### Testfall 2: Unit erzeugt Würfel

Given ein Commander hat vier aktive Units  
When ein Kampf ausgelöst wird  
Then würfelt dieser Commander mit vier Würfeln.

### Testfall 3: Leerer Commander kämpft als Kavallerie

Given ein Commander hat keine aktiven Units  
When er in einen Kampf verwickelt wird  
Then kämpft er mit einem Würfel als `cavalry`  
And verwendet `bonusPoints: 0`.

### Testfall 4: Leerer König erhält König-Bonus

Given ein König hat keine aktiven Units  
When er in einen Kampf verwickelt wird  
Then kämpft er mit einem Würfel als `cavalry`  
And erhält `kingBonus: 1`.

### Testfall 5: Natürliche Sortierung vor Bonus

Given ein Commander würfelt natürliche Werte `6` und `3`  
And die Unit mit dem Wert `3` hat höhere Bonuspunkte  
When die Würfel sortiert werden  
Then wird zuerst nach `6`, dann nach `3` sortiert  
And erst danach werden Boni addiert.

### Testfall 6: Effektiver Wert über 6

Given eine Unit würfelt eine natürliche `6`  
And sie hat `bonusPoints: 3`  
And `kingBonus: 1`  
When der effektive Wert berechnet wird  
Then beträgt der effektive Wert `10`.

### Testfall 7: Paarweiser Vergleich

Given der Angreifer hat drei Würfel  
And der Verteidiger hat zwei Würfel  
When Würfelpaare gebildet werden  
Then entstehen zwei Würfelpaare  
And ein Angreiferwürfel ist überzählig.

### Testfall 8: Überzähliger Würfel verursacht keinen Verlust

Given ein überzähliger Würfel existiert  
When der Kampf aufgelöst wird  
Then verursacht dieser Würfel keinen zusätzlichen Verlust.

### Testfall 9: Automatische Verlustzuordnung

Given ein Würfelpaar geht für den Angreifer verloren  
When der Verlust angewendet wird  
Then wird die dem verlorenen Würfel zugeordnete Angreifer-Unit entfernt  
And der Spieler darf keine andere Unit wählen.

### Testfall 10: Gleichstand Infanterie gegen Kavallerie

Given ein Infantry-Commander greift einen Cavalry-Commander an  
And beide effektiven Werte sind gleich  
When das Würfelpaar ausgewertet wird  
Then gewinnt der Angreifer dieses Würfelpaar.

### Testfall 11: Gleichstand Kavallerie gegen Infanterie

Given ein Cavalry-Commander greift einen Infantry-Commander an  
And beide effektiven Werte sind gleich  
When das Würfelpaar ausgewertet wird  
Then gewinnt der Angreifer nicht.

### Testfall 12: Commander stirbt nicht mit aktiven Units

Given ein Commander hat aktive Units  
And eine Unit verliert ein Würfelpaar  
When der Verlust angewendet wird  
Then wird die Unit entfernt  
And der Commander bleibt auf dem Brett.

### Testfall 13: Leerer Commander verliert

Given ein leerer Commander verliert sein Würfelpaar  
When der Verlust angewendet wird  
Then wird der Commander vom Brett entfernt.

### Testfall 14: Leerer König verliert

Given ein leerer König verliert sein Würfelpaar  
When der Verlust angewendet wird  
Then wird der Besitzer des Königs als `defeated` markiert.

### Testfall 15: Banner kann durch Nahkampf eingenommen werden

Given ein Infantry- oder Cavalry-Commander greift ein gegnerisches Banner erfolgreich im Nahkampf an  
When der Angriff aufgelöst wird  
Then erhält das Banner `status: 'captured'`  
And der Besitzer des Banners wird besiegt.

### Testfall 16: Banner kann nicht durch Bogenschützen zerstört werden

Given ein Archer-Commander hat ein gegnerisches Banner in Reichweite  
When er das Banner beschießen will  
Then ist das Banner kein gültiges Zerstörungsziel.

### Testfall 17: König-Bonus bei König gegen König

Given ein König greift einen gegnerischen König an  
When der Kampf aufgelöst wird  
Then erhält jede Seite ihren jeweiligen König-Bonus.

### Testfall 18: Alle Units nehmen teil

Given ein Commander hat vier aktive Units  
When ein Kampf ausgelöst wird  
Then nehmen alle vier Units teil  
And der Spieler darf keine Unit zurückhalten.

## Offene spätere Erweiterungen

Spätere Versionen können ergänzen:

- detailliertes Kampfprotokoll
- Wiederanzeige entfernter Units
- Auswahl teilnehmender Units
- freie oder taktische Verlustwahl
- gemischte Truppengattungen innerhalb eines Commanders
- Banner-Lebenspunkte
- Banner-Zerstörung durch Fernkampf oder Belagerungswaffen
- Mauern
- Katapulte
- Tribock
- Belagerungswaffen
- Sonderkarten
- Vasallen
- Lehnsherren
- Ultimatum
- GloryPoints
- Goldvermögen
- alternatives Schlachtfeld
- komplexes Phasenmodell
- formales `ResolveCombatAction`-Modell
- serverautoritär validierte Kampfauflösung

Diese Erweiterungen sind nicht Teil von Version 1.
