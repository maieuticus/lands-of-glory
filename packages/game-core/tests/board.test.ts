import { createEmptyBoard, getLineOfSight, getTile, hasLineOfSight, isPositionInBounds } from '../src/board';
import { Board, Position } from '../src/types';

describe('Board coordinate validation', () => {
  test.each([NaN, Infinity, -Infinity, -1, 24, 0.5])('rejects coordinate %s on either axis', value => {
    const board = createEmptyBoard();
    for (const position of [{ x: value, y: 0 }, { x: 0, y: value }]) {
      expect(isPositionInBounds(position)).toBe(false);
      expect(getTile(board, position)).toBeUndefined();
    }
  });
});

describe('Line of sight', () => {
  test('rejects invalid endpoints before starting the traversal', () => {
    expect(() => getLineOfSight({ x: 0.5, y: 0 }, { x: 1, y: 1 })).toThrow(RangeError);
    expect(() => getLineOfSight({ x: 0, y: 0 }, { x: NaN, y: 1 })).toThrow(RangeError);
  });
  test.each<Position>([
    { x: 11, y: 10 }, { x: 9, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 9 },
    { x: 11, y: 11 }, { x: 9, y: 9 }, { x: 9, y: 11 }, { x: 11, y: 9 },
  ])('includes the adjacent destination %j', target => {
    expect(getLineOfSight({ x: 10, y: 10 }, target)).toEqual([target]);
  });

  test('includes intermediate tiles and destination, but excludes origin', () => {
    expect(getLineOfSight({ x: 1, y: 1 }, { x: 4, y: 1 })).toEqual([
      { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
    ]);
    expect(getLineOfSight({ x: 4, y: 4 }, { x: 2, y: 2 })).toEqual([
      { x: 3, y: 3 }, { x: 2, y: 2 },
    ]);
    expect(getLineOfSight({ x: 1, y: 1 }, { x: 1, y: 1 })).toEqual([]);
  });

  test('checks blocking terrain at the destination as well as intermediate tiles', () => {
    const original = createEmptyBoard();
    const board: Board = {
      ...original,
      tiles: original.tiles.map(column => column.map(tile =>
        tile.position.x === 2 && tile.position.y === 1 ? { ...tile, terrain: 'water' } : tile
      )),
    };
    expect(hasLineOfSight(board, { x: 1, y: 1 }, { x: 2, y: 1 })).toBe(false);
    expect(hasLineOfSight(board, { x: 1, y: 1 }, { x: 3, y: 1 })).toBe(false);
    expect(hasLineOfSight(original, { x: 1, y: 1 }, { x: 3, y: 1 })).toBe(true);
  });
});
