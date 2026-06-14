/**
 * packages/game-core/src/game.ts
 *
 * Game state initialization and turn management
 *
 * Provides:
 * - Game creation with player setup
 * - Turn management and player cycling
 * - Victory condition checking
 * - Game state transitions (setup → active → finished)
 */

import {
  GameState,
  GameConfig,
  GameStatus,
  PlayerId,
  CommanderId,
  UnitId,
  BannerId,
  TroopType,
  Position,
  Player,
  Commander,
  Unit,
  Banner,
  Action,
  createGameId,
  createPlayerId,
  createCommanderId,
  createUnitId,
  createBannerId,
  COMMANDER_SLOTS,
  COMMANDER_MAX_HEALTH,
} from './types';
import { createEmptyBoard } from './board';
import { GameRuleError, GameErrorCode } from './errors';

/**
 * Create a new game with specified players
 *
 * Initializes:
 * - Empty 24×24 board
 * - Players with initial commanders
 * - First player as active
 * - Game status as 'setup'
 *
 * @param config - Game configuration with players
 * @returns New GameState in 'setup' status
 * @throws GameRuleError if configuration is invalid
 *
 * @example
 * const config: GameConfig = {
 *   players: [
 *     { name: 'Player 1', color: '#FF0000' },
 *     { name: 'Player 2', color: '#0000FF' }
 *   ]
 * };
 * const game = createGame(config);
 */
export function createGame(config: GameConfig): GameState {
  if (!config.players || config.players.length < 2 || config.players.length > 4) {
    throw new GameRuleError(
      'Game must have 2-4 players',
      GameErrorCode.INVALID_POSITION,
      { playerCount: config.players?.length }
    );
  }

  // Create players, commanders, and banners
  const players: Player[] = [];
  const commandersMap = new Map<CommanderId, Commander>();
  const unitsMap = new Map<UnitId, Unit>();
  const bannersMap = new Map<BannerId, Banner>();

  for (let pIdx = 0; pIdx < config.players.length; pIdx++) {
    const playerConfig = config.players[pIdx];
    const playerId = createPlayerId(`player-${pIdx}`);

    // Create 6 commanders per player: 1 King, 5 regular
    // Per Spec 003: 3 Infantry, 1 Cavalry, 2 Archers, King has Cavalry units (blue)
    const commanders: CommanderId[] = [];
    const commanderTypes: TroopType[] = [
      'cavalry',   // King (index 0) - has cavalry units (blue)
      'infantry',  // Regular infantry
      'infantry',  // Regular infantry
      'cavalry',   // Cavalry
      'archer',    // Archer
      'archer',    // Archer
    ];

    for (let cIdx = 0; cIdx < 6; cIdx++) {
      const commanderId = createCommanderId(`commander-${pIdx}-${cIdx}`);
      commanders.push(commanderId);

      const isKing = cIdx === 0;  // First commander is the King
      const troopType = commanderTypes[cIdx];

      // Create units for this commander per Spec 003
      // King: 0, 0, 0, 0 (all 4 units have bonusPoints 0)
      // Normal: 0, 0, 1, 3 (two with 0, one with 1, one with 3)
      // First regular infantry (cIdx === 1) has only 2 units
      const units: (Unit | null)[] = [];
      const isTwoUnitInfantry = !isKing && troopType === 'infantry' && cIdx === 1;
      // First archer (cIdx === 4) gets bonusValues [0, 2, 1, 3] - one 0 changed to 2
      const isFirstArcher = !isKing && troopType === 'archer' && cIdx === 4;
      const bonusValues: (0 | 1 | 2 | 3)[] = isKing
        ? [0, 0, 0, 0]
        : isFirstArcher
          ? [0, 2, 1, 3]
          : [0, 0, 1, 3];

      for (let slotIdx = 0; slotIdx < COMMANDER_SLOTS; slotIdx++) {
        // First regular infantry has only 2 units (slots 0 and 1)
        if (isTwoUnitInfantry && slotIdx >= 2) {
          units.push(null);
          continue;
        }

        const unitId = createUnitId(`unit-${pIdx}-${cIdx}-${slotIdx}`);
        const unit: Unit = {
          id: unitId,
          troopType,
          bonusPoints: bonusValues[slotIdx],
          commanderId,
          slotIndex: slotIdx as 0 | 1 | 2 | 3,
          status: 'active',
        };
        unitsMap.set(unitId, unit);
        units.push(unit);
      }

      const commander: Commander = {
        id: commanderId,
        type: troopType,
        position: getInitialCommanderPosition(pIdx, cIdx),
        health: COMMANDER_MAX_HEALTH,
        playerId,
        units,
        isKing,
        hasActedThisTurn: false,  // Per Spec 004: reset at turn start
      };

      commandersMap.set(commanderId, commander);
    }

    // Create 1 banner per player
    const bannerId = createBannerId(`banner-${pIdx}`);
    const banner: Banner = {
      id: bannerId,
      playerId,
      position: getInitialBannerPosition(pIdx),
      status: 'standing',
    };
    bannersMap.set(bannerId, banner);

    const player: Player = {
      id: playerId,
      name: playerConfig.name,
      color: playerConfig.color,
      commanders,
      score: 0,
      isActive: pIdx === 0,  // First player is active initially
    };

    players.push(player);
  }

  const gameState: GameState = {
    id: createGameId('game-1'),
    board: createEmptyBoard(),
    players,
    commanders: commandersMap,
    units: unitsMap,
    banners: bannersMap,
    activePlayerId: players[0].id,
    turnNumber: 0,
    gameStatus: 'setup',
    log: [],
  };

  return gameState;
}

/**
 * Calculate initial position for a commander based on player and commander index
 *
 * Positions per Spec 003 (0-indexed):
 * Player 1: (9,8), (10,8), (11,8), (13,8), (14,8), (15,8)
 * Player 2: (9,15), (10,15), (11,15), (13,15), (14,15), (15,15)
 *
 * @param playerIndex - Player number (0-3)
 * @param commanderIndex - Commander number within player (0-5)
 * @returns Initial position for commander
 */
function getInitialCommanderPosition(playerIndex: number, commanderIndex: number): Position {
  const positions: Record<number, Position[]> = {
    0: [
      { x: 10, y: 8 },   // King position (will be assigned to first commander)
      { x: 11, y: 8 },
      { x: 12, y: 8 },
      { x: 10, y: 9 },
      { x: 11, y: 9 },
      { x: 12, y: 9 },
    ],  // Player 1 - 2 rows, 3 columns (compact formation)
    1: [
      { x: 10, y: 14 },  // King position
      { x: 11, y: 14 },
      { x: 12, y: 14 },
      { x: 10, y: 15 },
      { x: 11, y: 15 },
      { x: 12, y: 15 },
    ],  // Player 2 - 2 rows, 3 columns (compact formation)
  };

  const playerPositions = positions[playerIndex] ?? positions[0];
  return playerPositions[commanderIndex] ?? playerPositions[0];
}

/**
 * Calculate initial position for a banner based on player index
 *
 * Positions per Spec 003 (0-indexed):
 * Player 1: (12, 8)
 * Player 2: (12, 15)
 *
 * @param playerIndex - Player number (0-3)
 * @returns Initial position for banner
 */
function getInitialBannerPosition(playerIndex: number): Position {
  const positions: Record<number, Position> = {
    0: { x: 13, y: 8 },   // Player 1 - behind the commander formation
    1: { x: 13, y: 14 },  // Player 2 - behind the commander formation
  };

  return positions[playerIndex] ?? { x: 13, y: 8 };
}

/**
 * Transition game from 'setup' to 'active' status
 *
 * Sets initial turn number to 1 and logs game start action.
 *
 * @param state - Current game state in 'setup' status
 * @returns New game state with status 'active'
 * @throws GameRuleError if not in setup status
 */
export function startGame(state: GameState): GameState {
  if (state.gameStatus !== 'setup') {
    throw new GameRuleError(
      'Game is not in setup status',
      GameErrorCode.GAME_NOT_ACTIVE,
      { status: state.gameStatus }
    );
  }

  const action: Action = {
    type: 'gameStart',
    playerId: state.activePlayerId,
    timestamp: Date.now(),
    details: { turnNumber: 1 },
  };

  return {
    ...state,
    gameStatus: 'active',
    turnNumber: 1,
    log: [...state.log, action],
  };
}

/**
 * End current player's turn and advance to next player
 *
 * - Cycles activePlayerId to next player
 * - Increments turn counter when all players have acted
 * - Logs end turn action
 * - Checks victory conditions
 *
 * @param state - Current game state in 'active' status
 * @returns New game state with next player active
 * @throws GameRuleError if game not active
 */
export function endTurn(state: GameState): GameState {
  if (state.gameStatus !== 'active') {
    throw new GameRuleError(
      'Game is not active',
      GameErrorCode.GAME_NOT_ACTIVE,
      { status: state.gameStatus }
    );
  }

  const currentPlayerIndex = state.players.findIndex((p) => p.id === state.activePlayerId);
  if (currentPlayerIndex === -1) {
    throw new GameRuleError(
      'Active player not found',
      GameErrorCode.INVALID_POSITION,
      { playerId: state.activePlayerId }
    );
  }

  // Determine next player
  const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextPlayerIndex];

  // Increment turn if we've cycled back to player 0
  // Per Spec 004: Reset hasActedThisTurn for all commanders at turn end
  const isNewRound = nextPlayerIndex === 0;
  let newTurnNumber = state.turnNumber;
  
  if (isNewRound) {
    newTurnNumber += 1;
  }

  // Update player active status and reset commander action state if new round
  const updatedPlayers = state.players.map((p, idx) => ({
    ...p,
    isActive: idx === nextPlayerIndex,
  }));

  // Reset hasActedThisTurn for all commanders at the end of each full round
  const updatedCommanders = isNewRound
    ? new Map(
        Array.from(state.commanders.entries()).map(([id, cmd]) => [
          id,
          { ...cmd, hasActedThisTurn: false },
        ])
      )
    : state.commanders;

  const action: Action = {
    type: 'endTurn',
    playerId: state.activePlayerId,
    timestamp: Date.now(),
    details: { nextPlayerId: nextPlayer.id, newRound: isNewRound },
  };

  const newState: GameState = {
    ...state,
    activePlayerId: nextPlayer.id,
    turnNumber: newTurnNumber,
    players: updatedPlayers,
    commanders: updatedCommanders,
    log: [...state.log, action],
  };

  // Check victory conditions
  return checkAndApplyVictoryConditions(newState);
}

/**
 * Get the currently active player
 *
 * @param state - Current game state
 * @returns Player object for activePlayerId
 * @throws GameRuleError if activePlayerId invalid
 */
export function getCurrentPlayer(state: GameState): Player {
  const player = state.players.find((p) => p.id === state.activePlayerId);
  if (!player) {
    throw new GameRuleError(
      'Active player not found',
      GameErrorCode.INVALID_POSITION,
      { playerId: state.activePlayerId }
    );
  }
  return player;
}

/**
 * Get game winner if game finished
 *
 * @param state - Current game state
 * @returns Winner player or undefined if game still active
 */
export function getWinner(state: GameState): Player | undefined {
  if (state.gameStatus !== 'finished' || !state.winner) {
    return undefined;
  }

  return state.players.find((p) => p.id === state.winner);
}

/**
 * Get the reason the game finished (if it has)
 *
 * @param state - Current game state
 * @returns { finished: boolean, reason?: string }
 */
export function getGameFinishReason(
  state: GameState
): { finished: boolean; reason?: 'king_defeated' | 'banner_captured' | 'stalemate' } {
  if (state.gameStatus !== 'finished') {
    return { finished: false };
  }

  const lastAction = state.log[state.log.length - 1];
  if (lastAction?.type === 'gameEnd') {
    const details = lastAction.details as { reason?: 'king_defeated' | 'banner_captured' | 'stalemate' };
    return { finished: true, reason: details.reason };
  }

  return { finished: true };
}

/**
 * Check and apply victory conditions
 *
 * Victory conditions per Spec 003/005:
 * 1. King defeated (health ≤ 0) - player loses immediately
 * 2. Banner captured (status === 'captured') - player loses immediately
 *
 * Updates game state to 'finished' if condition met.
 *
 * @param state - Current game state
 * @returns New game state with finished status if victory condition met
 */
export function checkAndApplyVictoryConditions(state: GameState): GameState {
  // Check for defeated kings or captured banners
  const defeatedPlayers: PlayerId[] = [];
  const defeatReasons: Map<PlayerId, 'king_defeated' | 'banner_captured'> = new Map();

  for (const player of state.players) {
    // Check if king is defeated
    for (const commanderId of player.commanders) {
      const commander = state.commanders.get(commanderId);
      if (!commander) continue;

      if (commander.isKing && commander.health <= 0) {
        defeatedPlayers.push(player.id);
        defeatReasons.set(player.id, 'king_defeated');
        break;
      }
    }

    // Check if banner is captured
    if (!defeatedPlayers.includes(player.id)) {
      for (const banner of state.banners.values()) {
        if (banner.playerId === player.id && banner.status === 'captured') {
          defeatedPlayers.push(player.id);
          defeatReasons.set(player.id, 'banner_captured');
          break;
        }
      }
    }
  }

  if (defeatedPlayers.length > 0) {
    // Find surviving players (winners)
    const winners = state.players.filter((p) => !defeatedPlayers.includes(p.id));

    if (winners.length === 1) {
      const winnerId = winners[0].id;
      const defeatedPlayerId = defeatedPlayers[0];
      const reason = defeatReasons.get(defeatedPlayerId) ?? 'king_defeated';

      const action: Action = {
        type: 'gameEnd',
        playerId: winnerId,
        timestamp: Date.now(),
        details: { reason, winner: winnerId },
      };

      return {
        ...state,
        gameStatus: 'finished',
        winner: winnerId,
        log: [...state.log, action],
      };
    }
  }

  return state;
}
