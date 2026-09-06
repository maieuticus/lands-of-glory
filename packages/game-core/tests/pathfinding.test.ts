import {
  createEmptyBoard, findPath, getPathCost, getReachablePositions, isReachable, getAdjacentPositions,
  getTerrainCost, placeCommander, removeCommanderFromPosition, moveCommanderOnBoard, createCommanderId,
  getOccupant, Board,
} from '../src';

describe('Shared pathfinding', () => {
  test('eight directions, unique reachable tiles and diagonal cost one', () => {
    const board = createEmptyBoard();
    expect(getAdjacentPositions({ x: 0, y: 0 })).toHaveLength(3);
    const reachable = getReachablePositions(board, { x: 10, y: 10 }, 1);
    expect(reachable).toHaveLength(9);
    expect(new Set(reachable.map(p => `${p.x},${p.y}`)).size).toBe(9);
    const path = findPath(board, { x: 10, y: 10 }, { x: 12, y: 12 }, 2);
    expect(getPathCost(board, path)).toBe(2);
    expect(isReachable(board, { x: 10, y: 10 }, { x: 12, y: 12 }, 1)).toBe(false);
  });

  test('occupied tiles are excluded by default and invalid coordinates/costs return no path', () => {
    const empty = createEmptyBoard();
    const occupied = placeCommander(empty, { x: 1, y: 1 }, createCommanderId('a'));
    expect(findPath(occupied, { x: 0, y: 0 }, { x: 1, y: 1 }, 2)).toEqual([]);
    expect(findPath(empty, { x: 0, y: 0 }, { x: 24, y: 0 }, 2)).toEqual([]);
    expect(findPath(empty, { x: -1, y: 0 }, { x: 1, y: 1 }, 2)).toEqual([]);
    for (const limit of [-1, NaN, Infinity]) expect(getReachablePositions(empty, { x: 0, y: 0 }, limit)).toEqual([]);
    expect(findPath(empty, { x: 0, y: 0 }, { x: 0, y: 0 }, 0)).toEqual([{ x: 0, y: 0 }]);
  });

  test('terrain helpers respect weighted paths and water without adding terrain to the default game', () => {
    const board = createEmptyBoard();
    const water: Board = { ...board, tiles: board.tiles.map(column => column.map(tile =>
      tile.position.x === 1 ? { ...tile, terrain: 'water' } : tile)) };
    expect(findPath(water, { x: 0, y: 0 }, { x: 2, y: 0 }, 10)).toEqual([]);
    expect(getTerrainCost('forest')).toBe(1.5);
    expect(getTerrainCost('mountain')).toBe(2);
    expect(getTerrainCost('unknown')).toBe(1);
    expect(getPathCost(board, [])).toBe(0);
  });

  test('immutable board placement helpers clear origin and reject overlap', () => {
    const board = createEmptyBoard();
    const id = createCommanderId('a');
    const placed = placeCommander(board, { x: 1, y: 1 }, id);
    expect(getOccupant(board, { x: 1, y: 1 })).toBeUndefined();
    expect(() => placeCommander(placed, { x: 1, y: 1 }, id)).toThrow('occupied');
    expect(() => placeCommander(board, { x: 24, y: 1 }, id)).toThrow('bounds');
    const moved = moveCommanderOnBoard(placed, { x: 1, y: 1 }, { x: 2, y: 2 }, id);
    expect(getOccupant(moved, { x: 1, y: 1 })).toBeUndefined();
    expect(getOccupant(moved, { x: 2, y: 2 })).toBe(id);
    expect(getOccupant(removeCommanderFromPosition(moved, { x: 2, y: 2 }), { x: 2, y: 2 })).toBeUndefined();
  });
});
