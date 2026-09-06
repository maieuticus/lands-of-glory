import { BannerId, Commander, CommanderId, GameState, MoveResult, PlayerId, Position, TROOP_STATS } from './types';
import { calculateDistance, getAdjacentPositions, getPositionsWithinDistance, hasLineOfSight, isPositionInBounds } from './board';
import { findPath, getPathCost } from './pathfinding';
import { boardWithOccupants, getCommanderAtPosition, getEffectiveTroopType } from './state';
import { getHoldingCommander, getPendingHoldingChoices } from './holding';

export function actionError(state: GameState, playerId: PlayerId, commanderId?: CommanderId): string | undefined {
  if (state.gameStatus !== 'active') return 'Game is not active';
  const player = state.players.find(item => item.id === playerId);
  if (!player || player.status === 'defeated' || playerId !== state.activePlayerId) return 'Not player turn';
  if (commanderId !== undefined) {
    const commander = state.commanders.get(commanderId);
    if (!commander || commander.health <= 0) return 'Commander not found or defeated';
    if (commander.playerId !== playerId) return 'Commander belongs to another player';
    if (!isPositionInBounds(commander.position)) return 'Invalid commander position';
    if (commander.hasActedThisTurn) return 'Commander has already acted this turn';
  }
  if (getPendingHoldingChoices(state).length > 0) return 'Holding response required';
  return undefined;
}

function bannerAt(state: GameState, position: Position): boolean {
  return [...state.banners.values()].some(b => b.status === 'standing' &&
    b.position.x === position.x && b.position.y === position.y);
}

export function movementPath(state: GameState, commander: Commander, target: Position, range: number): Position[] {
  const occupant = getCommanderAtPosition(state, target);
  if ((occupant !== undefined && occupant.id !== commander.id) || bannerAt(state, target)) return [];
  return findPath(boardWithOccupants(state), commander.position, target, range, {
    canTraverse: position => {
      const unit = getCommanderAtPosition(state, position);
      return !bannerAt(state, position) && (!unit || unit.playerId === commander.playerId);
    },
  });
}

export function canMove(state: GameState, commanderId: CommanderId, target: Position, playerId: PlayerId = state.activePlayerId): MoveResult {
  const reason = actionError(state, playerId, commanderId);
  if (reason) return { valid: false, reason };
  if (!isPositionInBounds(target)) return { valid: false, reason: 'Invalid target position' };
  const commander = state.commanders.get(commanderId)!;
  if (getHoldingCommander(state, commanderId)) return { valid: false, reason: 'Commander is held' };
  if (calculateDistance(commander.position, target) === 0) return { valid: false, reason: 'Already at target' };
  const path = movementPath(state, commander, target, TROOP_STATS[getEffectiveTroopType(commander)].moveRange);
  return path.length ? { valid: true, path } : { valid: false, reason: 'Target unreachable or occupied' };
}

export function getValidMoves(state: GameState, commanderId: CommanderId): Position[] {
  const commander = state.commanders.get(commanderId);
  if (!commander) return [];
  return getPositionsWithinDistance(commander.position, TROOP_STATS[getEffectiveTroopType(commander)].moveRange)
    .filter(position => canMove(state, commanderId, position).valid);
}

export interface AttackValidation extends MoveResult {
  readonly attackPosition?: Position;
}

function meleeApproach(state: GameState, attacker: Commander, target: Position): AttackValidation {
  const range = TROOP_STATS[getEffectiveTroopType(attacker)].attackRange;
  const distance = calculateDistance(attacker.position, target);
  if (distance < 1 || distance > range) return { valid: false, reason: 'Target out of range' };
  const paths = getAdjacentPositions(target).map(position => movementPath(state, attacker, position, range - 1))
    .filter(path => path.length > 0)
    .sort((a, b) => getPathCost(state.board, a) - getPathCost(state.board, b));
  const path = paths[0];
  if (!path) return { valid: false, reason: 'Attack path blocked' };
  return { valid: true, path, attackPosition: path[path.length - 1] };
}

export function canAttack(state: GameState, attackerId: CommanderId, defenderId: CommanderId, playerId: PlayerId = state.activePlayerId): AttackValidation {
  const reason = actionError(state, playerId, attackerId);
  if (reason) return { valid: false, reason };
  const attacker = state.commanders.get(attackerId)!;
  const defender = state.commanders.get(defenderId);
  if (!defender || defender.health <= 0) return { valid: false, reason: 'Defender not found' };
  if (defender.playerId === playerId || state.players.find(p => p.id === defender.playerId)?.status === 'defeated') {
    return { valid: false, reason: 'Target is not an active enemy' };
  }
  if (!isPositionInBounds(defender.position)) return { valid: false, reason: 'Invalid target position' };
  const holder = getHoldingCommander(state, attackerId);
  if (holder && holder.id !== defenderId) return { valid: false, reason: 'Must attack holding commander' };
  if (getEffectiveTroopType(attacker) === 'archer') {
    const distance = calculateDistance(attacker.position, defender.position);
    if (distance < 2 || distance > 3) return { valid: false, reason: 'Archers must attack from range 2-3' };
    if (!hasLineOfSight(state.board, attacker.position, defender.position)) return { valid: false, reason: 'No line of sight' };
    return { valid: true, path: [attacker.position], attackPosition: attacker.position };
  }
  return meleeApproach(state, attacker, defender.position);
}

export function getValidAttacks(state: GameState, commanderId: CommanderId): CommanderId[] {
  return [...state.commanders.keys()].filter(id => canAttack(state, commanderId, id).valid);
}

export function canCaptureBanner(state: GameState, attackerId: CommanderId, bannerId: BannerId, playerId: PlayerId = state.activePlayerId): AttackValidation {
  const reason = actionError(state, playerId, attackerId);
  if (reason) return { valid: false, reason };
  const attacker = state.commanders.get(attackerId)!;
  const banner = state.banners.get(bannerId);
  if (!banner || banner.status !== 'standing' || banner.playerId === playerId || !isPositionInBounds(banner.position)) {
    return { valid: false, reason: 'Invalid banner target' };
  }
  if (getEffectiveTroopType(attacker) === 'archer') return { valid: false, reason: 'Archers cannot capture banners' };
  if (getHoldingCommander(state, attackerId)) return { valid: false, reason: 'Commander is held' };
  return meleeApproach(state, attacker, banner.position);
}
