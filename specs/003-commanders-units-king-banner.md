# Commander, Units, König und Banner

## Zweck

Diese Spec beschreibt die regelrelevanten Spielobjekte Commander, Units, König und Banner für Version 1 des digitalen Brettspiel-Prototyps.

Sie legt fest, welche Objekte auf dem Brett stehen, wie Units zugeordnet werden und welche Siegbedingungen an König und Banner gebunden sind.

## Geltungsbereich für Version 1

Version 1 umfasst:

- Commander als einzige militärische Figuren auf dem Brett
- Units ausschließlich in Commander-Slots oder entfernt
- genau vier Slots pro Commander
- maximal eine Unit pro Slot
- genau eine Truppengattung pro Commander
- Truppengattungen `infantry`, `cavalry`, `archer`
- König als Commander mit `isKing: true`
- König-Bonus im Kampf
- Banner als Zielobjekt beziehungsweise Gebäude
- Banner mit `ownerId`
- Banner mit `position`
- Banner-Status `standing` oder `captured`
- Entfernung besiegter Units
- Entfernung besiegter leerer Commander
- Spieler-Niederlage durch besiegten König
- Spieler-Niederlage durch eingenommenes Banner
- fester Demo-Startzustand mit zwei Spielern

## Nicht-Ziele

Version 1 enthält nicht:

- frei bewegliche Units auf dem Brett
- gemischte Truppengattungen innerhalb eines Commanders
- mehr oder weniger als vier Slots pro Commander
- separate König-Klasse
- mehrere Könige pro Spieler
- Banner-Lebenspunkte
- Banner-Zerstörung durch Bogenschützen
- Gebäude außer Banner
- Mauern
- Katapulte
- Tribock
- Belagerungswaffen
- Vasallen
- Lehnsherren
- Ultimatum
- GloryPoints
- Goldvermögen
- alternatives Schlachtfeld

## Begriffe

| Begriff | Bedeutung |
|---|---|
| `Commander` | Militärische Brettfigur mit Position und vier Slots |
| `Unit` | Einheit innerhalb eines Commander-Slots |
| `Slot` | Platz für genau eine Unit |
| `slotIndex` | Technischer Index eines Slots von 0 bis 3 |
| `TroopType` | Truppengattung |
| `infantry` | Infanterie |
| `cavalry` | Kavallerie |
| `archer` | Bogenschützen |
| `isKing` | Kennzeichnung eines Commanders als König |
| `Banner` | Zielobjekt beziehungsweise Gebäude |
| `ownerId` | Spieler-ID des Besitzers |
| `position` | Feldposition auf dem Board |
| `bonusPoints` | Bonus einer Unit von 0 bis 3 |
| `active` | Aktiver Unit-Status |
| `removed` | Entfernte beziehungsweise besiegte Unit |
| `standing` | Banner steht noch |
| `captured` | Banner wurde eingenommen |

## Regeln

### 1. Commander als militärische Brettfiguren

In Version 1 stehen nur Commander als militärische Figuren auf dem Brett.

Units stehen nicht frei auf dem Brett.

### 2. Commander-Position

Jeder Commander besitzt eine Brettposition.

```ts
position: Position
```

Diese Position ist regelrelevant und gehört in den `GameState`.

### 3. Commander-Slots

Jeder Commander hat genau vier Slots.

```txt
Slot 0
Slot 1
Slot 2
Slot 3
```

Jeder Slot ist entweder leer oder enthält genau eine Unit.

### 4. Unit-Zuordnung

Eine Unit befindet sich entweder:

- in einem Commander-Slot, oder
- außerhalb des Spiels mit `status: 'removed'`.

Eine aktive Unit besitzt:

- `commanderId`
- `slotIndex`

Units besitzen keine eigene dauerhafte Brettposition.

### 5. Truppengattung pro Commander

Ein Commander führt in Version 1 genau eine Truppengattung.

Erlaubte Werte:

```ts
export type TroopType =
  | 'infantry'
  | 'cavalry'
  | 'archer';
```

Alle aktiven Units eines Commanders haben dieselbe Truppengattung wie der Commander.

Gemischte Commander sind nicht Teil von Version 1.

### 6. Bonuspunkte

Eine Unit besitzt `bonusPoints`.

Erlaubte Werte:

```txt
0
1
2
3
```

Visuelle Darstellung:

```txt
0 Punkte = +0
1 Punkt  = +1
2 Punkte = +2
3 Punkte = +3
```

### 7. Besiegte Units

Wenn eine Unit besiegt wird:

- wird sie aus dem Spielzustand entfernt oder als `removed` markiert
- bleibt sie nicht auf dem Brett liegen
- soll der Verlust visuell nachvollziehbar angezeigt werden

### 8. Leerer Commander

Ein Commander ohne aktive Units bleibt kampffähig.

Er kämpft als Kavallerie mit:

```txt
Würfelanzahl: 1
bonusPoints: 0
TroopType: cavalry
```

Wenn ein leerer Commander verliert, wird er vom Brett entfernt.

### 9. König

Der König ist technisch ein normaler Commander mit:

```ts
isKing: true
```

Es gibt keinen separaten König-Typ.

### 10. König-Darstellung

Der König wird als Commander mit zusätzlicher Markierung dargestellt.

Darstellung:

- quadratische Commander-Grundform
- vier sichtbare Slots
- zentraler Spielerfarbmarker
- zusätzlicher Balken am zentralen Marker
- Balken darf Units nicht verdecken

### 11. König-Bonus

Wenn der König am Kampf beteiligt ist, erhalten alle beteiligten unterstellten Units dieses Königs +1 auf ihren effektiven Würfelwert.

Gilt für:

- König greift an
- König wird angegriffen
- König gegen König

Wenn ein König ohne Units kämpft, kämpft er selbst als Kavallerie und erhält ebenfalls +1.

### 12. König besiegt

Wenn der König besiegt wird:

- ist der gesamte Spieler besiegt
- alle Units, Commander und Banner dieses Spielers werden in Version 1 entfernt oder als nicht mehr aktiv behandelt
- es gibt kein zusätzliches Ultimatum-Modul

### 13. Banner

Das Banner ist kein Commander.

Das Banner ist ein Gebäude beziehungsweise Zielobjekt.

Es besitzt:

- `id`
- `ownerId`
- `position`
- `status`

### 14. Banner-Belegung

Das Banner blockiert sein Feld.

Ein Commander darf nicht auf einem Banner-Feld enden, außer eine spätere Regel erlaubt nach erfolgreichem Nahkampfangriff eine Banner-Einnahme als Ergebnis.

### 15. Banner-Einnahme

Das Banner kann in Version 1 ausschließlich durch erfolgreichen Nahkampfangriff eingenommen werden.

Nahkampfeinheiten:

- `infantry`
- `cavalry`

Bogenschützen können das Banner in Version 1 nicht zerstören.

### 16. Banner besiegt Spieler

Wenn das Banner eines Spielers eingenommen wird:

- ist dieser Spieler besiegt
- alle Units, Commander und Banner dieses Spielers werden in Version 1 entfernt oder als nicht mehr aktiv behandelt

### 17. Demo-Startzustand

Version 1 startet mit mindestens zwei Spielern.

Pro Spieler:

- 1 Banner
- 6 Commander
- 3 Infanterie-Commander
- 1 Kavallerie-Commander
- 2 Bogenschützen-Commander

Der König ist einer der Infanterie-Commander.

### 18. König-Startausstattung

Der König führt Infanterie.

König-Units:

```txt
0, 0, 0, 0
```

Das bedeutet:

- 4 Infanterie-Units
- alle mit `bonusPoints: 0`

### 19. Normale Commander-Startausstattung

Normale Commander haben folgende Standardausstattung:

```txt
0, 0, 1, 3
```

Das bedeutet:

- 2 Units mit `bonusPoints: 0`
- 1 Unit mit `bonusPoints: 1`
- 1 Unit mit `bonusPoints: 3`

Alle Units eines normalen Commanders haben dieselbe Truppengattung wie der Commander.

### 20. Startpositionen Player 1

```txt
Banner B1: (13, 9)

Commander-Startfelder:
(10, 9)
(11, 9)
(12, 9)
(14, 9)
(15, 9)
(16, 9)
```

### 21. Startpositionen Player 2

```txt
Banner B2: (13, 16)

Commander-Startfelder:
(10, 16)
(11, 16)
(12, 16)
(14, 16)
(15, 16)
(16, 16)
```

### 22. Zufällige Commander-Reihenfolge

Die Reihenfolge der sechs Commander-Typen auf den sechs Startfeldern ist zufällig.

Für Tests muss diese Zufälligkeit kontrollierbar sein, zum Beispiel durch:

- festen Test-Seed
- explizite Testaufstellung ohne Zufall

## Datenmodell-Auswirkung

### Position

```ts
export type Position = {
  x: number;
  y: number;
};
```

### TroopType

```ts
export type TroopType =
  | 'infantry'
  | 'cavalry'
  | 'archer';
```

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

### GameState-Bezug

Der `GameState` enthält:

```ts
players: Player[];
commanders: Commander[];
units: Unit[];
banners: Banner[];
activePlayerId: string;
turnNumber: number;
```

Commander-Positionen und Banner-Positionen sind die Grundlage für Occupancy.

Units werden über `commanderId` und `slotIndex` zugeordnet.

## UI-Auswirkung

Die UI muss darstellen:

- Commander als quadratische Figuren
- vier sichtbare Slots pro Commander
- Units als runde Marker in Slots
- Unit-Bonuspunkte als bis zu drei gelbe Punkte
- Commander-Spielerfarbe
- König als Commander mit zusätzlicher Markierung
- Banner als Zielobjekt
- entfernte Units nachvollziehbar
- entfernte leere Commander nachvollziehbar
- besiegte Spieler nachvollziehbar

Die UI darf Units nicht als frei bewegliche Brettfiguren darstellen.

## Akzeptanzkriterien

Diese Spec ist erfüllt, wenn:

- nur Commander als militärische Figuren auf dem Board stehen
- Units ausschließlich in Commander-Slots oder als `removed` existieren
- jeder Commander genau vier Slots besitzt
- jeder Slot leer ist oder genau eine Unit referenziert
- jede aktive Unit einen gültigen `commanderId` besitzt
- jede aktive Unit einen gültigen `slotIndex` von 0 bis 3 besitzt
- jeder Commander genau einen `troopType` besitzt
- alle aktiven Units eines Commanders denselben `troopType` wie der Commander besitzen
- erlaubte `TroopType`-Werte nur `infantry`, `cavalry`, `archer` sind
- der König als Commander mit `isKing: true` modelliert ist
- kein separater König-Typ benötigt wird
- der König visuell eindeutig markiert ist
- ein König im Kampf seinen Bonus gemäß Kampfspec erhalten kann
- ein besiegter König den Besitzer besiegt
- Banner keine Commander sind
- Banner `ownerId`, `position` und `status` besitzen
- Banner ihr Feld blockieren
- Banner nicht durch Bogenschützen zerstört werden können
- Banner durch erfolgreichen Nahkampfangriff eingenommen werden können
- eingenommene Banner den Besitzer besiegen
- leere Commander als Kavallerie mit 1 Würfel und Bonus 0 kämpfen
- besiegte leere Commander vom Brett entfernt werden
- der Demo-Startzustand pro Spieler 1 Banner und 6 Commander enthält
- der König pro Spieler als Infanterie-Commander mit Bonuswerten `0, 0, 0, 0` startet
- normale Commander mit Bonuswerten `0, 0, 1, 3` starten
- die zufällige Commander-Startreihenfolge testbar kontrollierbar ist

## Given/When/Then-Testfälle

### Testfall 1: Commander steht auf dem Brett

Given ein Commander existiert im `GameState`  
When seine Position geprüft wird  
Then besitzt er eine gültige `position` mit `x` und `y`.

### Testfall 2: Unit steht nicht frei auf dem Brett

Given eine aktive Unit existiert  
When die Unit geprüft wird  
Then besitzt sie `commanderId` und `slotIndex`  
And sie besitzt keine eigene dauerhafte Brettposition.

### Testfall 3: Commander hat vier Slots

Given ein Commander wird erzeugt  
When seine `unitSlots` geprüft werden  
Then enthält `unitSlots` genau vier Einträge.

### Testfall 4: Slot enthält maximal eine Unit

Given ein Commander besitzt vier Slots  
When ein Slot geprüft wird  
Then ist der Slot entweder `null`  
Or der Slot referenziert genau eine Unit-ID.

### Testfall 5: Einheitliche Truppengattung

Given ein Commander hat `troopType: 'infantry'`  
And er besitzt aktive Units  
When die Units geprüft werden  
Then hat jede aktive Unit dieses Commanders `troopType: 'infantry'`.

### Testfall 6: Gemischter Commander ist ungültig

Given ein Commander hat `troopType: 'cavalry'`  
And eine seiner aktiven Units hat `troopType: 'archer'`  
When der GameState validiert wird  
Then ist der Zustand ungültig.

### Testfall 7: König ist Commander

Given ein Commander besitzt `isKing: true`  
When das Modell geprüft wird  
Then wird kein separater König-Typ benötigt.

### Testfall 8: König-Bonus ist möglich

Given ein König nimmt am Kampf teil  
When die Kampfwerte berechnet werden  
Then kann der König-Bonus von +1 auf beteiligte unterstellte Units angewendet werden.

### Testfall 9: Besiegter König besiegt Spieler

Given ein König ohne Units verliert einen Kampf  
When der Verlust angewendet wird  
Then wird der Besitzer des Königs als `defeated` markiert.

### Testfall 10: Banner ist kein Commander

Given ein Banner existiert  
When sein Typ geprüft wird  
Then ist es kein Commander  
And es besitzt `ownerId`, `position` und `status`.

### Testfall 11: Banner blockiert Feld

Given ein Banner steht auf Position `(13, 9)`  
When ein Commander auf dieses Feld ziehen soll  
Then ist das Feld blockiert, sofern keine gültige Banner-Einnahme vorliegt.

### Testfall 12: Bogenschützen zerstören kein Banner

Given ein Archer-Commander hat ein gegnerisches Banner in Reichweite  
When er einen Schuss auf das Banner ausführen will  
Then ist das Banner kein gültiges Zerstörungsziel.

### Testfall 13: Nahkampf nimmt Banner ein

Given ein Infantry- oder Cavalry-Commander greift ein gegnerisches Banner erfolgreich im Nahkampf an  
When die Banner-Regel aufgelöst wird  
Then erhält das Banner den Status `captured`  
And der Besitzer des Banners wird besiegt.

### Testfall 14: Leerer Commander kämpft als Kavallerie

Given ein Commander hat keine aktiven Units  
When er in einen Kampf verwickelt wird  
Then kämpft er mit 1 Würfel als `cavalry`  
And verwendet `bonusPoints: 0`.

### Testfall 15: Startzustand Player 1

Given der Demo-Startzustand wird erzeugt  
When Player 1 geprüft wird  
Then besitzt Player 1 ein Banner auf `(13, 9)`  
And sechs Commander auf den erlaubten Startfeldern.

### Testfall 16: Startzustand Player 2

Given der Demo-Startzustand wird erzeugt  
When Player 2 geprüft wird  
Then besitzt Player 2 ein Banner auf `(13, 16)`  
And sechs Commander auf den erlaubten Startfeldern.

### Testfall 17: König-Startausstattung

Given der Demo-Startzustand wird erzeugt  
When der König eines Spielers geprüft wird  
Then ist er ein Infanterie-Commander  
And seine vier Units haben `bonusPoints: 0`.

### Testfall 18: Normale Commander-Startausstattung

Given ein normaler Commander im Demo-Startzustand  
When seine Units geprüft werden  
Then haben sie die Bonuswerte `0, 0, 1, 3`.

## Offene spätere Erweiterungen

Spätere Versionen können ergänzen:

- frei bewegliche Units
- gemischte Commander mit mehreren Truppengattungen
- weitere Truppengattungen
- separate König-Mechaniken
- Ultimatum-Modul
- Banner-Lebenspunkte
- Banner-Zerstörung durch andere Mechaniken
- Gebäude außer Banner
- Mauern
- Katapulte
- Tribock
- Belagerungswaffen
- Vasallen
- Lehnsherren
- GloryPoints
- Goldvermögen
- alternatives Schlachtfeld
- komplexere Spielereliminierung
- persistente Verlusthistorie
- Kampfprotokoll
- Wiederanzeige entfernter Units

Diese Erweiterungen sind nicht Teil von Version 1.
