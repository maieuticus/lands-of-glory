import {
  GameConfig, GameState, TroopType, Position, CommanderId, Commander, createCommanderId, createUnitId,
  createGame, startGame, getMinimalArmyConfig, synchronizeState, getPendingHoldingChoices, setHoldingTarget,
} from '../src';

export function waiveHolding(state: GameState): GameState {
  let next = state;
  let choice = getPendingHoldingChoices(next)[0];
  while (choice) {
    next = setHoldingTarget(next, choice.playerId, choice.holderId, null);
    choice = getPendingHoldingChoices(next)[0];
  }
  return next;
}

export function createCombatGame(config: GameConfig): GameState {
  const state = createGame(config);
  const commanders = new Map(state.commanders);
  state.players.forEach((player, index) => {
    for (let n = 0; n < 2; n++) {
      const id = player.commanders[n];
      commanders.set(id, { ...commanders.get(id)!, position: { x: 10 + index, y: 9 + n } });
    }
  });
  return waiveHolding(startGame({ ...state, commanders }));
}

export interface Figure {
  id: string;
  player: number;
  type?: TroopType;
  position: Position;
  bonuses?: readonly (0 | 1 | 2 | 3)[];
  king?: boolean;
  acted?: boolean;
}

export function scenario(figures: readonly Figure[], count = 2): GameState {
  const state = createGame({ players: Array.from({ length: count }, (_, i) => ({
    name: `Player ${i}`, color: '#ffffff', armyConfig: getMinimalArmyConfig(),
  })) });
  const commanders = new Map(state.commanders);
  for (const figure of figures) {
    const id = createCommanderId(figure.id);
    const playerId = state.players[figure.player].id;
    if (figure.king) {
      for (const [key, cmd] of commanders) if (cmd.playerId === playerId && cmd.isKing) commanders.delete(key);
    }
    const type = figure.type ?? 'infantry';
    const bonuses = figure.bonuses ?? [0];
    const commander: Commander = {
      id, playerId, type, position: figure.position, health: 20, isKing: figure.king ?? false,
      hasActedThisTurn: figure.acted ?? false,
      units: Array.from({ length: 4 }, (_, slot) => slot < bonuses.length ? {
        id: createUnitId(`${id}-unit-${slot}`), commanderId: id, troopType: type,
        slotIndex: slot as 0 | 1 | 2 | 3, bonusPoints: bonuses[slot], status: 'active',
      } : null),
    };
    commanders.set(id, commander);
  }
  return startGame(synchronizeState({ ...state, commanders }));
}

export const id = (value: string): CommanderId => createCommanderId(value);
