import {
  resolveCombat, applyCombatResult, attackCommander, canAttack, canCaptureBanner, captureBanner,
  createRNG, endTurn, checkAndApplyVictoryConditions, calculateGameResults, getGameFinishReason,
  getWinner, getPlayerUnitBreakdown, getOccupant, TroopType, GameState, applyCommand,
} from '../src';
import { scenario, waiveHolding, id } from './fixtures';

describe('Confirmed combat rules', () => {
  test('highest natural roll gets highest unit bonus; king adds one to every pair', () => {
    const state = waiveHolding(scenario([
      { id: 'a', player: 0, position: { x: 10, y: 10 }, bonuses: [0, 3, 1, 2], king: true },
      { id: 'd', player: 1, position: { x: 11, y: 10 }, bonuses: [0, 0, 0, 0] },
    ]));
    const result = resolveCombat(state, id('a'), id('d'), undefined, [2, 6, 3, 5, 4, 1, 2, 3]);
    expect(result.attackerRolls.map(r => [r.unitId, r.naturalValue, r.bonusPoints, r.effectiveValue])).toEqual([
      ['a-unit-1', 6, 3, 10], ['a-unit-3', 5, 2, 8], ['a-unit-2', 3, 1, 5], ['a-unit-0', 2, 0, 3],
    ]);
    expect(result.defenderCasualties).toEqual(['d-unit-0', 'd-unit-1', 'd-unit-2', 'd-unit-3']);
  });

  const types: TroopType[] = ['infantry', 'cavalry', 'archer'];
  test.each(types.flatMap(a => types.map(d => [a, d] as const)))('tie table: %s attacks %s', (a, d) => {
    const state = waiveHolding(scenario([
      { id: 'a', player: 0, type: a, position: { x: 10, y: 10 } },
      { id: 'd', player: 1, type: d, position: { x: a === 'archer' ? 12 : 11, y: 10 } },
    ]));
    const result = resolveCombat(state, id('a'), id('d'), undefined, [4, 4]);
    const win = (a === 'infantry' && d !== 'infantry') || (a === 'cavalry' && d === 'archer');
    expect(result.pairs[0].attackerWins).toBe(win);
    expect(result.defenderCasualties).toHaveLength(Number(win));
    expect(result.attackerCasualties).toHaveLength(a === 'archer' ? 0 : Number(!win));
  });

  test.each([1, 2, 3, 4])('archer range %i', range => {
    const state = waiveHolding(scenario([
      { id: 'a', player: 0, type: 'archer', position: { x: 10, y: 10 } },
      { id: 'd', player: 1, position: { x: 10 + range, y: 10 } },
    ]));
    expect(canAttack(state, id('a'), id('d')).valid).toBe(range === 2 || range === 3);
  });

  test('empty former archers use cavalry rules and can die while attacking', () => {
    const state = waiveHolding(scenario([
      { id: 'a', player: 0, type: 'archer', position: { x: 10, y: 10 }, bonuses: [] },
      { id: 'd', player: 1, type: 'cavalry', position: { x: 11, y: 10 } },
    ]));
    const result = resolveCombat(state, id('a'), id('d'), undefined, [1, 6]);
    expect(result.attackerType).toBe('cavalry');
    expect(result.attackerCommanderDefeated).toBe(true);
    expect(applyCombatResult(state, result).commanders.has(id('a'))).toBe(false);
  });

  test('last unit loss leaves commander alive and excess dice cause no extra losses', () => {
    const state = waiveHolding(scenario([
      { id: 'a', player: 0, position: { x: 10, y: 10 }, bonuses: [0, 0, 0, 0] },
      { id: 'd', player: 1, position: { x: 11, y: 10 } },
    ]));
    const result = resolveCombat(state, id('a'), id('d'), undefined, [6, 6, 6, 6, 1]);
    expect(result.pairs).toHaveLength(1);
    expect(result.defenderCommanderDefeated).toBe(false);
    const next = applyCombatResult(state, result);
    expect(next.commanders.get(id('d'))!.units.filter(u => u?.status === 'active')).toHaveLength(0);
    expect(next.units.get(result.defenderCasualties[0])?.status).toBe('removed');
  });

  test('cavalry advances along a valid path then onto a defeated commander field', () => {
    const state = scenario([
      { id: 'a', player: 0, type: 'cavalry', position: { x: 10, y: 10 } },
      { id: 'd', player: 1, position: { x: 12, y: 12 }, bonuses: [] },
    ]);
    const result = resolveCombat(state, id('a'), id('d'), undefined, [6, 1]);
    expect(result.attackPosition).toEqual({ x: 11, y: 11 });
    expect(result.approachPath).toEqual([{ x: 10, y: 10 }, { x: 11, y: 11 }]);
    const next = applyCombatResult(state, result);
    expect(next.commanders.get(id('a'))!.position).toEqual({ x: 12, y: 12 });
    expect(getOccupant(next.board, { x: 12, y: 12 })).toBe('a');
    expect(next.commanders.has(id('d'))).toBe(false);
  });

  test('archer never advances and cavalry remains at approach field if defender survives', () => {
    for (const type of ['archer', 'cavalry'] as const) {
      const state = scenario([
        { id: 'a', player: 0, type, position: { x: 10, y: 10 } },
        { id: 'd', player: 1, type: 'cavalry', position: { x: 12, y: 12 } },
      ]);
      const next = attackCommander(state, id('a'), id('d'), [1, 6]);
      expect(next.commanders.get(id('a'))!.position).toEqual(type === 'archer' ? { x: 10, y: 10 } : { x: 11, y: 11 });
      expect(next.commanders.get(id('a'))!.hasActedThisTurn).toBe(true);
    }
  });

  test('invalid attack and blocked charge leave state and external RNG unchanged', () => {
    const state = scenario([
      { id: 'a', player: 0, type: 'cavalry', position: { x: 10, y: 10 } },
      { id: 'blocker', player: 1, type: 'cavalry', position: { x: 11, y: 11 } },
      { id: 'd', player: 1, type: 'cavalry', position: { x: 12, y: 12 } },
    ]);
    const rng = createRNG(42);
    const before = rng.getState();
    const log = state.log;
    expect(() => resolveCombat(state, id('a'), id('d'), rng)).toThrow('Attack path blocked');
    expect(() => resolveCombat(state, id('a'), id('a'), rng)).toThrow();
    expect(() => resolveCombat(state, id('d'), id('a'), rng)).toThrow();
    expect(rng.getState()).toEqual(before);
    expect(state.log).toBe(log);
    expect(state.commanders.get(id('a'))!.position).toEqual({ x: 10, y: 10 });
  });

  test.each([[0, 6], [7, 1], [NaN, 1], [1.5, 6], [1], [1, 2, 3]].map(dice => ({ dice })))('rejects invalid supplied dice $dice', ({ dice }) => {
    const state = waiveHolding(scenario([
      { id: 'a', player: 0, position: { x: 10, y: 10 } },
      { id: 'd', player: 1, position: { x: 11, y: 10 } },
    ]));
    const rng = createRNG(42);
    const before = rng.getState();
    expect(() => resolveCombat(state, id('a'), id('d'), rng, dice)).toThrow();
    expect(rng.getState()).toEqual(before);
  });

  test('stale, repeated and forged combat results are rejected', () => {
    const state = waiveHolding(scenario([
      { id: 'a', player: 0, position: { x: 10, y: 10 } },
      { id: 'd', player: 1, position: { x: 11, y: 10 } },
    ]));
    const result = resolveCombat(state, id('a'), id('d'), createRNG(10));
    expect(() => applyCombatResult(endTurn(state), result)).toThrow('Stale');
    expect(() => applyCombatResult(state, { ...result, defenderCommanderDefeated: true })).toThrow();
    expect(() => applyCombatResult(state, { ...result, rngAfter: null })).toThrow();
    const next = applyCombatResult(state, result);
    expect(() => applyCombatResult(next, result)).toThrow('Stale');
  });

  test('same state and actions reproduce dice, RNG continuation and logical logs', () => {
    const state = scenario([
      { id: 'a', player: 0, type: 'archer', position: { x: 10, y: 10 } },
      { id: 'd', player: 1, type: 'archer', position: { x: 12, y: 10 } },
    ]);
    const before = state.rngState;
    const one = attackCommander(state, id('a'), id('d'));
    const two = attackCommander(state, id('a'), id('d'));
    expect(one).toEqual(two);
    expect(one.rngState).not.toEqual(before);
    expect(state.rngState).toBe(before);
    expect(one.log[one.log.length - 1].details.rawDice).toHaveLength(2);
  });

  test('stored RNG continues through a second legal combat', () => {
    const state = scenario([
      { id: 'a', player: 0, type: 'archer', position: { x: 10, y: 10 }, bonuses: [3, 3, 3, 3] },
      { id: 'd', player: 1, type: 'archer', position: { x: 12, y: 10 }, bonuses: [3, 3, 3, 3] },
    ]);
    const first = attackCommander(state, id('a'), id('d'));
    const nextTurn = endTurn(first);
    const second = attackCommander(nextTurn, id('d'), id('a'));
    expect(second.rngState).not.toEqual(first.rngState);
    expect(second.log.filter(a => a.type === 'attack')).toHaveLength(2);
  });
});

describe('Elimination, capture and score', () => {
  test.each([2, 3, 4])('king defeat immediately eliminates player in a %i-player game', count => {
    const state = waiveHolding(scenario([
      { id: 'a', player: 0, position: { x: 10, y: 10 } },
      { id: 'king', player: 1, king: true, bonuses: [], position: { x: 11, y: 10 } },
    ], count));
    const next = attackCommander(state, id('a'), id('king'), [6, 1]);
    expect(next.players[1].status).toBe('defeated');
    expect([...next.commanders.values()].some(c => c.playerId === state.players[1].id)).toBe(false);
    expect(next.gameStatus).toBe(count === 2 ? 'finished' : 'active');
    expect(checkAndApplyVictoryConditions(next)).toBe(next);
    if (count > 2) expect(endTurn(waiveHolding(next)).activePlayerId).toBe(state.players[2].id);
    else {
      expect(next.winner).toBe(state.players[0].id);
      expect(getGameFinishReason(next).reason).toBe('king_defeated');
      expect(calculateGameResults(next)?.finishReason).toBe('king_defeated');
      expect(() => attackCommander(next, id('a'), id('king'))).toThrow();
      expect(() => endTurn(next)).toThrow();
    }
  });

  test('losing attacking king advances to next surviving player and skips a defeated seat at round boundary', () => {
    const state = scenario([
      { id: 'king', player: 0, king: true, bonuses: [], position: { x: 10, y: 10 } },
      { id: 'd', player: 1, type: 'cavalry', position: { x: 11, y: 10 } },
    ], 3);
    const next = attackCommander(state, id('king'), id('d'), [1, 6]);
    expect(next.activePlayerId).toBe(state.players[1].id);
    const round = endTurn(endTurn(next));
    expect(round.activePlayerId).toBe(state.players[1].id);
    expect(round.turnNumber).toBe(2);
  });

  test('banner capture consumes an action, moves onto the field and records correct end reason', () => {
    const state = scenario([{ id: 'a', player: 0, type: 'cavalry', position: { x: 11, y: 15 } }]);
    const banner = [...state.banners.values()].find(b => b.playerId === state.players[1].id)!;
    expect(canCaptureBanner(state, id('a'), banner.id).valid).toBe(true);
    const next = applyCommand(state, { type: 'capture', playerId: state.activePlayerId, attackerId: id('a'), bannerId: banner.id });
    expect(next.gameStatus).toBe('finished');
    expect(next.commanders.get(id('a'))!.position).toEqual(banner.position);
    expect(next.rngState).toEqual(state.rngState);
    expect(getGameFinishReason(next)).toEqual({ finished: true, reason: 'banner_captured' });
    expect(getWinner(next)?.id).toBe(state.activePlayerId);
    expect(next.log.slice(-3).map(a => a.type)).toEqual(['capture', 'playerDefeated', 'gameEnd']);
    expect(calculateGameResults(next)?.scores.find(p => p.playerId === state.players[1].id)?.totalScore).toBe(0);
  });

  test('archers, held figures, foreign actors and invalid banner targets cannot capture', () => {
    const state = scenario([{ id: 'a', player: 0, type: 'archer', position: { x: 11, y: 16 } }]);
    const banner = [...state.banners.values()][1];
    expect(() => captureBanner(state, id('a'), banner.id)).toThrow('Archers');
    expect(() => captureBanner(state, id('a'), banner.id, state.players[1].id)).toThrow();
    expect(() => captureBanner(state, id('a'), [...state.banners.keys()][0])).toThrow();
    expect(calculateGameResults(state)).toBeUndefined();
    expect(getWinner(state)).toBeUndefined();
    expect(getGameFinishReason(state)).toEqual({ finished: false });
    expect(getPlayerUnitBreakdown(state, state.players[0].id)).toHaveLength(2);
  });

  test('missing kings are detected and no-survivor external states have no invented winner', () => {
    const state = scenario([]);
    const noKings: GameState = { ...state, commanders: new Map() };
    const next = checkAndApplyVictoryConditions(noKings);
    expect(next.gameStatus).toBe('finished');
    expect(next.finishReason).toBe('stalemate');
    expect(next.winner).toBeUndefined();
    expect(checkAndApplyVictoryConditions(next)).toBe(next);
  });
});
