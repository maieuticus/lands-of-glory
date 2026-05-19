---
description: "Task list for Lands of Glory implementation"
---

# Tasks: Lands of Glory Digital Board Game Prototype

**Input**: Design documents from `/specs/002-spec-analysis/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Jest for game-core (unit), Cypress for prototype (E2E) - explicitly requested in plan.md

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Game Core**: `packages/game-core/src/` and `packages/game-core/tests/`
- **Prototype (PixiJS UI)**: `apps/prototype/src/` and `apps/prototype/tests/`
- **Documentation**: `docs/` and `contracts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [ ] T001 Create npm workspace configuration in package.json (root)
- [ ] T002 [P] Initialize game-core package with TypeScript and Jest configuration
- [ ] T003 [P] Initialize prototype package with TypeScript, Vite, and Cypress configuration
- [ ] T004 [P] Configure linting (ESLint) and formatting (Prettier) at root
- [ ] T005 Create .github/copilot-instructions.md with project context

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions & Core Interfaces

- [ ] T006 [P] Create type definitions in packages/game-core/src/types.ts (Position, Unit, Commander, Board, GameState, TroopType, etc.)
- [ ] T007 [P] Create GameRuleError class in packages/game-core/src/errors.ts (extends Error, includes rule context)
- [ ] T008 [P] Create seeded RNG (Mersenne Twister or similar) in packages/game-core/src/rng.ts with deterministic behavior

### Core Game Infrastructure

- [ ] T009 Create Board representation in packages/game-core/src/board.ts (24×24 grid, terrain support, tile/occupant tracking)
- [ ] T010 [P] Implement A* pathfinding in packages/game-core/src/pathfinding.ts (terrain costs, unit movement constraints)
- [ ] T011 Implement Game state initialization in packages/game-core/src/game.ts (new game creation, player setup, turn management)
- [ ] T012 Create action/command definitions in packages/game-core/src/actions.ts (MoveCommand, AttackCommand, EndTurnCommand, etc.)

### Game-Core Public API

- [ ] T013 Create game-core index.ts exports in packages/game-core/src/index.ts (public interface)
- [ ] T014 Copy contracts/game-api.ts to packages/game-core/src/contracts.ts (type contracts for external consumers)

### Prototype Infrastructure

- [ ] T015 [P] Initialize PixiJS application in apps/prototype/src/renderer/game-renderer.ts with layered architecture
- [ ] T016 [P] Create rendering layers in apps/prototype/src/renderer/layers.ts (board, unit, effect, UI layers)
- [ ] T017 Create sprite factory in apps/prototype/src/renderer/sprites.ts (createTileSprite, createUnitSprite helpers)
- [ ] T018 Create game controller in apps/prototype/src/controller/game-controller.ts (state management, input binding)

### Build & Test Infrastructure

- [ ] T019 Configure Jest for game-core in packages/game-core/jest.config.js
- [ ] T020 [P] Configure Cypress for prototype in apps/prototype/cypress.config.js
- [ ] T021 [P] Configure root npm scripts (dev, build, test, test:watch, test:e2e, lint)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initialize Game Board & Movement (Priority: P1) 🎯 MVP

**Goal**: Players can move commanders on a 24×24 board with A* pathfinding and terrain-aware costs

**Independent Test**: Can move a single commander to adjacent/pathfinding cells without obstacles; movement respects terrain costs

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US1] Contract test: Movement validation in packages/game-core/tests/movement.test.ts (tests all movement edge cases)
- [ ] T023 [P] [US1] Contract test: Pathfinding in packages/game-core/tests/pathfinding.test.ts (A* finds shortest path, respects terrain)
- [ ] T024 [P] [US1] Integration test: Game initialization in packages/game-core/tests/game.test.ts (create game with default board, 2 players, initial commanders)

### Implementation for User Story 1

#### Game-Core: Movement Logic

- [ ] T025 [P] [US1] Implement movement validation in packages/game-core/src/movement.ts (isValidMove, getMovementRange based on unit type)
- [ ] T026 [P] [US1] Implement movement execution in packages/game-core/src/movement.ts (executeMove, updates position, pathfinding)
- [ ] T027 [US1] Integrate pathfinding into movement in packages/game-core/src/movement.ts (depends on T025, T026, T010)

#### Prototype: Board Rendering & Input

- [ ] T028 [P] [US1] Create board rendering in apps/prototype/src/renderer/game-renderer.ts (render 24×24 grid, tile sprites)
- [ ] T029 [P] [US1] Create unit sprite rendering in apps/prototype/src/renderer/game-renderer.ts (render commanders and units)
- [ ] T030 [US1] Implement click-to-move input handling in apps/prototype/src/controller/game-controller.ts (tile click, validate move, dispatch action)
- [ ] T031 [US1] Implement pathfinding visualization in apps/prototype/src/renderer/layers.ts (highlight valid destination cells)

#### Integration & Testing

- [ ] T032 [US1] Create E2E test for movement in apps/prototype/tests/e2e/gameplay.cy.ts (click on board, verify unit moves)
- [ ] T033 [US1] Add validation and error handling in packages/game-core/src/errors.ts for movement violations
- [ ] T034 [US1] Add logging for movement operations in packages/game-core/src/movement.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Combat Resolution with Dice (Priority: P2)

**Goal**: Commanders can attack adjacent/ranged units; combat uses seeded dice rolls with bonuses; units can be defeated

**Independent Test**: Can attack adjacent enemy commander; dice rolls are deterministic with seed; hit/miss/damage resolved correctly; units die when health ≤ 0

### Tests for User Story 2

- [ ] T035 [P] [US2] Contract test: Combat calculation in packages/game-core/tests/combat.test.ts (attack validation, roll simulation, damage)
- [ ] T036 [P] [US2] Contract test: Dice system in packages/game-core/tests/rng.test.ts (seeded RNG produces deterministic sequences)
- [ ] T037 [US2] Integration test: Combat resolution in packages/game-core/tests/game.test.ts (full attack → damage → unit removal)

### Implementation for User Story 2

#### Game-Core: Combat Logic

- [ ] T038 [P] [US2] Implement combat validation in packages/game-core/src/combat.ts (isValidAttack, getAttackRange, getDefenders)
- [ ] T039 [P] [US2] Implement dice roll mechanics in packages/game-core/src/combat.ts (rollAttack, rollDefense using seeded RNG)
- [ ] T040 [US2] Implement damage calculation in packages/game-core/src/combat.ts (executeCombat, apply damage, remove dead units)
- [ ] T041 [US2] Integrate RNG into combat in packages/game-core/src/combat.ts (depends on T008, T038, T040)

#### Prototype: Combat UI

- [ ] T042 [P] [US2] Implement attack range highlighting in apps/prototype/src/renderer/layers.ts (show valid targets on selection)
- [ ] T043 [US2] Implement attack input handling in apps/prototype/src/controller/game-controller.ts (click on enemy to attack)
- [ ] T044 [US2] Create combat result display in apps/prototype/src/ui/panels.ts (show dice rolls, damage, unit status)
- [ ] T045 [US2] Implement unit death animation/removal in apps/prototype/src/renderer/game-renderer.ts

#### Integration & Testing

- [ ] T046 [US2] Create E2E test for combat in apps/prototype/tests/e2e/gameplay.cy.ts (move unit, attack, verify damage/death)
- [ ] T047 [US2] Add validation and error handling for combat violations in packages/game-core/src/errors.ts
- [ ] T048 [US2] Add logging for combat operations in packages/game-core/src/combat.ts

**Checkpoint**: Users can now move and engage in combat; unit health decreases; units can die

---

## Phase 5: User Story 3 - Turn Management & Victory Conditions (Priority: P3)

**Goal**: Turn-based flow with clear victory conditions (King defeat or Banner capture); game state persists through turns

**Independent Test**: Can start game, play turns in sequence, King/Banner defeat triggers game end

### Tests for User Story 3

- [ ] T049 [P] [US3] Contract test: Turn management in packages/game-core/tests/game.test.ts (validateEndTurn, nextTurn, turn order)
- [ ] T050 [P] [US3] Contract test: Victory conditions in packages/game-core/tests/game.test.ts (King defeated, Banner captured, game over)
- [ ] T051 [US3] Integration test: Full game flow in packages/game-core/tests/game.test.ts (init, move, attack, end turn, check victory)

### Implementation for User Story 3

#### Game-Core: Turn & Victory Logic

- [ ] T052 [P] [US3] Implement turn management in packages/game-core/src/game.ts (getCurrentPlayer, nextTurn, validateEndTurn)
- [ ] T053 [US3] Implement victory conditions in packages/game-core/src/game.ts (checkVictory, isKingDefeated, isBannerCaptured)
- [ ] T054 [US3] Create game state mutation pattern in packages/game-core/src/game.ts (immutable updates for deterministic replay)

#### Prototype: UI & Game Flow

- [ ] T055 [P] [US3] Create status panel in apps/prototype/src/ui/panels.ts (current player, turn count, game status)
- [ ] T056 [P] [US3] Implement end-turn button in apps/prototype/src/controller/game-controller.ts
- [ ] T057 [US3] Create victory/defeat screen in apps/prototype/src/ui/panels.ts (display winner, restart option)
- [ ] T058 [US3] Implement game flow in apps/prototype/src/controller/game-controller.ts (depends on turn management, victory check)

#### Integration & Testing

- [ ] T059 [US3] Create E2E test for full game flow in apps/prototype/tests/e2e/gameplay.cy.ts (start, play turns, end game)
- [ ] T060 [US3] Create replay test in packages/game-core/tests/game.test.ts (record actions, replay to same state)
- [ ] T061 [US3] Add logging for turn/victory events in packages/game-core/src/game.ts

**Checkpoint**: Full game loop is functional; players can play complete matches with victory conditions

---

## Phase 6: User Story 4 - Multi-Unit Commanders & Squad Management (Priority: P4)

**Goal**: Commanders have 4 unit slots; players can assign troops to slots; squads move/fight as cohesive units

**Independent Test**: Can create commander with multiple units; units stay in squad on movement; combat can target specific squad units

### Tests for User Story 4

- [ ] T062 [P] [US4] Contract test: Commander slots in packages/game-core/tests/game.test.ts (slot validation, unit assignment)
- [ ] T063 [P] [US4] Contract test: Squad integrity in packages/game-core/tests/movement.test.ts (units move with commander)
- [ ] T064 [US4] Integration test: Squad combat in packages/game-core/tests/combat.test.ts (target specific slots, remove wounded units)

### Implementation for User Story 4

#### Game-Core: Squad Management

- [ ] T065 [P] [US4] Implement unit slot management in packages/game-core/src/game.ts (addUnitToSlot, removeFromSlot, getSquad)
- [ ] T066 [US4] Implement squad integrity in packages/game-core/src/movement.ts (all units move with commander)
- [ ] T067 [US4] Extend combat to target slots in packages/game-core/src/combat.ts (select target slot, apply damage to slot unit)

#### Prototype: Squad UI

- [ ] T068 [P] [US4] Create squad panel showing unit slots in apps/prototype/src/ui/panels.ts (display 4 slots, unit stats)
- [ ] T069 [US4] Implement unit slot selection in apps/prototype/src/controller/game-controller.ts (click slot to target in combat)
- [ ] T070 [US4] Highlight individual units in squad in apps/prototype/src/renderer/game-renderer.ts (visual distinction for slots)

#### Integration & Testing

- [ ] T071 [US4] Create E2E test for squad mechanics in apps/prototype/tests/e2e/gameplay.cy.ts (move squad, attack specific unit, verify squad updates)
- [ ] T072 [US4] Add squad-level validation in packages/game-core/src/errors.ts
- [ ] T073 [US4] Add logging for squad operations in packages/game-core/src/game.ts

**Checkpoint**: Squads fully functional; players can manage units within commanders; combat targets individual units

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories; documentation and optimization

### Save/Load & Persistence

- [ ] T074 [P] Implement game save in packages/game-core/src/persistence.ts (serialize state to JSON)
- [ ] T075 [P] Implement game load in packages/game-core/src/persistence.ts (deserialize and validate)
- [ ] T076 [P] Add localStorage integration in apps/prototype/src/controller/game-controller.ts (save/load UI buttons)

### Replay System (Deterministic)

- [ ] T077 [P] Implement action logging in packages/game-core/src/replay.ts (record all actions with order)
- [ ] T078 [P] Implement deterministic replay in packages/game-core/src/replay.ts (replay actions from log, seed RNG consistently)
- [ ] T079 Create replay E2E test in apps/prototype/tests/e2e/gameplay.cy.ts (record, replay, verify same outcome)

### Documentation

- [ ] T080 [P] Update API documentation in docs/ based on implemented contracts
- [ ] T081 [P] Create game rules summary in docs/RULES.md
- [ ] T082 [P] Create development guide in docs/DEVELOPMENT.md (architecture, testing, extending)
- [ ] T083 Run quickstart.md validation against actual implementation

### Performance & Optimization

- [ ] T084 [P] Benchmark pathfinding on 24×24 board (target: <50ms)
- [ ] T085 [P] Benchmark game-core turn resolution (target: <100ms)
- [ ] T086 [P] Benchmark PixiJS rendering at 60 FPS (target: 16.67ms per frame)
- [ ] T087 Profile memory usage (target: <50MB for full session)

### Code Quality

- [ ] T088 [P] Achieve 100% test coverage for game-core
- [ ] T089 [P] Achieve >80% test coverage for prototype
- [ ] T090 Run ESLint and fix style issues
- [ ] T091 Add TypeScript strict mode validation

### Browser Compatibility

- [ ] T092 Test on Chrome, Firefox, Safari (Chromium-based)
- [ ] T093 Verify offline functionality (localStorage works without network)
- [ ] T094 Test on desktop and tablet viewports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on at least US1-US3 being complete for MVP

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational + US1 is complete - Depends on movement system
- **User Story 3 (P3)**: Can start after Foundational + US1 is complete - Turn/victory logic independent
- **User Story 4 (P4)**: Can start after Foundational + US1 is complete - Squad management independent of combat details

### Within Each User Story

- Tests (contract tests) MUST be written and FAIL before implementation
- Models/types before services
- Services before UI
- Core logic before UI integration
- Story complete and E2E passing before moving to next

### Parallel Opportunities

- **Phase 1**: All [P] tasks can run in parallel (T002, T003, T004)
- **Phase 2**: All [P] tasks within each group can run in parallel (types, infrastructure)
- **After Foundational**: All user stories (P1, P2, P3, P4) can start in parallel by different developers
- **Within each story**: All [P] test tasks can write in parallel, all [P] game-core implementation tasks in parallel, all [P] prototype tasks in parallel

---

## Parallel Example: User Story 1

```bash
# Phase 1 setup (all parallel):
T002: Initialize game-core
T003: Initialize prototype
T004: Configure linting

# Phase 2 types & infrastructure (groups can run in parallel):
T006: Type definitions
T007: GameRuleError
T008: RNG

# User Story 1 tests (all tests can write in parallel):
T022: Movement tests
T023: Pathfinding tests
T024: Game init tests

# User Story 1 game-core (logic parallel):
T025: Movement validation
T026: Movement execution

# User Story 1 prototype (UI parallel):
T028: Board rendering
T029: Unit rendering

# Integration:
T032: E2E test (depends on game-core + prototype complete)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (movement + basic rendering)
4. **STOP and VALIDATE**: Run E2E test, verify gameplay is smooth
5. Playable MVP: Players can move commanders on 24×24 board

### Incremental Delivery (P1 → P2 → P3 → P4)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP with movement!)
3. Add User Story 2 → Test independently → Demo (+ combat!)
4. Add User Story 3 → Test independently → Demo (+ full game flow!)
5. Add User Story 4 → Test independently → Demo (+ multi-unit squads!)
6. Polish & optimize
7. Each story adds value without breaking previous functionality

### Parallel Team Strategy (4 developers)

With multiple developers (after Foundational is done):

1. **Team**: Complete Setup + Foundational together (T001-T021)
2. **Developer A**: User Story 1 (movement) - T022-T034
3. **Developer B**: User Story 2 (combat) - T035-T048
4. **Developer C**: User Story 3 (turns/victory) - T049-T061
5. **Developer D**: User Story 4 (squads) - T062-T073
6. **Team**: Reconvene for Phase 7 (polish, integration, deployment)

---

## Notes

- [P] tasks = different files/modules, no blocking dependencies
- [Story] label (US1, US2, US3, US4) maps task to specific user story for traceability
- Each user story is independently completable and testable
- **Contract tests MUST be written first and fail before implementation**
- Commit after each completed task or logical group
- Stop at any checkpoint to validate story independently
- All tasks use exact file paths for clarity
- Game-core is pure functional (no side effects) to enable deterministic replay
- Prototype is stateful UI consuming game-core as a library
- Test coverage target: 100% for game-core, >80% for prototype E2E

---

## Test Framework Summary

- **Jest**: game-core unit tests (movement, combat, pathfinding, RNG)
- **Cypress**: prototype E2E tests (gameplay flow, UI interaction)
- **Test-First Approach**: Write contract tests first, implement to pass
- **Independent Test Criteria**: Each user story has standalone test scenario

---

## Success Criteria by Phase

| Phase | Criteria |
|-------|----------|
| **Phase 1** | ✅ Monorepo builds, dependencies installed |
| **Phase 2** | ✅ Type system in place, game infrastructure tested |
| **Phase 3 (US1)** | ✅ Can move commanders on 24×24 board with A* pathfinding |
| **Phase 4 (US2)** | ✅ Can attack with deterministic dice; units take damage/die |
| **Phase 5 (US3)** | ✅ Turn-based flow; King/Banner victory conditions work |
| **Phase 6 (US4)** | ✅ Squads with 4 unit slots; unit-targeting in combat |
| **Phase 7** | ✅ Save/load, replay, full test coverage, performance targets met |
