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
import {
  ArmyConfig,
  buildArmy,
  getDefaultArmyConfig,
  DEFAULT_STARTING_BUDGET,
} from './army-builder';

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

    // Get army configuration for this player
    // Use custom config if provided, otherwise use default
    const armyConfig: ArmyConfig = playerConfig.armyConfig ?? getDefaultArmyConfig();

    const totalPlayers = config.players.length;

    // Build the army using the army builder
    const commanderPositions = getCommanderPositionsForPlayer(pIdx, armyConfig.commanders.length, totalPlayers);
    const budget = config.startingBudget ?? DEFAULT_STARTING_BUDGET;
    console.log('💰 [game-core] Player', pIdx, 'budget:', budget, 'startingBudget:', config.startingBudget);
    const builtCommanders = buildArmy(playerId, armyConfig, commanderPositions, true, budget);

    // Add commanders to maps
    const commanderIds: CommanderId[] = [];
    for (const commander of builtCommanders) {
      commandersMap.set(commander.id, commander);
      commanderIds.push(commander.id);

      // Add units to units map
      for (const unit of commander.units) {
        if (unit) {
          unitsMap.set(unit.id, unit);
        }
      }
    }

    // Create 1 banner per player
    const bannerId = createBannerId(`banner-${pIdx}`);
    const banner: Banner = {
      id: bannerId,
      playerId,
      position: getInitialBannerPosition(pIdx, totalPlayers),
      status: 'standing',
    };
    bannersMap.set(bannerId, banner);

    const player: Player = {
      id: playerId,
      name: playerConfig.name,
      color: playerConfig.color,
      commanders: commanderIds,
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
 * Calculate initial positions for a player's commanders
 *
 * Generates positions in a grid formation based on the number of commanders.
 * Default formations for 6 commanders (2 rows x 3 columns):
 * Player 1: (10,8), (11,8), (12,8), (10,9), (11,9), (12,9)
 * Player 2: (10,14), (11,14), (12,14), (10,15), (11,15), (12,15)
 *
 * @param playerIndex - Player number (0-3)
 * @param commanderCount - Number of commanders to place
 * @returns Array of positions for each commander
 */
function getCommanderPositionsForPlayer(playerIndex: number, commanderCount: number, totalPlayers: number = 2): Position[] {
  // Commanders are placed between banner and outer edge
  const CENTER_X = 11;
  const CENTER_Y = 11;
  const BANNER_DIST = 3; // Banner 3 fields from center
  const COMMANDER_DIST = 5; // Commanders 5 fields from center (2 beyond banner)
  
  // Base positions for commanders (between banner and edge)
  const basePositions: Record<number, Record<number, { x: number; y: number }>> = {
    2: {
      // Top: commanders between banner (y=7) and edge
      0: { x: CENTER_X - 1, y: CENTER_Y - COMMANDER_DIST + 1 },
      // Bottom: commanders between banner (y=15) and edge
      1: { x: CENTER_X - 1, y: CENTER_Y + COMMANDER_DIST - 2 },
    },
    3: {
      0: { x: CENTER_X - 1, y: CENTER_Y - COMMANDER_DIST + 1 },  // Top
      1: { x: CENTER_X - COMMANDER_DIST + 1, y: CENTER_Y + 2 },   // Bottom-left
      2: { x: CENTER_X + COMMANDER_DIST - 2, y: CENTER_Y + 2 },   // Bottom-right
    },
    4: {
      0: { x: CENTER_X - 1, y: CENTER_Y - COMMANDER_DIST + 1 },   // Top
      1: { x: CENTER_X + COMMANDER_DIST - 2, y: CENTER_Y - 1 },   // Right
      2: { x: CENTER_X - 1, y: CENTER_Y + COMMANDER_DIST - 2 },   // Bottom
      3: { x: CENTER_X - COMMANDER_DIST + 1, y: CENTER_Y - 1 },   // Left
    },
  };

  const playerPositions = basePositions[totalPlayers] ?? basePositions[2];
  const base = playerPositions[playerIndex] ?? playerPositions[0];
  const positions: Position[] = [];

  // Calculate grid dimensions (aim for roughly square)
  const cols = Math.ceil(Math.sqrt(commanderCount));
  
  for (let i = 0; i < commanderCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      x: base.x + col,
      y: base.y + row,
    });
  }

  return positions;
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
function getInitialBannerPosition(playerIndex: number, totalPlayers: number = 2): Position {
  // All banners are 4 fields away from the center (11, 11)
  // Distributed in a circle around the center
  const CENTER_X = 11;
  const CENTER_Y = 11;
  const DISTANCE = 3; // 3 fields from center
  
  const positions: Record<number, Record<number, Position>> = {
    2: {
      // Opposite sides (top and bottom)
      0: { x: CENTER_X, y: CENTER_Y - DISTANCE },      // Top
      1: { x: CENTER_X, y: CENTER_Y + DISTANCE },      // Bottom
    },
    3: {
      // Triangle formation (top, bottom-left, bottom-right)
      0: { x: CENTER_X, y: CENTER_Y - DISTANCE },      // Top
      1: { x: CENTER_X - DISTANCE, y: CENTER_Y + 2 },  // Bottom-left (approximate)
      2: { x: CENTER_X + DISTANCE, y: CENTER_Y + 2 },  // Bottom-right (approximate)
    },
    4: {
      // Square formation (top, right, bottom, left)
      0: { x: CENTER_X, y: CENTER_Y - DISTANCE },      // Top
      1: { x: CENTER_X + DISTANCE, y: CENTER_Y },      // Right
      2: { x: CENTER_X, y: CENTER_Y + DISTANCE },      // Bottom
      3: { x: CENTER_X - DISTANCE, y: CENTER_Y },      // Left
    },
  };

  const playerPositions = positions[totalPlayers] ?? positions[2];
  return playerPositions[playerIndex] ?? { x: CENTER_X, y: CENTER_Y };
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
