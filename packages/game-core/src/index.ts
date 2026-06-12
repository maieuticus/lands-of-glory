/**
 * packages/game-core/src/index.ts
 *
 * Public API exports for @lands-of-glory/game-core
 *
 * This module exports the complete game engine interface.
 */

// Re-export types
export type {
  UnitId,
  CommanderId,
  PlayerId,
  GameId,
  BannerId,
  TroopType,
  TerrainType,
  GameStatus,
  Position,
  Unit,
  Commander,
  Banner,
  Tile,
  Board,
  PlayerConfig,
  Player,
  Action,
  GameState,
  MoveResult,
  AttackResult,
  GameConfig,
} from './types';

export {
  createUnitId,
  createCommanderId,
  createPlayerId,
  createGameId,
  createBannerId,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  COMMANDER_SLOTS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  COMMANDER_MAX_HEALTH,
  TROOP_STATS,
  TERRAIN_MOVEMENT_COST,
  VERSION,
} from './types';

// Re-export errors
export { GameRuleError, GameErrorCode } from './errors';

// Re-export game functions
export { createGame, startGame, endTurn, getCurrentPlayer, getWinner, getGameFinishReason } from './game';

// Re-export board functions
export {
  createEmptyBoard,
  getTile,
  getOccupant,
  isPositionInBounds,
  isPositionEmpty,
  getTerrain,
  placeCommander,
  removeCommanderFromPosition,
  moveCommanderOnBoard,
  getAdjacentPositions,
  getPositionsWithinDistance,
  calculateDistance,
  areAdjacent,
  getLineOfSight,
  hasLineOfSight,
} from './board';

// Re-export pathfinding functions
export {
  getTerrainCost,
  findPath,
  isReachable,
  getPathCost,
  getReachablePositions,
} from './pathfinding';

// Re-export action types and functions
export type { MoveCommand, AttackCommand, EndTurnCommand, GameCommand } from './actions';

export {
  createMoveCommand,
  createAttackCommand,
  createEndTurnCommand,
  isCommandValid,
} from './actions';

// Re-export RNG
export { SeededRNG, createRNG } from './rng';

// Re-export combat types and functions
export type { DieRoll, PairResult, CombatResult } from './combat';

export {
  resolveCombat,
  applyCombatResult,
  canAttack,
} from './combat';

export const GAME_CORE_VERSION = '1.0.0';
