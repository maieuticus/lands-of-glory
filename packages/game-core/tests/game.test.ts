/**
 * packages/game-core/tests/game.test.ts
 *
 * Tests for game initialization and state management
 * Based on Spec 003 Given/When/Then test cases
 */

import {
  createGame,
  startGame,
  endTurn,
  getCurrentPlayer,
  getWinner,
  GameConfig,
  TroopType,
} from '../src';

describe('Game Initialization', () => {
  const defaultConfig: GameConfig = {
    players: [
      { name: 'Player 1', color: '#FF0000' },
      { name: 'Player 2', color: '#0000FF' },
    ],
  };

  describe('Testfall 1: Commander steht auf dem Brett', () => {
    it('should create commanders with valid positions', () => {
      const game = createGame(defaultConfig);

      for (const player of game.players) {
        for (const commanderId of player.commanders) {
          const commander = game.commanders.get(commanderId);
          expect(commander).toBeDefined();
          expect(commander!.position).toBeDefined();
          expect(typeof commander!.position.x).toBe('number');
          expect(typeof commander!.position.y).toBe('number');
        }
      }
    });
  });

  describe('Testfall 2: Unit steht nicht frei auf dem Brett', () => {
    it('should have units only in commander slots with commanderId and slotIndex', () => {
      const game = createGame(defaultConfig);

      for (const commander of game.commanders.values()) {
        for (let slotIndex = 0; slotIndex < 4; slotIndex++) {
          const unit = commander.units[slotIndex];
          if (unit) {
            expect(unit.commanderId).toBe(commander.id);
            expect(unit.slotIndex).toBe(slotIndex);
            expect(unit.status).toBe('active');
          }
        }
      }
    });
  });

  describe('Testfall 3: Commander hat vier Slots', () => {
    it('should have exactly four unit slots per commander', () => {
      const game = createGame(defaultConfig);

      for (const commander of game.commanders.values()) {
        expect(commander.units).toHaveLength(4);
      }
    });
  });

  describe('Testfall 4: Slot enthält maximal eine Unit', () => {
    it('should have at most one unit per slot', () => {
      const game = createGame(defaultConfig);

      for (const commander of game.commanders.values()) {
        for (const unit of commander.units) {
          if (unit !== null) {
            expect(typeof unit.id).toBe('string');
          }
        }
      }
    });
  });

  describe('Testfall 5: Einheitliche Truppengattung', () => {
    it('should have all units with same troopType as their commander', () => {
      const game = createGame(defaultConfig);

      for (const commander of game.commanders.values()) {
        for (const unit of commander.units) {
          if (unit) {
            expect(unit.troopType).toBe(commander.type);
          }
        }
      }
    });
  });

  describe('Testfall 7: König ist Commander', () => {
    it('should have king as commander with isKing flag', () => {
      const game = createGame(defaultConfig);

      for (const player of game.players) {
        let foundKing = false;
        for (const commanderId of player.commanders) {
          const commander = game.commanders.get(commanderId);
          if (commander!.isKing) {
            foundKing = true;
            expect(commander!.type).toBe('infantry');
          }
        }
        expect(foundKing).toBe(true);
      }
    });
  });

  describe('Testfall 10: Banner ist kein Commander', () => {
    it('should have separate Banner type with ownerId, position and status', () => {
      const game = createGame(defaultConfig);

      expect(game.banners.size).toBe(2); // One per player

      for (const banner of game.banners.values()) {
        expect(banner.playerId).toBeDefined();
        expect(banner.position).toBeDefined();
        expect(banner.status).toBe('standing');
      }
    });
  });

  describe('Testfall 15 & 16: Startzustand Player 1 und 2', () => {
    it('should have 6 commanders per player', () => {
      const game = createGame(defaultConfig);

      for (const player of game.players) {
        expect(player.commanders).toHaveLength(6);
      }
    });

    it('should have 1 banner per player', () => {
      const game = createGame(defaultConfig);

      for (const player of game.players) {
        const playerBanners = Array.from(game.banners.values()).filter(
          (b) => b.playerId === player.id
        );
        expect(playerBanners).toHaveLength(1);
      }
    });
  });

  describe('Testfall 17: König-Startausstattung', () => {
    it('should have king with 4 infantry units with bonusPoints 0,0,0,0', () => {
      const game = createGame(defaultConfig);

      for (const player of game.players) {
        for (const commanderId of player.commanders) {
          const commander = game.commanders.get(commanderId);
          if (commander!.isKing) {
            expect(commander!.type).toBe('infantry');
            const activeUnits = commander!.units.filter((u) => u !== null);
            expect(activeUnits).toHaveLength(4);
            const bonusValues = activeUnits.map((u) => u!.bonusPoints).sort();
            expect(bonusValues).toEqual([0, 0, 0, 0]);
          }
        }
      }
    });
  });

  describe('Testfall 18: Normale Commander-Startausstattung', () => {
    it('should have normal commanders with bonusPoints 0,0,1,3', () => {
      const game = createGame(defaultConfig);

      for (const player of game.players) {
        for (const commanderId of player.commanders) {
          const commander = game.commanders.get(commanderId);
          if (!commander!.isKing) {
            const activeUnits = commander!.units.filter((u) => u !== null);
            expect(activeUnits).toHaveLength(4);
            const bonusValues = activeUnits.map((u) => u!.bonusPoints).sort((a, b) => a - b);
            expect(bonusValues).toEqual([0, 0, 1, 3]);
          }
        }
      }
    });
  });

  describe('Commander Type Distribution', () => {
    it('should have 3 infantry, 1 cavalry, 2 archers per player', () => {
      const game = createGame(defaultConfig);

      for (const player of game.players) {
        const types: TroopType[] = [];
        for (const commanderId of player.commanders) {
          const commander = game.commanders.get(commanderId);
          types.push(commander!.type);
        }

        const infantryCount = types.filter((t) => t === 'infantry').length;
        const cavalryCount = types.filter((t) => t === 'cavalry').length;
        const archerCount = types.filter((t) => t === 'archer').length;

        expect(infantryCount).toBe(3); // Including king
        expect(cavalryCount).toBe(1);
        expect(archerCount).toBe(2);
      }
    });
  });
});

describe('Game State Management', () => {
  const defaultConfig: GameConfig = {
    players: [
      { name: 'Player 1', color: '#FF0000' },
      { name: 'Player 2', color: '#0000FF' },
    ],
  };

  describe('Game Status Transitions', () => {
    it('should start in setup status', () => {
      const game = createGame(defaultConfig);
      expect(game.gameStatus).toBe('setup');
    });

    it('should transition to active after startGame', () => {
      let game = createGame(defaultConfig);
      game = startGame(game);
      expect(game.gameStatus).toBe('active');
      expect(game.turnNumber).toBe(1);
    });
  });

  describe('Turn Management', () => {
    it('should track active player correctly', () => {
      let game = createGame(defaultConfig);
      game = startGame(game);

      const currentPlayer = getCurrentPlayer(game);
      expect(currentPlayer.id).toBe(game.activePlayerId);
    });

    it('should cycle to next player on endTurn', () => {
      let game = createGame(defaultConfig);
      game = startGame(game);

      const firstPlayerId = game.activePlayerId;
      game = endTurn(game);

      expect(game.activePlayerId).not.toBe(firstPlayerId);
    });

    it('should increment turn number after full round', () => {
      let game = createGame(defaultConfig);
      game = startGame(game);

      // End turn for player 1
      game = endTurn(game);
      expect(game.turnNumber).toBe(1); // Still turn 1

      // End turn for player 2 (full round completed)
      game = endTurn(game);
      expect(game.turnNumber).toBe(2); // Now turn 2
    });
  });

  describe('hasActedThisTurn Reset', () => {
    it('should reset hasActedThisTurn after full round', () => {
      let game = createGame(defaultConfig);
      game = startGame(game);

      // Mark all commanders as having acted
      const updatedCommanders = new Map(game.commanders);
      for (const [id, cmd] of updatedCommanders) {
        updatedCommanders.set(id, { ...cmd, hasActedThisTurn: true });
      }
      game = { ...game, commanders: updatedCommanders };

      // Complete a full round
      game = endTurn(game); // Player 2's turn
      game = endTurn(game); // Back to Player 1, new round

      // All commanders should be reset
      for (const commander of game.commanders.values()) {
        expect(commander.hasActedThisTurn).toBe(false);
      }
    });
  });

  describe('Victory Conditions', () => {
    it('should detect king defeat', () => {
      let game = createGame(defaultConfig);
      game = startGame(game);

      // Find player 1's king and defeat it
      const player1 = game.players[0];
      let kingId: string | undefined;
      for (const cmdId of player1.commanders) {
        const cmd = game.commanders.get(cmdId);
        if (cmd?.isKing) {
          kingId = cmdId;
          break;
        }
      }

      expect(kingId).toBeDefined();

      // Reduce king's health to 0
      const updatedCommanders = new Map(game.commanders);
      const king = updatedCommanders.get(kingId!)!;
      updatedCommanders.set(kingId!, { ...king, health: 0 });
      game = { ...game, commanders: updatedCommanders };

      // Trigger victory check via endTurn
      game = endTurn(game);

      // Check that game ended with player 2 as winner
      expect(game.gameStatus).toBe('finished');
      expect(game.winner).toBe(game.players[1].id);
    });

    it('should detect banner capture', () => {
      let game = createGame(defaultConfig);
      game = startGame(game);

      // Find player 1's banner and capture it
      const player1 = game.players[0];
      const banner = Array.from(game.banners.values()).find(
        (b) => b.playerId === player1.id
      )!;

      // Capture the banner
      const updatedBanners = new Map(game.banners);
      updatedBanners.set(banner.id, { ...banner, status: 'captured' });
      game = { ...game, banners: updatedBanners };

      // Trigger victory check via endTurn
      game = endTurn(game);

      // Check that game ended with player 2 as winner
      expect(game.gameStatus).toBe('finished');
      expect(game.winner).toBe(game.players[1].id);
    });
  });
});
