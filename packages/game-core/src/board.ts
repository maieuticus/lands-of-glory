/**
 * packages/game-core/src/board.ts
 *
 * Board representation and management
 *
 * Provides:
 * - 24×24 grid creation and manipulation
 * - Terrain support (grass, water, mountain, forest)
 * - Occupancy tracking (which commander is on which tile)
 * - Board state queries (terrain, occupant, validity)
 */

import {
  Board,
  Tile,
  Position,
  CommanderId,
  TerrainType,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from './types';

/**
 * Create a new empty board with all grass tiles
 *
 * @returns New 24×24 board with all tiles set to grass
 */
export function createEmptyBoard(): Board {
  const tiles: Tile[][] = [];

  for (let x = 0; x < BOARD_WIDTH; x++) {
    tiles[x] = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      tiles[x][y] = {
        position: { x, y },
        terrain: 'grass',
      };
    }
  }

  return {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    tiles: tiles as readonly (readonly Tile[])[],
  };
}

/**
 * Get a tile at a specific position
 *
 * @param board - Game board
 * @param position - Position to query
 * @returns Tile at position, or undefined if out of bounds
 */
export function getTile(board: Board, position: Position): Tile | undefined {
  if (!isPositionInBounds(position)) {
    return undefined;
  }
  return board.tiles[position.x][position.y];
}

/**
 * Get the occupant (commander) at a position, if any
 *
 * @param board - Game board
 * @param position - Position to query
 * @returns CommanderId if occupied, undefined if empty
 */
export function getOccupant(board: Board, position: Position): CommanderId | undefined {
  const tile = getTile(board, position);
  return tile?.occupant;
}

/**
 * Check if a position is within board bounds (0-23 for both x and y)
 *
 * @param position - Position to check
 * @returns true if position is valid board coordinate
 */
export function isPositionInBounds(position: Position): boolean {
  return (
    Number.isInteger(position.x) &&
    Number.isInteger(position.y) &&
    position.x >= 0 &&
    position.x < BOARD_WIDTH &&
    position.y >= 0 &&
    position.y < BOARD_HEIGHT
  );
}

/**
 * Check if a position is walkable (not water, not occupied by non-moving unit)
 *
 * For movement purposes, we consider terrain cost.
 * Water terrain is impassable.
 *
 * @param board - Game board
 * @param position - Position to check
 * @returns true if position can be traversed
 */
export function isPositionWalkable(board: Board, position: Position): boolean {
  const tile = getTile(board, position);
  if (!tile) {
    return false;
  }

  if (tile.terrain === 'water') {
    return false;
  }

  return true;
}

/**
 * Check if a position is empty (no commander occupying it)
 *
 * @param board - Game board
 * @param position - Position to check
 * @returns true if no commander present
 */
export function isPositionEmpty(board: Board, position: Position): boolean {
  return getOccupant(board, position) === undefined;
}

/**
 * Get the terrain at a position
 *
 * @param board - Game board
 * @param position - Position to query
 * @returns Terrain type, or 'grass' if out of bounds
 */
export function getTerrain(board: Board, position: Position): TerrainType {
  const tile = getTile(board, position);
  return tile?.terrain ?? 'grass';
}

/**
 * Create a new board with a commander placed at a position
 *
 * Assumes position is empty and valid.
 *
 * @param board - Current board
 * @param position - Position to place commander
 * @param commanderId - Commander to place
 * @returns New board with commander at position
 */
export function placeCommander(
  board: Board,
  position: Position,
  commanderId: CommanderId
): Board {
  if (!isPositionInBounds(position)) {
    throw new Error('Position out of bounds');
  }

  if (!isPositionEmpty(board, position)) {
    throw new Error('Position already occupied');
  }

  const newTiles = board.tiles.map((col, x) =>
    col.map((tile, y) => {
      if (x === position.x && y === position.y) {
        return { ...tile, occupant: commanderId };
      }
      return tile;
    })
  );

  return {
    ...board,
    tiles: newTiles as readonly (readonly Tile[])[],
  };
}

/**
 * Create a new board with a commander removed from a position
 *
 * Assumes position contains the specified commander.
 *
 * @param board - Current board
 * @param position - Position to clear
 * @returns New board with position empty
 */
export function removeCommanderFromPosition(
  board: Board,
  position: Position
): Board {
  const newTiles = board.tiles.map((col, x) =>
    col.map((tile, y) => {
      if (x === position.x && y === position.y) {
        const rest = { ...tile };
        delete rest.occupant;
        return rest;
      }
      return tile;
    })
  );

  return {
    ...board,
    tiles: newTiles as readonly (readonly Tile[])[],
  };
}

/**
 * Move a commander from one position to another
 *
 * This is a convenience function combining remove + place.
 *
 * @param board - Current board
 * @param fromPosition - Current commander position
 * @param toPosition - New commander position
 * @param commanderId - Commander to move
 * @returns New board with commander at new position
 */
export function moveCommanderOnBoard(
  board: Board,
  fromPosition: Position,
  toPosition: Position,
  commanderId: CommanderId
): Board {
  const removed = removeCommanderFromPosition(board, fromPosition);
  return placeCommander(removed, toPosition, commanderId);
}

/**
 * Get all adjacent positions in the eight movement directions.
 *
 * Only returns positions that are in bounds.
 *
 * @param position - Center position
 * @returns Array of adjacent positions
 */
export function getAdjacentPositions(position: Position): Position[] {
  const adjacent: Position[] = [
    { x: position.x - 1, y: position.y }, // left
    { x: position.x + 1, y: position.y }, // right
    { x: position.x, y: position.y - 1 }, // up
    { x: position.x, y: position.y + 1 }, // down
    { x: position.x - 1, y: position.y - 1 },
    { x: position.x + 1, y: position.y - 1 },
    { x: position.x - 1, y: position.y + 1 },
    { x: position.x + 1, y: position.y + 1 },
  ];

  return adjacent.filter(isPositionInBounds);
}

/**
 * Get all positions within a certain distance (Chebyshev distance)
 *
 * Chebyshev distance is max(|dx|, |dy|), which is more suitable for grid-based games.
 *
 * @param position - Center position
 * @param distance - Maximum distance (inclusive)
 * @returns Array of positions within distance
 */
export function getPositionsWithinDistance(
  position: Position,
  distance: number
): Position[] {
  const positions: Position[] = [];

  for (let x = position.x - distance; x <= position.x + distance; x++) {
    for (let y = position.y - distance; y <= position.y + distance; y++) {
      const pos = { x, y };
      if (isPositionInBounds(pos)) {
        positions.push(pos);
      }
    }
  }

  return positions;
}

/**
 * Calculate Chebyshev distance between two positions
 *
 * This is the maximum of the absolute differences of coordinates.
 * Suitable for grid-based games with diagonal movement.
 *
 * @param from - Starting position
 * @param to - Target position
 * @returns Distance in tiles
 */
export function calculateDistance(from: Position, to: Position): number {
  return Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
}

/**
 * Check if two positions are adjacent (distance = 1)
 *
 * @param position1 - First position
 * @param position2 - Second position
 * @returns true if adjacent
 */
export function areAdjacent(position1: Position, position2: Position): boolean {
  return calculateDistance(position1, position2) === 1;
}

/**
 * Get line of sight from one position to another
 *
 * Uses Bresenham's line algorithm to determine which tiles are in line of sight.
 * Returns all positions along the line.
 *
 * @param from - Starting position
 * @param to - Target position
 * @returns Array of positions along line
 */
export function getLineOfSight(from: Position, to: Position): Position[] {
  if (!isPositionInBounds(from) || !isPositionInBounds(to)) {
    throw new RangeError('Line of sight requires valid board coordinates');
  }
  const positions: Position[] = [];
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;
  let err = dx - dy;

  let x = from.x;
  let y = from.y;

  while (x !== to.x || y !== to.y) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    // Include each reached tile, including the destination, but not the origin.
    positions.push({ x, y });
  }

  return positions;
}

/**
 * Check if there is line of sight between two positions
 *
 * Line of sight exists if there are no water tiles blocking the path.
 *
 * @param board - Game board
 * @param from - Starting position
 * @param to - Target position
 * @returns true if line of sight exists
 */
export function hasLineOfSight(board: Board, from: Position, to: Position): boolean {
  const line = getLineOfSight(from, to);
  return line.every((pos) => getTerrain(board, pos) !== 'water');
}
