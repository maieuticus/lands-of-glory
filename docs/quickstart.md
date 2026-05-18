# Lands of Glory - Quick Start Guide

## 🎮 Overview

Lands of Glory is a turn-based tactical board game prototype. Command armies across a 24×24 battlefield, manage your troops, and defeat your opponents through strategic movement and combat.

**Core Gameplay Loop:**
1. Select your commander (squad leader)
2. Drag to move or attack nearby enemies
3. End your turn
4. Repeat until one player remains victorious

## 📋 Prerequisites

- **Node.js** 18.0 or later
- **npm** 8.0 or later
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/maieuticus/lands-of-glory.git
cd lands-of-glory
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all packages in the monorepo:
- `@lands-of-glory/game-core` - Game logic library
- `@lands-of-glory/prototype` - PixiJS UI application

### 3. Start Development Server

```bash
npm run dev
```

This starts the Vite development server on `http://localhost:5173`.

### 4. Open in Browser

Navigate to http://localhost:5173 and the prototype loads automatically with hot-reload enabled.

## 🎯 Playing Your First Game

### Game Setup

1. **New Game**: Click "New Game" button
2. **Select Players**: Choose 2-4 players
   - Enter player names
   - Select unique colors
3. **Start Game**: Click "Start" to begin

### Basic Controls

#### Movement

- **Select Commander**: Left-click on a commander
- **See Valid Moves**: Valid destination tiles highlight in green
- **Move**: Drag-and-drop the selected commander to a green tile
  - Holding **Shift** shows movement range
  - Invalid drops appear in red

#### Combat

- **Select Attacker**: Left-click on your commander
- **See Valid Targets**: Enemy commanders in range highlight
- **Attack**: Right-click on target OR drag commander onto target
- **Resolve Combat**: Follow combat resolution dialog
  - See dice rolls for both sides
  - Watch automatic casualty assignment

#### Turn Management

- **End Turn**: Click "End Turn" button when done
- **Next Player**: Turn automatically passes to next player

### Game Rules

**Commanders:**
- Each player controls 3-4 commanders on the board
- Commanders lead 0-4 soldiers (units)
- Commanders have different troop types (Infantry, Cavalry, Archer)

**Movement:**
- Each commander can move within its movement range per turn
- Different terrains have different movement costs
- Diagonal movement is allowed (costs 1 movement point)
- Infantry can "hold" adjacent enemies (prevent their movement)

**Combat:**
- Commanders attack nearby enemies in melee
- Archers can attack from a distance but cannot move and shoot same turn
- Combat uses dice rolls + unit bonuses
- Casualties are assigned automatically
- Dead units are removed; dead commanders are captured

**Victory Conditions:**
1. **King Defeated**: If your King dies, you lose immediately
2. **Banner Captured**: If your Banner is captured in melee combat, you lose
3. **Last Player Standing**: Last player with commanders wins

**Special Units:**
- **Infantry** (green): Slow but sturdy; can hold enemies; base 10 HP
- **Cavalry** (blue): Fast and strong; mobile unit; base 8 HP
- **Archer** (orange): Ranged attacker; must choose move OR shoot; base 6 HP

## 📁 Project Structure

```
lands-of-glory/
├── apps/
│   └── prototype/                  # PixiJS UI application
│       ├── src/
│       │   ├── main.ts             # Entry point
│       │   ├── renderer.ts         # PixiJS renderer
│       │   ├── controller.ts       # Game flow controller
│       │   ├── ui/                 # UI components
│       │   │   ├── Board.ts        # Board rendering
│       │   │   ├── HUD.ts          # Heads-up display
│       │   │   ├── Menu.ts         # Main menu
│       │   │   └── DebugPanel.ts   # Debug overlay
│       │   └── styles/             # CSS
│       ├── index.html              # HTML entry point
│       ├── vite.config.ts          # Vite configuration
│       └── package.json
│
├── packages/
│   └── game-core/                  # Game logic library
│       ├── src/
│       │   ├── index.ts            # Exports all public API
│       │   ├── types/              # Type definitions
│       │   │   ├── game.ts         # GameState, Player, etc.
│       │   │   ├── units.ts        # Unit, Commander types
│       │   │   └── board.ts        # Board, Tile types
│       │   ├── game/               # Core game functions
│       │   │   ├── create.ts       # Game creation
│       │   │   ├── turn.ts         # Turn management
│       │   │   └── validation.ts   # Rule validation
│       │   ├── movement/           # Movement logic
│       │   │   ├── pathfinding.ts  # A* algorithm
│       │   │   ├── range.ts        # Valid moves
│       │   │   └── holding.ts      # Hold mechanics
│       │   ├── combat/             # Combat logic
│       │   │   ├── resolution.ts   # Combat math
│       │   │   ├── dice.ts         # Dice rolling
│       │   │   └── casualties.ts   # Unit losses
│       │   └── board/              # Board logic
│       │       ├── generator.ts    # Board creation
│       │       └── queries.ts      # Board queries
│       ├── tests/
│       │   ├── unit/               # Unit tests
│       │   ├── integration/        # Integration tests
│       │   └── fixtures/           # Test data
│       ├── package.json
│       └── tsconfig.json
│
├── contracts/                      # API contracts (interfaces)
│   ├── game-api.ts                 # Game core public API
│   └── renderer-api.ts             # Renderer interface
│
├── docs/                           # Documentation
│   ├── data-model.md               # Entity definitions
│   ├── architecture.md             # System design
│   ├── api.md                      # Function documentation
│   └── DEVELOPMENT.md              # Dev guide
│
├── specs/                          # Game rule specifications
│   ├── 001-version-1-scope.md      # Version 1 scope
│   ├── 002-board-rendering.md      # Board & rendering
│   ├── 003-commanders-units.md     # Unit system
│   ├── 004-movement.md             # Movement rules
│   ├── 005-combat.md               # Combat rules
│   └── 006-combat-examples.md      # Combat examples
│
└── .github/
    ├── workflows/                  # CI/CD pipelines
    └── pull_request_template.md    # PR template
```

## 🛠️ Development

### Build Game Core Library

```bash
npm -w @lands-of-glory/game-core run build
```

Compiles TypeScript to JavaScript in `dist/`.

### Run Tests

**Unit tests (game-core):**
```bash
npm -w @lands-of-glory/game-core run test
```

**Watch mode (re-run on changes):**
```bash
npm -w @lands-of-glory/game-core run test:watch
```

**With coverage:**
```bash
npm -w @lands-of-glory/game-core run test:coverage
```

**E2E tests (prototype UI):**
```bash
npm -w @lands-of-glory/prototype run test:e2e
```

### Code Quality

**Lint TypeScript:**
```bash
npm run lint
```

**Format code:**
```bash
npm run format
```

**Type check:**
```bash
npm run typecheck
```

### Debug in VS Code

1. Set breakpoints in source files
2. Open **Run and Debug** (Ctrl+Shift+D / Cmd+Shift+D)
3. Select "Chrome" configuration
4. Click "Play" to start debugging

VS Code will open Chrome with DevTools connected, allowing you to step through code and inspect variables.

## 🎓 Key Concepts

### GameState

The complete immutable snapshot of the game at any point in time.

```typescript
interface GameState {
  id: string;
  board: Board;
  players: Player[];
  commanders: Map<CommanderId, Commander>;
  units: Map<UnitId, Unit>;
  activePlayerId: string;
  turnNumber: number;
  gameStatus: 'setup' | 'active' | 'finished';
  winner?: string;
  log: Action[];
}
```

Every action (move, attack, endTurn) produces a new GameState. No mutations.

### Units

Individual soldiers within a commander's slots (0-4 per commander).

- **Type**: infantry, cavalry, or archer
- **Health**: 1-10, dies when ≤ 0
- **Bonus**: Combat roll bonus (usually 0-3)
- **SlotIndex**: Position in commander's unit array (0-3)

### Commanders

Squad leaders on the board representing players.

- **Type**: Inherits from units (determines empty commander behavior)
- **Position**: Current tile on board
- **Health**: 1-20, dies when ≤ 0
- **Units**: Exactly 4 slots (each null or Unit)
- **isKing**: True if this is player's king
- **isBanner**: True if this is player's banner/objective

### Movement

Each commander can move within its movement range based on troop type:

- **Infantry**: 2 tiles
- **Cavalry**: 3 tiles
- **Archer**: 2 tiles

Movement uses A* pathfinding with terrain costs:
- Grass: 1.0
- Water: blocked (impassable)
- Mountain: 2.0 (slow)
- Forest: 1.5

### Combat

Tactical grid-based combat with dice rolls:

1. Attacker and defender each roll one die per unit
2. Dice rolls are sorted naturally (ascending)
3. Bonuses are added to each die
4. Highest rolls are matched: if attacker > defender, defender loses 1 HP
5. Units die when health ≤ 0

**Special Rules:**
- Empty commanders fight as cavalry
- Archers cannot move and shoot same turn
- Infantry can hold adjacent enemies (blocking movement)
- Banner can only be captured by melee attacks

## 🐛 Troubleshooting

### Game won't load

**Check browser console** (F12 → Console tab) for errors.

**Clear cache:**
```bash
# Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Reinstall dependencies:**
```bash
rm -rf node_modules
npm install
npm run dev
```

### Commands won't move

**Check:**
1. Is it your turn? (Active player indicator at top)
2. Are there valid moves? (Drag and look for green highlights)
3. Is the destination blocked by terrain or another commander?
4. Try pressing **Shift** to see movement range

### Combat won't resolve

**Ensure:**
1. Target is within attack range
2. There's line of sight to target
3. Target is an enemy (different color)
4. You have units in commander slots to participate

### Slow performance

**Optimization steps:**
1. Close other browser tabs
2. Disable debug mode (press **D** or toggle in settings)
3. Lower resolution (if available)
4. Try a different browser

### Hot-reload isn't working

```bash
# Stop dev server (Ctrl+C)
# Hard rebuild
npm run dev
```

## 📚 Further Reading

### Game Design Documents

- **data-model.md** - Entity definitions and data structures
- **architecture.md** - System design and component interactions
- **contracts/game-api.ts** - Public game logic API
- **contracts/renderer-api.ts** - Renderer interface contract

### Game Rules Specifications

All detailed game rules are documented in `specs/` directory:

- `001-version-1-scope.md` - Version 1 scope and goals
- `002-board-rendering-input.md` - Board and input handling
- `003-commanders-units-king-banner.md` - Unit system details
- `004-movement-holding-actions.md` - Movement and hold mechanics
- `005-combat-and-dice-resolution.md` - Combat rules and resolution
- `006-combat-examples.md` - Detailed combat examples

### Development Guides

- **DEVELOPMENT.md** - Developer onboarding
- **CONTRIBUTING.md** - Contribution guidelines
- **TESTING.md** - Testing strategy and examples

## 🤝 Contributing

See CONTRIBUTING.md for guidelines on:

- Code style (ESLint + Prettier)
- Testing requirements
- Pull request process
- Commit message format
- Running the full test suite before submitting

## ❓ FAQ

**Q: Can I play online?**
A: Version 1 is local-only. Future versions will support online multiplayer.

**Q: Can I save/load games?**
A: Version 1 has no persistence. Games exist for the current session only.

**Q: What if the game crashes?**
A: Reload the browser. GameState is in-memory only.

**Q: Can I customize the board?**
A: Version 1 has a fixed 24×24 all-grass board. Future versions will support custom maps.

**Q: How do I report a bug?**
A: Open an issue on GitHub with:
- Steps to reproduce
- Expected vs. actual behavior
- Browser/OS version
- Screenshots/video if possible

## 📝 License

See LICENSE file in repository root.

## 🎯 Roadmap

**Version 2 (Planned):**
- Server-authoritative multiplayer
- Terrain variety (forests, mountains, water)
- Additional buildings beyond Banner
- Resource system (gold, supplies)

**Version 3+ (Backlog):**
- Persistent accounts and rankings
- Seasonal campaigns
- Custom scenarios
- Modding support

## 🆘 Getting Help

- **Documentation**: Read docs/ and specs/ directories
- **Issues**: Search GitHub issues or create new one
- **Discussions**: Start a GitHub discussion
- **Discord**: (Link if community exists)

---

**Enjoy commanding your armies!** 🏰⚔️
