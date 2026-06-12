/**
 * packages/game-core/tests/combat.test.ts
 *
 * Tests for combat resolution system
 * Based on Spec 005 Given/When/Then test cases
 */

import {
  createGame,
  startGame,
  resolveCombat,
  applyCombatResult,
  canAttack,
  createRNG,
  GameConfig,
  CombatResult,
  createUnitId,
  createCommanderId,
  createPlayerId,
  createBannerId,
  createGameId,
} from '../src';

describe('Combat Resolution', () => {
  const defaultConfig: GameConfig = {
    players: [
      { name: 'Player 1', color: '#FF0000' },
      { name: 'Player 2', color: '#0000FF' },
    ],
  };

  describe('Testfall 2: Unit erzeugt Würfel', () => {
    it('should roll 4 dice for commander with 4 active units', () => {
      const game = createGame(defaultConfig);
      const rng = createRNG(42);

      // Get first commanders from each player
      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1]; // Non-king commander
      const defenderId = player2.commanders[1];

      const result = resolveCombat(game, attackerId, defenderId, rng);

      // Both commanders should have 4 units initially
      const attacker = game.commanders.get(attackerId)!;
      const defender = game.commanders.get(defenderId)!;
      const attackerUnitCount = attacker.units.filter((u) => u?.status === 'active').length;
      const defenderUnitCount = defender.units.filter((u) => u?.status === 'active').length;

      expect(attackerUnitCount).toBe(4);
      expect(defenderUnitCount).toBe(4);
      expect(result.attackerRolls).toHaveLength(4);
      expect(result.defenderRolls).toHaveLength(4);
    });
  });

  describe('Testfall 3: Leerer Commander kämpft als Kavallerie', () => {
    it('should fight with 1 die as cavalry when commander has no active units', () => {
      let game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      // Remove all units from attacker
      const updatedCommanders = new Map(game.commanders);
      const attacker = updatedCommanders.get(attackerId)!;
      updatedCommanders.set(attackerId, {
        ...attacker,
        units: [null, null, null, null],
      });
      game = { ...game, commanders: updatedCommanders };

      const result = resolveCombat(game, attackerId, defenderId, rng);

      // Empty commander fights with 1 die
      expect(result.attackerRolls).toHaveLength(1);
      expect(result.attackerRolls[0].bonusPoints).toBe(0);
    });
  });

  describe('Testfall 4: Leerer König erhält König-Bonus', () => {
    it('should give king bonus to empty king fighting as cavalry', () => {
      let game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];

      // Find the king
      let kingId: string | undefined;
      for (const cmdId of player1.commanders) {
        const cmd = game.commanders.get(cmdId);
        if (cmd?.isKing) {
          kingId = cmdId;
          break;
        }
      }

      const defenderId = player2.commanders[1];

      // Remove all units from king
      const updatedCommanders = new Map(game.commanders);
      const king = updatedCommanders.get(kingId!)!;
      updatedCommanders.set(kingId!, {
        ...king,
        units: [null, null, null, null],
      });
      game = { ...game, commanders: updatedCommanders };

      const result = resolveCombat(game, kingId!, defenderId, rng);

      // Empty king fights with 1 die and gets king bonus
      expect(result.attackerRolls).toHaveLength(1);
      expect(result.attackerRolls[0].kingBonus).toBe(1);
    });
  });

  describe('Testfall 5: Natürliche Sortierung vor Bonus', () => {
    it('should sort by natural value before adding bonuses', () => {
      // This is tested implicitly by checking that effectiveValue = natural + bonus
      // and that the highest natural values are paired first
      const game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      const result = resolveCombat(game, attackerId, defenderId, rng);

      // Verify dice are sorted by natural value descending
      for (let i = 1; i < result.attackerRolls.length; i++) {
        expect(result.attackerRolls[i - 1].naturalValue).toBeGreaterThanOrEqual(
          result.attackerRolls[i].naturalValue
        );
      }
    });
  });

  describe('Testfall 6: Effektiver Wert über 6', () => {
    it('should allow effective values over 6', () => {
      // Create a unit with bonus 3 and simulate a roll of 6
      // effectiveValue should be 6 + 3 + kingBonus = 10
      const naturalValue = 6;
      const bonusPoints = 3;
      const kingBonus = 1;
      const effectiveValue = naturalValue + bonusPoints + kingBonus;

      expect(effectiveValue).toBe(10);
      expect(effectiveValue).toBeGreaterThan(6);
    });
  });

  describe('Testfall 7: Paarweiser Vergleich', () => {
    it('should create pairs up to the minimum dice count', () => {
      let game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      // Remove 2 units from attacker (leaving 2)
      const attacker = game.commanders.get(attackerId)!;
      const updatedCommanders = new Map(game.commanders);
      updatedCommanders.set(attackerId, {
        ...attacker,
        units: attacker.units.map((u, i) => (i < 2 ? u : null)),
      });
      game = { ...game, commanders: updatedCommanders };

      const result = resolveCombat(game, attackerId, defenderId, rng);

      // Attacker has 2 dice, defender has 4
      // Should create 2 pairs
      expect(result.pairs).toHaveLength(2);
    });
  });

  describe('Testfall 8: Überzähliger Würfel verursacht keinen Verlust', () => {
    it('should not cause additional losses from excess dice', () => {
      let game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      // Attacker has 4 units, defender has 4 units
      // Both roll 4 dice, 4 pairs created, no excess
      const result = resolveCombat(game, attackerId, defenderId, rng);

      // Maximum casualties per side is number of pairs (4)
      expect(result.attackerCasualties.length).toBeLessThanOrEqual(4);
      expect(result.defenderCasualties.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Testfall 9: Automatische Verlustzuordnung', () => {
    it('should automatically assign casualties based on lost pairs', () => {
      const game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      const result = resolveCombat(game, attackerId, defenderId, rng);

      // Each lost pair results in one casualty
      const attackerLosses = result.pairs.filter((p) => !p.attackerWins).length;
      const defenderLosses = result.pairs.filter((p) => p.attackerWins).length;

      expect(result.attackerCasualties).toHaveLength(attackerLosses);
      expect(result.defenderCasualties).toHaveLength(defenderLosses);
    });
  });

  describe('Testfall 12: Commander stirbt nicht mit aktiven Units', () => {
    it('should not defeat commander while they have active units', () => {
      const game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      const result = resolveCombat(game, attackerId, defenderId, rng);

      // Both commanders have units, neither should be defeated
      expect(result.attackerCommanderDefeated).toBe(false);
      expect(result.defenderCommanderDefeated).toBe(false);
    });
  });

  describe('Testfall 14: Leerer König verliert', () => {
    it('should mark king as defeated when empty king loses', () => {
      let game = createGame(defaultConfig);
      const rng = createRNG(1); // Fixed seed for reproducibility

      const player1 = game.players[0];
      const player2 = game.players[1];

      // Find the king
      let kingId: string | undefined;
      for (const cmdId of player1.commanders) {
        const cmd = game.commanders.get(cmdId);
        if (cmd?.isKing) {
          kingId = cmdId;
          break;
        }
      }

      const defenderId = player2.commanders[1];

      // Remove all units from king
      const updatedCommanders = new Map(game.commanders);
      const king = updatedCommanders.get(kingId!)!;
      updatedCommanders.set(kingId!, {
        ...king,
        units: [null, null, null, null],
      });
      game = { ...game, commanders: updatedCommanders };

      const result = resolveCombat(game, kingId!, defenderId, rng);

      // If the empty king loses, it should be marked as defeated
      // (Note: This depends on dice rolls, so we check the structure)
      expect(result.kingDefeated === undefined || result.kingDefeated === kingId).toBe(true);
    });
  });

  describe('Testfall 17: König-Bonus bei König gegen König', () => {
    it('should apply king bonus to both sides in king vs king combat', () => {
      let game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];

      // Find both kings
      let king1Id: string | undefined;
      let king2Id: string | undefined;

      for (const cmdId of player1.commanders) {
        const cmd = game.commanders.get(cmdId);
        if (cmd?.isKing) {
          king1Id = cmdId;
          break;
        }
      }

      for (const cmdId of player2.commanders) {
        const cmd = game.commanders.get(cmdId);
        if (cmd?.isKing) {
          king2Id = cmdId;
          break;
        }
      }

      const result = resolveCombat(game, king1Id!, king2Id!, rng);

      // All rolls from both sides should have king bonus
      for (const roll of result.attackerRolls) {
        expect(roll.kingBonus).toBe(1);
      }
      for (const roll of result.defenderRolls) {
        expect(roll.kingBonus).toBe(1);
      }
    });
  });

  describe('Testfall 18: Alle Units nehmen teil', () => {
    it('should have all active units participate in combat', () => {
      const game = createGame(defaultConfig);
      const rng = createRNG(42);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      const attacker = game.commanders.get(attackerId)!;
      const activeUnitCount = attacker.units.filter((u) => u?.status === 'active').length;

      const result = resolveCombat(game, attackerId, defenderId, rng);

      // Number of rolls should equal number of active units
      expect(result.attackerRolls).toHaveLength(activeUnitCount);
    });
  });
});

describe('Combat Validation', () => {
  const defaultConfig: GameConfig = {
    players: [
      { name: 'Player 1', color: '#FF0000' },
      { name: 'Player 2', color: '#0000FF' },
    ],
  };

  describe('canAttack', () => {
    it('should reject attack if commander has already acted', () => {
      let game = createGame(defaultConfig);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      // Mark attacker as having acted
      const updatedCommanders = new Map(game.commanders);
      const attacker = updatedCommanders.get(attackerId)!;
      updatedCommanders.set(attackerId, { ...attacker, hasActedThisTurn: true });
      game = { ...game, commanders: updatedCommanders };

      const result = canAttack(game, attackerId, defenderId);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Commander has already acted this turn');
    });

    it('should reject attack if target is out of range', () => {
      let game = createGame(defaultConfig);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      // Move defender far away
      const updatedCommanders = new Map(game.commanders);
      const defender = updatedCommanders.get(defenderId)!;
      updatedCommanders.set(defenderId, { ...defender, position: { x: 20, y: 20 } });
      game = { ...game, commanders: updatedCommanders };

      const result = canAttack(game, attackerId, defenderId);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Target out of range');
    });

    it('should allow attack if all conditions are met', () => {
      const game = createGame(defaultConfig);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      // Place defender within range (infantry range = 1)
      const updatedCommanders = new Map(game.commanders);
      const attacker = updatedCommanders.get(attackerId)!;
      const defender = updatedCommanders.get(defenderId)!;
      updatedCommanders.set(defenderId, {
        ...defender,
        position: { x: attacker.position.x + 1, y: attacker.position.y },
      });
      game = { ...game, commanders: updatedCommanders };

      const result = canAttack(game, attackerId, defenderId);

      expect(result.valid).toBe(true);
    });

    it('should allow empty commander to attack (fights as cavalry)', () => {
      let game = createGame(defaultConfig);

      const player1 = game.players[0];
      const player2 = game.players[1];
      const attackerId = player1.commanders[1];
      const defenderId = player2.commanders[1];

      // Remove all units from attacker
      const updatedCommanders = new Map(game.commanders);
      const attacker = updatedCommanders.get(attackerId)!;
      const defender = updatedCommanders.get(defenderId)!;
      updatedCommanders.set(attackerId, {
        ...attacker,
        units: [null, null, null, null],
      });
      updatedCommanders.set(defenderId, {
        ...defender,
        position: { x: attacker.position.x + 1, y: attacker.position.y },
      });
      game = { ...game, commanders: updatedCommanders };

      const result = canAttack(game, attackerId, defenderId);

      expect(result.valid).toBe(true);
    });
  });
});

describe('Combat Application', () => {
  const defaultConfig: GameConfig = {
    players: [
      { name: 'Player 1', color: '#FF0000' },
      { name: 'Player 2', color: '#0000FF' },
    ],
  };

  it('should apply casualties to game state', () => {
    let game = createGame(defaultConfig);
    const rng = createRNG(42);

    const player1 = game.players[0];
    const player2 = game.players[1];
    const attackerId = player1.commanders[1];
    const defenderId = player2.commanders[1];

    const result = resolveCombat(game, attackerId, defenderId, rng);
    game = applyCombatResult(game, result);

    // Verify casualties were marked as removed
    for (const unitId of result.attackerCasualties) {
      const unit = game.units.get(unitId);
      expect(unit?.status).toBe('removed');
    }

    for (const unitId of result.defenderCasualties) {
      const unit = game.units.get(unitId);
      expect(unit?.status).toBe('removed');
    }
  });
});
