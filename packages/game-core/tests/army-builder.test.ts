/**
 * packages/game-core/tests/army-builder.test.ts
 *
 * Tests for the army builder system
 */

import {
  calculateArmyCost,
  validateArmyConfig,
  buildArmy,
  getDefaultArmyConfig,
  getDefaultArmyCost,
  getMinimalArmyConfig,
  createEmptyCommanderConfig,
  addUnitToCommanderConfig,
  removeUnitFromCommanderConfig,
  setUnitBonusPoints,
  ARMY_BUILDER_COSTS,
  DEFAULT_STARTING_BUDGET,
} from '../src/army-builder';
import { createPlayerId, TroopType } from '../src/types';

describe('Army Builder', () => {
  const testPlayerId = createPlayerId('test-player');

  describe('Cost Calculation', () => {
    test('calculateArmyCost returns correct breakdown for default army', () => {
      const config = getDefaultArmyConfig();
      const cost = calculateArmyCost(config);

      // Default army: 1 King (free) + 3 Captains (3 gold)
      // Units: 13 units total (King: 4, 3 Captains: 3 each = 9)
      expect(cost.commanderCosts).toBe(3);
      expect(cost.unitCosts).toBe(13);
      expect(cost.bonusPointCosts).toBeGreaterThan(0);
      expect(cost.totalCost).toBe(cost.commanderCosts + cost.unitCosts + cost.bonusPointCosts);
      expect(cost.totalCost).toBeLessThanOrEqual(DEFAULT_STARTING_BUDGET);
    });

    test('calculateArmyCost with free bonus units', () => {
      // Create a config with a commander that has exactly 3 units
      const config = {
        commanders: [
          {
            type: 'king' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 1 as const },
              { hasUnit: true, bonusPoints: 2 as const },
              { hasUnit: true, bonusPoints: 3 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };

      const cost = calculateArmyCost(config, true);
      expect(cost.freeBonusUnits).toBe(1); // Should have 1 free bonus unit
    });

    test('captain commander costs 1 gold', () => {
      const config = {
        commanders: [
          {
            type: 'king' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
          {
            type: 'captain' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };

      const cost = calculateArmyCost(config);
      expect(cost.commanderCosts).toBe(ARMY_BUILDER_COSTS.captain);
    });

    test('king commander is free', () => {
      const config = {
        commanders: [
          {
            type: 'king' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };

      const cost = calculateArmyCost(config);
      expect(cost.commanderCosts).toBe(0);
    });

    test('each unit costs 1 gold', () => {
      const config = {
        commanders: [
          {
            type: 'king' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 0 as const },
              { hasUnit: true, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };

      const cost = calculateArmyCost(config);
      expect(cost.unitCosts).toBe(2); // 2 units
    });

    test('each bonus point costs 1 gold', () => {
      const config = {
        commanders: [
          {
            type: 'king' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 0 as const },
              { hasUnit: true, bonusPoints: 1 as const },
              { hasUnit: true, bonusPoints: 2 as const },
              { hasUnit: true, bonusPoints: 3 as const },
            ],
          },
        ],
      };

      const cost = calculateArmyCost(config);
      expect(cost.bonusPointCosts).toBe(6); // 0+1+2+3 = 6
    });
  });

  describe('Validation', () => {
    test('validateArmyConfig requires exactly one king', () => {
      const noKingConfig = {
        commanders: [
          {
            type: 'captain' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };

      const validation = validateArmyConfig(noKingConfig, DEFAULT_STARTING_BUDGET);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Army must have exactly one King (no King found)');
    });

    test('validateArmyConfig rejects multiple kings', () => {
      const multiKingConfig = {
        commanders: [
          {
            type: 'king' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
          {
            type: 'king' as const,
            troopType: 'cavalry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };

      const validation = validateArmyConfig(multiKingConfig, DEFAULT_STARTING_BUDGET);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('exactly one King'))).toBe(true);
    });

    test('validateArmyConfig checks budget limit', () => {
      const expensiveConfig = {
        commanders: [
          {
            type: 'king' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 3 as const },
              { hasUnit: true, bonusPoints: 3 as const },
              { hasUnit: true, bonusPoints: 3 as const },
              { hasUnit: true, bonusPoints: 3 as const },
            ],
          },
          ...Array(10).fill(null).map(() => ({
            type: 'captain' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 3 as const },
              { hasUnit: true, bonusPoints: 3 as const },
              { hasUnit: true, bonusPoints: 3 as const },
              { hasUnit: true, bonusPoints: 3 as const },
            ],
          })),
        ],
      };

      const validation = validateArmyConfig(expensiveConfig, 10);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('exceeds budget'))).toBe(true);
    });

    test('default army passes validation', () => {
      const config = getDefaultArmyConfig();
      const validation = validateArmyConfig(config, DEFAULT_STARTING_BUDGET);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('validateArmyConfig calculates remaining budget', () => {
      const minimalConfig = getMinimalArmyConfig();
      const validation = validateArmyConfig(minimalConfig, DEFAULT_STARTING_BUDGET);
      expect(validation.remainingBudget).toBeGreaterThan(0);
    });
  });

  describe('Army Building', () => {
    test('buildArmy creates commanders with correct structure', () => {
      const config = getMinimalArmyConfig();
      const positions = [{ x: 10, y: 10 }];
      
      const commanders = buildArmy(testPlayerId, config, positions);
      
      expect(commanders).toHaveLength(1);
      expect(commanders[0].isKing).toBe(true);
      expect(commanders[0].playerId).toBe(testPlayerId);
      expect(commanders[0].units).toHaveLength(4);
    });

    test('buildArmy applies free bonus unit rule', () => {
      // Config with 3 units - should get a 4th for free
      const config = {
        commanders: [
          {
            type: 'king' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 1 as const },
              { hasUnit: true, bonusPoints: 2 as const },
              { hasUnit: true, bonusPoints: 3 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };

      const positions = [{ x: 10, y: 10 }];
      const commanders = buildArmy(testPlayerId, config, positions, true);
      
      const activeUnits = commanders[0].units.filter(u => u !== null);
      expect(activeUnits).toHaveLength(4); // 3 paid + 1 free
      
      // The free unit should have strength equal to the weakest (1)
      const weakestUnit = activeUnits.find(u => u!.bonusPoints === 1);
      expect(weakestUnit).toBeDefined();
    });

    test('buildArmy throws on invalid config', () => {
      const invalidConfig = {
        commanders: [
          {
            type: 'captain' as const, // No king!
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: true, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };

      expect(() => buildArmy(testPlayerId, invalidConfig, [{ x: 10, y: 10 }])).toThrow();
    });

    test('buildArmy throws when not enough positions', () => {
      const config = getMinimalArmyConfig();
      // Add a captain to make it require 2 positions
      const configWithTwoCommanders = {
        commanders: [
          ...config.commanders,
          {
            type: 'captain' as const,
            troopType: 'infantry' as TroopType,
            slots: [
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
              { hasUnit: false, bonusPoints: 0 as const },
            ],
          },
        ],
      };
      expect(() => buildArmy(testPlayerId, configWithTwoCommanders, [{ x: 10, y: 10 }])).toThrow('Not enough positions');
    });
  });

  describe('Utility Functions', () => {
    test('createEmptyCommanderConfig creates empty commander', () => {
      const config = createEmptyCommanderConfig('captain', 'cavalry');
      
      expect(config.type).toBe('captain');
      expect(config.troopType).toBe('cavalry');
      expect(config.slots).toHaveLength(4);
      expect(config.slots.every(s => !s.hasUnit)).toBe(true);
    });

    test('addUnitToCommanderConfig adds unit to first empty slot', () => {
      const config = createEmptyCommanderConfig('captain', 'infantry');
      const updated = addUnitToCommanderConfig(config, 2);
      
      expect(updated).not.toBeNull();
      expect(updated!.slots[0].hasUnit).toBe(true);
      expect(updated!.slots[0].bonusPoints).toBe(2);
    });

    test('addUnitToCommanderConfig returns null when full', () => {
      const fullConfig: ReturnType<typeof createEmptyCommanderConfig> = {
        type: 'captain',
        troopType: 'infantry',
        slots: [
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: true, bonusPoints: 0 },
        ],
      };
      
      const updated = addUnitToCommanderConfig(fullConfig, 1);
      expect(updated).toBeNull();
    });

    test('removeUnitFromCommanderConfig removes unit', () => {
      const config: ReturnType<typeof createEmptyCommanderConfig> = {
        type: 'captain',
        troopType: 'infantry',
        slots: [
          { hasUnit: true, bonusPoints: 2 },
          { hasUnit: false, bonusPoints: 0 },
          { hasUnit: false, bonusPoints: 0 },
          { hasUnit: false, bonusPoints: 0 },
        ],
      };
      
      const updated = removeUnitFromCommanderConfig(config, 0);
      expect(updated.slots[0].hasUnit).toBe(false);
      expect(updated.slots[0].bonusPoints).toBe(0);
    });

    test('setUnitBonusPoints changes bonus points', () => {
      const config: ReturnType<typeof createEmptyCommanderConfig> = {
        type: 'captain',
        troopType: 'infantry',
        slots: [
          { hasUnit: true, bonusPoints: 0 },
          { hasUnit: false, bonusPoints: 0 },
          { hasUnit: false, bonusPoints: 0 },
          { hasUnit: false, bonusPoints: 0 },
        ],
      };
      
      const updated = setUnitBonusPoints(config, 0, 3);
      expect(updated.slots[0].bonusPoints).toBe(3);
    });
  });

  describe('Default Configurations', () => {
    test('getDefaultArmyConfig returns valid config', () => {
      const config = getDefaultArmyConfig();
      
      expect(config.commanders).toHaveLength(4);
      
      const kingCount = config.commanders.filter(c => c.type === 'king').length;
      expect(kingCount).toBe(1);
      
      const captainCount = config.commanders.filter(c => c.type === 'captain').length;
      expect(captainCount).toBe(3);
    });

    test('getDefaultArmyCost returns consistent values', () => {
      const cost1 = getDefaultArmyCost();
      const cost2 = getDefaultArmyCost();
      
      expect(cost1.totalCost).toBe(cost2.totalCost);
      expect(cost1.commanderCosts).toBe(3); // 3 captains
      expect(cost1.unitCosts).toBe(13); // 13 units total (King 4 + 3 Captains x 3)
      expect(cost1.totalCost).toBeLessThanOrEqual(DEFAULT_STARTING_BUDGET);
    });

    test('getMinimalArmyConfig has only king', () => {
      const config = getMinimalArmyConfig();
      
      expect(config.commanders).toHaveLength(1);
      expect(config.commanders[0].type).toBe('king');
    });
  });
});
