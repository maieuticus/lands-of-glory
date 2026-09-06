import {
  createGame, getStartArea, getDefaultArmyConfig, createEmptyCommanderConfig, validateArmyConfig,
  buildArmy, calculateArmyCost, createPlayerId, ArmyConfig, CommanderBuildConfig, TroopType,
  getOccupant, createRNG, SeededRNG, getCurrentPlayer, getMinimalArmyConfig,
} from '../src';

describe('Disjoint start areas and army validation', () => {
  test.each([2, 3, 4])('supports minimum, default and maximum armies for %i players', count => {
    for (const size of [1, 6, 72]) {
      const army: ArmyConfig = size === 6 ? getDefaultArmyConfig() : {
        commanders: Array.from({ length: size }, (_, i) => createEmptyCommanderConfig(i === 0 ? 'king' : 'captain', 'infantry')),
      };
      const state = createGame({ startingBudget: 100, players: Array.from({ length: count }, (_, i) => ({
        name: `P${i}`, color: '#fff', armyConfig: army,
      })) });
      const all = [...state.commanders.values(), ...state.banners.values()].map(c => `${c.position.x},${c.position.y}`);
      expect(new Set(all).size).toBe(count * (size + 1));
      for (const cmd of state.commanders.values()) {
        expect(getOccupant(state.board, cmd.position)).toBe(cmd.id);
        expect(state.players.find(p => p.id === cmd.playerId)?.commanders).toContain(cmd.id);
        expect(cmd.position.x).toBeGreaterThanOrEqual(0);
        expect(cmd.position.x).toBeLessThan(24);
        expect(cmd.position.y).toBeGreaterThanOrEqual(0);
        expect(cmd.position.y).toBeLessThan(24);
      }
      expect(getCurrentPlayer(state).id).toBe(state.players[0].id);
    }
  });

  test('seeded formation is reproducible and independent of the caller configuration', () => {
    const config = { seed: 42, players: [{ name: 'a', color: '#fff' }, { name: 'b', color: '#000' }] };
    const state = createGame(config);
    expect(createGame(config)).toEqual(state);
    expect(createGame({ ...config, seed: 21 }).commanders).not.toEqual(state.commanders);
    expect([...state.commanders.values()].map(c => c.id)).toEqual([...createGame({ ...config, seed: 21 }).commanders.keys()]);
  });

  test('rejects oversized armies, invalid seats and budgets for every player', () => {
    const commanders = Array.from({ length: 73 }, (_, i) => createEmptyCommanderConfig(i === 0 ? 'king' : 'captain', 'infantry'));
    expect(validateArmyConfig({ commanders }, 100).valid).toBe(false);
    expect(() => createGame({ startingBudget: 100, players: [
      { name: 'a', color: '#fff', armyConfig: { commanders } }, { name: 'b', color: '#000' },
    ] })).toThrow('capacity');
    for (const [seat, count] of [[-1, 2], [2, 2], [0, 1], [0, 5], [0.5, 2]]) expect(() => getStartArea(seat, count)).toThrow();
    for (const budget of [-1, NaN, Infinity, 10.5, 48]) {
      expect(validateArmyConfig(getDefaultArmyConfig(), budget).valid).toBe(false);
    }
    expect(() => createGame({ startingBudget: 2, players: [
      { name: 'a', color: '#fff', armyConfig: getMinimalArmyConfig() }, { name: 'b', color: '#000' },
    ] })).toThrow('budget');
  });

  test.each(['infantry', 'cavalry', 'archer'] as const)('cost and free unit construction agree for %s', type => {
    const config: ArmyConfig = { commanders: [{ type: 'king', troopType: type, slots: [
      { hasUnit: true, bonusPoints: 1 }, { hasUnit: true, bonusPoints: 2 },
      { hasUnit: true, bonusPoints: 3 }, { hasUnit: false, bonusPoints: 0 },
    ] }] };
    const cost = calculateArmyCost(config);
    expect(cost.totalCost).toBe(9);
    expect(cost.freeBonusUnits).toBe(type === 'infantry' ? 1 : 0);
    for (const free of [false, true]) {
      const units = buildArmy(createPlayerId('p'), config, [{ x: 1, y: 1 }], free, 9)[0].units.filter(u => u !== null);
      expect(units).toHaveLength(free && type === 'infantry' ? 4 : 3);
      expect(units.map(u => u.bonusPoints)).toEqual(free && type === 'infantry' ? [1, 2, 3, 1] : [1, 2, 3]);
    }
    expect(() => buildArmy(createPlayerId('p'), config, [{ x: 1, y: 1 }], true, 8)).toThrow('budget');
    expect(calculateArmyCost(config, false).freeBonusUnits).toBe(0);
  });

  test('explicit fourth unit is charged; malformed configs and noninteger bonuses are rejected', () => {
    expect(calculateArmyCost(getDefaultArmyConfig()).totalCost).toBe(49);
    const king = getDefaultArmyConfig().commanders[0];
    for (const config of [null, { commanders: [null] }, { commanders: [{ ...king, slots: [null] }] }]) {
      expect(validateArmyConfig(config as unknown as ArmyConfig).valid).toBe(false);
    }
    for (const bonusPoints of [NaN, Infinity, -1, 4, 1.5]) {
      const invalid = { commanders: [{ ...king, slots: [{ hasUnit: true, bonusPoints }, ...king.slots.slice(1)] }] };
      expect(validateArmyConfig(invalid as ArmyConfig).valid).toBe(false);
    }
    expect(validateArmyConfig({ commanders: [{ ...king, troopType: 'wizard' as TroopType }] }).valid).toBe(false);
    expect(validateArmyConfig({ commanders: [{ ...king, type: 'lord' as CommanderBuildConfig['type'] }] }).valid).toBe(false);
    expect(validateArmyConfig({ commanders: [{ ...king, slots: king.slots.slice(1) }] }).valid).toBe(false);
    expect(() => buildArmy(createPlayerId('p'), { commanders: [king] }, [{ x: 0.5, y: 0 }])).toThrow('positions');
    expect(() => buildArmy(createPlayerId('p'), { commanders: [king, { ...king, type: 'captain' }] }, [{ x: 1, y: 1 }, { x: 1, y: 1 }])).toThrow('positions');
  });
});

describe('Reproducible random stream', () => {
  test('snapshot roundtrip across MT19937 regeneration preserves stream', () => {
    const rng = createRNG(5489);
    expect(rng.nextInt(0x100000000)).toBe(3499211612);
    rng.rollDice(700);
    const snapshot = rng.getState();
    expect(SeededRNG.fromState(snapshot).rollDice(700)).toEqual(rng.rollDice(700));
    const value = rng.nextFloat();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
  test('rejects invalid seed, bounds, count and snapshot', () => {
    for (const value of [NaN, Infinity, 0.5]) expect(() => createRNG(value)).toThrow();
    const rng = createRNG(0);
    for (const value of [-1, 0, 0.5, Infinity, 0x100000001]) expect(() => rng.nextInt(value)).toThrow();
    for (const value of [-1, 0.5]) expect(() => rng.rollDice(value)).toThrow();
    expect(() => SeededRNG.fromState({ values: [], index: 0 })).toThrow();
    expect(() => SeededRNG.fromState({ ...rng.getState(), index: -1 })).toThrow();
  });
});
