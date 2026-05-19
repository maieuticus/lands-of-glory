# Research: Lands of Glory Digital Prototype

**Date**: 2025 | **Feature**: 002-spec-analysis | **Status**: Complete

## Overview

This research document resolves all technical clarifications for the Lands of Glory board game prototype, establishing a foundation for Phase 1 (Planning) and Phase 2 (Implementation). All decisions are justified with alternatives considered.

---

## 1. Rendering Architecture (PixiJS)

### Decision
Implement a **layered rendering system** with PixiJS:
- **Board Layer**: Static 24×24 grid of grass tiles (WebGL texture atlas)
- **Unit Layer**: Dynamic sprites for units, sorted by depth
- **Effect Layer**: Animations, highlights, damage numbers
- **UI Layer**: DOM for buttons, status panels (separate from canvas)
- **Renderer Controller**: Updates canvas on state change (tick/render)

### Rationale
- PixiJS renders 2D graphics fast via WebGL (60 FPS achievable on 24×24 board)
- Layering enables independent updates (board static, units animate)
- Texture atlasing reduces draw calls
- DOM UI keeps interactive elements native and accessible
- Turn-based game allows frame batching (not real-time)

### Alternatives Considered
- **Three.js**: 3D rendering unnecessary; adds complexity and memory overhead
- **Konva.js**: Good for interactive shapes, but slower than PixiJS for dense grids
- **Canvas 2D**: No GPU acceleration; would struggle at 60 FPS with animations
- **SVG**: Not GPU-accelerated; too slow for real-time rendering
- **WebGL directly**: Manual shader management; PixiJS abstracts this well

### Implementation Pattern
```typescript
// apps/prototype/src/renderer.ts
import * as PIXI from 'pixi.js';

export class GameRenderer {
  private app: PIXI.Application;
  private boardLayer: PIXI.Container;
  private unitLayer: PIXI.Container;
  private effectLayer: PIXI.Container;

  constructor(container: HTMLElement) {
    this.app = new PIXI.Application({
      width: 1200,
      height: 900,
      antialias: true,
      autoDensity: true,
    });
    container.appendChild(this.app.view);

    // Create layers
    this.boardLayer = new PIXI.Container();
    this.unitLayer = new PIXI.Container();
    this.effectLayer = new PIXI.Container();

    this.app.stage.addChild(this.boardLayer, this.unitLayer, this.effectLayer);
  }

  render(state: GameState): void {
    this.renderBoard(state.board);
    this.renderUnits(state.units);
    this.renderEffects(state);
  }

  private renderBoard(board: Board): void {
    // Render 24×24 grid once, cache as static
    if (this.boardLayer.children.length === 0) {
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 24; x++) {
          const tile = board.tiles[y][x];
          const sprite = this.createTileSprite(tile);
          sprite.position.set(x * CELL_SIZE, y * CELL_SIZE);
          this.boardLayer.addChild(sprite);
        }
      }
    }
  }

  private renderUnits(units: Map<UnitId, Unit>): void {
    // Clear and re-render units each frame
    this.unitLayer.removeChildren();
    for (const unit of units.values()) {
      const sprite = this.createUnitSprite(unit);
      sprite.position.set(
        unit.position.x * CELL_SIZE,
        unit.position.y * CELL_SIZE
      );
      this.unitLayer.addChild(sprite);
    }
    // Sort by y (depth sorting for isometric perspective)
    this.unitLayer.children.sort((a, b) => a.y - b.y);
  }
}
```

---

## 2. State Management (Immutable Game Core)

### Decision
Implement **immutable, pure functional** game-core:
- State is read-only snapshot of game (Position, Unit, Commander, etc.)
- Actions are pure functions: `(GameState, params) → GameState`
- No mutations: each function returns new GameState copy
- State changes tracked in log for replay

### Rationale
- **Testability**: Pure functions deterministic and easy to mock
- **Replay**: Log of actions replayed on same initial state = same outcome
- **Multiplayer**: Actions serialized for network transmission to server
- **Undo**: Previous states kept in history stack (if needed)
- **Debugging**: No hidden state changes; state visible at any point

### Alternatives Considered
- **Mutable state**: Faster writes, but bugs hide in side effects; not testable; can't replay
- **OOP with methods**: Encapsulation false security; still mutates internals
- **Redux/Vuex**: Good patterns but overkill for game logic; use pure functions directly

### Core Patterns
```typescript
// game-core/src/game.ts - Pure functions
export function moveUnit(
  state: GameState,
  unitId: UnitId,
  target: Position
): GameState {
  // Validate
  if (!canMove(state, unitId, target)) {
    throw new GameRuleError('Invalid move', 'INVALID_MOVE');
  }

  // Get references (read)
  const unit = state.units.get(unitId)!;

  // Create new state (no mutation)
  return {
    ...state,
    units: new Map(state.units).set(unitId, {
      ...unit,
      position: target,
    }),
    log: [...state.log, { type: 'move', unitId, target }],
  };
}

export function endTurn(state: GameState): GameState {
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const newTurn = nextPlayerIndex === 0 ? state.turn + 1 : state.turn;

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    turn: newTurn,
  };
}
```

---

## 3. Unit & Commander Hierarchy

### Decision
Implement **hierarchical structure**:
- **Commander**: Squad leader (King, General, or Banner)
- **Unit Slots**: 3-5 slots per commander (can be empty)
- **Units**: Individual soldiers (Infantry, Cavalry, Archer) in slots
- **Positioning**: Units and commanders independently positioned (units don't auto-follow)

### Rationale
- Matches tabletop game design (squads with leaders)
- Enables unit transfers (unit from one commander to another, if rules allow)
- Commander death ≠ unit death (units orphaned, can rejoin or die)
- Flexible: future features (unit upgrades, reinforcements) fit naturally

### Alternatives Considered
- **Flat units**: Simpler data model but loses squad concept
- **Units auto-follow commander**: Less flexible; breaks if commander teleports
- **Commander is slot manager only**: Loses commander positioning and damage

### Data Structure
```typescript
export interface Unit {
  id: UnitId;
  type: 'infantry' | 'cavalry' | 'archer';
  position: Position;
  health: number;
  moveRange: number;
  attackRange: number;
  damage: number;
  commanderId: CommanderId;
}

export interface Commander {
  id: CommanderId;
  type: 'king' | 'general' | 'banner';
  position: Position;
  health: number;
  playerId: PlayerId;
  unitSlots: UnitId[]; // Can have empty slots
}

// Victory conditions
export function getWinner(state: GameState): PlayerId | undefined {
  // King defeated
  for (const player of state.players) {
    const king = state.commanders.get(player.commanders[0]);
    if (!king || king.health <= 0) {
      return state.currentPlayer.id; // Other player wins
    }
  }

  // Banner captured
  for (const player of state.players) {
    const banner = state.commanders.find(
      (c) => c.type === 'banner' && c.playerId === player.id
    );
    if (banner && banner.playerId !== state.currentPlayer.id) {
      return state.currentPlayer.id;
    }
  }

  return undefined;
}
```

---

## 4. Dice & Randomness (Seeded PRNG)

### Decision
Implement **seeded Mersenne Twister PRNG**:
- Each combat action includes seed
- Same seed + same game state = same dice roll
- Actions logged: `{ type: 'attack', attackerId, targetId, seed }`
- Replay uses logged seed, no re-rolling

### Rationale
- **Deterministic replays**: Same seed produces same outcome
- **Server validation**: Client sends seed; server recomputes roll to verify
- **Tournament replays**: Recorded games always replay identically
- **Debugging**: Specific seed values reproduce bugs

### Alternatives Considered
- **Client-side Math.random()**: Non-deterministic; can't verify server-side
- **Server sends roll**: Network latency; susceptible to tampering
- **No randomness**: Deterministic but boring; no tension

### Implementation
```typescript
// game-core/src/rng.ts
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed ^ 0x9e3779b9;
  }

  next(): number {
    this.seed = (this.seed + 0x9e3779b9) | 0;
    let t = this.seed ^ (this.seed >>> 16);
    t = Math.imul(t, 0x27d4eb2d);
    t = t ^ (t >>> 15);
    return ((t >>> 0) / 4294967296) as unknown as number;
  }

  d6(): number {
    return Math.floor(this.next() * 6) + 1;
  }
}

export function resolveCombat(
  state: GameState,
  attackerId: UnitId,
  targetId: UnitId,
  seed: number
): GameState {
  const rng = new SeededRandom(seed);
  const attacker = state.units.get(attackerId)!;
  const target = state.units.get(targetId)!;

  const attackRoll = attacker.damage + rng.d6();
  const defendRoll = rng.d6(); // Future: add armor
  const damage = Math.max(0, attackRoll - defendRoll);

  const newHealth = Math.max(0, target.health - damage);
  const isDead = newHealth === 0;

  return {
    ...state,
    units: new Map(state.units).set(targetId, {
      ...target,
      health: newHealth,
    }),
    log: [
      ...state.log,
      { type: 'attack', attackerId, targetId, seed, damage, isDead },
    ],
  };
}
```

---

## 5. Board Representation & Pathfinding

### Decision
Implement **2D grid with A* pathfinding**:
- Board: `Tile[24][24]` with terrain type and occupant
- Pathfinding: A* algorithm with Manhattan heuristic
- Movement cost: varies by terrain (grass=1, forest=1.5, water=∞)
- Precompute paths on demand (no background pathfinding)

### Rationale
- 2D array is cache-friendly and simple
- A* is efficient (O(n log n) with good heuristic)
- Manhattan heuristic admissible on grid (never overestimates)
- Terrain costs enable strategic positioning (forests slow cavalry)
- Precompute avoids lag (only pathfind when player requests move)

### Alternatives Considered
- **Graph representation**: More flexible but overkill for fixed 24×24 grid
- **Dijkstra's algorithm**: Slower than A* (explores more nodes)
- **Precompute all paths**: Too much memory (24×24 × 24×24 paths)
- **Jumping Point Search**: Faster but complex; A* sufficient for 24×24

### Implementation
```typescript
// game-core/src/pathfinding.ts
export function findPath(
  board: Board,
  start: Position,
  goal: Position,
  walkable: (tile: Tile) => boolean
): Position[] {
  const openSet: Array<[number, Position]> = [[0, start]];
  const cameFrom = new Map<string, Position>();
  const gScore = new Map<string, number>();
  gScore.set(posKey(start), 0);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a[0] - b[0]); // Priority queue
    const [_, current] = openSet.shift()!;

    if (posEqual(current, goal)) {
      return reconstructPath(cameFrom, current);
    }

    for (const neighbor of getNeighbors(board, current, walkable)) {
      const g = gScore.get(posKey(current))! + moveCost(board, neighbor);

      if (!gScore.has(posKey(neighbor)) || g < gScore.get(posKey(neighbor))!) {
        cameFrom.set(posKey(neighbor), current);
        gScore.set(posKey(neighbor), g);
        const h = manhattan(neighbor, goal);
        openSet.push([g + h, neighbor]);
      }
    }
  }

  return []; // No path
}

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function moveCost(board: Board, pos: Position): number {
  const tile = board.tiles[pos.y][pos.x];
  return tile.terrain === 'grass' ? 1 : tile.terrain === 'forest' ? 1.5 : Infinity;
}
```

---

## 6. Movement & Combat Rules

### Decision
Implement **explicit rule validation before action**:
- Check function: `canMove(state, unitId, target) → boolean`
- Perform function: `moveUnit(state, unitId, target) → GameState` (throws if invalid)
- Combat: Line-of-sight check required
- Range: Measured in grid cells (Manhattan distance initially)

### Rationale
- Explicit checks prevent invalid states
- UI can validate before sending action (better UX)
- Logging shows exactly which rule failed
- Extensible: new terrain rules, unit abilities, etc.

### Alternatives Considered
- **Silent failures**: No error on invalid move; dangerous
- **Return status codes**: More boilerplate than exceptions
- **Euclidean distance**: Manhattan simpler and equally fair

### Validation Pattern
```typescript
export function canMove(
  state: GameState,
  unitId: UnitId,
  target: Position
): boolean {
  const unit = state.units.get(unitId);
  if (!unit) return false;

  // Check bounds
  if (target.x < 0 || target.x >= 24 || target.y < 0 || target.y >= 24) {
    return false;
  }

  // Check range
  const distance = manhattan(unit.position, target);
  if (distance > unit.moveRange) return false;

  // Check walkable (not water, not occupied)
  const tile = state.board.tiles[target.y][target.x];
  if (tile.terrain === 'water') return false;
  if (tile.occupant && tile.occupant !== unitId) return false;

  // Check path exists
  const path = findPath(state.board, unit.position, target, isTerrain(tile));
  return path.length > 0;
}

export function moveUnit(
  state: GameState,
  unitId: UnitId,
  target: Position
): GameState {
  if (!canMove(state, unitId, target)) {
    throw new GameRuleError('Cannot move to target', 'INVALID_MOVE');
  }

  const unit = state.units.get(unitId)!;
  const oldTile = state.board.tiles[unit.position.y][unit.position.x];
  const newTile = state.board.tiles[target.y][target.x];

  return {
    ...state,
    units: new Map(state.units).set(unitId, { ...unit, position: target }),
    board: {
      ...state.board,
      tiles: updateTiles(state.board, unit.position, target),
    },
  };
}
```

---

## 7. Testing Strategy (Jest + Cypress)

### Decision
Implement **two-tier testing**:
- **Jest (game-core)**: Unit tests for pure functions
  - Test each rule independently
  - Use snapshot tests for state transitions
  - 100% coverage target (pure logic)
- **Cypress (prototype)**: E2E tests for UI + integration
  - Test user flows: select unit → move → attack → end turn
  - Visual regression tests (screenshots)
  - Performance checks (frame rate, turn time)

### Rationale
- Jest tests are fast (milliseconds) and deterministic
- Cypress tests user-facing features (most important)
- Separation: logic bugs caught by Jest, UI bugs by Cypress
- Snapshot tests verify state shape (regression detection)

### Alternatives Considered
- **All unit tests**: Slow for UI; doesn't catch integration issues
- **All E2E tests**: Slow and brittle; poor coverage of edge cases
- **No tests**: High risk of regressions

### Jest Example
```typescript
// game-core/tests/movement.test.ts
describe('Movement', () => {
  it('should move unit to valid position', () => {
    const state = createGame([{ name: 'p1' }, { name: 'p2' }]);
    const unitId = Array.from(state.units.keys())[0];
    const unit = state.units.get(unitId)!;
    const target = { x: unit.position.x + 1, y: unit.position.y };

    const newState = moveUnit(state, unitId, target);

    expect(newState.units.get(unitId)!.position).toEqual(target);
  });

  it('should throw on out-of-range move', () => {
    const state = createGame([{ name: 'p1' }, { name: 'p2' }]);
    const unitId = Array.from(state.units.keys())[0];

    expect(() => {
      moveUnit(state, unitId, { x: 20, y: 20 });
    }).toThrow(GameRuleError);
  });
});
```

### Cypress Example
```typescript
// apps/prototype/tests/e2e/gameplay.cy.ts
describe('Gameplay', () => {
  it('should move unit on click', () => {
    cy.visit('http://localhost:5173');
    cy.get('[data-testid=new-game]').click();
    cy.get('[data-testid=start]').click();

    // Select unit
    cy.get('[data-testid=unit-0]').click();
    // Click destination
    cy.get('[data-testid=cell-5-5]').click();

    cy.get('[data-testid=unit-0]').should('have.css', 'left', '160px');
  });
});
```

---

## 8. TypeScript Configuration

### Decision
Implement **strict TypeScript** with:
- `strict: true` (all strict flags enabled)
- `noUnusedLocals: true` (catch dead code)
- `noImplicitAny: true` (require types everywhere)
- Path aliases: `@game-core` → `packages/game-core/src`
- Branded types for IDs (UnitId, CommanderId) to prevent mixing

### Rationale
- Strict mode catches bugs at compile time
- Unused code detection improves maintainability
- Branded types prevent UnitId/CommanderId mix-ups
- Path aliases keep imports readable

### Alternatives Considered
- **Loose TypeScript**: Faster initially but accumulates tech debt
- **`any` type**: Defeats purpose; makes refactoring dangerous

### Configuration
```json
// packages/game-core/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedParameters": true
  },
  "include": ["src"],
  "exclude": ["tests"]
}
```

---

## 9. Monorepo Build & Distribution

### Decision
Implement **separate build pipelines**:
- **game-core**: Compile TypeScript → JavaScript + type defs (no bundling)
- **prototype**: Vite dev server + production build with tree-shaking

### Rationale
- Dual format (ESM/CJS) supports Node.js + browser
- No pre-bundling keeps consumers flexible
- Vite provides fast HMR in development
- Tree-shaking removes unused code in production

### Alternatives Considered
- **Single UMD bundle**: Inflexible for consumers
- **Only ESM**: Breaks older Node.js
- **Webpack**: Heavier and slower than Vite

---

## 10. State Persistence & Save/Load

### Decision
Implement **JSON serialization** for save files:
- `saveGame(state): SaveFile` → JSON string
- `loadGame(json): GameState` → validate and restore
- Version field for future migrations

### Rationale
- JSON is universal and debuggable
- Version field allows format upgrades
- Deterministic: same JSON loads identically

### Implementation
```typescript
export interface SaveFile {
  version: 1;
  timestamp: number;
  gameState: GameState;
}

export function saveGame(state: GameState): string {
  const save: SaveFile = {
    version: 1,
    timestamp: Date.now(),
    gameState: state,
  };
  return JSON.stringify(save, (key, value) => {
    if (value instanceof Map) {
      return Object.fromEntries(value);
    }
    return value;
  });
}
```

---

## 11. Error Handling

### Decision
Implement **exception-based error handling**:
- Throw `GameRuleError` for rule violations
- Controllers catch and display UI messages
- Validation checks before actions

### Rationale
- Explicit vs. silent failures
- UI layer translates error codes to messages

### Pattern
```typescript
export class GameRuleError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'GameRuleError';
  }
}

// Usage
try {
  gameState = moveUnit(gameState, unitId, target);
} catch (e) {
  if (e instanceof GameRuleError) {
    ui.showMessage(getErrorMessage(e.code), 'error');
  }
}
```

---

## 12. Replay & Determinism

### Decision
Design for **deterministic replay from start**:
- Game state fully determined by initial state + action log
- Each action includes seed
- Replay: apply same actions → same state

### Rationale
- Tournament replays always identical
- Server validation via replay
- AI can play deterministically
- Debugging via specific seed

---

## 13. Performance Targets

### Decision
Establish performance budgets:
- **Rendering**: 60 FPS (16.67ms per frame)
- **Turn resolution**: <100ms from click to result
- **Memory**: <50MB game state
- **Pathfinding**: <50ms for 24×24 A*

### Rationale
- 60 FPS feels smooth
- <100ms feels responsive
- 50MB budget achievable
- Pathfinding budget prevents turn lag

---

## 14. Development Workflow

### Decision
Establish watch modes:
- `npm run dev`: Vite server + hot reload
- `npm run test:watch`: Jest in watch mode
- Breakpoints in VS Code
- Pre-commit hooks (lint + test)

### Rationale
- Fast feedback loop
- Breakpoints > console.log
- Pre-commit hooks catch issues early

---

## Summary: Decision Matrix

| Decision | Implementation | Rationale |
|----------|----------------|-----------|
| Rendering | PixiJS + layers | Fast, WebGL, turn-based |
| State | Immutable functions | Testable, replay-ready |
| Units | Hierarchical commanders | Matches design, flexible |
| Randomness | Seeded PRNG | Deterministic replay |
| Board | 2D grid + A* pathfinding | Efficient, extensible |
| Rules | Explicit validation | Prevents invalid states |
| Testing | Jest + Cypress | Separation of concerns |
| Types | Strict TypeScript | Compile-time safety |
| Build | game-core + Vite | Independent packages |
| Performance | 60 FPS, <100ms turns | Smooth, responsive UX |

---

## Implementation Roadmap

**Phase 2 (Core)**: Implement game-core (types, game, movement, combat, board)
**Phase 3 (Render)**: Build PixiJS renderer (layers, sprites, animations)
**Phase 4 (UI)**: Connect state → rendering pipeline
**Phase 5 (Tests)**: Full Jest + Cypress coverage
**Phase 6 (Polish)**: Performance, edge cases, UX refinement

---

## References

- PixiJS: https://pixijs.io/
- Jest: https://jestjs.io/
- Cypress: https://cypress.io/
- TypeScript: https://www.typescriptlang.org/
- A* Pathfinding: https://en.wikipedia.org/wiki/A*_search_algorithm

