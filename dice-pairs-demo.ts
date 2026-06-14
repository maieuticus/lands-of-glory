/**
 * Demonstration: Würfelpaare nebeneinander darstellen
 * 
 * SPIELERFARBEN (Spalten):
 *   - Spieler 1 (Angreifer): z.B. Weiß
 *   - Spieler 2 (Verteidiger): z.B. Schwarz (Grau)
 * 
 * TRUPPENTYPEN (nur Typ-Bezeichnung):
 *   - Bogenschützen = Rot
 *   - Kavallerie = Blau
 *   - Infanterie = Grün
 */

import {
  createGame,
  resolveCombat,
  createRNG,
  GameConfig,
  CombatResult,
  DieRoll,
  GameState,
} from './packages/game-core/src';

// ANSI Farbcodes
const COLORS = {
  reset: '\x1b[0m',
  // Spielerfarben (für Spalten)
  player1: '\x1b[97m',  // Weiß (hell)
  player2: '\x1b[90m',  // Grau/Schwarz (dunkel)
  // Truppentypen (nur für Typ-Bezeichnung)
  archer: '\x1b[31m',    // Rot = Bogenschützen
  cavalry: '\x1b[34m',   // Blau = Kavallerie
  infantry: '\x1b[32m',  // Grün = Infanterie
  // Sonstige
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  brightRed: '\x1b[91m',
  brightBlue: '\x1b[94m',
};

/**
 * Gibt die Farbe für einen Truppentyp zurück (nur für die Typ-Bezeichnung)
 */
function getTroopColor(type: string): string {
  switch (type) {
    case 'archer': return COLORS.archer;
    case 'cavalry': return COLORS.cavalry;
    case 'infantry': return COLORS.infantry;
    default: return COLORS.reset;
  }
}

/**
 * Gibt den deutschen Namen für einen Truppentyp zurück
 */
function getTroopName(type: string): string {
  switch (type) {
    case 'cavalry': return 'Kavallerie';
    case 'archer': return 'Bogenschützen';
    case 'infantry': return 'Infanterie';
    default: return type;
  }
}

/**
 * Formatiert einen einzelnen Würfelwurf
 */
function formatDie(roll: DieRoll): string {
  const bonusStr = roll.bonusPoints > 0 ? `+${roll.bonusPoints}` : '';
  const kingStr = roll.kingBonus > 0 ? '(K)' : '';
  return `${roll.naturalValue}${bonusStr}${kingStr}=${roll.effectiveValue}`;
}

/**
 * Zeigt detaillierte Würfelpaare nebeneinander an
 */
function printDicePairs(
  result: CombatResult, 
  title: string, 
  game: GameState,
  p1Name: string,
  p2Name: string
): void {
  const attacker = game.commanders.get(result.attackerId);
  const defender = game.commanders.get(result.defenderId);
  
  const attackerType = attacker?.type || 'unknown';
  const defenderType = defender?.type || 'unknown';
  const attackerTypeColor = getTroopColor(attackerType);
  const defenderTypeColor = getTroopColor(defenderType);
  
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║  ${title.padEnd(62)} ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
  
  // Header mit SPIELERFARBEN (nicht Truppentyp-Farben)
  console.log(`${COLORS.player1}▓▓▓ ANGREIFER: ${p1Name} ▓▓▓${COLORS.reset}           ${COLORS.player2}▓▓▓ VERTEIDIGER: ${p2Name} ▓▓▓${COLORS.reset}`);
  console.log(`${COLORS.player1}${result.attackerId}${COLORS.reset}`);
  console.log(`  Typ: ${attackerTypeColor}${getTroopName(attackerType)}${COLORS.reset}                              ${COLORS.player2}${result.defenderId}${COLORS.reset}`);
  console.log(`                                         Typ: ${defenderTypeColor}${getTroopName(defenderType)}${COLORS.reset}\n`);
  
  // Alle Würfe nebeneinander anzeigen - Spalten in SPIELERFARBEN
  console.log(`${COLORS.player1}╔════════════════════════════════════╗${COLORS.reset}  ${COLORS.player2}╔════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.player1}║        WÜRFE ANGREIFER             ║${COLORS.reset}  ${COLORS.player2}║        WÜRFE VERTEIDIGER           ║${COLORS.reset}`);
  console.log(`${COLORS.player1}╚════════════════════════════════════╝${COLORS.reset}  ${COLORS.player2}╚════════════════════════════════════╝${COLORS.reset}`);
  
  const maxRolls = Math.max(result.attackerRolls.length, result.defenderRolls.length);
  for (let i = 0; i < maxRolls; i++) {
    const a = result.attackerRolls[i];
    const d = result.defenderRolls[i];
    const num = (i + 1).toString().padStart(2);
    const aStr = a ? formatDie(a).padEnd(28) : '-'.padEnd(28);
    const dStr = d ? formatDie(d).padEnd(28) : '-'.padEnd(28);
    // Würfelwerte in Spielerfarbe
    console.log(` ${num}.  ${COLORS.player1}${aStr}${COLORS.reset}    ${COLORS.player2}${dStr}${COLORS.reset}`);
  }
  
  // Überschuss anzeigen
  const excessAttacker = result.attackerRolls.length - result.pairs.length;
  const excessDefender = result.defenderRolls.length - result.pairs.length;
  if (excessAttacker > 0 || excessDefender > 0) {
    console.log(`\n${COLORS.player1}╔════════════════════════════════════╗${COLORS.reset}  ${COLORS.player2}╔════════════════════════════════════╗${COLORS.reset}`);
    if (excessAttacker > 0) {
      console.log(`${COLORS.player1}║  Überschuss: ${excessAttacker} Würfel              ║${COLORS.reset}`);
    } else {
      console.log(`${COLORS.player1}║                                    ║${COLORS.reset}`);
    }
    if (excessDefender > 0) {
      console.log(`  ${COLORS.player2}║  Überschuss: ${excessDefender} Würfel              ║${COLORS.reset}`);
    } else {
      console.log(`  ${COLORS.player2}║                                    ║${COLORS.reset}`);
    }
    console.log(`${COLORS.player1}╚════════════════════════════════════╝${COLORS.reset}  ${COLORS.player2}╚════════════════════════════════════╝${COLORS.reset}`);
  }
  
  // Paarweiser Vergleich
  console.log(`\n${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.yellow}                  PAARWEISER VERGLEICH${COLORS.reset}`);
  console.log(`${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(` Paar │ ${COLORS.player1}ANGREIFER${COLORS.reset}    vs    ${COLORS.player2}VERTEIDIGER${COLORS.reset}   │    GEWINNER`);
  console.log(`──────┼──────────────────────────────────────┼───────────────────`);
  
  result.pairs.forEach((pair, index) => {
    const pairNum = (index + 1).toString().padStart(3);
    const aStr = formatDie(pair.attackerDie).padEnd(10);
    const dStr = formatDie(pair.defenderDie).padEnd(10);
    const winner = pair.attackerWins 
      ? `${COLORS.player1}${p1Name} ✓${COLORS.reset}` 
      : `${COLORS.player2}${p2Name} ✓${COLORS.reset}`;
    const tie = pair.isTie ? ' (Unentschieden)' : '';
    console.log(`  ${pairNum}  │ ${COLORS.player1}${aStr}${COLORS.reset}  vs   ${COLORS.player2}${dStr}${COLORS.reset} │ ${winner}${tie}`);
  });
  
  // Verluste
  console.log(`\n${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.yellow}                        ERGEBNIS${COLORS.reset}`);
  console.log(`${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.player1}Angreifer (${p1Name}) Verluste: ${result.attackerCasualties.length} Unit(s)${COLORS.reset}`);
  result.attackerCasualties.forEach(id => console.log(`${COLORS.player1}                      - ${id}${COLORS.reset}`));
  console.log(`${COLORS.player2}Verteidiger (${p2Name}) Verluste: ${result.defenderCasualties.length} Unit(s)${COLORS.reset}`);
  result.defenderCasualties.forEach(id => console.log(`${COLORS.player2}                      - ${id}${COLORS.reset}`));
  
  if (result.attackerCommanderDefeated) {
    console.log(`\n${COLORS.brightRed}>>> ANGREIFER ${result.attackerId} WURDE BESIEGT! <<<
${COLORS.reset}`);
  }
  if (result.defenderCommanderDefeated) {
    console.log(`\n${COLORS.brightBlue}>>> VERTEIDIGER ${result.defenderId} WURDE BESIEGT! <<<
${COLORS.reset}`);
  }
  if (result.kingDefeated) {
    console.log(`\n${COLORS.magenta}>>> 👑 KÖNIG ${result.kingDefeated} WURDE BESIEGT! 👑 <<<
${COLORS.reset}`);
  }
  
  console.log(`\n${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO-SZENARIEN
// ═══════════════════════════════════════════════════════════════════════════

const config: GameConfig = {
  players: [
    { name: 'Spieler 1 (Weiß)', color: '#FFFFFF' },
    { name: 'Spieler 2 (Schwarz)', color: '#000000' },
  ],
};

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║              WÜRFELPAARE - ÜBERSICHT MIT FARBEN                  ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log('║  SPIELERFARBEN (Spalten):                                        ║');
console.log('║    Angreifer = Weiß                                              ║');
console.log('║    Verteidiger = Grau/Schwarz                                    ║');
console.log('║                                                                  ║');
console.log('║  TRUPPENTYPEN (nur Typ-Name):                                    ║');
console.log(`║    ${COLORS.archer}Bogenschützen${COLORS.reset} = Rot                                          ║`);
console.log(`║    ${COLORS.cavalry}Kavallerie${COLORS.reset} = Blau                                           ║`);
console.log(`║    ${COLORS.infantry}Infanterie${COLORS.reset} = Grün                                          ║`);
console.log('╚══════════════════════════════════════════════════════════════════╝');

// DEMO 1: Standard-Kampf (Infanterie vs Infanterie)
let game = createGame(config);
const rng = createRNG(42);

const player1 = game.players[0];
const player2 = game.players[1];
const attackerId = player1.commanders[1];
const defenderId = player2.commanders[1];

let result = resolveCombat(game, attackerId, defenderId, rng);
printDicePairs(result, 'DEMO 1: Infanterie vs Infanterie', game, 'Weiß', 'Schwarz');

// DEMO 2: König (Kavallerie) vs Infanterie
let game2 = createGame(config);
let king1Id: string | undefined;
for (const cmdId of player1.commanders) {
  const cmd = game2.commanders.get(cmdId);
  if (cmd?.isKing) {
    king1Id = cmdId;
    break;
  }
}

if (king1Id) {
  result = resolveCombat(game2, king1Id, defenderId, rng);
  printDicePairs(result, 'DEMO 2: König (Kavallerie) vs Infanterie', game2, 'Weiß', 'Schwarz');
}

// DEMO 3: Bogenschützen vs Kavallerie (wenn verfügbar)
console.log(`\n${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}`);
console.log(`${COLORS.yellow}              WEITERE KOMBINATIONEN${COLORS.reset}`);
console.log(`${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}\n`);

// DEMO 4: Ungleicher Kampf
let game4 = createGame(config);
const attacker4 = game4.commanders.get(attackerId)!;
const updatedCommanders4 = new Map(game4.commanders);
updatedCommanders4.set(attackerId, {
  ...attacker4,
  units: attacker4.units.map((u, i) => (i < 1 ? u : null)),
});
game4 = { ...game4, commanders: updatedCommanders4 };

result = resolveCombat(game4, attackerId, defenderId, rng);
printDicePairs(result, 'DEMO 3: 1 Unit vs 2 Units (Überschuss)', game4, 'Weiß', 'Schwarz');

// DEMO 5: Leerer Commander
let game5 = createGame(config);
const attacker5 = game5.commanders.get(attackerId)!;
const updatedCommanders5 = new Map(game5.commanders);
updatedCommanders5.set(attackerId, {
  ...attacker5,
  units: [null, null, null, null],
});
game5 = { ...game5, commanders: updatedCommanders5 };

result = resolveCombat(game5, attackerId, defenderId, rng);
printDicePairs(result, 'DEMO 4: Leerer Commander kämpft als Kavallerie', game5, 'Weiß', 'Schwarz');

// Truppentypen-Legende
console.log(`\n${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}`);
console.log(`${COLORS.yellow}                    TRUPPENTYPEN-LEGENDE${COLORS.reset}`);
console.log(`${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}\n`);
console.log('Die Truppentypen werden in folgenden Farben angezeigt:');
console.log(`  ${COLORS.archer}● Bogenschützen${COLORS.reset} = Rot (Fernkampf, Reichweite 2)`);
console.log(`  ${COLORS.cavalry}● Kavallerie${COLORS.reset} = Blau (schnell, Reichweite 2)`);
console.log(`  ${COLORS.infantry}● Infanterie${COLORS.reset} = Grün (Nahkampf, Reichweite 1)`);
console.log(`\n${COLORS.yellow}══════════════════════════════════════════════════════════════════${COLORS.reset}\n`);

console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║                        ENDE DER DEMO                             ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');
