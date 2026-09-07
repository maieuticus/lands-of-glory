import { Action, Board, Commander, CommanderId, GameState, Position, Unit } from './types';
import { isPositionInBounds } from './board';
import { GameRuleError, GameErrorCode } from './errors';
import { validDecisions } from './holding';

export function activeUnits(commander: Commander): Unit[] {
  return commander.units.filter((unit): unit is Unit => unit !== null && unit.status === 'active');
}

export function getEffectiveTroopType(commander: Commander): Commander['type'] {
  return activeUnits(commander).length ? commander.type : 'cavalry';
}

export function getCommanderAtPosition(state: GameState, position: Position): Commander | undefined {
  return [...state.commanders.values()].find(cmd => cmd.position.x === position.x && cmd.position.y === position.y);
}

/** Commander positions are authoritative; Tile.occupant is a derived cache. */
export function boardWithOccupants(state: GameState): Board {
  const positions = new Map<string, CommanderId>();
  for (const commander of state.commanders.values()) {
    const { x, y } = commander.position;
    const key = `${x},${y}`;
    if (!isPositionInBounds(commander.position) || positions.has(key) ||
        [...state.banners.values()].some(b => b.status === 'standing' && b.position.x === x && b.position.y === y)) {
      throw new GameRuleError('Invalid or overlapping commander position', GameErrorCode.INVALID_POSITION);
    }
    positions.set(key, commander.id);
  }
  return { ...state.board, tiles: state.board.tiles.map(column => column.map(tile => {
    const copy = { ...tile };
    delete copy.occupant;
    const occupant = positions.get(`${tile.position.x},${tile.position.y}`);
    return occupant ? { ...copy, occupant } : copy;
  })) };
}

/** Keep board, player memberships and unit registry consistent after an action. */
export function synchronizeState(state: GameState): GameState {
  const units = new Map(state.units);
  for (const [id, unit] of units) units.set(id, { ...unit, status: 'removed' });
  for (const cmd of state.commanders.values()) for (const unit of cmd.units) if (unit) units.set(unit.id, unit);
  return {
    ...state, units, board: boardWithOccupants(state), holdingDecisions: validDecisions(state),
    players: state.players.map(player => ({
      ...player,
      commanders: [...state.commanders.values()].filter(cmd => cmd.playerId === player.id).map(cmd => cmd.id),
    })),
  };
}

/** timestamp is a deterministic logical event number, not wall-clock time. */
export function logEvent(state: GameState, event: Omit<Action, 'timestamp'>): GameState {
  return { ...state, log: [...state.log, {
    ...event, details: { ...event.details, turnNumber: state.turnNumber }, timestamp: state.log.length,
  }] };
}

export function stateKey(state: GameState): string {
  return JSON.stringify(state, (_key, value: unknown): unknown => value instanceof Map ? [...value.entries()] : value);
}
