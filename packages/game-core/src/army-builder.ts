/**
 * packages/game-core/src/army-builder.ts
 *
 * Army builder with budget system for Lands of Glory
 *
 * Allows players to assemble their own armies within a gold budget:
 * - Hauptmann (Captain): 1 Gold
 * - Infantry/Cavalry/Archer unit: 1 Gold each
 * - Each bonus point (strength) on a unit: 1 Gold
 * - Commanders with 3 units get a free 4th unit (strength = weakest unit)
 */

import {
  TroopType,
  Unit,
  Commander,
  PlayerId,
  createUnitId,
  createCommanderId,
  COMMANDER_SLOTS,
  COMMANDER_MAX_HEALTH,
} from './types';

// ============================================================================
// COST CONSTANTS
// ============================================================================

export const ARMY_BUILDER_COSTS = {
  captain: 1,        // Hauptmann (Commander without King/Banner)
  king: 0,           // King is free (required)
  unit: 1,           // Each unit slot costs 1 gold
  bonusPoint: 1,     // Each strength point costs 1 gold
} as const;

export const DEFAULT_STARTING_BUDGET = 20;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Commander type for army building
 * - 'king': The king commander (with banner/stripes)
 * - 'captain': Regular commander (Hauptmann, without stripes)
 */
export type CommanderBuilderType = 'king' | 'captain';

/**
 * Configuration for building a unit in a slot
 */
export interface UnitBuildConfig {
  readonly hasUnit: boolean;
  readonly bonusPoints: 0 | 1 | 2 | 3;
}

/**
 * Configuration for building a commander
 */
export interface CommanderBuildConfig {
  readonly type: CommanderBuilderType;
  readonly troopType: TroopType;
  readonly slots: readonly UnitBuildConfig[];  // Must have exactly 4 slots
}

/**
 * Army configuration for a player
 */
export interface ArmyConfig {
  readonly commanders: readonly CommanderBuildConfig[];
}

/**
 * Cost breakdown for an army
 */
export interface ArmyCostBreakdown {
  readonly commanderCosts: number;
  readonly unitCosts: number;
  readonly bonusPointCosts: number;
  readonly freeBonusUnits: number;
  readonly totalCost: number;
}

/**
 * Validation result for army configuration
 */
export interface ArmyValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly cost: ArmyCostBreakdown;
  readonly remainingBudget: number;
}

// ============================================================================
// COST CALCULATION
// ============================================================================

/**
 * Calculate the cost of a single unit slot
 */
function calculateUnitSlotCost(slot: UnitBuildConfig): number {
  if (!slot.hasUnit) {
    return 0;
  }
  return ARMY_BUILDER_COSTS.unit + (slot.bonusPoints * ARMY_BUILDER_COSTS.bonusPoint);
}

/**
 * Calculate the cost of a commander configuration
 * Includes the free bonus unit rule: Commanders with 3 units get a 4th free
 */
function calculateCommanderCost(
  config: CommanderBuildConfig,
  applyFreeBonusUnit: boolean = true
): { cost: number; freeUnitAdded: boolean } {
  let cost = 0;
  let freeUnitAdded = false;

  // Commander base cost
  if (config.type === 'captain') {
    cost += ARMY_BUILDER_COSTS.captain;
  }
  // King is free

  // Count units
  const unitCount = config.slots.filter(s => s.hasUnit).length;

  // Calculate unit costs
  for (const slot of config.slots) {
    cost += calculateUnitSlotCost(slot);
  }

  // Apply free bonus unit rule: Only for infantry commanders with exactly 3 units
  // The free unit's strength equals the weakest unit the commander has
  if (applyFreeBonusUnit && unitCount === 3 && config.troopType === 'infantry') {
    // Find the weakest unit's bonus points
    const activeUnits = config.slots
      .filter(s => s.hasUnit)
      .map(s => s.bonusPoints);
    
    if (activeUnits.length === 3) {
      const weakestBonus = Math.min(...activeUnits);
      // The 4th unit is free, so we subtract the cost of what would have been a paid unit
      // But we don't add any cost - it's free!
      freeUnitAdded = true;
      // No cost subtraction needed since we only calculate what IS there
      // The free unit is conceptually in the 4th slot, but since it's free,
      // we just don't charge for it
    }
  }

  return { cost, freeUnitAdded };
}

/**
 * Calculate the total cost of an army configuration
 */
export function calculateArmyCost(
  config: ArmyConfig,
  applyFreeBonusUnit: boolean = true
): ArmyCostBreakdown {
  let commanderCosts = 0;
  let unitCosts = 0;
  let bonusPointCosts = 0;
  let freeBonusUnits = 0;

  for (const commander of config.commanders) {
    const { cost, freeUnitAdded } = calculateCommanderCost(commander, applyFreeBonusUnit);

    // Split cost into components
    if (commander.type === 'captain') {
      commanderCosts += ARMY_BUILDER_COSTS.captain;
    }

    for (const slot of commander.slots) {
      if (slot.hasUnit) {
        unitCosts += ARMY_BUILDER_COSTS.unit;
        bonusPointCosts += slot.bonusPoints * ARMY_BUILDER_COSTS.bonusPoint;
      }
    }

    if (freeUnitAdded) {
      freeBonusUnits++;
    }
  }

  // Adjust for free units: we counted them above, so we need to subtract
  // The cost of a free unit would be: 1 (base) + weakestBonus
  // But since the unit doesn't exist in the config yet, we don't need to subtract
  // The free unit is added during build phase, not in the cost calculation

  return {
    commanderCosts,
    unitCosts,
    bonusPointCosts,
    freeBonusUnits,
    totalCost: commanderCosts + unitCosts + bonusPointCosts,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate an army configuration
 * Checks:
 * - Budget limit
 * - Exactly one King per player
 * - Valid slot configurations (exactly 4 slots per commander)
 * - Valid bonus point values (0-3)
 */
export function validateArmyConfig(
  config: ArmyConfig,
  budget: number = DEFAULT_STARTING_BUDGET
): ArmyValidationResult {
  const errors: string[] = [];

  // Check for exactly one king
  const kingCount = config.commanders.filter(c => c.type === 'king').length;
  if (kingCount === 0) {
    errors.push('Army must have exactly one King (no King found)');
  } else if (kingCount > 1) {
    errors.push(`Army must have exactly one King (found ${kingCount})`);
  }

  // Check commander configurations
  for (let i = 0; i < config.commanders.length; i++) {
    const commander = config.commanders[i];
    
    // Check slot count
    if (commander.slots.length !== COMMANDER_SLOTS) {
      errors.push(`Commander ${i + 1} must have exactly ${COMMANDER_SLOTS} slots (found ${commander.slots.length})`);
    }

    // Check bonus point values
    for (let j = 0; j < commander.slots.length; j++) {
      const slot = commander.slots[j];
      if (slot.bonusPoints < 0 || slot.bonusPoints > 3) {
        errors.push(`Commander ${i + 1}, Slot ${j + 1}: Invalid bonus points ${slot.bonusPoints} (must be 0-3)`);
      }
    }
  }

  // Calculate cost
  const cost = calculateArmyCost(config);
  const remainingBudget = budget - cost.totalCost;

  // Check budget
  if (cost.totalCost > budget) {
    errors.push(`Army cost (${cost.totalCost} gold) exceeds budget (${budget} gold)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    cost,
    remainingBudget,
  };
}

// ============================================================================
// ARMY BUILDING
// ============================================================================

/**
 * Build a complete unit from configuration
 */
function buildUnit(
  playerId: PlayerId,
  commanderId: string,
  slotIndex: number,
  config: UnitBuildConfig,
  unitIndex: number
): Unit | null {
  if (!config.hasUnit) {
    return null;
  }

  return {
    id: createUnitId(`unit-${playerId}-${commanderId}-${slotIndex}-${unitIndex}`),
    troopType: 'infantry', // Will be set by commander
    bonusPoints: config.bonusPoints,
    commanderId: createCommanderId(commanderId),
    slotIndex: slotIndex as 0 | 1 | 2 | 3,
    status: 'active',
  };
}

/**
 * Apply the free bonus unit rule to a commander
 * If a commander has exactly 3 units, add a 4th with strength equal to the weakest
 */
function applyFreeBonusUnit(
  units: (Unit | null)[],
  troopType: TroopType,
  commanderId: string,
  playerId: PlayerId,
  unitIndex: number
): (Unit | null)[] {
  const activeUnits = units.filter((u): u is Unit => u !== null);
  
  // Only apply if exactly 3 units
  if (activeUnits.length !== 3) {
    return units;
  }

  // Find the first empty slot
  const emptySlotIndex = units.findIndex(u => u === null);
  if (emptySlotIndex === -1) {
    return units; // No empty slot
  }

  // Find the weakest unit's bonus points
  const weakestBonus = Math.min(...activeUnits.map(u => u.bonusPoints)) as 0 | 1 | 2 | 3;

  // Create the free bonus unit
  const bonusUnit: Unit = {
    id: createUnitId(`unit-${playerId}-${commanderId}-free-${unitIndex}`),
    troopType,
    bonusPoints: weakestBonus,
    commanderId: createCommanderId(commanderId),
    slotIndex: emptySlotIndex as 0 | 1 | 2 | 3,
    status: 'active',
  };

  // Create new units array with the bonus unit
  const newUnits = [...units];
  newUnits[emptySlotIndex] = bonusUnit;
  
  return newUnits;
}

/**
 * Build a commander from configuration
 */
function buildCommander(
  playerId: PlayerId,
  commanderIndex: number,
  config: CommanderBuildConfig,
  position: { x: number; y: number },
  applyBonusUnit: boolean = true
): Commander {
  const commanderId = createCommanderId(`cmd-${playerId}-${commanderIndex}`);
  
  // Build units
  let units: (Unit | null)[] = config.slots.map((slot, slotIdx) => 
    buildUnit(playerId, commanderId, slotIdx, slot, 0)
  );

  // Apply free bonus unit rule if enabled
  if (applyBonusUnit) {
    units = applyFreeBonusUnit(units, config.troopType, commanderId, playerId, commanderIndex);
  }

  // Update troop type on all units
  units = units.map(u => 
    u ? { ...u, troopType: config.troopType } : null
  );

  return {
    id: commanderId,
    type: config.troopType,
    position,
    health: COMMANDER_MAX_HEALTH,
    playerId,
    units,
    isKing: config.type === 'king',
    hasActedThisTurn: false,
  };
}

/**
 * Build a complete army from configuration
 * 
 * @param playerId - The player ID
 * @param config - Army configuration
 * @param positions - Starting positions for commanders (must match commander count)
 * @param applyBonusUnits - Whether to apply the free bonus unit rule (default: true)
 * @returns Array of built commanders
 * @throws Error if validation fails
 */
export function buildArmy(
  playerId: PlayerId,
  config: ArmyConfig,
  positions: readonly { x: number; y: number }[],
  applyBonusUnits: boolean = true,
  budget: number = DEFAULT_STARTING_BUDGET
): Commander[] {
  // Validate with the provided budget
  const validation = validateArmyConfig(config, budget);
  if (!validation.valid) {
    throw new Error(`Invalid army configuration: ${validation.errors.join(', ')}`);
  }

  if (positions.length < config.commanders.length) {
    throw new Error(`Not enough positions: need ${config.commanders.length}, have ${positions.length}`);
  }

  // Build commanders
  const commanders: Commander[] = [];
  for (let i = 0; i < config.commanders.length; i++) {
    const commander = buildCommander(
      playerId,
      i,
      config.commanders[i],
      positions[i],
      applyBonusUnits
    );
    commanders.push(commander);
  }

  return commanders;
}

// ============================================================================
// PRESET ARMIES
// ============================================================================

/**
 * Default army configuration (fits within 20 gold budget)
 * - 1 King (Infantry) with units: 0,0,0,0
 * - 1 Infantry Captain with units: 0,0,1
 * - 1 Cavalry Captain with units: 0,0,1
 * - 1 Archer Captain with units: 0,0,1
 * 
 * Total cost: King (free) + 3 Captains * 1 = 3 gold
 *             + 10 units * 1 = 10 gold
 *             + 3 bonus points = 3 gold
 *             = 16 gold total (within 20 gold budget)
 */
export function getDefaultArmyConfig(): ArmyConfig {
  const createCaptainConfig = (troopType: TroopType): CommanderBuildConfig => ({
    type: 'captain',
    troopType,
    slots: [
      { hasUnit: true, bonusPoints: 0 },
      { hasUnit: true, bonusPoints: 0 },
      { hasUnit: true, bonusPoints: 1 },
      { hasUnit: false, bonusPoints: 0 },
    ],
  });

  return {
    commanders: [
      {
        type: 'king',
        troopType: 'infantry',
        slots: [
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: true, bonusPoints: 0 },
        ],
      },
      createCaptainConfig('infantry'),
      createCaptainConfig('cavalry'),
      createCaptainConfig('archer'),
    ],
  };
}

/**
 * Calculate the cost of the default army
 */
export function getDefaultArmyCost(): ArmyCostBreakdown {
  return calculateArmyCost(getDefaultArmyConfig());
}

/**
 * Create a minimal army configuration (for testing)
 * - 1 King with 2 units
 */
export function getMinimalArmyConfig(): ArmyConfig {
  return {
    commanders: [
      {
        type: 'king',
        troopType: 'infantry',
        slots: [
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: false, bonusPoints: 0 },
          { hasUnit: false, bonusPoints: 0 },
        ],
      },
    ],
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create an empty commander configuration
 */
export function createEmptyCommanderConfig(
  type: CommanderBuilderType,
  troopType: TroopType
): CommanderBuildConfig {
  return {
    type,
    troopType,
    slots: [
      { hasUnit: false, bonusPoints: 0 },
      { hasUnit: false, bonusPoints: 0 },
      { hasUnit: false, bonusPoints: 0 },
      { hasUnit: false, bonusPoints: 0 },
    ],
  };
}

/**
 * Add a unit to a commander configuration
 * Returns a new config with the unit added, or null if no space
 */
export function addUnitToCommanderConfig(
  config: CommanderBuildConfig,
  bonusPoints: 0 | 1 | 2 | 3
): CommanderBuildConfig | null {
  const emptySlotIndex = config.slots.findIndex(s => !s.hasUnit);
  
  if (emptySlotIndex === -1) {
    return null; // No empty slots
  }

  const newSlots = [...config.slots];
  newSlots[emptySlotIndex] = { hasUnit: true, bonusPoints };

  return {
    ...config,
    slots: newSlots,
  };
}

/**
 * Remove a unit from a commander configuration
 */
export function removeUnitFromCommanderConfig(
  config: CommanderBuildConfig,
  slotIndex: number
): CommanderBuildConfig {
  const newSlots = [...config.slots];
  newSlots[slotIndex] = { hasUnit: false, bonusPoints: 0 };

  return {
    ...config,
    slots: newSlots,
  };
}

/**
 * Change a unit's bonus points in a commander configuration
 */
export function setUnitBonusPoints(
  config: CommanderBuildConfig,
  slotIndex: number,
  bonusPoints: 0 | 1 | 2 | 3
): CommanderBuildConfig {
  if (slotIndex < 0 || slotIndex >= config.slots.length) {
    return config;
  }

  const newSlots = [...config.slots];
  newSlots[slotIndex] = { 
    ...newSlots[slotIndex], 
    bonusPoints 
  };

  return {
    ...config,
    slots: newSlots,
  };
}
