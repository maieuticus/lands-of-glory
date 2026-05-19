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
  Position,
  Player,
  Commander,
  Unit,
  Action,
  createGameId,
  createPlayerId,
  createCommanderId,
  createUnitId,
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

  // Create players and commanders
  const players: Player[] = [];
  const commandersMap = new Map<CommanderId, Commander>();
  const unitsMap = new Map<UnitId, Unit>();

  for (let pIdx = 0; pIdx < config.players.length; pIdx++) {
    const playerConfig = config.players[pIdx];
    const playerId = createPlayerId(`player-${pIdx}`);

    // Create 3 commanders per player: 1 King, 1 Banner, 1 regular
    const commanders: CommanderId[] = [];

    for (let cIdx = 0; cIdx < 3; cIdx++) {
      const commanderId = createCommanderId(`commander-${pIdx}-${cIdx}`);
      commanders.push(commanderId);

      let isKing = false;
      let isBanner = false;

      if (cIdx === 0) {
        isKing = true;
      }
      if (cIdx === 1) {
        isBanner = true;
      }

      const commander: Commander = {
        id: commanderId,
        type: 'cavalry',  // Default type
        position: getInitialCommanderPosition(pIdx, cIdx),
        health: COMMANDER_MAX_HEALTH,
        playerId,
        units: [null, null, null, null],  // 4 empty slots
        isKing,
        isBanner,
      };

      commandersMap.set(commanderId, commander);
    }

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
 * Positions are arranged in a circle around the board edges.
 *
 * @param playerIndex - Player number (0-3)
 * @param commanderIndex - Commander number within player (0-2)
 * @returns Initial position for commander
 */
function getInitialCommanderPosition(playerIndex: number, commanderIndex: number): Position {
  const positions: Record<number, Position[]> = {
    0: [
      { x: 2, y: 2 },
      { x: 2, y: 12 },
      { x: 5, y: 7 },
    ],  // Player 1 (top-left)
    1: [
      { x: 21, y: 2 },
      { x: 21, y: 12 },
      { x: 18, y: 7 },
    ],  // Player 2 (top-right)
    2: [
      { x: 2, y: 21 },
      { x: 2, y: 11 },
      { x: 5, y: 16 },
    ],  // Player 3 (bottom-left)
    3: [
      { x: 21, y: 21 },
      { x: 21, y: 11 },
      { x: 18, y: 16 },
    ],  // Player 4 (bottom-right)
  };

  const playerPositions = positions[playerIndex] ?? positions[0];
  return playerPositions[commanderIndex] ?? playerPositions[0];
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
  let newTurnNumber = state.turnNumber;
  if (nextPlayerIndex === 0) {
    newTurnNumber += 1;
  }

  // Update player active status
  const updatedPlayers = state.players.map((p, idx) => ({
    ...p,
    isActive: idx === nextPlayerIndex,
  }));

  const action: Action = {
    type: 'endTurn',
    playerId: state.activePlayerId,
    timestamp: Date.now(),
    details: { nextPlayerId: nextPlayer.id },
  };

  const newState: GameState = {
    ...state,
    activePlayerId: nextPlayer.id,
    turnNumber: newTurnNumber,
    players: updatedPlayers,
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
    const reason = (lastAction.details as any)?.reason;
    return { finished: true, reason };
  }

  return { finished: true };
}

/**
 * Check and apply victory conditions
 *
 * Victory conditions:
 * 1. King defeated (health ≤ 0)
 * 2. Banner captured (removed from board)
 *
 * Updates game state to 'finished' if condition met.
 *
 * @param state - Current game state
 * @returns New game state with finished status if victory condition met
 */
export function checkAndApplyVictoryConditions(state: GameState): GameState {
  // Check for defeated kings or captured banners
  const defeatedPlayers: PlayerId[] = [];

  for (const player of state.players) {
    for (const commanderId of player.commanders) {
      const commander = state.commanders.get(commanderId);
      if (!commander) continue;

      // Check if king is defeated
      if (commander.isKing && commander.health <= 0) {
        defeatedPlayers.push(player.id);
        break;
      }

      // Check if banner is defeated
      if (commander.isBanner && commander.health <= 0) {
        defeatedPlayers.push(player.id);
        break;
      }
    }
  }

  if (defeatedPlayers.length > 0) {
    // Find surviving players (winners)
    const winners = state.players.filter((p) => !defeatedPlayers.includes(p.id));

    if (winners.length === 1) {
      const winnerId = winners[0].id;
      const defeatedPlayer = state.players.find((p) => p.id === defeatedPlayers[0]);
      const firstCommanderId = defeatedPlayer?.commanders[0];
      const firstCommander = firstCommanderId ? state.commanders.get(firstCommanderId) : undefined;
      const reason: 'king_defeated' | 'banner_captured' = 
        firstCommander?.isKing ? 'king_defeated' : 'banner_captured';

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
