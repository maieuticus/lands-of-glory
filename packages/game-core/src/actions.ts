/**
 * packages/game-core/src/actions.ts
 *
 * Action definitions and validation
 *
 * Defines the types of commands players can issue and their properties.
 * Actions are applied through action handlers that validate and update GameState.
 */

import { Position, CommanderId, UnitId, PlayerId } from './types';

/**
 * Move command: relocate a commander to a new position
 *
 * Validation:
 * - Commander exists and is alive
 * - Target position is in bounds
 * - Target position is walkable
 * - Path distance respects movement range
 * - No other commander occupies target
 * - It's the player's turn
 */
export interface MoveCommand {
  readonly type: 'move';
  readonly playerId: PlayerId;
  readonly commanderId: CommanderId;
  readonly target: Position;
}

/**
 * Attack command: attack an enemy commander
 *
 * Validation:
 * - Attacker and target commanders exist and are alive
 * - Target is within attack range
 * - Line of sight exists (unblocked by water)
 * - Target belongs to different player
 * - Attacker has at least one unit in squad (or uses commander stats)
 * - It's the player's turn
 */
export interface AttackCommand {
  readonly type: 'attack';
  readonly playerId: PlayerId;
  readonly attackerId: CommanderId;
  readonly targetId: CommanderId;
  readonly diceRolls?: readonly number[];  // If provided, use these rolls; otherwise auto-roll
}

/**
 * End turn command: finish current player's turn
 *
 * Validation:
 * - Game is active
 * - It's the player's turn
 */
export interface EndTurnCommand {
  readonly type: 'endTurn';
  readonly playerId: PlayerId;
}

/**
 * Union type of all possible commands
 */
export type GameCommand = MoveCommand | AttackCommand | EndTurnCommand;

/**
 * Create a move command
 *
 * @param playerId - Player issuing command
 * @param commanderId - Commander to move
 * @param target - Destination position
 * @returns Move command
 */
export function createMoveCommand(
  playerId: PlayerId,
  commanderId: CommanderId,
  target: Position
): MoveCommand {
  return {
    type: 'move',
    playerId,
    commanderId,
    target,
  };
}

/**
 * Create an attack command
 *
 * @param playerId - Player issuing command
 * @param attackerId - Commander attacking
 * @param targetId - Enemy commander to attack
 * @param diceRolls - Optional: predetermined dice rolls for deterministic replay
 * @returns Attack command
 */
export function createAttackCommand(
  playerId: PlayerId,
  attackerId: CommanderId,
  targetId: CommanderId,
  diceRolls?: number[]
): AttackCommand {
  return {
    type: 'attack',
    playerId,
    attackerId,
    targetId,
    diceRolls,
  };
}

/**
 * Create an end turn command
 *
 * @param playerId - Player issuing command
 * @returns End turn command
 */
export function createEndTurnCommand(playerId: PlayerId): EndTurnCommand {
  return {
    type: 'endTurn',
    playerId,
  };
}

/**
 * Check if a command is valid in terms of basic structure
 *
 * @param command - Command to validate
 * @returns true if command has required fields
 */
export function isCommandValid(command: GameCommand): boolean {
  if (!command || !command.type || !command.playerId) {
    return false;
  }

  switch (command.type) {
    case 'move':
      return (
        'commanderId' in command &&
        'target' in command &&
        command.target !== null &&
        typeof command.target === 'object' &&
        'x' in command.target &&
        'y' in command.target
      );

    case 'attack':
      return 'attackerId' in command && 'targetId' in command;

    case 'endTurn':
      return true;

    default:
      return false;
  }
}
