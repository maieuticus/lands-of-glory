# Datenmodell

Das kanonische Modell liegt in `packages/game-core/src/types.ts`.

`GameState` enthält `board`, `players`, `commanders`, `units`, `banners`, `activePlayerId`, `turnNumber`, `gameStatus`, optional `winner`/`finishReason`, `log`, `rngState` und `holdingDecisions`. Maps und enthaltene Objekte werden durch Core-Operationen nicht mutiert.

Ein `Commander` besitzt `id`, `playerId`, `position`, `type`, vier Unit-Slots, `isKing` und `hasActedThisTurn`. Eine Unit ist nicht frei beweglich und besitzt `commanderId` sowie `slotIndex`. Ein Banner ist ein stehendes oder erobertes Zielobjekt. Spieler können `active` oder `defeated` sein.

Version 1 verwendet ein 24 × 24 Grasbrett. Bewegung: Infanterie 1, Kavallerie 2, Bogenschützen 1. Angriff: Infanterie 1, Kavallerie 2, Bogenschützen ausschließlich 2–3 mit Sichtlinie. Leere Commander verwenden effektiv Kavallerie und würfeln als eigene Einheit.

Würfe werden nach natürlichem Würfelwert absteigend den stärksten Units zugeordnet; erst danach kommen Unit- und König-Boni hinzu. `CombatResult` enthält Rohwürfe, zugeordnete Würfe, Paare, Verluste, Anmarsch, effektive Typen und RNG-Fortsetzung. `holdingDecisions` halten Ziel oder ausdrücklichen Verzicht fest.
