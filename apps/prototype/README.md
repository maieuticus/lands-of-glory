# Prototype: Lands of Glory UI

PixiJS-based user interface for Lands of Glory digital board game.

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation & Start

```bash
# 1. Install root dependencies
npm install

# 2. Build game-core (required before running prototype)
npm run build

# 3. Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Controls

### Keyboard
| Key | Action |
|-----|--------|
| `D` | Toggle Debug Mode |
| `E` | End Turn |
| `ESC` | Deselect Commander |

### Mouse
| Action | Function |
|--------|----------|
| Left Click | Select Commander / Move / Attack |
| Right Click | Deselect |

## Game Rules (Version 1)

### Setup
- 2 Players
- Each player: 1 King (Infantry), 5 Commanders (3 Inf, 1 Cav, 2 Arch), 1 Banner
- King starts with units: 0, 0, 0, 0 (4x Infantry)
- Normal commanders start with units: 0, 0, 1, 3

### Movement
| Troop Type | Movement Range |
|------------|---------------|
| Infantry | 1 tile |
| Cavalry | 2 tiles |
| Archer | 1 tile |

- Each commander can move OR attack once per turn
- Cannot move through other commanders or banners

### Combat
| Troop Type | Attack Range |
|------------|-------------|
| Infantry | 1 tile (melee) |
| Cavalry | 2 tiles (melee with reach) |
| Archer | 2 tiles (ranged) |

- Click on enemy to attack
- Combat resolved with dice (1 die per unit, max 4)
- Empty commanders fight as cavalry with 1 die
- King gives +1 bonus to all his units
- Automatic casualty assignment

### Banner Capture
- Only Infantry and Cavalry can capture banners
- Must be adjacent to banner (melee range)
- Archers cannot capture banners
- Capturing banner defeats the opponent

### Victory Conditions
1. Defeat enemy King (reduce to 0 health)
2. Capture enemy Banner

## Debug Mode

Press `D` to toggle debug overlay showing:
- Unit bonus values
- Commander positions
- Active player ID
- Game status
- Unit counts per commander

## Architecture

### Renderer
- **game-renderer.ts**: Main rendering loop with console output (Phase 2)
- **layers.ts**: Board, unit, effect, and UI layer management
- **sprites.ts**: Sprite creation helpers for tiles, units, effects

### Controller
- **game-controller.ts**: Input handling and game state synchronization
  - Movement validation with TROOP_STATS
  - Combat resolution integration
  - Banner capture logic
  - Turn management

### UI
- **ui-state.ts**: UI state (selections, highlights, debug mode)

## Development

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Testing

```bash
# Run structure tests (works without npm install)
npm run test:structure

# Run full game-core tests (requires npm install)
cd packages/game-core
npm install
npm test

# Run E2E tests (Cypress)
npm run test:e2e       
npm run test:e2e:open  # Open Cypress UI
```

## Project Structure

```
apps/prototype/
├── src/
│   ├── controller/
│   │   └── game-controller.ts    # Input & game logic
│   └── renderer/
│       ├── game-renderer.ts      # Visual output
│       ├── layers.ts             # Rendering layers
│       └── sprites.ts            # Sprite helpers
├── tests/                        # E2E tests
├── index.html                    # Entry point
└── vite.config.ts               # Build configuration
```

## Current Status (Phase 2)

✅ **Implemented:**
- Complete game-core integration
- Banner/Commander/Unit data model per Spec 003
- Movement with correct ranges (Spec 004)
- Combat system with dice resolution (Spec 005)
- Turn management with `hasActedThisTurn`
- Victory conditions (King defeat, Banner capture)
- Console-based rendering
- Debug mode

🔄 **Next (Phase 3):**
- Visual PixiJS rendering with sprites
- Drag-and-drop interface
- Animations for movement and combat
- Visual feedback for valid/invalid moves

## Performance Targets

- Rendering: 60 FPS (16.67ms per frame)
- Turn update: <100ms
- UI responsiveness: <100ms

## License

MIT
