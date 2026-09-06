import { GameState, CommanderId, UnitId, Commander, TroopType, Position, PlayerId, createUnitId } from './types';
import { SeededRNG, RNGState, createRNG } from './rng';
import { GameRuleError, GameErrorCode } from './errors';
import { canAttack } from './rules';
import { activeUnits, getEffectiveTroopType, logEvent, stateKey, synchronizeState } from './state';
import { checkAndApplyVictoryConditions } from './game';

export { canAttack } from './rules';

export interface DieRoll {
  readonly unitId: UnitId;
  readonly naturalValue: number;
  readonly bonusPoints: number;
  readonly kingBonus: number;
  readonly effectiveValue: number;
}
export interface PairResult {
  readonly attackerDie: DieRoll;
  readonly defenderDie: DieRoll;
  readonly attackerWins: boolean;
  readonly isTie: boolean;
}
export interface CombatResult {
  readonly attackerId: CommanderId;
  readonly defenderId: CommanderId;
  readonly attackerRolls: readonly DieRoll[];
  readonly defenderRolls: readonly DieRoll[];
  readonly pairs: readonly PairResult[];
  readonly attackerCasualties: readonly UnitId[];
  readonly defenderCasualties: readonly UnitId[];
  readonly attackerCommanderDefeated: boolean;
  readonly defenderCommanderDefeated: boolean;
  readonly kingDefeated?: CommanderId;
  readonly attackerType: TroopType;
  readonly defenderType: TroopType;
  readonly attackPosition: Position;
  readonly approachPath: readonly Position[];
  readonly sourceKey: string;
  /** Unsorted attacker dice followed by unsorted defender dice. */
  readonly rawDice: readonly number[];
  readonly rngBefore: RNGState | null;
  readonly rngAfter: RNGState | null;
}

const TIE_WINS: Record<TroopType, readonly TroopType[]> = {
  infantry: ['cavalry', 'archer'], cavalry: ['archer'], archer: [],
};

function emptyId(id: CommanderId): UnitId { return createUnitId(`empty-${id}`); }

function assignDice(commander: Commander, dice: readonly number[]): DieRoll[] {
  const units = activeUnits(commander).sort((a, b) => b.bonusPoints - a.bonusPoints || a.slotIndex - b.slotIndex);
  const sortedDice = [...dice].sort((a, b) => b - a);
  return sortedDice.map((naturalValue, index) => {
    const unit = units[index];
    const bonusPoints = unit?.bonusPoints ?? 0;
    const kingBonus = commander.isKing ? 1 : 0;
    return { unitId: unit?.id ?? emptyId(commander.id), naturalValue, bonusPoints, kingBonus,
      effectiveValue: naturalValue + bonusPoints + kingBonus };
  });
}

/** Validate before drawing. Preview leaves GameState unchanged; apply checks freshness. */
export function resolveCombat(
  state: GameState, attackerId: CommanderId, defenderId: CommanderId,
  rng?: SeededRNG, diceRolls?: readonly number[], playerId: PlayerId = state.activePlayerId
): CombatResult {
  const validation = canAttack(state, attackerId, defenderId, playerId);
  if (!validation.valid) throw new GameRuleError(validation.reason!, GameErrorCode.INVALID_ATTACK);
  // Detect inconsistent occupancy before a supplied RNG can be consumed.
  synchronizeState(state);
  const attacker = state.commanders.get(attackerId)!;
  const defender = state.commanders.get(defenderId)!;
  const attackerCount = Math.max(1, activeUnits(attacker).length);
  const defenderCount = Math.max(1, activeUnits(defender).length);
  const count = attackerCount + defenderCount;
  if (diceRolls && (diceRolls.length !== count || diceRolls.some(d => !Number.isInteger(d) || d < 1 || d > 6))) {
    throw new GameRuleError('Expected one d6 per active unit (or empty commander)', GameErrorCode.INVALID_ATTACK);
  }
  const generator = rng ?? (state.rngState ? SeededRNG.fromState(state.rngState) : createRNG(0));
  const rngBefore = diceRolls ? null : generator.getState();
  const rawDice = diceRolls ? [...diceRolls] : generator.rollDice(count);
  const rngAfter = diceRolls ? null : generator.getState();
  const attackerRolls = assignDice(attacker, rawDice.slice(0, attackerCount));
  const defenderRolls = assignDice(defender, rawDice.slice(attackerCount));
  const attackerType = getEffectiveTroopType(attacker);
  const defenderType = getEffectiveTroopType(defender);
  const pairs = attackerRolls.slice(0, Math.min(attackerCount, defenderCount)).map((attackerDie, index): PairResult => {
    const defenderDie = defenderRolls[index];
    const isTie = attackerDie.effectiveValue === defenderDie.effectiveValue;
    return { attackerDie, defenderDie, isTie, attackerWins: isTie ?
      TIE_WINS[attackerType].includes(defenderType) : attackerDie.effectiveValue > defenderDie.effectiveValue };
  });
  const attackerCasualties = attackerType === 'archer' ? [] :
    pairs.filter(p => !p.attackerWins).map(p => p.attackerDie.unitId);
  const defenderCasualties = pairs.filter(p => p.attackerWins).map(p => p.defenderDie.unitId);
  const attackerCommanderDefeated = attackerCasualties.includes(emptyId(attackerId));
  const defenderCommanderDefeated = defenderCasualties.includes(emptyId(defenderId));
  return {
    attackerId, defenderId, attackerRolls, defenderRolls, pairs, attackerCasualties, defenderCasualties,
    attackerCommanderDefeated, defenderCommanderDefeated,
    kingDefeated: attackerCommanderDefeated && attacker.isKing ? attackerId :
      defenderCommanderDefeated && defender.isKing ? defenderId : undefined,
    attackerType, defenderType, attackPosition: validation.attackPosition!, approachPath: validation.path!,
    sourceKey: stateKey(state), rawDice, rngBefore, rngAfter,
  };
}

export function applyCombatResult(state: GameState, result: CombatResult): GameState {
  if (result.sourceKey !== stateKey(state)) throw new GameRuleError('Stale combat result', GameErrorCode.INVALID_ATTACK);
  const expected = resolveCombat(state, result.attackerId, result.defenderId, undefined, result.rawDice);
  const normalized = { ...result, rngBefore: null, rngAfter: null };
  if (JSON.stringify(expected) !== JSON.stringify(normalized)) {
    throw new GameRuleError('Combat result does not match dice', GameErrorCode.INVALID_ATTACK);
  }
  let rngState = state.rngState;
  if (result.rngBefore && result.rngAfter) {
    const generator = SeededRNG.fromState(result.rngBefore);
    const dice = generator.rollDice(result.rawDice.length);
    if (JSON.stringify(dice) !== JSON.stringify(result.rawDice) ||
        JSON.stringify(generator.getState()) !== JSON.stringify(result.rngAfter)) {
      throw new GameRuleError('Invalid combat RNG continuation', GameErrorCode.INVALID_ATTACK);
    }
    rngState = generator.getState();
  } else if (result.rngBefore !== null || result.rngAfter !== null) {
    throw new GameRuleError('Incomplete combat RNG continuation', GameErrorCode.INVALID_ATTACK);
  }
  const commanders = new Map(state.commanders);
  const attacker = commanders.get(result.attackerId)!;
  const defender = commanders.get(result.defenderId)!;
  for (const [commander, casualties] of [
    [attacker, result.attackerCasualties], [defender, result.defenderCasualties],
  ] as const) {
    commanders.set(commander.id, { ...commander, units: commander.units.map(unit =>
      unit && casualties.includes(unit.id) ? { ...unit, status: 'removed' } : unit) });
  }
  commanders.set(attacker.id, { ...commanders.get(attacker.id)!, hasActedThisTurn: true,
    position: result.defenderCommanderDefeated && result.attackerType !== 'archer' ?
      { ...defender.position } : { ...result.attackPosition } });
  if (result.attackerCommanderDefeated) commanders.delete(attacker.id);
  if (result.defenderCommanderDefeated) commanders.delete(defender.id);
  const next = synchronizeState({ ...state, commanders, rngState });
  const logged = logEvent(next, {
    type: 'attack', playerId: attacker.playerId, commanderId: attacker.id,
    details: { defenderId: defender.id, rawDice: [...result.rawDice], pairs: result.pairs,
      attackerCasualties: result.attackerCasualties, defenderCasualties: result.defenderCasualties,
      attackerCommanderDefeated: result.attackerCommanderDefeated,
      defenderCommanderDefeated: result.defenderCommanderDefeated,
      approachPath: result.approachPath, finalPosition: commanders.get(attacker.id)?.position,
      rngBefore: result.rngBefore, rngAfter: result.rngAfter },
  });
  return checkAndApplyVictoryConditions(logged);
}

export function attackCommander(
  state: GameState, attackerId: CommanderId, defenderId: CommanderId,
  diceRolls?: readonly number[], playerId: PlayerId = state.activePlayerId
): GameState {
  return applyCombatResult(state, resolveCombat(state, attackerId, defenderId, undefined, diceRolls, playerId));
}
