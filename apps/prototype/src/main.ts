/**
 * apps/prototype/src/main.ts
 *
 * Application entry point
 * Initializes the game with start screen and menu options
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
import { showStartScreen, GameOptions, MenuSelection } from './start-screen';
import { applyUIScale } from './ui-scale';
import './style.css';

// All available player configurations
const ALL_PLAYER_CONFIGS: PlayerConfig[] = [
  { name: 'Spieler 1', color: '#FF4444' },
  { name: 'Spieler 2', color: '#4444FF' },
  { name: 'Spieler 3', color: '#44FF44' },
  { name: 'Spieler 4', color: '#FFD700' },
];

const STARTING_BUDGET = DEFAULT_STARTING_BUDGET;

/**
 * Get player configs based on count
 */
function getPlayerConfigs(count: number): PlayerConfig[] {
  return ALL_PLAYER_CONFIGS.slice(0, count);
}

// Global game options (set from start screen)
export let gameOptions: GameOptions = {
  useTextures: true,
  enableSound: true,
  showGrid: true,
};

// Re-export GameOptions type
export type { GameOptions };

// Track last selected commander to detect changes
let lastSelectedCommanderId: string | undefined = undefined;

// Track animation frame ID for cleanup
let selectionMonitorId: number | null = null;

// Track all event listeners for cleanup
let gameCleanupFunctions: (() => void)[] = [];
let currentPixiApp: any = null;
let currentRenderer: any = null;

/**
 * Cleanup all game resources before starting a new game
 */
function cleanupGame(): void {
  console.log('🧹 Cleaning up previous game...');
  
  // Cancel animation frames
  if (selectionMonitorId !== null) {
    cancelAnimationFrame(selectionMonitorId);
    selectionMonitorId = null;
  }
  
  // Remove all registered event listeners
  gameCleanupFunctions.forEach(cleanup => {
    try {
      cleanup();
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  gameCleanupFunctions = [];
  
  // Destroy renderer
  if (currentRenderer) {
    try {
      currentRenderer.destroy();
      console.log('🧹 Renderer destroyed');
    } catch (e) {
      console.warn('Error destroying renderer:', e);
    }
    currentRenderer = null;
  }

  // Destroy PIXI application
  if (currentPixiApp) {
    try {
      currentPixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
      console.log('🧹 PIXI app destroyed');
    } catch (e) {
      console.warn('Error destroying PIXI app:', e);
    }
    currentPixiApp = null;
  }
  
  // Clear container
  const container = document.getElementById('app');
  if (container) {
    container.innerHTML = '';
  }
  
  // Reset last selected commander
  lastSelectedCommanderId = undefined;
  
  console.log('🧹 Cleanup complete');
}

// Initialize game
async function initGame(): Promise<void> {
  console.log('🎮 Initializing Lands of Glory...');

  try {
    const container = document.getElementById('app');
    if (!container) {
      throw new Error('App container not found');
    }
    
    // Ensure container has proper styles
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // Show start screen
    console.log('Creating start screen...');
    const startScreen = showStartScreen('app', async (selection, options) => {
      console.log('⭐ START SCREEN CALLBACK FIRED!');
      console.log('🎮 Selected:', selection, 'with options:', options);
      
      // Save options globally
      gameOptions = options;
      
      // Hide start screen
      console.log('Hiding start screen...');
      startScreen.hide();
      console.log('Start screen hidden');
      
      // Handle menu selection
      if (selection === 'options') {
        // Options already saved, show start screen again
        startScreen.show();
        return;
      }
      
      if (selection === 'army-builder') {
        // Hide start screen first
        startScreen.hide();
        container.innerHTML = '';
        container.style.display = 'block';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        
        const activePlayers = getPlayerConfigs(gameOptions.playerCount);
        
        // Show army builder
        try {
          const result = await showArmyBuilder('app', activePlayers, STARTING_BUDGET);
          const armyConfigs = result.configs;
          const selectedBudget = result.budget;
          
          // Create game config with custom armies and budget
          const gameConfig: GameConfig = {
            players: activePlayers.map((player, index) => ({
              ...player,
              armyConfig: armyConfigs[index],
            })),
            startingBudget: selectedBudget,
          };
          
          console.log('💰 Budget from army builder:', selectedBudget);
          console.log('💰 Game config startingBudget:', (gameConfig as any).startingBudget);
          console.log('💰 Army costs:', armyConfigs.map((a, i) => `Player ${i+1}: ${a.commanders.reduce((sum, c) => sum + c.slots.filter(s => s.hasUnit).length, 0)} units`));
          
          // Cleanup and start game
          cleanupGame();
          await startGameWithConfig(gameConfig);
        } catch (error) {
          // User cancelled, show start screen again
          console.log('ℹ️ Army builder cancelled');
          startScreen.show();
        }
      } else if (selection === 'quick-start') {
        // Quick start with default armies
        console.log('⚡ Quick start selected, preparing game...');
        const activePlayers = getPlayerConfigs(gameOptions.playerCount);
        const gameConfig: GameConfig = { players: activePlayers };
        
        // Cleanup previous game if any
        cleanupGame();
        
        // Hide start screen first
        console.log('Hiding start screen...');
        startScreen.hide();
        
        // Reset container display after hide() set it to 'none'
        container.style.display = 'block';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.overflow = 'hidden';
        console.log('Container display reset:', container.style.display);
        
        // Force a small delay to ensure DOM is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Starting game with config...');
        await startGameWithConfig(gameConfig);
      }
    });

  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    showErrorMessage(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Start the game with the given configuration
 */
async function startGameWithConfig(gameConfig: GameConfig): Promise<void> {
  // Apply UI scale for in-game UI
  applyUIScale(gameOptions.diceSize);
  console.log('🎲 Starting game with textures:', gameOptions.useTextures);
  
  // Declare variables outside try block so they're available in catch and after
  let controller: ReturnType<typeof createGameController> | null = null;
  let renderer: ReturnType<typeof createGameRenderer> | null = null;
  
  try {
    // Ensure container is ready
    const container = document.getElementById('app');
    if (!container) {
      throw new Error('App container not found when starting game');
    }
    
    console.log('Container before renderer:', container.innerHTML.substring(0, 100));
    console.log('Container dimensions:', container.clientWidth, 'x', container.clientHeight);

    // Create renderer with options
    console.log('Creating renderer...');
    renderer = createGameRenderer('app', window.innerWidth, window.innerHeight, 48, {
      useTextures: gameOptions.useTextures,
      showGrid: gameOptions.showGrid,
    });
    
    // Store PIXI app and renderer for cleanup
    currentPixiApp = renderer.getApp();
    currentRenderer = renderer;
    console.log('🧹 PIXI app and renderer stored for cleanup');
    
    console.log('Renderer created, checking for canvas...');
    const canvas = container.querySelector('canvas');
    console.log('Canvas found:', !!canvas, 'Size:', canvas?.width, 'x', canvas?.height);
    
    if (!canvas) {
      throw new Error('Canvas was not created!');
    }

    // Create controller
    console.log('Creating game controller...');
    controller = createGameController(gameConfig, renderer, gameOptions.diceSize);

    // Create unit info panel
    console.log('Creating unit info panel...');
    createUnitInfoPanel();

    // Initialize and start game
    console.log('Initializing game controller...');
    controller.initializeGame();
    console.log('Game controller initialized');
    
    // Force initial render with error handling
    console.log('Rendering first frame...');
    const gameState = controller.getGameState();
    if (!gameState) {
      throw new Error('Game state is null after initialization!');
    }
    console.log('Game state:', {
      turn: gameState.turn,
      commanders: gameState.commanders.size,
      banners: gameState.banners.size,
      players: gameState.players.length
    });
    
    renderer.render(gameState, { debugEnabled: false });
    console.log('✅ First frame rendered successfully');
    
    // DEBUG: Force show canvas
    const canvasEl = document.querySelector('canvas');
    if (canvasEl) {
      console.log('🔧 DEBUG: Canvas found, forcing visibility...');
      const canvas = canvasEl as HTMLCanvasElement;
      
      // Get canvas position and size
      const rect = canvas.getBoundingClientRect();
      console.log('🔧 Canvas rect:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom
      });
      
      // Force styles
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      canvas.style.zIndex = '999999';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      
      console.log('🔧 DEBUG: Canvas should now be visible with red border!');
      console.log('🔧 Canvas computed style:', window.getComputedStyle(canvas).cssText.substring(0, 200));
    } else {
      console.error('❌ DEBUG: No canvas found in DOM!');
    }

    // Setup window resize handling
    const resizeHandler = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Renderer handles resize internally
    };
    window.addEventListener('resize', resizeHandler);
    gameCleanupFunctions.push(() => {
      window.removeEventListener('resize', resizeHandler);
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
    
  } catch (error) {
    console.error('❌ Error during game startup:', error);
    showErrorMessage('Fehler beim Starten des Spiels: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    return;
  }
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
  // Stop previous monitor if exists
  if (selectionMonitorId !== null) {
    cancelAnimationFrame(selectionMonitorId);
  }
  
  const checkSelection = () => {
    const uiState = controller.getUIState();
    const currentSelection = uiState.selectedCommanderId;
    
    // Only update if selection changed
    if (currentSelection !== lastSelectedCommanderId) {
      lastSelectedCommanderId = currentSelection;
      updateUnitInfoPanel(controller);
    }
    
    selectionMonitorId = requestAnimationFrame(checkSelection);
  };
  
  selectionMonitorId = requestAnimationFrame(checkSelection);
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
  const handler = (event: KeyboardEvent) => {
    controller.handleKeyDown(event.key, {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
    });
  };
  window.addEventListener('keydown', handler);
  
  // Register cleanup function
  gameCleanupFunctions.push(() => {
    window.removeEventListener('keydown', handler);
  });
}

/**
 * Setup camera control event listeners
 * Note: Panning is handled directly in game-renderer.ts via PIXI events
 */
function setupCameraControls(
  controller: ReturnType<typeof createGameController>,
  renderer: ReturnType<typeof createGameRenderer>
): void {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  // Mouse wheel for zoom
  const wheelHandler = (event: WheelEvent) => {
    event.preventDefault();
    const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
    const currentZoom = renderer.getCamera().zoom;
    renderer.setZoom(currentZoom * zoomDelta);
    renderer.render(controller.getGameState(), { debugEnabled: false });
  };
  canvas.addEventListener('wheel', wheelHandler, { passive: false });

  // Register cleanup function
  gameCleanupFunctions.push(() => {
    canvas.removeEventListener('wheel', wheelHandler);
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
