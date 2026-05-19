# Copilot Instructions for Lands of Glory

## Project Overview

**Lands of Glory** is a digital board game prototype featuring:
- 24×24 grid-based tactical board
- Commander-led unit squads (up to 4 units per commander)
- Turn-based movement with A* pathfinding
- Deterministic dice-based combat
- Victory conditions (King defeat or Banner capture)

## Technical Stack

- **Language**: TypeScript (ES2020+)
- **Rendering**: PixiJS 7+
- **Game Logic**: Pure functional, immutable state
- **Testing**: Jest (game-core), Cypress (prototype)
- **Build**: Vite (prototype), TypeScript compiler (game-core)
- **Package Manager**: npm with workspaces

## Project Structure

```
lands-of-glory/
├── packages/game-core/      # Pure game logic (library)
│   ├── src/                 # TypeScript source
│   ├── tests/               # Jest unit tests
│   ├── jest.config.js
│   └── tsconfig.json
├── apps/prototype/          # PixiJS UI application
│   ├── src/                 # TypeScript source
│   ├── tests/e2e/           # Cypress E2E tests
│   ├── vite.config.ts
│   └── cypress.config.ts
├── docs/                    # Documentation
├── specs/                   # Specification artifacts
└── contracts/               # API contracts
```

## Key Files

- **spec.md**: Feature specification (4 user stories, 14 requirements, 10 success criteria)
- **plan.md**: Technical implementation plan (architecture, tech decisions)
- **tasks.md**: 94 implementation tasks organized by phase
- **data-model.md**: Entity definitions (Unit, Commander, Board, GameState, etc.)
- **contracts/game-api.ts**: Game-core public interface
- **contracts/renderer-api.ts**: PixiJS renderer interface

## Game-Core Architecture

**Pure Functional Design**:
- All state is immutable
- Actions produce new GameState
- Deterministic (same seed = same outcome)
- Replay-capable

**Core Modules**:
- `types.ts`: Type definitions
- `game.ts`: Game initialization, turn management
- `movement.ts`: Movement validation + pathfinding
- `combat.ts`: Combat resolution with dice
- `board.ts`: 24×24 grid representation
- `pathfinding.ts`: A* algorithm
- `rng.ts`: Seeded PRNG for determinism
- `errors.ts`: GameRuleError
- `persistence.ts`: Save/load
- `replay.ts`: Action logging and replay

## Prototype Architecture

**Layered Rendering**:
- Board layer: Tiles and terrain
- Unit layer: Commanders and units
- Effect layer: Animations
- UI layer: Panels, buttons, info

**Game Controller**:
- Input handling (mouse clicks, keyboard)
- Game state synchronization
- UI state management

## Development Workflow

### Local Development

```bash
npm install                # Install all dependencies
npm run dev               # Start prototype dev server (port 3000)
npm test                  # Run game-core tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests
npm run lint             # Run ESLint
npm run type-check       # TypeScript strict mode check
```

### Implementation Strategy

**Phase 1 (Setup)**: Monorepo initialization ✅
**Phase 2 (Foundational)**: Core types, board, pathfinding, game infrastructure (BLOCKS all user stories)
**Phase 3 (Movement MVP)**: Board rendering, movement validation, A* pathfinding
**Phase 4 (Combat)**: Combat resolution with dice
**Phase 5 (Turn Management)**: Turn flow, victory conditions
**Phase 6 (Squads)**: Multi-unit commanders
**Phase 7 (Polish)**: Save/load, replay, testing, optimization

## Performance Targets

- **Rendering**: 60 FPS (16.67ms per frame)
- **Turn Resolution**: <100ms
- **Pathfinding**: <50ms (24×24 board)
- **Memory**: <50MB per game session
- **Load Time**: <2s

## Testing Requirements

- **Game-Core**: 100% test coverage (Jest)
- **Prototype**: >80% E2E coverage (Cypress)
- **Test-First Approach**: Contract tests before implementation

## Key Design Decisions

1. **Pure Functional Game-Core**: Enables deterministic replay and future server validation
2. **Monorepo Structure**: game-core library + prototype UI consumer
3. **PixiJS Rendering**: Efficient 2D graphics with layered architecture
4. **Seeded RNG**: Deterministic combat outcomes for replay
5. **A* Pathfinding**: Terrain-aware, performant movement
6. **No External Multiplayer v1**: Local-only, offline-capable

## Important Constraints

- No server dependency for v1 MVP
- Offline-capable (localStorage saves)
- TypeScript strict mode required
- Must pass linting (ESLint) and type checking (tsc)
- All commits include Co-authored-by: Copilot trailer

## Next Steps

After Phase 1 setup:
1. Execute Phase 2: Foundational tasks (types, board, pathfinding, game infrastructure)
2. Validate foundation with tests
3. Execute Phase 3: User Story 1 (Movement MVP)
4. Run E2E test to verify gameplay
