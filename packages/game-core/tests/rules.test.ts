import {
  applyCommand, canMove, moveCommander, getValidMoves, canAttack, getValidAttacks, getEffectiveTroopType,
  getHoldingCommander, getPendingHoldingChoices, setHoldingTarget, endTurn, getOccupant,
  createMoveCommand, createAttackCommand, createEndTurnCommand, isCommandValid, createPlayerId,
  synchronizeState, GameCommand,
} from '../src';
import { scenario, waiveHolding, id } from './fixtures';

describe('Authoritative movement and commands', () => {
  test('events retain their original round after later turn changes', () => {
    const initial = scenario([{ id: 'a', player: 0, position: { x: 10, y: 10 } }]);
    const moved = moveCommander(initial, id('a'), { x: 11, y: 10 });
    const nextRound = endTurn(endTurn(moved));
    expect(nextRound.turnNumber).toBe(2);
    expect(nextRound.log.find(event => event.type === 'move')?.details.turnNumber).toBe(1);
    expect(initial.log).toHaveLength(1);
  });

  test('diagonal moves cost one action and update all occupancy queries without mutating input', () => {
    const state = scenario([{ id: 'a', player: 0, position: { x: 10, y: 10 } }]);
    const target = { x: 11, y: 11 };
    expect(getValidMoves(state, id('a'))).toContainEqual(target);
    const result = applyCommand(state, createMoveCommand(state.activePlayerId, id('a'), target));
    expect(getOccupant(result.board, target)).toBe('a');
    expect(getOccupant(result.board, { x: 10, y: 10 })).toBeUndefined();
    expect(getOccupant(state.board, { x: 10, y: 10 })).toBe('a');
    expect(result.commanders.get(id('a'))!.hasActedThisTurn).toBe(true);
    expect(result.log[result.log.length - 1].type).toBe('move');
    expect(() => moveCommander(result, id('a'), { x: 10, y: 10 })).toThrow();
    target.x = 0;
    expect(result.commanders.get(id('a'))!.position.x).toBe(11);
  });

  test('cavalry can jump a friendly intermediate figure but cannot end on it', () => {
    const state = scenario([
      { id: 'a', player: 0, type: 'cavalry', position: { x: 10, y: 10 } },
      { id: 'friend', player: 0, position: { x: 11, y: 11 } },
    ]);
    expect(canMove(state, id('a'), { x: 12, y: 12 }).valid).toBe(true);
    expect(canMove(state, id('a'), { x: 11, y: 11 }).valid).toBe(false);
    const blocked = scenario([
      { id: 'a', player: 0, type: 'cavalry', position: { x: 10, y: 10 } },
      { id: 'enemy', player: 1, type: 'cavalry', position: { x: 11, y: 11 } },
    ]);
    expect(canMove(blocked, id('a'), { x: 12, y: 12 }).valid).toBe(false);
  });

  test.each(['infantry', 'archer', 'cavalry'] as const)('empty %s moves as cavalry', type => {
    const state = scenario([{ id: 'a', player: 0, type, bonuses: [], position: { x: 10, y: 10 } }]);
    expect(getEffectiveTroopType(state.commanders.get(id('a'))!)).toBe('cavalry');
    expect(canMove(state, id('a'), { x: 12, y: 12 }).valid).toBe(true);
  });

  test('rejects wrong owner, actor, status, missing commander, coordinates and stationary moves', () => {
    const state = scenario([{ id: 'a', player: 0, position: { x: 10, y: 10 } }]);
    for (const target of [{ x: NaN, y: 10 }, { x: 10, y: 0.5 }, { x: 24, y: 0 }, { x: 10, y: 10 }, { x: 15, y: 15 }]) {
      expect(() => moveCommander(state, id('a'), target)).toThrow();
    }
    expect(() => moveCommander(state, id('missing'), { x: 11, y: 10 })).toThrow();
    expect(() => moveCommander(state, state.players[1].commanders[0], { x: 11, y: 10 })).toThrow();
    expect(() => moveCommander(state, id('a'), { x: 11, y: 10 }, state.players[1].id)).toThrow();
    expect(() => moveCommander({ ...state, gameStatus: 'setup' }, id('a'), { x: 11, y: 10 })).toThrow();
    expect(() => moveCommander({ ...state, gameStatus: 'finished' }, id('a'), { x: 11, y: 10 })).toThrow();
    expect(getValidMoves(state, id('missing'))).toEqual([]);
    expect(() => endTurn(state, createPlayerId('unknown'))).toThrow();
  });

  test('standing banners block destination and intermediate paths', () => {
    const state = scenario([{ id: 'a', player: 0, type: 'cavalry', position: { x: 10, y: 5 } }]);
    expect(canMove(state, id('a'), { x: 11, y: 6 }).valid).toBe(false);
    expect(canMove(state, id('a'), { x: 12, y: 7 }).valid).toBe(false);
  });

  test.each([null, {}, { type: 'unknown', playerId: 'p' }, { type: 'move', playerId: 'p', commanderId: 'a', target: 1 },
    { type: 'move', playerId: 'p', commanderId: 'a', target: { x: 0.1, y: 0 } },
    { type: 'attack', playerId: 'p', attackerId: 'a', targetId: 'b', diceRolls: [7] },
    { type: 'hold', playerId: 'p', holderId: 'a' }, { type: 'capture', playerId: 'p' },
  ])('rejects malformed command %j', command => {
    expect(isCommandValid(command)).toBe(false);
    expect(() => applyCommand(scenario([]), command as GameCommand)).toThrow();
  });

  test('builders create structurally valid commands and end-turn dispatch advances player', () => {
    const state = scenario([]);
    expect(isCommandValid(createAttackCommand(state.activePlayerId, id('a'), id('b'), [1, 6]))).toBe(true);
    const command = createEndTurnCommand(state.activePlayerId);
    expect(applyCommand(state, command).activePlayerId).toBe(state.players[1].id);
  });
});

describe('Holding responses', () => {
  const figures = [
    { id: 'a', player: 0, position: { x: 10, y: 10 }, bonuses: [] },
    { id: 'b', player: 0, position: { x: 10, y: 11 } },
    { id: 'holder', player: 1, position: { x: 11, y: 10 } },
    { id: 'third', player: 2, position: { x: 11, y: 11 } },
  ];

  test('only infantry owner selects among active-player figures, including empty commanders', () => {
    const state = scenario(figures, 3);
    const choice = getPendingHoldingChoices(state).find(c => c.holderId === id('holder'))!;
    expect(choice.candidates).toEqual(['a', 'b']);
    expect(canMove(state, id('a'), { x: 9, y: 9 }).reason).toBe('Holding response required');
    expect(() => endTurn(state)).toThrow('Holding response required');
    expect(() => setHoldingTarget(state, state.players[0].id, id('holder'), id('a'))).toThrow();
    expect(() => setHoldingTarget(state, state.players[1].id, id('holder'), id('third'))).toThrow();
    // Resolve whichever owner's reaction precedes holder by the documented seat order.
    let next = state;
    while (getPendingHoldingChoices(next)[0].holderId !== id('holder')) {
      const first = getPendingHoldingChoices(next)[0];
      next = setHoldingTarget(next, first.playerId, first.holderId, null);
    }
    next = applyCommand(next, { type: 'hold', playerId: choice.playerId, holderId: id('holder'), targetId: id('a') });
    next = waiveHolding(next);
    expect(getHoldingCommander(next, id('a'))?.id).toBe('holder');
    expect(canMove(next, id('a'), { x: 9, y: 9 }).valid).toBe(false);
    expect(canAttack(next, id('a'), id('holder')).valid).toBe(true);
    expect(canAttack(next, id('a'), id('third')).valid).toBe(false);
    expect(getValidAttacks(next, id('a'))).toEqual(['holder']);
    const released = setHoldingTarget(next, choice.playerId, id('holder'), null);
    expect(canMove(released, id('a'), { x: 9, y: 9 }).valid).toBe(true);
    expect(next.commanders.get(id('holder'))!.hasActedThisTurn).toBe(false);
  });

  test('held archers with units cannot attack their holder or escape', () => {
    let state = scenario([
      { id: 'archer', player: 0, type: 'archer', position: { x: 10, y: 10 } },
      { id: 'holder', player: 1, position: { x: 11, y: 10 } },
    ]);
    state = setHoldingTarget(state, state.players[1].id, id('holder'), id('archer'));
    expect(canAttack(state, id('archer'), id('holder')).valid).toBe(false);
    expect(getValidMoves(state, id('archer'))).toEqual([]);
  });

  test('one target cannot be held twice, empty infantry cannot hold and turn change clears decisions', () => {
    let state = scenario([
      { id: 'a', player: 0, position: { x: 10, y: 10 } },
      { id: 'h1', player: 1, position: { x: 11, y: 10 } },
      { id: 'h2', player: 1, position: { x: 10, y: 11 } },
      { id: 'empty', player: 1, bonuses: [], position: { x: 9, y: 10 } },
    ]);
    expect(getPendingHoldingChoices(state).map(c => c.holderId)).toEqual(['h1', 'h2']);
    state = setHoldingTarget(state, state.players[1].id, id('h1'), id('a'));
    expect(getPendingHoldingChoices(state)).toEqual([]);
    expect(() => setHoldingTarget(state, state.players[1].id, id('h2'), id('a'))).toThrow();
    expect(endTurn(state).holdingDecisions).toEqual([]);
  });

  test('loss of holder units releases the target', () => {
    let state = scenario([
      { id: 'a', player: 0, position: { x: 10, y: 10 } },
      { id: 'h', player: 1, position: { x: 11, y: 10 } },
    ]);
    state = setHoldingTarget(state, state.players[1].id, id('h'), id('a'));
    const commanders = new Map(state.commanders);
    commanders.set(id('h'), { ...commanders.get(id('h'))!, units: [null, null, null, null] });
    const released = synchronizeState({ ...state, commanders });
    expect(getHoldingCommander(released, id('a'))).toBeUndefined();
    expect(canMove(released, id('a'), { x: 9, y: 9 }).valid).toBe(true);
  });

  test('entering infantry adjacency creates a response; leaving expires the old waiver', () => {
    const state = scenario([
      { id: 'a', player: 0, position: { x: 9, y: 10 } },
      { id: 'h', player: 1, position: { x: 11, y: 10 } },
    ]);
    expect(getPendingHoldingChoices(state)).toEqual([]);
    const entered = moveCommander(state, id('a'), { x: 10, y: 10 });
    expect(getPendingHoldingChoices(entered)[0].candidates).toEqual(['a']);
    const waived = waiveHolding(entered);
    const commanders = new Map(waived.commanders);
    commanders.set(id('a'), { ...commanders.get(id('a'))!, position: { x: 9, y: 10 } });
    const left = synchronizeState({ ...waived, commanders });
    expect(left.holdingDecisions).toEqual([]);
    commanders.set(id('a'), { ...commanders.get(id('a'))!, position: { x: 10, y: 10 } });
    expect(getPendingHoldingChoices(synchronizeState({ ...left, commanders }))[0].candidates).toEqual(['a']);
  });
});
