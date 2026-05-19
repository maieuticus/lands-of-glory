/**
 * apps/prototype/src/renderer/game-renderer.ts
 *
 * Main PixiJS renderer for the game
 *
 * Responsible for:
 * - Rendering game state visually
 * - Managing camera (pan, zoom)
 * - Handling input events
 * - Displaying UI and effects
 */

import { GameState, Position } from '@lands-of-glory/game-core';

/**
 * UI state that is NOT persisted as part of GameState
 */
export interface UIState {
  selectedCommanderId?: string;
  hoveredTile?: Position;
  debugEnabled: boolean;
}

/**
 * Camera state
 */
export interface CameraState {
  position: Position;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Main game renderer (simplified stub for Phase 2)
 */
export class GameRenderer {
  private camera: CameraState;
  private tileSize: number;

  constructor(
    containerId: string,
    width: number,
    height: number,
    tileSize: number = 128
  ) {
    this.tileSize = tileSize;
    this.camera = {
      position: { x: 0, y: 0 },
      zoom: 1,
      viewportWidth: width,
      viewportHeight: height,
    };

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    // Create canvas placeholder
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = '1px solid #ccc';
    container.appendChild(canvas);
  }

  /**
   * Render the current game state
   *
   * @param state - Current game state
   * @param uiState - UI state
   */
  render(state: GameState, uiState: UIState): void {
    // Stub: Rendering will be implemented in Phase 3
  }

  /**
   * Clear all rendered content
   */
  clear(): void {
    // Stub
  }

  /**
   * Get current camera state
   */
  getCamera(): CameraState {
    return { ...this.camera };
  }

  /**
   * Set camera position (pan)
   */
  setCamera(position: Position): void {
    this.camera = { ...this.camera, position };
  }

  /**
   * Set camera zoom
   */
  setZoom(zoom: number): void {
    this.camera = { ...this.camera, zoom: Math.max(0.25, Math.min(4, zoom)) };
  }

  /**
   * Pan camera smoothly
   */
  panCamera(delta: Position, duration: number = 300): void {
    const newX = this.camera.position.x + delta.x;
    const newY = this.camera.position.y + delta.y;
    this.camera = { ...this.camera, position: { x: newX, y: newY } };
  }

  /**
   * Zoom camera smoothly
   */
  zoomCamera(targetZoom: number, duration: number = 300): void {
    this.setZoom(targetZoom);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: Position): Position {
    return screenPos;
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: Position): Position {
    return worldPos;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Stub
  }
}

/**
 * Create a game renderer
 *
 * @param containerId - DOM element ID for canvas
 * @param width - Canvas width
 * @param height - Canvas height
 * @param tileSize - Pixel size of each tile
 * @returns GameRenderer instance
 */
export function createGameRenderer(
  containerId: string,
  width: number,
  height: number,
  tileSize: number = 128
): GameRenderer {
  return new GameRenderer(containerId, width, height, tileSize);
}
