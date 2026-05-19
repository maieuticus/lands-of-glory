# Prototype: Lands of Glory UI

PixiJS-based user interface for Lands of Glory digital board game.

## Architecture

### Renderer
- **game-renderer.ts**: Main PixiJS application and rendering loop
- **layers.ts**: Board, unit, effect, and UI layer management
- **sprites.ts**: Sprite creation helpers for tiles, units, effects

### Controller
- **game-controller.ts**: Input handling and game state synchronization
- **camera.ts**: Camera pan/zoom controls

### UI
- **ui-state.ts**: UI state (selections, highlights)
- **panels.ts**: Status panels, buttons, info displays

## Development

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production
```

## Testing

```bash
npm run test:e2e       # Run E2E tests
npm run test:e2e:open  # Open Cypress UI
```

## Performance Targets

- Rendering: 60 FPS (16.67ms per frame)
- Turn update: <100ms
- UI responsiveness: <100ms
