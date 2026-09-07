import { applyCombatResult, getHoldingCommander, resolveCombat, setHoldingTarget } from '@lands-of-glory/game-core';
import { scenario, waiveHolding, id } from '../../../packages/game-core/tests/fixtures';
import { GameController } from '../src/controller/game-controller';
import type { GameRenderer } from '../src/renderer/game-renderer';

let mockCompletion: (() => void) | undefined;
const mockPlay = jest.fn((...args: unknown[]) => { mockCompletion = args[5] as () => void; });
const mockClose = jest.fn((notify = true) => {
  const callback = mockCompletion;
  mockCompletion = undefined;
  if (notify) callback?.();
});
jest.mock('../src/renderer/combat-animation', () => ({
  DICE_SIZE_CONFIGS: { large: {} },
  CombatDiceAnimation: jest.fn().mockImplementation(() => ({
    play: mockPlay, close: mockClose, dispose: () => mockClose(false),
  })),
}));

describe('Controller with real Core and controlled animation completion', () => {
  let controller: GameController | undefined;
  const addEventListener = jest.fn();
  const removeEventListener = jest.fn();
  const renderer = {
    getApp: () => ({ view: { parentElement: null, addEventListener, removeEventListener } }),
    setDragCallbacks: jest.fn(), render: jest.fn(), showGameResults: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompletion = undefined;
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { addEventListener, removeEventListener } });
  });
  afterEach(() => {
    controller?.destroy();
    Reflect.deleteProperty(globalThis, 'window');
  });
  function mount(state: ReturnType<typeof scenario>): GameController {
    controller = new GameController(state, renderer as unknown as GameRenderer);
    controller.initializeGame();
    return controller;
  }

  test('holding an empty commander, releasing and undo use complete Core states', () => {
    const initial = scenario([
      { id: 'a', player: 0, bonuses: [], position: { x: 10, y: 10 } },
      { id: 'holder', player: 1, position: { x: 11, y: 10 } },
    ]);
    const game = mount(initial);
    expect(game.getInteractionPhase()).toBe('holding');
    expect(game.endCurrentTurn()).toBe(false);
    expect(game.performDrop(id('a'), { x: 9, y: 10 })).toBe(false);
    expect(game.chooseHoldingTarget(id('holder'), id('a'))).toBe(true);
    const held = game.getGameState();
    expect(held).toEqual(setHoldingTarget(initial, initial.players[1].id, id('holder'), id('a')));
    expect(game.releaseHoldingTarget(id('holder'))).toBe(true);
    expect(getHoldingCommander(game.getGameState(), id('a'))).toBeUndefined();
    expect(game.releaseHoldingTarget(id('holder'))).toBe(false);
    expect(game.undo()).toBe(true);
    expect(game.getGameState()).toBe(held);
    expect(getHoldingCommander(game.getGameState(), id('a'))?.id).toBe('holder');
  });

  test('combat blocks repeated actions and undo restores RNG, log and casualties together', () => {
    const source = waiveHolding(scenario([
      { id: 'a', player: 0, type: 'cavalry', position: { x: 10, y: 10 } },
      { id: 'd', player: 1, type: 'cavalry', position: { x: 11, y: 10 } },
    ]));
    const expected = applyCombatResult(source, resolveCombat(source, id('a'), id('d')));
    const game = mount(source);
    expect(game.performDrop(id('a'), { x: 11, y: 10 })).toBe(true);
    expect(game.getGameState()).toBe(source);
    expect(game.endCurrentTurn()).toBe(false);
    expect(game.undo()).toBe(false);
    expect(game.performDrop(id('a'), { x: 11, y: 10 })).toBe(false);
    expect(game.completeCombatAnimation()).toBe(true);
    expect(game.completeCombatAnimation()).toBe(false);
    expect(game.getGameState()).toEqual(expected);
    expect(game.undo()).toBe(true);
    expect(game.getGameState()).toBe(source);
    expect(game.performDrop(id('a'), { x: 11, y: 10 })).toBe(true);
    game.completeCombatAnimation();
    expect(game.getGameState()).toEqual(expected);
  });

  test('destroy invalidates a late animation callback and removes installed listeners', () => {
    const source = scenario([
      { id: 'a', player: 0, type: 'cavalry', position: { x: 10, y: 10 } },
      { id: 'd', player: 1, type: 'cavalry', position: { x: 11, y: 10 } },
    ]);
    const game = mount(source);
    game.performDrop(id('a'), { x: 11, y: 10 });
    const lateCallback = mockCompletion!;
    game.destroy();
    lateCallback();
    expect(game.getGameState()).toBe(source);
    expect(game.getInteractionPhase()).toBe('disposed');
    expect(removeEventListener).toHaveBeenCalledTimes(2);
    expect(mockClose).toHaveBeenCalledWith(false);
  });

  test('an animation startup failure clears its overlay and allows a subsequent action', () => {
    const source = scenario([
      { id: 'a', player: 0, type: 'cavalry', position: { x: 10, y: 10 } },
      { id: 'd', player: 1, type: 'cavalry', position: { x: 11, y: 10 } },
    ]);
    const game = mount(source);
    mockPlay.mockImplementationOnce(() => { throw new Error('Rendering failed'); });
    expect(game.performDrop(id('a'), { x: 11, y: 10 })).toBe(false);
    expect(mockClose).toHaveBeenCalledWith(false);
    expect(game.getGameState()).toBe(source);
    expect(game.getInteractionPhase()).toBe('idle');
    expect(game.performDrop(id('a'), { x: 9, y: 10 })).toBe(true);
  });
});
