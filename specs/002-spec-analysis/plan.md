# Implementation Plan: Lands of Glory Digital Board Game Prototype

**Branch**: `002-spec-analysis` | **Date**: 2025 | **Spec**: `/specs/002-spec-analysis/spec.md`

**Input**: Feature specification from `/specs/002-spec-analysis/spec.md`

## Summary

Implement a local multiplayer tactical board game prototype (Lands of Glory) with a 24×24 game board, commander-led unit squads, rule-validated movement and combat with dice resolution, and victory conditions based on King defeat or Banner capture. The prototype uses PixiJS for rendering and a pure functional game-core library for logic, enabling deterministic replay, server validation, and future multiplayer support via Colyseus.

## Technical Context

**Language/Version**: JavaScript/TypeScript (ES2020+)

**Primary Dependencies**: 
- PixiJS 7+ (rendering)
- Jest 29+ (testing game-core)
- Cypress 13+ (E2E testing prototype)
- Vite 4+ (dev server and build)
- Colyseus (future multiplayer)

**Storage**: N/A for v1 (local state in memory; localStorage for saves)

**Testing**: 
- Jest for game-core unit tests
- Cypress for prototype E2E tests
- Target: 100% coverage for game-core logic

**Target Platform**: Browser (Chromium-based, ES2020+), offline-capable

**Project Type**: Web app (PixiJS UI) + library (game-core game logic), monorepo structure

**Performance Goals**: 
- 60 FPS rendering (16.67ms per frame)
- <100ms turn resolution (click to result)
- <50ms pathfinding (A* on 24×24)

**Constraints**: 
- <50MB memory footprint for full game session
- <2s initial load time
- <500ms turn update time
- Offline-capable (no server dependency for v1)

**Scale/Scope**: 
- 2-4 players per game
- 24×24 board
- 8-12 units per player (in slots)
- 3-4 commanders per player

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (no constitution violations)

**Notes**: 
- Constitution file is template; no principles to verify against yet
- Recommend establishing principles post-planning (see governance notes below)

## Project Structure

### Documentation (this feature)

```text
specs/002-spec-analysis/
├── plan.md              # This file (implementation planning output)
├── research.md          # Phase 0 output (all technical decisions)
├── data-model.md        # Phase 1 output (entity definitions)
├── quickstart.md        # Phase 1 output (setup + usage guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── game-api.ts      # game-core public interface
│   └── renderer-api.ts  # PixiJS renderer interface
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

The project uses a **monorepo with npm workspaces**:

```text
lands-of-glory/
├── packages/
│   └── game-core/                  # Pure game logic library
│       ├── src/
│       │   ├── types.ts            # Type definitions (Position, Unit, etc.)
│       │   ├── index.ts            # Public API exports
│       │   ├── game.ts             # Game initialization, turn management
│       │   ├── movement.ts         # Unit movement validation + execution
│       │   ├── combat.ts           # Combat resolution + dice
│       │   ├── board.ts            # Board representation, pathfinding (A*)
│       │   ├── pathfinding.ts      # A* algorithm implementation
│       │   ├── rng.ts              # Seeded random number generator
│       │   ├── errors.ts           # GameRuleError class
│       │   ├── persistence.ts      # Save/load game state
│       │   └── replay.ts           # Action log + deterministic replay
│       ├── tests/
│       │   ├── movement.test.ts
│       │   ├── combat.test.ts
│       │   ├── pathfinding.test.ts
│       │   └── ... (100% coverage target)
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── apps/
│   └── prototype/                  # PixiJS UI application
│       ├── src/
│       │   ├── main.ts             # Entry point
│       │   ├── index.html
│       │   ├── renderer/
│       │   │   ├── game-renderer.ts    # PixiJS rendering layer
│       │   │   ├── layers.ts           # Board, unit, effect layers
│       │   │   └── sprites.ts          # Sprite creation helpers
│       │   ├── controller/
│       │   │   ├── game-controller.ts  # Input handling + game state
│       │   │   └── camera.ts           # Camera pan/zoom
│       │   ├── ui/
│       │   │   ├── ui-state.ts         # UI (selections, highlights)
│       │   │   ├── panels.ts           # Status panels, buttons
│       │   │   └── styles.css
│       │   └── assets/
│       │       ├── tiles/
│       │       ├── units/
│       │       └── ui/
│       ├── tests/
│       │   └── e2e/
│       │       ├── gameplay.cy.ts
│       │       └── ui.cy.ts
│       ├── vite.config.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── docs/
│   ├── architecture.md         # Design decisions (linked from specs)
│   ├── data-model.md           # Entity definitions
│   ├── quickstart.md           # Setup + gameplay guide
│   └── README.md
│
├── .github/
│   └── copilot-instructions.md # Agent context (updated in Phase 1)
│
└── package.json (root, npm workspaces config)
```

**Structure Decision**: 
Monorepo with npm workspaces enables:
- **game-core**: Standalone library, testable independently, future npm publish
- **prototype**: Vite app consuming game-core, PixiJS UI layer
- **Shared**: Monorepo simplifies dev workflow (single `npm install`, linked packages)
- **Future**: Easy to add other consumers (AI player, server validation, Discord bot)

### Root Scripts

```json
{
  "scripts": {
    "install": "npm install && npm -w @lands-of-glory/game-core run build",
    "dev": "npm -w lands-of-glory-prototype run dev",
    "build": "npm -w @lands-of-glory/game-core run build && npm -w lands-of-glory-prototype run build",
    "test": "npm -w @lands-of-glory/game-core run test",
    "test:watch": "npm -w @lands-of-glory/game-core run test:watch",
    "test:e2e": "npm -w lands-of-glory-prototype run test:e2e",
    "lint": "npm -w @lands-of-glory/game-core run lint && npm -w lands-of-glory-prototype run lint",
    "type-check": "npm -w @lands-of-glory/game-core run type-check && npm -w lands-of-glory-prototype run type-check"
  }
}
```

## Complexity Tracking

> No Constitution Check violations. No complexity justification needed at this time.
