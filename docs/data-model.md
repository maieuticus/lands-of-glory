# Data Model: Lands of Glory

## Core Entities

### Position

- **Description**: A coordinate on the game board
- **Fields**:
  - `x: number` (0-23)
  - `y: number` (0-23)
- **Invariants**: x and y must be within board bounds
- **Type Safety**: Represented as `{ x: number; y: number }`

### Tile

- **Description**: Individual cell on the 24×24 board
- **Fields**:
  - `position: Position`
  - `terrain: TerrainType` ('grass' | 'water' | 'mountain' | 'forest')
  - `occupant?: CommanderId` (only one commander per cell)
- **Relationships**: Many tiles form Board
- **State**: Terrain is static; occupant changes during gameplay
- **Invariants**: 
  - Exactly one commander per tile or none
  - Position must be unique within board
- **Note**: In Version 1, terrain is always 'grass'

### Unit

- **Description**: Individual combat unit (infantry, cavalry, archer) within a Commander's slot
- **Fields**:
  - `id: UnitId` (unique identifier)
  - `type: TroopType` ('infantry' | 'cavalry' | 'archer')
  - `health: number` (1-10)
  - `bonus: number` (0+, added to combat rolls)
  - `commanderId: CommanderId` (parent commander)
  - `slotIndex: number` (0-3, position in commander's unit slots)
- **Relationships**: Belongs to Commander via slot
- **State Transitions**:
  - health decreases (combat)
  - dies (removed) when health ≤ 0
  - bonus increases through upgrades (future)
- **Invariants**:
  - Health: 0 < health ≤ 10
  - Slot index: 0 ≤ slotIndex < 4
  - Exactly one unit per slot or empty
- **Combat Properties** (derived from type):
  - Infantry: moveRange=2, attackRange=1, baseAttack=3, maxHealth=10
  - Cavalry: moveRange=3, attackRange=1, baseAttack=3, maxHealth=8
  - Archer: moveRange=2, attackRange=3, baseAttack=3, maxHealth=6

### Commander

- **Description**: Squad leader with up to 4 unit slots; represents player on board
- **Fields**:
  - `id: CommanderId` (unique identifier)
  - `type: TroopType` ('infantry' | 'cavalry' | 'archer', defines empty commander behavior)
  - `position: Position` (current board location)
  - `health: number` (1-20, max health depends on role)
  - `playerId: PlayerId` (owning player)
  - `units: (Unit | null)[]` (exactly 4 slots, each null or Unit)
  - `isKing: boolean` (true if this is the player's king)
  - `isBanner: boolean` (true if this is the player's banner/castle)
- **Relationships**: 1 commander : 0-4 units; belongs to Player
- **State Transitions**:
  - position changes (move)
  - health decreases (combat)
  - dies (removed) when health ≤ 0
  - units added/removed from slots
- **Invariants**:
  - Health: 0 < health ≤ 20
  - Exactly 4 unit slots
  - Exactly one King per player (isKing: true)
  - Exactly one Banner per player (isBanner: true)
  - Position unique per player per tile (not shared with other commanders)
- **Combat Rules**:
  - Empty commander fights as cavalry (default type-based stats)
  - When empty, uses default attack/defense values
- **Special Cases**:
  - King defeat = player loss condition
  - Banner defeat = player loss condition

### Board

- **Description**: 24×24 game board containing all tiles
- **Fields**:
  - `width: 24` (constant)
  - `height: 24` (constant)
  - `tiles: Tile[][]` (2D grid indexed as tiles[x][y])
- **Relationships**: Contains 576 tiles
- **Invariants**: Grid is always 24×24, every tile has valid position
- **Note**: In Version 1, all terrain is 'grass'

### GameState

- **Description**: Complete immutable snapshot of game state
- **Fields**:
  - `id: GameId` (unique game session identifier)
  - `board: Board` (game board)
  - `players: Player[]` (2-4 players)
  - `commanders: Map<CommanderId, Commander>` (all commanders in game)
  - `units: Map<UnitId, Unit>` (all units in game)
  - `activePlayerId: PlayerId` (current player's turn)
  - `turnNumber: number` (starts at 1, increments each full round)
  - `gameStatus: GameStatus` ('setup' | 'active' | 'finished')
  - `winner?: PlayerId` (set when gameStatus === 'finished')
  - `log: Action[]` (action history for replay/undo)
- **Relationships**: Contains board, players, commanders, units
- **State Transitions**:
  - gameStatus: 'setup' → 'active' (game starts)
  - gameStatus: 'active' → 'finished' (win condition met)
  - turnNumber increments after each player's turn
  - activePlayerId cycles through players
- **Invariants**:
  - gameStatus must be valid
  - if gameStatus === 'finished', winner must be set
  - exactly one active player (or none if paused)
  - all referenced entity IDs must exist in maps
- **Immutability**: GameState is immutable; actions produce new states

### Player

- **Description**: Game participant with resources and units
- **Fields**:
  - `id: PlayerId` (unique identifier)
  - `name: string` (display name)
  - `color: string` (hex color code, e.g., '#FF0000')
  - `commanders: CommanderId[]` (3-4 commanders per player)
  - `score: number` (cumulative: kills, damage dealt, objectives)
  - `isActive: boolean` (true if this player's turn)
- **Relationships**: Has multiple commanders; part of game
- **State Transitions**:
  - score increases on unit kills, territory control
  - isActive toggles on turn end/start
  - commanders added/removed on death
- **Invariants**:
  - 3-4 commanders per player
  - Unique color per player in game
  - Score ≥ 0
- **Victory Conditions**:
  - King defeated → player loses
  - Banner captured → player loses
  - Last player remaining → player wins

## Data Structure Details

### Movement & Pathfinding

**Valid Moves Calculation**:
1. Determine moveRange based on unit type or commander type
2. Use A* pathfinding with terrain cost:
   - Grass: 1.0 cost per step
   - Water: blocked (impassable)
   - Mountain: 2.0 cost per step
   - Forest: 1.5 cost per step
3. Diagonal moves allowed, cost = 1.0
4. Include holding rule: friendly infantry in adjacent tiles block movement

**Holding Rule**:
- If target square is adjacent to friendly infantry, movement is invalid
- Holding applies only to infantry troop type
- Holding is passive (no action required)

**A* Algorithm**:
```
Algorithm: A*(start, goal, moveRange)
  openSet = PriorityQueue()
  openSet.add(start, 0)
  cameFrom = {}
  gScore = {start: 0}
  fScore = {start: heuristic(start, goal)}
  
  while openSet not empty:
    current = openSet.popMin()
    if current == goal:
      return reconstructPath(cameFrom, goal)
    
    for neighbor in neighbors(current):
      if neighbor blocked:
        continue
      
      tentative_g = gScore[current] + cost(current, neighbor)
      if tentative_g > moveRange:
        continue
      
      if tentative_g < gScore[neighbor]:
        cameFrom[neighbor] = current
        gScore[neighbor] = tentative_g
        fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, goal)
        openSet.add(neighbor, fScore[neighbor])
  
  return []  // no path found

heuristic(pos, goal) = abs(pos.x - goal.x) + abs(pos.y - goal.y)
```

### Combat Resolution

**Attack Validation**:
1. Target must be within attackRange of attacker
2. Target must be enemy (different player)
3. Line of sight required:
   - No terrain blocking (terrain blocks LoS except grass)
   - Path must be straight line or allow diagonal
4. Attacker must not have moved this turn (or action already used)

**Combat Process**:
1. Attacker rolls dice for each attacking unit
2. Defender rolls dice for each defending unit
3. Sort rolls naturally (ascending)
4. Add bonuses to each roll
5. Assign casualties from bottom of sorted list
6. Remove units with health ≤ 0

**Damage Calculation**:
```
Attacker rolls N dice (where N = number of attacking units)
Each die: d6 (1-6) + unit bonus
  
Defender rolls M dice (where M = number of defending units)
Each die: d6 (1-6) + unit bonus

Casualties determined by:
  - Sort attacker rolls ascending
  - Sort defender rolls ascending
  - Match rolls: if attacker[i] > defender[i], defender[i] dies
  - Apply health reduction from each match
  - If defender health ≤ 0, unit dies
```

**Health Management**:
- Unit types have different max health:
  - Infantry: 10
  - Cavalry: 8
  - Archer: 6
- Commander base: 20
- Health displayed as current/max
- Health ≤ 0 → unit removed from game

### Siege Rules

**Banner Capture**:
- Banner is a special tile with `isBanner: true`
- Banner can only be captured by melee (adjacent) units
- Archers cannot capture banner (arrow attack doesn't count)
- When captured, opponent loses immediately

**King Defeat**:
- King is commander with `isKing: true`
- When king's health ≤ 0, king dies
- Owner's player loses immediately

## Validation Rules

| Entity | Rule | Validation | Impact |
|--------|------|-----------|--------|
| Position | Must be in bounds | `0 ≤ x < 24 AND 0 ≤ y < 24` | GameError if violated |
| Unit | Health valid | `0 < health ≤ maxHealth[type]` | GameError if violated |
| Unit | One per slot | No two units in same slot | Data integrity |
| Commander | Must belong to player | `playerId` references existing player | Data integrity |
| Commander | Unique king | Exactly one king per player | Setup validation |
| Commander | Unique banner | Exactly one banner per player | Setup validation |
| Player | Unique color | No two players same color | Setup validation |
| Board | Must be 24×24 | Width = 24, height = 24 | Data integrity |
| GameState | Valid status | gameStatus in ['setup', 'active', 'finished'] | Data integrity |
| GameState | Active player exists | `activePlayerId` valid if game active | Data integrity |

## State Persistence

**Save Format** (JSON serializable):
```typescript
interface SaveFile {
  version: 1;
  timestamp: number;
  gameState: GameState;
}
```

**Load Validation**:
- Check version matches (version 1)
- Validate all entities:
  - All positions within board bounds
  - All health values in valid ranges
  - No orphaned references (unit.commanderId exists)
  - All IDs unique
- Verify game status consistency
- Reconstruct Maps from persisted data

## Entity Relationship Diagram

```
Player (1) ──────── many ───────→ Commander (N-M relationship)
    owns

Commander (1) ──── 0-4 ──────→ Unit (1-N relationship)
     contains    via slots

Board (1) ──────── 576 ────────→ Tile (1-N relationship)
  contains    (24×24 grid)

GameState (1) ──── many ───────→ Action (1-N relationship)
    logs     (history)

GameState (1) ──── many ───────→ Player (1-N relationship)
   contains

GameState (1) ──── many ───────→ Commander (1-N relationship)
   contains    (in Map)

GameState (1) ──── many ───────→ Unit (1-N relationship)
   contains    (in Map)

Tile (0-1) ──── 1 ───────→ Commander (0-1-N relationship)
  occupies               occupies one tile
```

## Type System (TypeScript)

```typescript
// Branded types for type safety
export type UnitId = string & { readonly __brand: 'UnitId' };
export type CommanderId = string & { readonly __brand: 'CommanderId' };
export type PlayerId = string & { readonly __brand: 'PlayerId' };
export type GameId = string & { readonly __brand: 'GameId' };

// Type unions
export type TroopType = 'infantry' | 'cavalry' | 'archer';
export type TerrainType = 'grass' | 'water' | 'mountain' | 'forest';
export type GameStatus = 'setup' | 'active' | 'finished';

// Core interfaces
export interface Position {
  x: number;
  y: number;
}

export interface Unit {
  id: UnitId;
  type: TroopType;
  health: number;
  bonus: number;
  commanderId: CommanderId;
  slotIndex: number;
}

export interface Commander {
  id: CommanderId;
  type: TroopType;
  position: Position;
  health: number;
  playerId: PlayerId;
  units: (Unit | null)[];  // exactly 4 slots
  isKing: boolean;
  isBanner: boolean;
}

export interface Tile {
  position: Position;
  terrain: TerrainType;
  occupant?: CommanderId;
}

export interface Board {
  width: 24;
  height: 24;
  tiles: Tile[][];
}

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  commanders: CommanderId[];
  score: number;
  isActive: boolean;
}

export interface Action {
  type: 'move' | 'attack' | 'endTurn';
  playerId: PlayerId;
  commanderId: CommanderId;
  timestamp: number;
  details: Record<string, unknown>;
}

export interface GameState {
  id: GameId;
  board: Board;
  players: Player[];
  commanders: Map<CommanderId, Commander>;
  units: Map<UnitId, Unit>;
  activePlayerId: PlayerId;
  turnNumber: number;
  gameStatus: GameStatus;
  winner?: PlayerId;
  log: Action[];
}

// Helper types
export interface MoveResult {
  valid: boolean;
  path?: Position[];
  reason?: string;
}

export interface AttackResult {
  valid: boolean;
  reason?: string;
  casualties?: { unitId: UnitId; damage: number }[];
}
```

## Functional Approach

All state changes follow immutable patterns:

```typescript
// Example: Moving a unit
function moveCommander(
  state: GameState,
  commanderId: CommanderId,
  target: Position
): GameState {
  // Validation
  if (!isValidMove(state, commanderId, target)) {
    throw new GameRuleError('Invalid move');
  }
  
  // Create new state with updated commander position
  const commander = state.commanders.get(commanderId)!;
  const newCommander = { ...commander, position: target };
  
  const newCommanders = new Map(state.commanders);
  newCommanders.set(commanderId, newCommander);
  
  const newState: GameState = {
    ...state,
    commanders: newCommanders,
    log: [...state.log, { /* action */ }]
  };
  
  return newState;
}
```

## Summary

This data model provides:

- **Clear entity definitions** with all fields, relationships, and constraints
- **Type safety** via TypeScript interfaces and branded types
- **Validation rules** for data integrity and game rule enforcement
- **State transitions** for each entity through immutable updates
- **Extensibility** for future features (terrain effects, unit upgrades, resources)
- **Testability** via pure functions and immutable state
- **Persistence** support via JSON serialization and validation

All entities maintain referential integrity through ID references. The model emphasizes immutability: state changes produce new instances rather than mutations.
