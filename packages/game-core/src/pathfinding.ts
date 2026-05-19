/**
 * packages/game-core/src/pathfinding.ts
 *
 * A* pathfinding algorithm for terrain-aware movement
 *
 * Provides:
 * - A* shortest path calculation
 * - Terrain cost support (grass=1, forest=1.5, mountain=2, water=impassable)
 * - Movement range constraints
 * - Valid destination enumeration
 */

import { Position, Board, CommanderId, TroopType } from './types';
import {
  isPositionInBounds,
  isPositionEmpty,
  getAdjacentPositions,
  calculateDistance,
  getTerrain,
} from './board';

/**
 * Get the movement cost for traversing a terrain type
 *
 * @param terrain - Terrain type
 * @returns Movement cost (lower = faster)
 */
export function getTerrainCost(terrain: string): number {
  switch (terrain) {
    case 'grass':
      return 1.0;
    case 'forest':
      return 1.5;
    case 'mountain':
      return 2.0;
    case 'water':
      return Infinity;  // Impassable
    default:
      return 1.0;
  }
}

/**
 * Heuristic function for A*
 *
 * Uses Chebyshev distance (suitable for grid-based movement)
 *
 * @param from - Current position
 * @param to - Goal position
 * @returns Estimated cost to goal
 */
function heuristic(from: Position, to: Position): number {
  return calculateDistance(from, to);
}

/**
 * Find the shortest path between two positions using A* algorithm
 *
 * Takes terrain costs into account to find the optimal path.
 * Returns empty array if no path exists.
 *
 * @param board - Game board
 * @param start - Starting position
 * @param goal - Goal position
 * @param maxCost - Maximum total path cost (used for movement range)
 * @returns Array of positions from start to goal (inclusive), or empty if no path
 */
export function findPath(
  board: Board,
  start: Position,
  goal: Position,
  maxCost: number
): Position[] {
  // Early exit for same position
  if (start.x === goal.x && start.y === goal.y) {
    return [start];
  }

  // Open set: positions to evaluate
  const openSet: Position[] = [start];

  // For each position, track best known cost from start
  const gScore = new Map<string, number>();
  const posKey = (p: Position) => `${p.x},${p.y}`;
  gScore.set(posKey(start), 0);

  // For each position, track the best position to come from
  const cameFrom = new Map<string, Position>();

  // For each position, track f(n) = g(n) + h(n)
  const fScore = new Map<string, number>();
  fScore.set(posKey(start), heuristic(start, goal));

  while (openSet.length > 0) {
    // Find position in openSet with lowest fScore
    let current = openSet[0];
    let currentIndex = 0;
    let currentF = fScore.get(posKey(openSet[0])) ?? Infinity;

    for (let i = 1; i < openSet.length; i++) {
      const f = fScore.get(posKey(openSet[i])) ?? Infinity;
      if (f < currentF) {
        current = openSet[i];
        currentIndex = i;
        currentF = f;
      }
    }

    if (current.x === goal.x && current.y === goal.y) {
      // Path found, reconstruct it
      const path: Position[] = [current];
      let node = current;

      while (cameFrom.has(posKey(node))) {
        node = cameFrom.get(posKey(node))!;
        path.unshift(node);
      }

      return path;
    }

    openSet.splice(currentIndex, 1);
    const currentG = gScore.get(posKey(current)) ?? Infinity;

    // Check all neighbors
    for (const neighbor of getAdjacentPositions(current)) {
      // Skip if not walkable
      if (!isPositionWalkable(board, neighbor)) {
        continue;
      }

      const terrainCost = getTerrainCost(getTerrain(board, neighbor));
      if (terrainCost === Infinity) {
        continue;
      }

      const tentativeG = currentG + terrainCost;

      // Stop if we've exceeded max cost
      if (tentativeG > maxCost) {
        continue;
      }

      const neighborKey = posKey(neighbor);
      const neighborG = gScore.get(neighborKey) ?? Infinity;

      if (tentativeG < neighborG) {
        // This path to neighbor is better than previously found
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);

        const f = tentativeG + heuristic(neighbor, goal);
        fScore.set(neighborKey, f);

        if (!openSet.some((p) => p.x === neighbor.x && p.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // No path found
  return [];
}

/**
 * Check if a position is reachable from start within maximum cost
 *
 * @param board - Game board
 * @param start - Starting position
 * @param target - Target position to check
 * @param maxCost - Maximum cost allowed
 * @returns true if reachable within maxCost
 */
export function isReachable(
  board: Board,
  start: Position,
  target: Position,
  maxCost: number
): boolean {
  const path = findPath(board, start, target, maxCost);
  return path.length > 0;
}

/**
 * Get the actual cost of a path (sum of terrain costs)
 *
 * @param board - Game board
 * @param path - Path as array of positions
 * @returns Total movement cost
 */
export function getPathCost(board: Board, path: Position[]): number {
  if (path.length <= 1) {
    return 0;
  }

  let cost = 0;
  for (let i = 1; i < path.length; i++) {
    const terrainCost = getTerrainCost(getTerrain(board, path[i]));
    cost += terrainCost;
  }

  return cost;
}

/**
 * Get all positions reachable from start within maximum cost
 *
 * Performs a breadth-first search from the start position,
 * considering terrain costs and movement range.
 *
 * @param board - Game board
 * @param start - Starting position
 * @param maxCost - Maximum movement cost (equals movement range)
 * @returns Array of all reachable positions (including start)
 */
export function getReachablePositions(
  board: Board,
  start: Position,
  maxCost: number
): Position[] {
  const visited = new Map<string, boolean>();
  const posKey = (p: Position) => `${p.x},${p.y}`;

  // Use Dijkstra-like approach to find all reachable positions
  const distances = new Map<string, number>();
  distances.set(posKey(start), 0);

  const queue: Position[] = [start];
  visited.set(posKey(start), true);

  const reachable: Position[] = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(posKey(current)) ?? 0;

    for (const neighbor of getAdjacentPositions(current)) {
      // Skip if not walkable
      if (!isPositionWalkable(board, neighbor)) {
        continue;
      }

      const terrainCost = getTerrainCost(getTerrain(board, neighbor));
      if (terrainCost === Infinity) {
        continue;
      }

      const newDist = currentDist + terrainCost;

      // Skip if exceeds max cost
      if (newDist > maxCost) {
        continue;
      }

      const neighborKey = posKey(neighbor);

      if (!visited.has(neighborKey)) {
        visited.set(neighborKey, true);
        distances.set(neighborKey, newDist);
        queue.push(neighbor);
        reachable.push(neighbor);
      }
    }
  }

  return reachable;
}

/**
 * Helper function to check if a position is walkable
 *
 * A position is walkable if:
 * 1. It's in bounds
 * 2. It's not water terrain
 *
 * Note: We ignore occupancy for pathfinding, as blocking other units
 * is handled at the action validation layer.
 *
 * @param board - Game board
 * @param position - Position to check
 * @returns true if walkable
 */
function isPositionWalkable(board: Board, position: Position): boolean {
  if (!isPositionInBounds(position)) {
    return false;
  }

  const terrain = getTerrain(board, position);
  return terrain !== 'water';
}
