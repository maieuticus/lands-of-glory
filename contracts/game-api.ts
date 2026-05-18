/**
 * contracts/game-api.ts
 *
 * This is the external interface contract for @lands-of-glory/game-core.
 * The prototype application depends on these functions and types.
 *
 * Design principles:
 * - Pure functions: no side effects
 * - Immutable input: GameState is never mutated
 * - Immutable output: returns new GameState
 * - Total functions: always return a result or throw GameRuleError
 * - Deterministic: same input always produces same output
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Branded types for type safety (prevent accidental ID misuse)
 */
export type UnitId = string & { readonly __brand: 'UnitId' };
export type CommanderId = string & { readonly __brand: 'CommanderId' };
export type PlayerId = string & { readonly __brand: 'PlayerId' };
export type GameId = string & { readonly __brand: 'GameId' };

/**
 * Game-wide enums
 */
export type TroopType = 'infantry' | 'cavalry' | 'archer';
export type TerrainType = 'grass' | 'water' | 'mountain' | 'forest';
export type GameStatus = 'setup' | 'active' | 'finished';

/**
 * Position on the 24×24 board
 * @example { x: 12, y: 12 }
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Individual unit (soldier) within a commander slot
 */
export interface Unit {
  id: UnitId;
  type: TroopType;
  health: number;  // 1-10, unit dies when ≤ 0
  bonus: number;   // 0+ bonus to combat rolls
  commanderId: CommanderId;
  slotIndex: number;  // 0-3, position in commander's unit slots
}

/**
 * Commander (squad leader) on the board
 * Represents a player's military unit with 0-4 soldiers
 */
export interface Commander {
  id: CommanderId;
  type: TroopType;  // Used for empty commander combat behavior
  position: Position;
  health: number;  // 1-20, commander dies when ≤ 0
  playerId: PlayerId;
  units: (Unit | null)[];  // Exactly 4 slots, each null or Unit
  isKing: boolean;  // True if this is the player's King
  isBanner: boolean;  // True if this is the player's Banner/Castle
}

/**
 * Single tile on the board
 */
export interface Tile {
  position: Position;
  terrain: TerrainType;
  occupant?: CommanderId;  // null if no commander present
}

/**
 * The 24×24 game board
 */
export interface Board {
  width: 24;
  height: 24;
  tiles: Tile[][];  // 2D array indexed as tiles[x][y]
}

/**
 * Configuration for creating a player
 */
export interface PlayerConfig {
  name: string;
  color: string;  // Hex color code
  commanderIds?: CommanderId[];  // Optional: pre-defined commanders
}

/**
 * Game participant
 */
export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  commanders: CommanderId[];  // 3-4 commanders per player
  score: number;  // Cumulative score (kills, objectives)
  isActive: boolean;  // True if current turn
}

/**
 * Action recorded in game log
 */
export interface Action {
  type: 'move' | 'attack' | 'endTurn' | 'gameStart' | 'gameEnd';
  playerId: PlayerId;
  commanderId?: CommanderId;
  timestamp: number;
  details: Record<string, unknown>;
}

/**
 * Complete immutable game state
 */
export interface GameState {
  id: GameId;
  board: Board;
  players: Player[];
  commanders: Map<CommanderId, Commander>;
  units: Map<UnitId, Unit>;
  activePlayerId: PlayerId;
  turnNumber: number;
  gameStatus: GameStatus;
  winner?: PlayerId;
  log: Action[];
}

/**
 * Result of move validation
 */
export interface MoveResult {
  valid: boolean;
  path?: Position[];  // Sequence of positions from start to end
  reason?: string;  // Reason why move is invalid
}

/**
 * Result of attack validation
 */
export interface AttackResult {
  valid: boolean;
  reason?: string;
  casualties?: Array<{
    unitId: UnitId;
    damage: number;
  }>;
}

/**
 * Configuration for game initialization
 */
export interface GameConfig {
  players: PlayerConfig[];
  boardSeed?: number;  // Optional: for reproducible board generation
  debugMode?: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Thrown when a game rule is violated
 */
export class GameRuleError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'GameRuleError';
    this.code = code;
    this.details = details;
  }
}

export enum GameErrorCode {
  INVALID_MOVE = 'INVALID_MOVE',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  PATH_BLOCKED = 'PATH_BLOCKED',
  OCCUPIED = 'OCCUPIED',
  INVALID_ATTACK = 'INVALID_ATTACK',
  OUT_OF_ATTACK_RANGE = 'OUT_OF_ATTACK_RANGE',
  NO_LINE_OF_SIGHT = 'NO_LINE_OF_SIGHT',
  NOT_PLAYER_TURN = 'NOT_PLAYER_TURN',
  UNIT_DEAD = 'UNIT_DEAD',
  COMMANDER_DEAD = 'COMMANDER_DEAD',
  INVALID_POSITION = 'INVALID_POSITION',
  GAME_NOT_ACTIVE = 'GAME_NOT_ACTIVE',
}

// ============================================================================
// GAME INITIALIZATION
// ============================================================================

/**
 * Create a new game with specified players
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
export function createGame(config: GameConfig): GameState;

/**
 * Transition game from 'setup' to 'active' status
 *
 * @param state - Current game state in 'setup' status
 * @returns New game state with status 'active' and turn 1
 * @throws GameRuleError if not in setup status
 */
export function startGame(state: GameState): GameState;

// ============================================================================
// MOVEMENT API
// ============================================================================

/**
 * Get all valid move destinations for a commander
 *
 * @param state - Current game state
 * @param commanderId - ID of commander to move
 * @returns Array of valid destination positions
 * @throws GameRuleError if commander not found
 *
 * @example
 * const validMoves = getValidMoves(state, cmd1);
 * // returns [{ x: 5, y: 5 }, { x: 6, y: 5 }, ...]
 */
export function getValidMoves(state: GameState, commanderId: CommanderId): Position[];

/**
 * Check if a specific move is valid
 *
 * @param state - Current game state
 * @param commanderId - ID of commander to move
 * @param target - Destination position
 * @returns MoveResult with validity and path
 *
 * @example
 * const result = canMove(state, cmd1, { x: 10, y: 10 });
 * if (result.valid) {
 *   console.log('Path:', result.path);
 * } else {
 *   console.log('Reason:', result.reason);
 * }
 */
export function canMove(
  state: GameState,
  commanderId: CommanderId,
  target: Position
): MoveResult;

/**
 * Move a commander to a new position
 *
 * Validates move before execution. Creates new GameState with:
 * - Commander at new position
 * - Action logged
 * - Turn potentially advanced
 *
 * @param state - Current game state
 * @param commanderId - ID of commander to move
 * @param target - Destination position
 * @returns New game state with commander moved
 * @throws GameRuleError if move is invalid
 *
 * @example
 * const newState = moveCommander(state, cmd1, { x: 10, y: 10 });
 */
export function moveCommander(
  state: GameState,
  commanderId: CommanderId,
  target: Position
): GameState;

// ============================================================================
// COMBAT API
// ============================================================================

/**
 * Get all valid attack targets for a commander
 *
 * Considers:
 * - Attack range based on unit types
 * - Line of sight
 * - Enemy vs ally
 *
 * @param state - Current game state
 * @param commanderId - ID of attacking commander
 * @returns Array of enemy commander IDs in range
 * @throws GameRuleError if commander not found
 *
 * @example
 * const targets = getValidAttacks(state, cmd1);
 */
export function getValidAttacks(state: GameState, commanderId: CommanderId): CommanderId[];

/**
 * Check if an attack is valid
 *
 * @param state - Current game state
 * @param attackerId - ID of attacking commander
 * @param targetId - ID of target commander
 * @returns AttackResult with validity information
 */
export function canAttack(
  state: GameState,
  attackerId: CommanderId,
  targetId: CommanderId
): AttackResult;

/**
 * Execute attack with dice roll
 *
 * Performs:
 * 1. Validation (range, LoS, not dead, etc.)
 * 2. Dice roll sorting (natural order)
 * 3. Bonus addition
 * 4. Casualty assignment (from highest roll down)
 * 5. Unit removal if health ≤ 0
 * 6. Victory condition check
 *
 * @param state - Current game state
 * @param attackerId - ID of attacking commander
 * @param targetId - ID of target commander
 * @param diceRoll - Array of dice results [3, 4, 5] or empty for auto-roll
 * @returns New game state after attack resolution
 * @throws GameRuleError if attack is invalid
 *
 * @example
 * // Manual dice roll
 * const newState = attackCommander(state, cmd1, cmd2, [4, 5, 6]);
 *
 * // Auto-roll
 * const diceCount = getAttackingUnitCount(state, cmd1);
 * const rolls = Array.from({length: diceCount}, () => d6());
 * const newState = attackCommander(state, cmd1, cmd2, rolls);
 */
export function attackCommander(
  state: GameState,
  attackerId: CommanderId,
  targetId: CommanderId,
  diceRoll: number[]
): GameState;

// ============================================================================
// TURN MANAGEMENT
// ============================================================================

/**
 * End current player's turn and advance to next player
 *
 * - Increments turn counter if all players have gone
 * - Cycles activePlayerId to next player
 * - Resets action counters
 * - Checks victory conditions
 *
 * @param state - Current game state
 * @returns New game state with next player active
 * @throws GameRuleError if game not active
 */
export function endTurn(state: GameState): GameState;

/**
 * Get the currently active player
 *
 * @param state - Current game state
 * @returns Player object for activePlayerId
 * @throws GameRuleError if activePlayerId invalid
 */
export function getCurrentPlayer(state: GameState): Player;

/**
 * Get game winner if game finished
 *
 * @param state - Current game state
 * @returns Winner player or undefined if game still active
 */
export function getWinner(state: GameState): Player | undefined;

/**
 * Check if game is finished and why
 *
 * @param state - Current game state
 * @returns { finished: boolean, reason?: string }
 *
 * Reasons:
 * - 'king_defeated' - Player's king was killed
 * - 'banner_captured' - Player's banner was captured
 * - 'stalemate' - No valid moves for any player
 * - null - Game still active
 */
export function getGameFinishReason(state: GameState): {
  finished: boolean;
  reason?: 'king_defeated' | 'banner_captured' | 'stalemate';
};

// ============================================================================
// QUERY FUNCTIONS (Read-Only)
// ============================================================================

/**
 * Get all units belonging to a player
 *
 * @param state - Current game state
 * @param playerId - ID of player
 * @returns Array of units owned by player
 */
export function getPlayerUnits(state: GameState, playerId: PlayerId): Unit[];

/**
 * Get all commanders belonging to a player
 *
 * @param state - Current game state
 * @param playerId - ID of player
 * @returns Array of commanders owned by player
 */
export function getPlayerCommanders(state: GameState, playerId: PlayerId): Commander[];

/**
 * Get a specific commander
 *
 * @param state - Current game state
 * @param commanderId - ID of commander
 * @returns Commander object
 * @throws GameRuleError if commander not found
 */
export function getCommander(state: GameState, commanderId: CommanderId): Commander;

/**
 * Get a specific unit
 *
 * @param state - Current game state
 * @param unitId - ID of unit
 * @returns Unit object
 * @throws GameRuleError if unit not found
 */
export function getUnit(state: GameState, unitId: UnitId): Unit;

/**
 * Get a specific player
 *
 * @param state - Current game state
 * @param playerId - ID of player
 * @returns Player object
 * @throws GameRuleError if player not found
 */
export function getPlayer(state: GameState, playerId: PlayerId): Player;

/**
 * Get commander at a specific position (if any)
 *
 * @param state - Current game state
 * @param position - Position to check
 * @returns Commander at position or undefined
 */
export function getCommanderAtPosition(state: GameState, position: Position): Commander | undefined;

/**
 * Get all units attacking in a battle
 *
 * @param state - Current game state
 * @param commanderId - ID of attacking commander
 * @returns Array of units that would participate in attack
 */
export function getAttackingUnits(state: GameState, commanderId: CommanderId): Unit[];

/**
 * Get all units defending in a battle
 *
 * @param state - Current game state
 * @param commanderId - ID of defending commander
 * @returns Array of units that would defend
 */
export function getDefendingUnits(state: GameState, commanderId: CommanderId): Unit[];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate entire game state for consistency
 *
 * Checks:
 * - All positions in bounds
 * - All health in valid ranges
 * - All ID references valid
 * - No duplicate units
 * - Commander count per player valid
 * - Exactly one king and banner per player
 *
 * @param state - Game state to validate
 * @returns { valid: boolean, errors: string[] }
 */
export function validateGameState(state: GameState): { valid: boolean; errors: string[] };

/**
 * Check if a position is within board bounds
 *
 * @param position - Position to check
 * @returns true if 0 ≤ x < 24 and 0 ≤ y < 24
 */
export function isPositionInBounds(position: Position): boolean;

/**
 * Check if a position is walkable (not blocked by terrain)
 *
 * @param state - Current game state
 * @param position - Position to check
 * @returns true if position is walkable
 */
export function isPositionWalkable(state: GameState, position: Position): boolean;

/**
 * Check if a position has line of sight to another position
 *
 * @param state - Current game state
 * @param from - Starting position
 * @param to - Target position
 * @returns true if line of sight exists
 */
export function hasLineOfSight(state: GameState, from: Position, to: Position): boolean;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get movement range for a unit type
 *
 * @param troopType - Type of troop
 * @returns Movement range in tiles
 */
export function getMovementRange(troopType: TroopType): number;

/**
 * Get attack range for a unit type
 *
 * @param troopType - Type of troop
 * @returns Attack range in tiles
 */
export function getAttackRange(troopType: TroopType): number;

/**
 * Get base attack power for a unit type
 *
 * @param troopType - Type of troop
 * @returns Base attack damage
 */
export function getBaseAttack(troopType: TroopType): number;

/**
 * Get maximum health for a unit type
 *
 * @param troopType - Type of troop
 * @returns Maximum health
 */
export function getMaxHealth(troopType: TroopType): number;

/**
 * Calculate distance between two positions
 *
 * @param from - Starting position
 * @param to - Target position
 * @returns Manhattan distance
 */
export function calculateDistance(from: Position, to: Position): number;

/**
 * Serialize game state to JSON
 *
 * @param state - Game state to serialize
 * @returns JSON string
 */
export function serializeGameState(state: GameState): string;

/**
 * Deserialize game state from JSON
 *
 * @param json - JSON string
 * @returns Deserialized game state
 * @throws Error if JSON invalid or state invalid
 */
export function deserializeGameState(json: string): GameState;

// ============================================================================
// CONSTANTS
// ============================================================================

export const BOARD_WIDTH = 24;
export const BOARD_HEIGHT = 24;
export const COMMANDER_SLOTS = 4;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const COMMANDER_MAX_HEALTH = 20;

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
};

export const TERRAIN_MOVEMENT_COST = {
  grass: 1.0,
  water: Infinity,  // impassable
  mountain: 2.0,
  forest: 1.5,
};

export const VERSION = '1.0.0';
