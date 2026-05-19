/**
 * packages/game-core/src/types.ts
 *
 * Core type definitions for the Lands of Glory game engine.
 * All types are immutable and designed for pure functional programming.
 */

// ============================================================================
// BRANDED TYPES - Type-safe ID wrappers
// ============================================================================

/**
 * Unit identifier - uniquely identifies a soldier in a commander's squad
 */
export type UnitId = string & { readonly __brand: 'UnitId' };

/**
 * Commander identifier - uniquely identifies a squad leader on the board
 */
export type CommanderId = string & { readonly __brand: 'CommanderId' };

/**
 * Player identifier - uniquely identifies a game participant
 */
export type PlayerId = string & { readonly __brand: 'PlayerId' };

/**
 * Game identifier - uniquely identifies a game session
 */
export type GameId = string & { readonly __brand: 'GameId' };

// Helper functions to create branded types
export const createUnitId = (id: string): UnitId => id as UnitId;
export const createCommanderId = (id: string): CommanderId => id as CommanderId;
export const createPlayerId = (id: string): PlayerId => id as PlayerId;
export const createGameId = (id: string): GameId => id as GameId;

// ============================================================================
// ENUMERATIONS
// ============================================================================

/**
 * Types of combat units available to players
 */
export type TroopType = 'infantry' | 'cavalry' | 'archer';

/**
 * Terrain types on the game board
 * - grass: normal movement (cost 1.0)
 * - water: impassable (cost Infinity)
 * - mountain: difficult terrain (cost 2.0)
 * - forest: moderate difficulty (cost 1.5)
 */
export type TerrainType = 'grass' | 'water' | 'mountain' | 'forest';

/**
 * Game progression state
 * - setup: game created, players assigned, ready to start
 * - active: turns are being played
 * - finished: game ended (winner determined or stalemate)
 */
export type GameStatus = 'setup' | 'active' | 'finished';

// ============================================================================
// GEOMETRIC TYPES
// ============================================================================

/**
 * Position on the 24×24 board
 * x and y are 0-indexed: 0 ≤ x < 24, 0 ≤ y < 24
 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

// ============================================================================
// COMBAT UNIT TYPES
// ============================================================================

/**
 * Individual soldier in a commander's squad
 *
 * Each unit occupies one of 4 slots in a commander's unit array.
 * Units can be null (empty slot) or a Unit object.
 *
 * Units are removed from the board immediately when health ≤ 0.
 */
export interface Unit {
  readonly id: UnitId;
  readonly type: TroopType;
  readonly health: number;  // 1-10, unit dies when ≤ 0
  readonly bonus: number;   // Combat roll bonus (0+)
  readonly commanderId: CommanderId;
  readonly slotIndex: number;  // 0-3, position in commander's unit array
}

/**
 * Commander (squad leader) on the board
 *
 * Represents a player's primary unit with 0-4 soldiers (units) in slots.
 * Each player has 3-4 commanders: exactly 1 King, 1 Banner, and 1-2 others.
 *
 * When a commander dies (health ≤ 0), all units in its squad are also removed.
 * If isKing=true and health ≤ 0, that player loses immediately.
 * If isBanner=true and health ≤ 0, that player loses immediately.
 */
export interface Commander {
  readonly id: CommanderId;
  readonly type: TroopType;  // Used for base stats when commander is empty
  readonly position: Position;
  readonly health: number;  // 1-20, commander dies when ≤ 0
  readonly playerId: PlayerId;
  readonly units: (Unit | null)[];  // Exactly 4 slots, each null or Unit
  readonly isKing: boolean;  // True if this is the player's King
  readonly isBanner: boolean;  // True if this is the player's Banner/Castle
}

// ============================================================================
// BOARD TYPES
// ============================================================================

/**
 * Single tile on the 24×24 board
 *
 * Each tile has a terrain type and optionally an occupant (commander).
 * At most one commander can occupy a tile.
 */
export interface Tile {
  readonly position: Position;
  readonly terrain: TerrainType;
  readonly occupant?: CommanderId;  // undefined if no commander present
}

/**
 * The 24×24 game board
 *
 * Immutable structure representing board layout and occupancy.
 * Tiles are indexed as tiles[x][y] where x is column, y is row.
 */
export interface Board {
  readonly width: 24;
  readonly height: 24;
  readonly tiles: readonly (readonly Tile[])[];  // 2D array indexed as tiles[x][y]
}

// ============================================================================
// PLAYER & GAME STATE TYPES
// ============================================================================

/**
 * Configuration for creating a player
 */
export interface PlayerConfig {
  readonly name: string;
  readonly color: string;  // Hex color code (e.g., '#FF0000')
  readonly commanderIds?: readonly CommanderId[];  // Optional: pre-defined commanders
}

/**
 * Game participant
 *
 * Represents a player in the game with their commanders and units.
 */
export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly color: string;
  readonly commanders: readonly CommanderId[];  // 3-4 commanders per player
  readonly score: number;  // Cumulative score (kills, objectives)
  readonly isActive: boolean;  // True if current turn
}

/**
 * Action recorded in game log for deterministic replay
 *
 * Actions form an immutable log of all game state changes.
 * This enables deterministic replay with different RNG seeds.
 */
export interface Action {
  readonly type: 'move' | 'attack' | 'endTurn' | 'gameStart' | 'gameEnd';
  readonly playerId: PlayerId;
  readonly commanderId?: CommanderId;
  readonly timestamp: number;
  readonly details: Readonly<Record<string, unknown>>;
}

/**
 * Complete immutable game state
 *
 * GameState is the single source of truth. All operations create new GameState
 * instances rather than mutating existing ones.
 *
 * Properties:
 * - id: Unique game session identifier
 * - board: 24×24 grid with terrain and occupancy
 * - players: Array of player objects
 * - commanders: Map of all commanders indexed by ID
 * - units: Map of all units indexed by ID
 * - activePlayerId: ID of player whose turn it is
 * - turnNumber: Current round (increments after all players act)
 * - gameStatus: 'setup' | 'active' | 'finished'
 * - winner?: ID of winning player (only set if finished)
 * - log: Immutable action log for replay
 */
export interface GameState {
  readonly id: GameId;
  readonly board: Board;
  readonly players: readonly Player[];
  readonly commanders: ReadonlyMap<CommanderId, Commander>;
  readonly units: ReadonlyMap<UnitId, Unit>;
  readonly activePlayerId: PlayerId;
  readonly turnNumber: number;
  readonly gameStatus: GameStatus;
  readonly winner?: PlayerId;
  readonly log: readonly Action[];
}

// ============================================================================
// VALIDATION & RESULT TYPES
// ============================================================================

/**
 * Result of movement validation
 *
 * Indicates whether a move is valid and provides either the path (if valid)
 * or the reason for rejection (if invalid).
 */
export interface MoveResult {
  readonly valid: boolean;
  readonly path?: readonly Position[];  // Sequence of positions from start to end
  readonly reason?: string;  // Reason why move is invalid
}

/**
 * Result of attack validation
 *
 * Indicates whether an attack is valid and provides casualty information.
 */
export interface AttackResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly casualties?: ReadonlyArray<{
    readonly unitId: UnitId;
    readonly damage: number;
  }>;
}

/**
 * Configuration for game initialization
 */
export interface GameConfig {
  readonly players: readonly PlayerConfig[];
  readonly boardSeed?: number;  // Optional: for reproducible board generation
  readonly debugMode?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BOARD_WIDTH = 24;
export const BOARD_HEIGHT = 24;
export const COMMANDER_SLOTS = 4;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const COMMANDER_MAX_HEALTH = 20;

/**
 * Base stats for each troop type
 *
 * - moveRange: How many tiles the unit can move per turn
 * - attackRange: How far the unit can attack (1 = adjacent, 3 = 3 tiles away)
 * - baseAttack: Base damage value before bonuses and dice rolls
 * - maxHealth: Maximum health points for units of this type
 */
export const TROOP_STATS = {
  infantry: {
    moveRange: 2,
    attackRange: 1,
    baseAttack: 3,
    maxHealth: 10,
  },
  cavalry: {
    moveRange: 3,
    attackRange: 1,
    baseAttack: 3,
    maxHealth: 8,
  },
  archer: {
    moveRange: 2,
    attackRange: 3,
    baseAttack: 3,
    maxHealth: 6,
  },
} as const;

/**
 * Terrain movement costs
 *
 * Lower values = easier to traverse
 * Infinity = impassable
 *
 * Used by A* pathfinding to calculate movement costs
 */
export const TERRAIN_MOVEMENT_COST = {
  grass: 1.0,
  water: Infinity,
  mountain: 2.0,
  forest: 1.5,
} as const;

export const VERSION = '1.0.0';
