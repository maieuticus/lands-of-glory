import {
  GameState, GameConfig, PlayerId, CommanderId, UnitId, BannerId, Position,
  Player, Commander, Unit, Banner, createGameId, createPlayerId, createBannerId, MAX_ARMY_COMMANDERS,
} from './types';
import { createEmptyBoard } from './board';
import { GameRuleError, GameErrorCode } from './errors';
import { buildArmy, getDefaultArmyConfig, DEFAULT_STARTING_BUDGET } from './army-builder';
import { createRNG } from './rng';
import { logEvent, synchronizeState } from './state';
import { actionError } from './rules';

export const START_AREA_CAPACITY = MAX_ARMY_COMMANDERS;

/** Four nonoverlapping 12x6 strips; seat 2 faces seat 1 in a two-player game. */
export function getStartArea(playerIndex: number, playerCount: number): Position[] {
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 4 ||
      !Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= playerCount) {
    throw new RangeError('Invalid seat');
  }
  const side = playerCount === 2 && playerIndex === 1 ? 2 : playerIndex;
  const positions: Position[] = [];
  for (let row = 0; row < 6; row++) for (let col = 0; col < 12; col++) {
    const x = 6 + col;
    const y = 5 - row;
    positions.push(side === 0 ? { x, y } : side === 1 ? { x: 23 - y, y: x } :
      side === 2 ? { x: 23 - x, y: 23 - y } : { x: y, y: 23 - x });
  }
  return positions;
}

export function createGame(config: GameConfig): GameState {
  if (!config.players || config.players.length < 2 || config.players.length > 4) {
    throw new GameRuleError('Game must have 2-4 players', GameErrorCode.INVALID_POSITION);
  }
  const players: Player[] = [];
  const commanders = new Map<CommanderId, Commander>();
  const units = new Map<UnitId, Unit>();
  const banners = new Map<BannerId, Banner>();
  const rng = createRNG(config.seed ?? config.boardSeed ?? 0);
  const budget = config.startingBudget ?? config.armyBuilder?.startingBudget ?? DEFAULT_STARTING_BUDGET;
  const bannerPositions = [{ x: 11, y: 6 }, { x: 17, y: 11 }, { x: 12, y: 17 }, { x: 6, y: 12 }];
  config.players.forEach((configuration, index) => {
    const id = createPlayerId(`player-${index}`);
    const army = configuration.armyConfig ?? getDefaultArmyConfig();
    if (army.commanders.length > START_AREA_CAPACITY) throw new RangeError('Army exceeds start area capacity');
    const area = getStartArea(index, config.players.length);
    // A supplied seed opts into a repeatable permutation of the selected formation.
    const positions = area.slice(0, army.commanders.length);
    if (config.seed !== undefined || config.boardSeed !== undefined) {
      for (let i = positions.length - 1; i > 0; i--) {
        const j = rng.nextInt(i + 1);
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
    }
    const built = buildArmy(id, army, positions, true, budget);
    for (const commander of built) {
      commanders.set(commander.id, commander);
      for (const unit of commander.units) if (unit) units.set(unit.id, unit);
    }
    const bannerId = createBannerId(`banner-${index}`);
    const side = config.players.length === 2 && index === 1 ? 2 : index;
    banners.set(bannerId, { id: bannerId, playerId: id, position: bannerPositions[side], status: 'standing' });
    players.push({ id, name: configuration.name, color: configuration.color,
      commanders: built.map(cmd => cmd.id), score: 0, isActive: index === 0, status: 'active' });
  });
  return synchronizeState({
    id: createGameId('game-1'), board: createEmptyBoard(), players, commanders, units, banners,
    activePlayerId: players[0].id, turnNumber: 0, gameStatus: 'setup', log: [],
    rngState: rng.getState(), holdingDecisions: [],
  });
}

export function startGame(state: GameState): GameState {
  if (state.gameStatus !== 'setup') throw new GameRuleError('Game is not in setup status', GameErrorCode.GAME_NOT_ACTIVE);
  return logEvent(synchronizeState({ ...state, gameStatus: 'active', turnNumber: 1 }), {
    type: 'gameStart', playerId: state.activePlayerId, details: { turnNumber: 1 },
  });
}

/** Immediate elimination, idempotent even after the king has left the map. */
export function checkAndApplyVictoryConditions(state: GameState): GameState {
  if (state.gameStatus !== 'active') return state;
  let next = state;
  let lastReason: 'king_defeated' | 'banner_captured' | undefined;
  for (const player of state.players) {
    if (player.status === 'defeated') continue;
    const army = [...next.commanders.values()].filter(cmd => cmd.playerId === player.id);
    const king = army.find(cmd => cmd.isKing);
    const captured = [...next.banners.values()].some(b => b.playerId === player.id && b.status === 'captured');
    if (king && king.health > 0 && !captured) continue;
    const reason = captured ? 'banner_captured' : 'king_defeated';
    lastReason = reason;
    const commanders = new Map([...next.commanders].filter(([, cmd]) => cmd.playerId !== player.id));
    const banners = new Map([...next.banners].map(([id, b]) => [id, b.playerId === player.id ? { ...b, status: 'captured' as const } : b]));
    next = logEvent({ ...next, commanders, banners, players: next.players.map(p => p.id === player.id ?
      { ...p, status: 'defeated', defeatReason: reason, isActive: false, commanders: [] } : p) }, {
      type: 'playerDefeated', playerId: player.id, details: { reason },
    });
  }
  const survivors = next.players.filter(p => p.status !== 'defeated');
  if (survivors.length <= 1) {
    const winner = survivors[0]?.id;
    const reason = winner ? lastReason ?? next.players.find(p => p.defeatReason)?.defeatReason ?? 'king_defeated' : 'stalemate';
    next = logEvent({ ...next, gameStatus: 'finished', winner, finishReason: reason,
      holdingDecisions: [], players: next.players.map(p => ({ ...p, isActive: false })) }, {
      type: 'gameEnd', playerId: winner ?? next.activePlayerId, details: { reason, winner },
    });
  } else if (!survivors.some(p => p.id === next.activePlayerId)) {
    next = advanceTurn(next);
  }
  return next === state ? state : synchronizeState(next);
}

function advanceTurn(state: GameState): GameState {
  const current = state.players.findIndex(player => player.id === state.activePlayerId);
  if (current < 0) throw new GameRuleError('Active player not found', GameErrorCode.NOT_PLAYER_TURN);
  let index = (current + 1) % state.players.length;
  while (state.players[index].status === 'defeated') index = (index + 1) % state.players.length;
  const newRound = index <= current;
  return {
    ...state, activePlayerId: state.players[index].id, turnNumber: state.turnNumber + Number(newRound),
    holdingDecisions: [],
    players: state.players.map((p, i) => ({ ...p, isActive: i === index })),
    commanders: new Map([...state.commanders].map(([id, cmd]) => [id,
      newRound || cmd.playerId === state.players[index].id ? { ...cmd, hasActedThisTurn: false } : cmd])),
  };
}

export function endTurn(state: GameState, playerId: PlayerId = state.activePlayerId): GameState {
  // Reject a foreign request before processing even an externally supplied defeat.
  if (state.gameStatus !== 'active' || playerId !== state.activePlayerId) {
    throw new GameRuleError('Game not active or not player turn', GameErrorCode.NOT_PLAYER_TURN);
  }
  const settled = checkAndApplyVictoryConditions(state);
  if (settled.gameStatus === 'finished' || settled.activePlayerId !== playerId) return settled;
  const reason = actionError(settled, playerId);
  if (reason) throw new GameRuleError(reason, GameErrorCode.NOT_PLAYER_TURN);
  const next = advanceTurn(settled);
  return logEvent(next, { type: 'endTurn', playerId,
    details: { nextPlayerId: next.activePlayerId, newRound: next.turnNumber !== settled.turnNumber } });
}

export function getCurrentPlayer(state: GameState): Player {
  const player = state.players.find(p => p.id === state.activePlayerId);
  if (!player) throw new GameRuleError('Active player not found', GameErrorCode.NOT_PLAYER_TURN);
  return player;
}

export function getWinner(state: GameState): Player | undefined {
  return state.gameStatus === 'finished' ? state.players.find(p => p.id === state.winner) : undefined;
}

export function getGameFinishReason(state: GameState): { finished: boolean; reason?: GameState['finishReason'] } {
  return state.gameStatus === 'finished' ? { finished: true, reason: state.finishReason } : { finished: false };
}
