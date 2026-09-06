import { Board, Position, TERRAIN_MOVEMENT_COST } from './types';
import { getAdjacentPositions, getTile, isPositionInBounds } from './board';

export function getTerrainCost(terrain: string): number {
  return TERRAIN_MOVEMENT_COST[terrain as keyof typeof TERRAIN_MOVEMENT_COST] ?? 1;
}

export interface PathOptions {
  readonly canTraverse?: (position: Position) => boolean;
}

const key = (position: Position): string => `${position.x},${position.y}`;

function search(board: Board, start: Position, maxCost: number, options: PathOptions): Map<string, Position[]> {
  const paths = new Map<string, Position[]>();
  if (!isPositionInBounds(start) || !Number.isFinite(maxCost) || maxCost < 0) return paths;
  const distances = new Map([[key(start), 0]]);
  const queue = [start];
  paths.set(key(start), [start]);
  while (queue.length) {
    queue.sort((a, b) => distances.get(key(a))! - distances.get(key(b))!);
    const current = queue.shift()!;
    for (const next of getAdjacentPositions(current)) {
      const tile = getTile(board, next)!;
      if (options.canTraverse ? !options.canTraverse(next) : !!tile.occupant) continue;
      const cost = distances.get(key(current))! + getTerrainCost(tile.terrain);
      if (cost > maxCost || cost >= (distances.get(key(next)) ?? Infinity)) continue;
      distances.set(key(next), cost);
      paths.set(key(next), [...paths.get(key(current))!, next]);
      if (!queue.some(item => key(item) === key(next))) queue.push(next);
    }
  }
  return paths;
}

export function findPath(board: Board, start: Position, goal: Position, maxCost: number, options: PathOptions = {}): Position[] {
  if (!isPositionInBounds(goal)) return [];
  return search(board, start, maxCost, options).get(key(goal)) ?? [];
}

export function isReachable(board: Board, start: Position, target: Position, maxCost: number): boolean {
  return findPath(board, start, target, maxCost).length > 0;
}

export function getPathCost(board: Board, path: readonly Position[]): number {
  return path.slice(1).reduce((cost, position) => cost + getTerrainCost(getTile(board, position)?.terrain ?? 'water'), 0);
}

export function getReachablePositions(board: Board, start: Position, maxCost: number, options: PathOptions = {}): Position[] {
  return [...search(board, start, maxCost, options).values()].map(path => path[path.length - 1]);
}
