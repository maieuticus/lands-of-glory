/**
 * apps/prototype/src/main.ts
 *
 * Application entry point
 * Initializes the game and starts the rendering loop
 */

import { createGame, startGame, GameConfig } from '@lands-of-glory/game-core';
import { createGameRenderer } from './renderer/game-renderer';
import { createGameController } from './controller/game-controller';
import './style.css';

// Game configuration
const gameConfig: GameConfig = {
  players: [
    { name: 'Player 1', color: '#FF0000' },
    { name: 'Player 2', color: '#0000FF' },
  ],
};

// Initialize game
function initGame(): void {
  console.log('🎮 Initializing Lands of Glory...');

  try {
    // Create renderer
    const container = document.getElementById('app');
    if (!container) {
      throw new Error('App container not found');
    }

    const renderer = createGameRenderer('app', window.innerWidth, window.innerHeight, 48);

    // Create controller
    const controller = createGameController(gameConfig, renderer);

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

    console.log('✅ Game initialized successfully!');
    console.log('🎮 Controls:');
    console.log('  - Drag commander to move/attack');
    console.log('  - Mouse wheel to zoom');
    console.log('  - Right-click drag to pan camera');
    console.log('  - D: Toggle debug mode');
    console.log('  - E: End turn');
    console.log('  - ESC: Deselect');
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    showErrorMessage(error instanceof Error ? error.message : 'Unknown error');
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
