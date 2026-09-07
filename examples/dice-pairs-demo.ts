/** Executable Core example: npm run demo:dice (from the repository root). */
import {
  CommanderBuildConfig, TroopType, UnitBuildConfig,
  createGame, startGame, getMinimalArmyConfig, getPendingHoldingChoices,
  setHoldingTarget, resolveCombat, applyCombatResult,
} from '../packages/game-core/src';

function captain(troopType: TroopType, bonuses: readonly (0 | 1 | 2 | 3)[]): CommanderBuildConfig {
  const slots: UnitBuildConfig[] = Array.from({ length: 4 }, (_, slot) => ({
    hasUnit: slot < bonuses.length,
    bonusPoints: bonuses[slot] ?? 0,
  }));
  return { type: 'captain', troopType, slots };
}

function demonstrate(
  title: string,
  attacker: CommanderBuildConfig,
  defender: CommanderBuildConfig,
  distance: number,
  dice: readonly number[],
): void {
  let state = createGame({ players: [attacker, defender].map((commander, index) => ({
    name: `Spieler ${index + 1}`, color: index === 0 ? '#ffffff' : '#000000',
    armyConfig: { commanders: [...getMinimalArmyConfig().commanders, commander] },
  })) });
  const attackerId = state.players[0].commanders[1];
  const defenderId = state.players[1].commanders[1];
  const commanders = new Map(state.commanders);
  commanders.set(attackerId, { ...commanders.get(attackerId)!, position: { x: 10, y: 10 } });
  commanders.set(defenderId, { ...commanders.get(defenderId)!, position: { x: 10 + distance, y: 10 } });
  state = startGame({ ...state, commanders });
  // This demo's infantry owners explicitly waive all pending reactions.
  let choice = getPendingHoldingChoices(state)[0];
  while (choice) {
    state = setHoldingTarget(state, choice.playerId, choice.holderId, null);
    choice = getPendingHoldingChoices(state)[0];
  }
  const result = resolveCombat(state, attackerId, defenderId, undefined, dice);
  const next = applyCombatResult(state, result);
  console.log(`\n${title} (${result.attackerType} → ${result.defenderType})`);
  console.table(result.pairs.map(pair => ({
    Angreifer: `${pair.attackerDie.naturalValue} + ${pair.attackerDie.bonusPoints} = ${pair.attackerDie.effectiveValue}`,
    Verteidiger: `${pair.defenderDie.naturalValue} + ${pair.defenderDie.bonusPoints} = ${pair.defenderDie.effectiveValue}`,
    Sieger: pair.attackerWins ? 'Angreifer' : 'Verteidiger',
  })));
  console.log(`Verluste: ${result.attackerCasualties.length}:${result.defenderCasualties.length}; Aktion verbraucht: ${next.commanders.get(attackerId)?.hasActedThisTurn ?? 'Commander besiegt'}`);
}

demonstrate('Stärkste Unit zum höchsten natürlichen Wurf',
  captain('infantry', [0, 3, 1, 2]), captain('cavalry', [0, 0, 0, 0]), 1, [2, 6, 3, 5, 4, 1, 2, 3]);
demonstrate('Bogenschützen verlieren beim eigenen Schuss keine Units',
  captain('archer', [0]), captain('cavalry', [0]), 3, [1, 6]);
demonstrate('Leerer ehemaliger Bogenschützen-Commander kämpft als Kavallerie',
  captain('archer', []), captain('cavalry', [0]), 1, [1, 6]);
demonstrate('Überzählige Würfel verursachen keine weiteren Verluste',
  captain('cavalry', [0, 0, 0, 0]), captain('cavalry', [0]), 1, [6, 5, 4, 3, 1]);
