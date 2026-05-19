# Game Core: Lands of Glory Logic Library

Pure functional game logic for Lands of Glory digital board game.

## Architecture

- **types.ts**: Core type definitions (Position, Unit, Commander, Board, GameState, etc.)
- **game.ts**: Game initialization, turn management, state mutations
- **movement.ts**: Movement validation and execution with pathfinding
- **combat.ts**: Combat resolution with dice rolls
- **board.ts**: Board representation and terrain
- **pathfinding.ts**: A* pathfinding algorithm
- **rng.ts**: Seeded random number generator for deterministic dice rolls
- **errors.ts**: GameRuleError for validation failures
- **persistence.ts**: Save/load game state
- **replay.ts**: Action logging and deterministic replay

## Testing

```bash
npm test        # Run all tests
npm run test:watch   # Watch mode
```

## Build

```bash
npm run build   # Compile TypeScript to dist/
```

## Performance Targets

- Movement validation: <50ms
- Pathfinding (24×24): <50ms
- Turn resolution: <100ms
- Full game session memory: <50MB
