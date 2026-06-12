/**
 * packages/game-core/src/combat.ts
 *
 * Combat resolution system per Spec 005
 *
 * Implements:
 * - Dice rolling based on active units (max 4 per commander)
 * - Empty commander/king combat rules
 * - Natural dice sorting before bonus addition
 * - King bonus (+1 for all units when king participates)
 * - Pairwise comparison
 * - Automatic casualty assignment
 * - Combat table for ties
 */

import {
  GameState,
  CommanderId,
  UnitId,
  Commander,
  Unit,
  TroopType,
  createUnitId,
} from './types';
import { SeededRNG } from './rng';

// ============================================================================
// COMBAT TYPES
// ============================================================================

/**
 * Result of a single die roll
 */
export interface DieRoll {
  readonly unitId: UnitId;
  readonly naturalValue: number;  // 1-6 before bonuses
  readonly bonusPoints: number;   // Unit's bonusPoints (0-3)
  readonly kingBonus: number;     // +1 if king participates
  readonly effectiveValue: number; // naturalValue + bonusPoints + kingBonus
}

/**
 * Result of a single dice pair comparison
 */
export interface PairResult {
  readonly attackerDie: DieRoll;
  readonly defenderDie: DieRoll;
  readonly attackerWins: boolean;
  readonly isTie: boolean;
}

/**
 * Complete combat resolution result
 */
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
  readonly kingDefeated?: CommanderId;  // If a king was defeated
}

// ============================================================================
// COMBAT CONSTANTS
// ============================================================================

const DIE_MIN = 1;
const DIE_MAX = 6;
const KING_BONUS = 1;

/**
 * Combat table for tie resolution (Spec 005, Section 22)
 * attackerType vs defenderType -> attacker wins on tie?
 */
const TIE_WINS: Record<TroopType, Record<TroopType, boolean>> = {
  infantry: {
    infantry: false,  // Attacker must exceed defender
    cavalry: true,    // Inf vs Cav: attacker wins on tie
    archer: false,
  },
  cavalry: {
    infantry: false,
    cavalry: false,
    archer: false,
  },
  archer: {
    infantry: false,
    cavalry: false,
    archer: false,
  },
};

// ============================================================================
// COMBAT RESOLUTION
// ============================================================================

/**
 * Resolve combat between two commanders
 *
 * Per Spec 005:
 * 1. Roll dice (1 per unit, max 4)
 * 2. Empty commanders fight as cavalry with 1 die
 * 3. Sort naturally before adding bonuses
 * 4. Apply king bonus (+1) if king participates
 * 5. Compare pairs
 * 6. Assign casualties automatically
 *
 * @param state - Current game state
 * @param attackerId - Attacking commander
 * @param defenderId - Defending commander
 * @param rng - Random number generator for dice
 * @returns Combat result with all details
 */
export function resolveCombat(
  state: GameState,
  attackerId: CommanderId,
  defenderId: CommanderId,
  rng: SeededRNG
): CombatResult {
  const attacker = state.commanders.get(attackerId);
  const defender = state.commanders.get(defenderId);

  if (!attacker || !defender) {
    throw new Error('Commander not found');
  }

  // Determine if kings are participating
  const attackerIsKing = attacker.isKing;
  const defenderIsKing = defender.isKing;

  // Roll dice for both sides
  const attackerRolls = rollForCommander(attacker, attackerIsKing, rng);
  const defenderRolls = rollForCommander(defender, defenderIsKing, rng);

  // Sort by natural value descending (Spec 005: natural sorting before bonus)
  const sortedAttackerRolls = [...attackerRolls].sort(
    (a, b) => b.naturalValue - a.naturalValue
  );
  const sortedDefenderRolls = [...defenderRolls].sort(
    (a, b) => b.naturalValue - a.naturalValue
  );

  // Compare pairs
  const pairs = comparePairs(
    sortedAttackerRolls,
    sortedDefenderRolls,
    attacker.type,
    defender.type
  );

  // Determine casualties
  const attackerCasualties: UnitId[] = [];
  const defenderCasualties: UnitId[] = [];

  for (const pair of pairs) {
    if (!pair.attackerWins) {
      // Attacker loses this pair
      attackerCasualties.push(pair.attackerDie.unitId);
    } else {
      // Defender loses this pair
      defenderCasualties.push(pair.defenderDie.unitId);
    }
  }

  // Check if commanders are defeated (only if they have no units left)
  const remainingAttackerUnits = attacker.units.filter(
    (u): u is Unit => u !== null && u.status === 'active' && !attackerCasualties.includes(u.id)
  ).length;
  const remainingDefenderUnits = defender.units.filter(
    (u): u is Unit => u !== null && u.status === 'active' && !defenderCasualties.includes(u.id)
  ).length;

  // Commander is defeated only if they have no units AND lose their single die
  const attackerCommanderDefeated = remainingAttackerUnits === 0 && pairs.some(
    p => !p.attackerWins && p.attackerDie.unitId === createEmptyCommanderUnitId(attackerId)
  );
  const defenderCommanderDefeated = remainingDefenderUnits === 0 && pairs.some(
    p => p.attackerWins && p.defenderDie.unitId === createEmptyCommanderUnitId(defenderId)
  );

  // Check if a king was defeated
  let kingDefeated: CommanderId | undefined;
  if (attackerCommanderDefeated && attackerIsKing) {
    kingDefeated = attackerId;
  } else if (defenderCommanderDefeated && defenderIsKing) {
    kingDefeated = defenderId;
  }

  return {
    attackerId,
    defenderId,
    attackerRolls: sortedAttackerRolls,
    defenderRolls: sortedDefenderRolls,
    pairs,
    attackerCasualties,
    defenderCasualties,
    attackerCommanderDefeated,
    defenderCommanderDefeated,
    kingDefeated,
  };
}

/**
 * Roll dice for a commander
 *
 * Per Spec 005:
 * - 1 die per active unit (max 4)
 * - Empty commander: 1 die as cavalry
 * - Empty king: 1 die as cavalry with king bonus
 *
 * Units are sorted by bonusPoints descending (highest bonus = first die)
 *
 * @param commander - Commander to roll for
 * @param isKing - Whether this commander is a king
 * @param rng - Random number generator
 * @returns Array of die rolls
 */
function rollForCommander(
  commander: Commander,
  isKing: boolean,
  rng: SeededRNG
): DieRoll[] {
  const activeUnits = commander.units.filter(
    (u): u is Unit => u !== null && u.status === 'active'
  );

  // Sort units by bonusPoints descending (highest bonus fights first)
  const sortedUnits = [...activeUnits].sort((a, b) => b.bonusPoints - a.bonusPoints);

  if (sortedUnits.length === 0) {
    // Empty commander fights as cavalry with 1 die (Spec 005, Section 9)
    const unitId = createEmptyCommanderUnitId(commander.id);
    const naturalValue = rng.d6();
    const kingBonus = isKing ? KING_BONUS : 0;

    return [
      {
        unitId,
        naturalValue,
        bonusPoints: 0,
        kingBonus,
        effectiveValue: naturalValue + kingBonus,
      },
    ];
  }

  // Roll for each unit
  return sortedUnits.map((unit) => {
    const naturalValue = rng.d6();
    const kingBonus = isKing ? KING_BONUS : 0;

    return {
      unitId: unit.id,
      naturalValue,
      bonusPoints: unit.bonusPoints,
      kingBonus,
      effectiveValue: naturalValue + unit.bonusPoints + kingBonus,
    };
  });
}

/**
 * Compare dice pairs
 *
 * Per Spec 005:
 * - Highest vs highest, second highest vs second highest, etc.
 * - Ignore excess dice (no additional casualties)
 * - Lower effective value loses
 * - Tie: consult combat table (only Inf vs Cav favors attacker)
 *
 * @param attackerRolls - Attacker's sorted rolls
 * @param defenderRolls - Defender's sorted rolls
 * @param attackerType - Attacker's troop type
 * @param defenderType - Defender's troop type
 * @returns Array of pair results
 */
function comparePairs(
  attackerRolls: readonly DieRoll[],
  defenderRolls: readonly DieRoll[],
  attackerType: TroopType,
  defenderType: TroopType
): PairResult[] {
  const pairs: PairResult[] = [];
  const pairCount = Math.min(attackerRolls.length, defenderRolls.length);

  for (let i = 0; i < pairCount; i++) {
    const attackerDie = attackerRolls[i];
    const defenderDie = defenderRolls[i];

    const isTie = attackerDie.effectiveValue === defenderDie.effectiveValue;
    let attackerWins: boolean;

    if (isTie) {
      // Consult combat table (Spec 005, Section 21-22)
      attackerWins = TIE_WINS[attackerType][defenderType];
    } else {
      attackerWins = attackerDie.effectiveValue > defenderDie.effectiveValue;
    }

    pairs.push({
      attackerDie,
      defenderDie,
      attackerWins,
      isTie,
    });
  }

  return pairs;
}

/**
 * Create a virtual unit ID for empty commander combat
 */
function createEmptyCommanderUnitId(commanderId: CommanderId): UnitId {
  return createUnitId(`empty-${commanderId}`);
}

// ============================================================================
// COMBAT APPLICATION
// ============================================================================

/**
 * Apply combat result to game state
 *
 * - Remove casualties (set status to 'removed')
 * - Remove defeated commanders
 * - Check for king defeat
 * - Check victory conditions
 *
 * @param state - Current game state
 * @param result - Combat result
 * @returns New game state with combat applied
 */
export function applyCombatResult(
  state: GameState,
  result: CombatResult
): GameState {
  let newState = { ...state };
  const newCommanders = new Map(state.commanders);
  const newUnits = new Map(state.units);

  // Apply attacker casualties
  const attacker = newCommanders.get(result.attackerId);
  if (attacker) {
    const updatedUnits = attacker.units.map((unit) => {
      if (unit && result.attackerCasualties.includes(unit.id)) {
        // Mark unit as removed
        newUnits.set(unit.id, { ...unit, status: 'removed' });
        return { ...unit, status: 'removed' };
      }
      return unit;
    });

    newCommanders.set(result.attackerId, {
      ...attacker,
      units: updatedUnits,
    });
  }

  // Apply defender casualties
  const defender = newCommanders.get(result.defenderId);
  if (defender) {
    const updatedUnits = defender.units.map((unit) => {
      if (unit && result.defenderCasualties.includes(unit.id)) {
        // Mark unit as removed
        newUnits.set(unit.id, { ...unit, status: 'removed' });
        return { ...unit, status: 'removed' };
      }
      return unit;
    });

    newCommanders.set(result.defenderId, {
      ...defender,
      units: updatedUnits,
    });
  }

  // Remove defeated commanders
  if (result.attackerCommanderDefeated) {
    newCommanders.delete(result.attackerId);
  }
  if (result.defenderCommanderDefeated) {
    newCommanders.delete(result.defenderId);
  }

  newState = {
    ...newState,
    commanders: newCommanders,
    units: newUnits,
  };

  return newState;
}

// ============================================================================
// COMBAT VALIDATION
// ============================================================================

/**
 * Check if an attack is valid
 *
 * Per Spec 004 & 005:
 * - Target must be within attack range
 * - Attacker must not have acted this turn
 * - Attacker must have active units or be empty (fights as cavalry)
 *
 * @param state - Current game state
 * @param attackerId - Attacking commander
 * @param defenderId - Target commander
 * @returns { valid: boolean, reason?: string }
 */
export function canAttack(
  state: GameState,
  attackerId: CommanderId,
  defenderId: CommanderId
): { valid: boolean; reason?: string } {
  const attacker = state.commanders.get(attackerId);
  const defender = state.commanders.get(defenderId);

  if (!attacker) {
    return { valid: false, reason: 'Attacker not found' };
  }
  if (!defender) {
    return { valid: false, reason: 'Defender not found' };
  }

  // Check if attacker has already acted
  if (attacker.hasActedThisTurn) {
    return { valid: false, reason: 'Commander has already acted this turn' };
  }

  // Check range
  const dx = Math.abs(attacker.position.x - defender.position.x);
  const dy = Math.abs(attacker.position.y - defender.position.y);
  const distance = Math.max(dx, dy);

  const attackRange = getAttackRange(attacker.type);
  if (distance > attackRange) {
    return { valid: false, reason: 'Target out of range' };
  }

  // Check if attacker has any active units (or is empty - fights as cavalry)
  const hasActiveUnits = attacker.units.some(
    (u) => u !== null && u.status === 'active'
  );
  if (!hasActiveUnits) {
    // Empty commander can still fight as cavalry (Spec 005, Section 9)
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Get attack range for a troop type (per Spec 004)
 */
function getAttackRange(troopType: TroopType): number {
  switch (troopType) {
    case 'infantry':
      return 1;
    case 'cavalry':
      return 2;
    case 'archer':
      return 2;
    default:
      return 1;
  }
}
