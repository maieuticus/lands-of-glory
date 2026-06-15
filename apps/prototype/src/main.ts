/**
 * apps/prototype/src/main.ts
 *
 * Application entry point
 * Initializes the game with army builder and starts the rendering loop
 */

import { 
  createGame, 
  startGame, 
  GameConfig, 
  TROOP_STATS,
  ArmyConfig,
  PlayerConfig,
  DEFAULT_STARTING_BUDGET,
} from '@lands-of-glory/game-core';
import { createGameRenderer } from './renderer/game-renderer';
import { createGameController } from './controller/game-controller';
import { showArmyBuilder } from './army-builder-screen';
import './style.css';

// Game configuration
const playerConfigs: PlayerConfig[] = [
  { name: 'Player 1', color: '#FF4444' },
  { name: 'Player 2', color: '#4444FF' },
];

const ARMY_BUILDER_ENABLED = true;
const STARTING_BUDGET = DEFAULT_STARTING_BUDGET;

// Track last selected commander to detect changes
let lastSelectedCommanderId: string | undefined = undefined;

// Initialize game
async function initGame(): Promise<void> {
  console.log('🎮 Initializing Lands of Glory...');

  try {
    const container = document.getElementById('app');
    if (!container) {
      throw new Error('App container not found');
    }

    let gameConfig: GameConfig;

    if (ARMY_BUILDER_ENABLED) {
      // Show army builder screen
      console.log('🎨 Showing army builder...');
      container.innerHTML = '';
      
      try {
        const armyConfigs = await showArmyBuilder('app', playerConfigs, STARTING_BUDGET);
        
        // Create game config with custom armies
        gameConfig = {
          players: playerConfigs.map((player, index) => ({
            ...player,
            armyConfig: armyConfigs[index],
          })),
        };
        
        console.log('✅ Army configurations complete');
      } catch (error) {
        // User cancelled army builder, use default armies
        console.log('ℹ️ Army builder cancelled, using defaults');
        gameConfig = { players: playerConfigs };
      }
    } else {
      // Use default armies
      gameConfig = { players: playerConfigs };
    }

    // Clear container and start game
    container.innerHTML = '';
    await startGameWithConfig(gameConfig);

  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    showErrorMessage(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Start the game with the given configuration
 */
async function startGameWithConfig(gameConfig: GameConfig): Promise<void> {
  console.log('🎲 Starting game...');

  // Create renderer
  const renderer = createGameRenderer('app', window.innerWidth, window.innerHeight, 48);

  // Create controller
  const controller = createGameController(gameConfig, renderer);

  // Create unit info panel
  createUnitInfoPanel();

  // Initialize and start game
  controller.initializeGame();

  // Setup window resize handling
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Renderer handles resize internally
  });

  // Setup keyboard controls
  setupKeyboardControls(controller);

  // Setup mouse controls for camera
  setupCameraControls(controller, renderer);

  // Start render loop to check for selection changes
  startSelectionMonitor(controller);

  console.log('✅ Game initialized successfully!');
  console.log('🎮 Controls:');
  console.log('  - Drag commander to move/attack');
  console.log('  - Mouse wheel to zoom');
  console.log('  - Right-click drag to pan camera');
  console.log('  - D: Toggle debug mode');
  console.log('  - E: End turn');
  console.log('  - ESC: Deselect');
}

/**
 * Create the unit info panel HTML structure
 */
function createUnitInfoPanel(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const panel = document.createElement('div');
  panel.id = 'unit-info-panel';
  panel.className = 'selected-info';
  panel.style.display = 'none'; // Hidden by default
  
    panel.innerHTML = `
    <div id="player-color-indicator" class="player-color-box"></div>
    <h4 id="unit-type-display">Unit Info</h4>
    <div class="unit-stats">
      <div class="stat-row">
        <span class="stat-label">Bewegung:</span>
        <span id="unit-move" class="stat-value">-</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Reichweite:</span>
        <span id="unit-range" class="stat-value">-</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Einheiten:</span>
        <span id="unit-count" class="stat-value">-</span>
      </div>
    </div>
  `;
  
  app.appendChild(panel);
}

/**
 * Monitor selection changes and update the info panel
 */
function startSelectionMonitor(controller: ReturnType<typeof createGameController>): void {
  const checkSelection = () => {
    const uiState = controller.getUIState();
    const currentSelection = uiState.selectedCommanderId;
    
    // Only update if selection changed
    if (currentSelection !== lastSelectedCommanderId) {
      lastSelectedCommanderId = currentSelection;
      updateUnitInfoPanel(controller);
    }
    
    requestAnimationFrame(checkSelection);
  };
  
  requestAnimationFrame(checkSelection);
}

/**
 * Update the unit info panel with current selection
 */
function updateUnitInfoPanel(controller: ReturnType<typeof createGameController>): void {
  const panel = document.getElementById('unit-info-panel');
  if (!panel) return;
  
  const uiState = controller.getUIState();
  const selectedId = uiState.selectedCommanderId;
  
  if (!selectedId) {
    panel.style.display = 'none';
    return;
  }
  
  const gameState = controller.getGameState();
  const commander = gameState.commanders.get(selectedId);
  if (!commander) {
    panel.style.display = 'none';
    return;
  }
  
  // Show panel
  panel.style.display = 'block';
  
  // Update player color indicator
  const colorIndicator = document.getElementById('player-color-indicator');
  if (colorIndicator) {
    const player = gameState.players.find(p => p.id === commander.playerId);
    const playerColor = player?.color || '#ffffff';
    colorIndicator.style.backgroundColor = playerColor;
  }
  
  // Update unit type with appropriate color
  const typeDisplay = document.getElementById('unit-type-display');
  if (typeDisplay) {
    const typeNames: Record<string, string> = {
      'cavalry': 'Kavallerie',
      'infantry': 'Infanterie',
      'archer': 'Bogenschützen'
    };
    
    const typeClasses: Record<string, string> = {
      'cavalry': 'unit-type-cavalry',
      'infantry': 'unit-type-infantry',
      'archer': 'unit-type-archer'
    };
    
    const unitType = commander.type;
    const displayName = typeNames[unitType] || unitType;
    const cssClass = typeClasses[unitType] || '';
    
    typeDisplay.innerHTML = `<span class="${cssClass}">${displayName}</span>${commander.isKing ? ' <span style="color: #ffd700;">👑</span>' : ''}`;
  }
  
  // Update stats
  const stats = TROOP_STATS[commander.type];
  
  const moveEl = document.getElementById('unit-move');
  if (moveEl) moveEl.textContent = stats.moveRange.toString();
  
  const rangeEl = document.getElementById('unit-range');
  if (rangeEl) rangeEl.textContent = stats.attackRange.toString();
  
  const countEl = document.getElementById('unit-count');
  if (countEl) {
    const activeUnits = commander.units.filter((u): u is NonNullable<typeof u> => u !== null && u.status === 'active').length;
    countEl.textContent = `${activeUnits}/4`;
  }
}

/**
 * Setup keyboard event listeners
 */
function setupKeyboardControls(controller: ReturnType<typeof createGameController>): void {
  window.addEventListener('keydown', (event) => {
    controller.handleKeyDown(event.key, {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
    });
  });
}

/**
 * Setup camera control event listeners
 */
function setupCameraControls(
  controller: ReturnType<typeof createGameController>,
  renderer: ReturnType<typeof createGameRenderer>
): void {
  let isPanning = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  // Mouse wheel for zoom
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
    const currentZoom = renderer.getCamera().zoom;
    renderer.setZoom(currentZoom * zoomDelta);
    renderer.render(controller.getGameState(), { debugEnabled: false });
  }, { passive: false });

  // Right-click drag for panning
  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 2) { // Right click
      isPanning = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      canvas.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', (event) => {
    if (isPanning) {
      const deltaX = (event.clientX - lastMouseX) / renderer.getCamera().zoom;
      const deltaY = (event.clientY - lastMouseY) / renderer.getCamera().zoom;
      
      const currentPos = renderer.getCamera().position;
      renderer.setCamera({
        x: currentPos.x - deltaX / 48, // 48 is tile size
        y: currentPos.y - deltaY / 48,
      });
      
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      
      renderer.render(controller.getGameState(), { debugEnabled: false });
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = 'default';
    }
  });
}

/**
 * Show error message to user
 */
function showErrorMessage(message: string): void {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: #ff6b6b;
        font-family: Arial, sans-serif;
      ">
        <h1>⚠️ Error</h1>
        <p>${message}</p>
        <button onclick="location.reload()" style="
          margin-top: 20px;
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
        ">Reload</button>
      </div>
    `;
  }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
