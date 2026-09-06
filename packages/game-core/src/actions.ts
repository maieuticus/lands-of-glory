import { Position, CommanderId, PlayerId, BannerId, GameState } from './types';
import { isPositionInBounds } from './board';
import { canMove, canCaptureBanner } from './rules';
import { logEvent, synchronizeState } from './state';
import { checkAndApplyVictoryConditions, endTurn } from './game';
import { attackCommander } from './combat';
import { setHoldingTarget } from './holding';
import { GameRuleError, GameErrorCode } from './errors';

export interface MoveCommand { readonly type: 'move'; readonly playerId: PlayerId; readonly commanderId: CommanderId; readonly target: Position; }
export interface AttackCommand {
  readonly type: 'attack'; readonly playerId: PlayerId; readonly attackerId: CommanderId;
  readonly targetId: CommanderId; readonly diceRolls?: readonly number[];
}
export interface EndTurnCommand { readonly type: 'endTurn'; readonly playerId: PlayerId; }
export interface CaptureCommand { readonly type: 'capture'; readonly playerId: PlayerId; readonly attackerId: CommanderId; readonly bannerId: BannerId; }
export interface HoldCommand { readonly type: 'hold'; readonly playerId: PlayerId; readonly holderId: CommanderId; readonly targetId: CommanderId | null; }
export type GameCommand = MoveCommand | AttackCommand | EndTurnCommand | CaptureCommand | HoldCommand;

export function createMoveCommand(playerId: PlayerId, commanderId: CommanderId, target: Position): MoveCommand {
  return { type: 'move', playerId, commanderId, target };
}
export function createAttackCommand(playerId: PlayerId, attackerId: CommanderId, targetId: CommanderId, diceRolls?: number[]): AttackCommand {
  return { type: 'attack', playerId, attackerId, targetId, diceRolls };
}
export function createEndTurnCommand(playerId: PlayerId): EndTurnCommand { return { type: 'endTurn', playerId }; }

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function identifier(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }
export function isCommandValid(command: unknown): command is GameCommand {
  if (!record(command) || !identifier(command.playerId)) return false;
  switch (command.type) {
    case 'move':
      return identifier(command.commanderId) && record(command.target) &&
        typeof command.target.x === 'number' && typeof command.target.y === 'number' &&
        isPositionInBounds({ x: command.target.x, y: command.target.y });
    case 'attack':
      return identifier(command.attackerId) && identifier(command.targetId) &&
        (command.diceRolls === undefined || (Array.isArray(command.diceRolls) &&
          command.diceRolls.every((d: unknown) => typeof d === 'number' && Number.isInteger(d) && d >= 1 && d <= 6)));
    case 'capture': return identifier(command.attackerId) && identifier(command.bannerId);
    case 'hold': return identifier(command.holderId) && (command.targetId === null || identifier(command.targetId));
    case 'endTurn': return true;
    default: return false;
  }
}

export function moveCommander(state: GameState, commanderId: CommanderId, target: Position, playerId: PlayerId = state.activePlayerId): GameState {
  const validation = canMove(state, commanderId, target, playerId);
  if (!validation.valid) throw new GameRuleError(validation.reason!, GameErrorCode.INVALID_MOVE);
  const commanders = new Map(state.commanders);
  const commander = commanders.get(commanderId)!;
  commanders.set(commanderId, { ...commander, position: { ...target }, hasActedThisTurn: true });
  return logEvent(synchronizeState({ ...state, commanders }), {
    type: 'move', playerId, commanderId, details: { from: commander.position, to: { ...target }, path: validation.path },
  });
}

export function captureBanner(state: GameState, attackerId: CommanderId, bannerId: BannerId, playerId: PlayerId = state.activePlayerId): GameState {
  const validation = canCaptureBanner(state, attackerId, bannerId, playerId);
  if (!validation.valid) throw new GameRuleError(validation.reason!, GameErrorCode.INVALID_ATTACK);
  const commanders = new Map(state.commanders);
  const banners = new Map(state.banners);
  const banner = banners.get(bannerId)!;
  banners.set(bannerId, { ...banner, status: 'captured' });
  commanders.set(attackerId, { ...commanders.get(attackerId)!, position: { ...banner.position }, hasActedThisTurn: true });
  const next = logEvent(synchronizeState({ ...state, commanders, banners }), {
    type: 'capture', playerId, commanderId: attackerId,
    details: { bannerId, defeatedPlayerId: banner.playerId, path: validation.path, to: banner.position },
  });
  return checkAndApplyVictoryConditions(next);
}

/** Single authoritative entry point for UI commands and deterministic scenarios. */
export function applyCommand(state: GameState, command: GameCommand): GameState {
  if (!isCommandValid(command)) throw new GameRuleError('Malformed command', GameErrorCode.INVALID_MOVE);
  switch (command.type) {
    case 'move': return moveCommander(state, command.commanderId, command.target, command.playerId);
    case 'attack': return attackCommander(state, command.attackerId, command.targetId, command.diceRolls, command.playerId);
    case 'capture': return captureBanner(state, command.attackerId, command.bannerId, command.playerId);
    case 'hold': return setHoldingTarget(state, command.playerId, command.holderId, command.targetId);
    case 'endTurn': return endTurn(state, command.playerId);
  }
}
