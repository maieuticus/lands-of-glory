/**
 * HISTORICAL DESIGN DRAFT, not an implemented or type-checked API.
 * Block 3 will align this with the actual prototype renderer.
 * contracts/renderer-api.ts
 *
 * This is the interface contract between game-core (pure logic) and the PixiJS
 * renderer (visual presentation). It defines what the renderer must implement
 * and what events it must emit to the controller.
 *
 * The renderer is responsible for:
 * - Displaying game state visually
 * - Handling user input (clicks, drag, keyboard)
 * - Managing camera (pan, zoom)
 * - Providing visual feedback
 *
 * Design principles:
 * - Renderer is stateless with respect to GameState
 * - Renderer accepts complete GameState on each render() call
 * - Renderer delegates game logic to controllers, not game-core
 * - Events are typed and allow for easy testing/mocking
 */

import { GameState, Position, CommanderId, UnitId, PlayerId } from './game-api';

// ============================================================================
// CORE RENDERER INTERFACE
// ============================================================================

/**
 * Main renderer interface that PixiJS implementation must provide
 */
export interface GameRenderer {
  /**
   * Render the current game state
   *
   * Called whenever GameState changes. The renderer must:
   * - Clear previous rendering
   * - Draw all board tiles
   * - Draw all commanders
   * - Draw all units within slots
   * - Update UI with current player info
   * - Apply any highlighting/effects
   *
   * @param state - Complete current game state
   * @param uiState - Temporary UI state (selections, hovers, debug mode)
   *
   * @example
   * renderer.render(gameState, {
   *   selectedCommanderId: cmd1,
   *   hoveredTile: { x: 10, y: 10 },
   *   debugEnabled: false
   * });
   */
  render(state: GameState, uiState: PrototypeUiState): void;

  /**
   * Clear all rendered content
   */
  clear(): void;

  /**
   * Get the current camera state
   *
   * @returns Current camera position and zoom level
   */
  getCamera(): CameraState;

  /**
   * Set camera position (pan)
   *
   * @param position - New camera center in world coordinates
   */
  setCamera(position: Position): void;

  /**
   * Set camera zoom level
   *
   * @param zoom - Zoom level (1 = 100%, 2 = 200%, 0.5 = 50%)
   */
  setZoom(zoom: number): void;

  /**
   * Pan camera smoothly
   *
   * @param delta - Delta to move in world coordinates
   * @param duration - Animation duration in milliseconds
   */
  panCamera(delta: Position, duration?: number): void;

  /**
   * Zoom camera smoothly
   *
   * @param targetZoom - Target zoom level
   * @param duration - Animation duration in milliseconds
   */
  zoomCamera(targetZoom: number, duration?: number): void;

  /**
   * Convert screen coordinates to world coordinates
   *
   * @param screenPos - Position in screen pixels
   * @returns Position in world coordinates (tile units)
   */
  screenToWorld(screenPos: Position): Position;

  /**
   * Convert world coordinates to screen coordinates
   *
   * @param worldPos - Position in world coordinates (tile units)
   * @returns Position in screen pixels
   */
  worldToScreen(worldPos: Position): Position;

  /**
   * Show visual feedback (highlight, selection, etc.)
   *
   * @param effect - Type and details of effect to show
   */
  showEffect(effect: VisualEffect): void;

  /**
   * Clear all visual effects
   */
  clearEffects(): void;

  /**
   * Display a message to the player
   *
   * @param text - Message text
   * @param type - Message type (info, error, success, warning)
   * @param duration - Display duration in milliseconds (0 = indefinite)
   */
  showMessage(text: string, type: MessageType, duration?: number): void;

  /**
   * Highlight valid move destinations
   *
   * @param positions - Array of valid target positions
   */
  highlightValidMoves(positions: Position[]): void;

  /**
   * Highlight valid attack targets
   *
   * @param commanderIds - Array of valid target commander IDs
   */
  highlightValidAttacks(commanderIds: CommanderId[]): void;

  /**
   * Highlight a specific tile
   *
   * @param position - Tile position
   * @param type - Highlight type (selected, valid, invalid, hover)
   */
  highlightTile(position: Position, type: HighlightType): void;

  /**
   * Highlight a specific unit
   *
   * @param commanderId - Commander ID to highlight
   * @param type - Highlight type
   */
  highlightCommander(commanderId: CommanderId, type: HighlightType): void;

  /**
   * Clear all highlights
   */
  clearHighlights(): void;

  /**
   * Animate a unit moving
   *
   * @param commanderId - Unit to animate
   * @param from - Starting position
   * @param to - Ending position
   * @param duration - Animation duration in milliseconds
   */
  animateMove(commanderId: CommanderId, from: Position, to: Position, duration?: number): Promise<void>;

  /**
   * Animate an attack (visual effect)
   *
   * @param attackerId - Attacker commander ID
   * @param targetId - Target commander ID
   * @param duration - Animation duration in milliseconds
   */
  animateAttack(attackerId: CommanderId, targetId: CommanderId, duration?: number): Promise<void>;

  /**
   * Show combat resolution visually
   *
   * @param details - Combat details for display
   */
  showCombatResolution(details: CombatDisplay): Promise<void>;

  /**
   * Show debug overlay with game info
   *
   * @param enabled - Whether to show debug info
   */
  setDebugMode(enabled: boolean): void;

  /**
   * Dispose all resources and clean up
   */
  dispose(): void;
}

// ============================================================================
// TEMPORARY UI STATE
// ============================================================================

/**
 * Temporary UI state that is NOT part of GameState
 *
 * This includes transient selections, hover effects, drag states, and debug info.
 * It exists only during a session and is not persisted.
 */
export interface PrototypeUiState {
  /**
   * Currently selected commander (for movement preview)
   */
  selectedCommanderId?: CommanderId;

  /**
   * Currently hovered tile
   */
  hoveredTile?: Position;

  /**
   * Commander being dragged
   */
  draggedCommanderId?: CommanderId;

  /**
   * Target position during drag operation
   */
  currentDragTarget?: Position;

  /**
   * Valid destination positions for selected commander
   */
  validMoveDestinations?: Position[];

  /**
   * Valid attack target commander IDs
   */
  validAttackTargets?: CommanderId[];

  /**
   * Debug mode enabled
   */
  debugEnabled: boolean;

  /**
   * Show pathfinding visualization
   */
  debugShowPaths?: boolean;

  /**
   * Show movement ranges
   */
  debugShowRanges?: boolean;

  /**
   * Show field of view
   */
  debugShowFov?: boolean;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Input events from renderer to controller
 */
export interface RenderInputEvents {
  /**
   * User clicked on a tile
   *
   * @param position - Clicked tile position
   * @param button - Mouse button (0=left, 1=middle, 2=right)
   */
  onTileClick?(position: Position, button: number): void;

  /**
   * User started dragging on a tile
   *
   * @param position - Drag start tile position
   */
  onTileDragStart?(position: Position): void;

  /**
   * User dragged to a new tile
   *
   * @param fromPosition - Drag start position
   * @param toPosition - Current drag position
   */
  onTileDrag?(fromPosition: Position, toPosition: Position): void;

  /**
   * User finished dragging
   *
   * @param fromPosition - Drag start position
   * @param toPosition - Drag end position
   */
  onTileDragEnd?(fromPosition: Position, toPosition: Position): void;

  /**
   * User clicked on a commander
   *
   * @param commanderId - Clicked commander ID
   * @param button - Mouse button
   */
  onCommanderClick?(commanderId: CommanderId, button: number): void;

  /**
   * User started dragging a commander
   *
   * @param commanderId - Commander being dragged
   */
  onCommanderDragStart?(commanderId: CommanderId): void;

  /**
   * User moved commander during drag
   *
   * @param commanderId - Commander being dragged
   * @param toPosition - Current drag position
   */
  onCommanderDrag?(commanderId: CommanderId, toPosition: Position): void;

  /**
   * User finished dragging commander
   *
   * @param commanderId - Commander being dragged
   * @param toPosition - Drop position
   */
  onCommanderDragEnd?(commanderId: CommanderId, toPosition: Position): void;

  /**
   * User hovered over a tile
   *
   * @param position - Hovered tile position
   */
  onTileHover?(position: Position): void;

  /**
   * User stopped hovering
   */
  onTileHoverEnd?(): void;

  /**
   * User pressed a keyboard key
   *
   * @param key - Key code (e.g., 'D' for debug)
   * @param modifiers - Shift, Ctrl, Alt state
   */
  onKeyDown?(key: string, modifiers: KeyModifiers): void;

  /**
   * User pressed Escape (cancel action)
   */
  onEscape?(): void;

  /**
   * User requested undo
   */
  onUndo?(): void;

  /**
   * Camera panned
   *
   * @param delta - Pan delta in world coordinates
   */
  onCameraPan?(delta: Position): void;

  /**
   * Camera zoomed
   *
   * @param zoom - New zoom level
   * @param screenCenter - Screen coordinates of zoom center
   */
  onCameraZoom?(zoom: number, screenCenter?: Position): void;
}

// ============================================================================
// VISUAL EFFECTS & DISPLAY TYPES
// ============================================================================

/**
 * Types of visual highlights
 */
export type HighlightType = 'selected' | 'valid' | 'invalid' | 'hover' | 'target' | 'under_attack';

/**
 * Types of messages
 */
export type MessageType = 'info' | 'error' | 'success' | 'warning';

/**
 * Visual effect definitions
 */
export type VisualEffect =
  | {
      type: 'highlight_tile';
      position: Position;
      highlightType: HighlightType;
    }
  | {
      type: 'highlight_commander';
      commanderId: CommanderId;
      highlightType: HighlightType;
    }
  | {
      type: 'particle_effect';
      position: Position;
      particleType: 'attack' | 'magic' | 'heal' | 'explosion';
    }
  | {
      type: 'floating_text';
      position: Position;
      text: string;
      color: string;
      duration: number;
    };

/**
 * Camera state
 */
export interface CameraState {
  position: Position;  // Center of camera in world coordinates
  zoom: number;  // 1.0 = 100%
  viewportWidth: number;  // Screen width in pixels
  viewportHeight: number;  // Screen height in pixels
}

/**
 * Combat display information
 */
export interface CombatDisplay {
  attackerId: CommanderId;
  targetId: CommanderId;
  attackerRolls: number[];  // Individual dice rolls
  defenderRolls: number[];  // Individual dice rolls
  attackerBonuses: number[];  // Bonus per attacking unit
  defenderBonuses: number[];  // Bonus per defending unit
  casualties: Array<{
    unitId: UnitId;
    defendingTeam: boolean;
    damage: number;
  }>;
  duration?: number;  // Display duration in milliseconds
}

/**
 * Key modifier state
 */
export interface KeyModifiers {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
}

// ============================================================================
// RENDERER CONFIGURATION
// ============================================================================

/**
 * Configuration for renderer initialization
 */
export interface RenderConfig {
  /**
   * Canvas container element ID
   */
  containerId: string;

  /**
   * Canvas width in pixels
   */
  width: number;

  /**
   * Canvas height in pixels
   */
  height: number;

  /**
   * Size of each tile in pixels
   */
  cellSize: number;

  /**
   * Antialiasing mode
   */
  antialias?: boolean;

  /**
   * Background color (hex or CSS color)
   */
  backgroundColor?: string;

  /**
   * Enable debug mode by default
   */
  debugMode?: boolean;

  /**
   * Asset loading paths
   */
  assetPaths?: {
    tilesets?: string;
    sprites?: string;
    fonts?: string;
  };

  /**
   * Animation settings
   */
  animations?: {
    moveSpeed?: number;  // ms per tile
    attackSpeed?: number;  // ms per attack
    combatResolutionSpeed?: number;  // ms per casualty
  };

  /**
   * UI settings
   */
  ui?: {
    showFps?: boolean;
    showCoordinates?: boolean;
    messageDisplayDuration?: number;  // ms
  };
}

/**
 * Renderer factory function type
 */
export type RendererFactory = (config: RenderConfig, events: RenderInputEvents) => GameRenderer;

// ============================================================================
// RENDERER FACTORY & INITIALIZATION
// ============================================================================

/**
 * Create a PixiJS renderer instance
 *
 * @param config - Renderer configuration
 * @param events - Input event handlers
 * @returns GameRenderer instance
 *
 * @example
 * const renderer = createRenderer({
 *   containerId: 'canvas',
 *   width: 1920,
 *   height: 1080,
 *   cellSize: 128
 * }, {
 *   onTileClick: (pos) => controller.handleTileClick(pos),
 *   onCommanderDragEnd: (cmd, pos) => controller.handleDrop(cmd, pos)
 * });
 *
 * renderer.render(gameState, uiState);
 */
export function createRenderer(config: RenderConfig, events: RenderInputEvents): GameRenderer;

// ============================================================================
// HELPER TYPES FOR TESTING
// ============================================================================

/**
 * Mock renderer for testing (no-op implementations)
 */
export class MockRenderer implements GameRenderer {
  render(): void {}
  clear(): void {}
  getCamera(): CameraState {
    return { position: { x: 0, y: 0 }, zoom: 1, viewportWidth: 1920, viewportHeight: 1080 };
  }
  setCamera(): void {}
  setZoom(): void {}
  panCamera(): void {}
  zoomCamera(): void {}
  screenToWorld(pos: Position): Position {
    return pos;
  }
  worldToScreen(pos: Position): Position {
    return pos;
  }
  showEffect(): void {}
  clearEffects(): void {}
  showMessage(): void {}
  highlightValidMoves(): void {}
  highlightValidAttacks(): void {}
  highlightTile(): void {}
  highlightCommander(): void {}
  clearHighlights(): void {}
  async animateMove(): Promise<void> {}
  async animateAttack(): Promise<void> {}
  async showCombatResolution(): Promise<void> {}
  setDebugMode(): void {}
  dispose(): void {}
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const RENDERER_VERSION = '1.0.0';
export const DEFAULT_CELL_SIZE = 128;
export const DEFAULT_ZOOM = 1;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
