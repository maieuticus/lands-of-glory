/**
 * packages/game-core/src/errors.ts
 *
 * Game rule error definitions and error handling
 */

/**
 * Thrown when a game rule is violated
 *
 * Includes error code and optional context details for debugging.
 */
export class GameRuleError extends Error {
  readonly code: string;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GameRuleError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, GameRuleError.prototype);
  }
}

/**
 * Error codes for game rule violations
 *
 * Used to categorize errors and allow UI/tests to handle specific cases
 */
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
