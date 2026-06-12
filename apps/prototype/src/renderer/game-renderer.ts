/**
 * apps/prototype/src/renderer/game-renderer.ts
 *
 * Main PixiJS renderer for the game
 *
 * Responsible for:
 * - Rendering game state visually with PixiJS
 * - Managing camera (pan, zoom)
 * - Handling input events
 * - Displaying UI and effects
 */

import {
  GameState,
  Position,
  Banner,
  TROOP_STATS,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from '@lands-of-glory/game-core';
import * as PIXI from 'pixi.js';
import { AnimationManager, AnimationConfig } from './animations';

/**
 * UI state that is NOT persisted as part of GameState
 * Per Spec 002: PrototypeUiState contains temporary UI state
 */
export interface UIState {
  selectedCommanderId?: string;
  hoveredTile?: Position;
  draggedCommanderId?: string;
  currentDragTarget?: Position;
  debugEnabled: boolean;
}

/**
 * Event callbacks for drag-and-drop
 */
export interface DragCallbacks {
  onDragStart?: (commanderId: string) => void;
  onDragMove?: (position: Position) => void;
  onDragEnd?: (commanderId: string, target: Position) => void;
}

/**
 * Drag state
 */
interface DragState {
  isDragging: boolean;
  commanderId?: string;
  startPosition?: Position;
  dragSprite?: PIXI.Graphics;
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
 * Colors for rendering
 */
const COLORS = {
  // Terrain
  GRASS: 0x7cb342,
  GRASS_DARK: 0x558b2f,
  GRID: 0x33691e,
  
  // Players
  PLAYER_1: 0xe53935,  // Red
  PLAYER_2: 0x1e88e5,  // Blue
  PLAYER_3: 0x43a047,  // Green
  PLAYER_4: 0xfdd835,  // Yellow
  
  // Units
  INFANTRY: 0x5d4037,   // Brown
  CAVALRY: 0xff8f00,    // Orange/Amber
  ARCHER: 0x00897b,     // Teal
  
  // UI
  SELECTED: 0xffeb3b,
  VALID_MOVE: 0x4caf50,
  INVALID_MOVE: 0xf44336,
  BANNER: 0x8e24aa,     // Purple
  KING_CROWN: 0xffd700, // Gold
  
  // Debug
  DEBUG_TEXT: 0xffffff,
};

const PLAYER_COLORS = [COLORS.PLAYER_1, COLORS.PLAYER_2, COLORS.PLAYER_3, COLORS.PLAYER_4];

/**
 * Main game renderer
 */
export class GameRenderer {
  private app: PIXI.Application;
  private camera: CameraState;
  private tileSize: number;
  private container: HTMLElement;
  
  // Layers
  private boardLayer: PIXI.Container;
  private bannerLayer: PIXI.Container;
  private commanderLayer: PIXI.Container;
  private uiLayer: PIXI.Container;
  private debugLayer: PIXI.Container;
  
  // Cache for sprites
  private tileSprites: Map<string, PIXI.Graphics> = new Map();
  private commanderSprites: Map<string, PIXI.Container> = new Map();
  private bannerSprites: Map<string, PIXI.Graphics> = new Map();
  
  // Drag state
  private dragState: DragState = { isDragging: false };
  private callbacks: DragCallbacks = {};
  
  // Drag overlay for valid/invalid indicators
  private dragOverlay: PIXI.Graphics | null = null;

  constructor(
    containerId: string,
    width: number,
    height: number,
    tileSize: number = 64
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
    this.container = container;

    // Create PixiJS Application
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x2e7d32,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    container.appendChild(this.app.view as HTMLCanvasElement);

    // Create layers
    this.boardLayer = new PIXI.Container();
    this.bannerLayer = new PIXI.Container();
    this.commanderLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    this.debugLayer = new PIXI.Container();

    this.app.stage.addChild(this.boardLayer);
    this.app.stage.addChild(this.bannerLayer);
    this.app.stage.addChild(this.commanderLayer);
    this.app.stage.addChild(this.uiLayer);
    this.app.stage.addChild(this.debugLayer);

    // Initialize animation manager
    this.animationManager = new AnimationManager(this.app);

    // Setup drag-and-drop events
    this.setupDragEvents();

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Set callbacks for drag-and-drop events
   */
  setDragCallbacks(callbacks: DragCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Setup drag-and-drop event handling
   */
  private setupDragEvents(): void {
    // Enable interactivity
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // Mouse/Touch events
    this.app.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      const pos = this.screenToWorld({ x: e.global.x, y: e.global.y });
      this.handlePointerDown(pos, e.global);
    });

    this.app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      const pos = this.screenToWorld({ x: e.global.x, y: e.global.y });
      this.handlePointerMove(pos, e.global);
    });

    this.app.stage.on('pointerup', (e: PIXI.FederatedPointerEvent) => {
      const pos = this.screenToWorld({ x: e.global.x, y: e.global.y });
      this.handlePointerUp(pos);
    });

    this.app.stage.on('pointerupoutside', (e: PIXI.FederatedPointerEvent) => {
      this.cancelDrag();
    });

    // Right-click for deselect (context menu)
    this.app.view.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
    });
  }

  /**
   * Handle pointer down (start drag or select)
   */
  private handlePointerDown(worldPos: Position, screenPos: Position): void {
    // Check if clicked on a commander
    const clickedCommander = this.findCommanderAtPosition(worldPos);
    
    if (clickedCommander) {
      this.startDrag(clickedCommander, worldPos, screenPos);
    }
  }

  /**
   * Handle pointer move (update drag)
   */
  private handlePointerMove(worldPos: Position, screenPos: Position): void {
    if (this.dragState.isDragging && this.dragState.dragSprite) {
      // Update drag sprite position to follow mouse
      this.dragState.dragSprite.x = screenPos.x;
      this.dragState.dragSprite.y = screenPos.y;

      // Update hover indicator
      this.updateDragOverlay(worldPos);

      // Notify callback
      if (this.callbacks.onDragMove) {
        this.callbacks.onDragMove(worldPos);
      }
    }
  }

  /**
   * Handle pointer up (end drag)
   */
  private handlePointerUp(worldPos: Position): void {
    if (this.dragState.isDragging && this.dragState.commanderId) {
      // End drag
      if (this.callbacks.onDragEnd) {
        this.callbacks.onDragEnd(this.dragState.commanderId, worldPos);
      }
    }
    this.cancelDrag();
  }

  /**
   * Start dragging a commander
   */
  private startDrag(commanderId: string, worldPos: Position, screenPos: Position): void {
    this.dragState = {
      isDragging: true,
      commanderId,
      startPosition: worldPos,
    };

    // Create drag visual (ghost of the commander)
    const dragSprite = new PIXI.Graphics();
    const size = this.tileSize * this.camera.zoom;
    
    // Semi-transparent commander representation
    dragSprite.beginFill(0xffffff, 0.5);
    dragSprite.drawRoundedRect(-size/2, -size/2, size, size, size * 0.1);
    dragSprite.endFill();
    
    dragSprite.x = screenPos.x;
    dragSprite.y = screenPos.y;
    dragSprite.alpha = 0.7;
    
    this.uiLayer.addChild(dragSprite);
    this.dragState.dragSprite = dragSprite;

    // Create overlay for valid/invalid moves
    this.createDragOverlay();

    // Notify callback
    if (this.callbacks.onDragStart) {
      this.callbacks.onDragStart(commanderId);
    }
  }

  /**
   * Cancel current drag operation
   */
  private cancelDrag(): void {
    if (this.dragState.dragSprite) {
      this.dragState.dragSprite.destroy();
    }
    if (this.dragOverlay) {
      this.dragOverlay.destroy();
      this.dragOverlay = null;
    }
    this.dragState = { isDragging: false };
  }

  /**
   * Create overlay showing valid/invalid move targets
   */
  private createDragOverlay(): void {
    this.dragOverlay = new PIXI.Graphics();
    this.uiLayer.addChild(this.dragOverlay);
  }

  /**
   * Update drag overlay to show current hover state
   */
  private updateDragOverlay(hoverPos: Position): void {
    if (!this.dragOverlay || !this.dragState.startPosition) return;

    this.dragOverlay.clear();

    const screenPos = this.worldToScreen(hoverPos);
    const size = this.tileSize * this.camera.zoom;

    // Draw hover indicator
    this.dragOverlay.lineStyle(3, 0xffffff, 0.8);
    this.dragOverlay.drawRect(screenPos.x + 2, screenPos.y + 2, size - 4, size - 4);
  }

  // Store current state for interaction
  private currentState: GameState | null = null;
  
  // Animation manager
  private animationManager: AnimationManager;

  /**
   * Find commander at a world position
   */
  private findCommanderAtPosition(pos: Position): string | undefined {
    if (!this.currentState) return undefined;
    
    for (const [id, cmd] of this.currentState.commanders) {
      if (cmd.position.x === pos.x && cmd.position.y === pos.y) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Render the current game state
   */
  render(state: GameState, uiState: UIState): void {
    // Store state for interaction handling
    this.currentState = state;
    
    this.clearLayers();
    
    this.renderBoard(state, uiState);
    this.renderValidMoves(state, uiState);
    this.renderBanners(state);
    this.renderCommanders(state, uiState);
    this.renderHeldStatus(state);
    
    if (uiState.debugEnabled) {
      this.renderDebug(state, uiState);
    }
  }

  /**
   * Render valid move indicators
   */
  private renderValidMoves(state: GameState, uiState: UIState): void {
    if (!uiState.selectedCommanderId) return;

    const commander = state.commanders.get(uiState.selectedCommanderId as CommanderId);
    if (!commander || commander.hasActedThisTurn) return;

    const graphics = new PIXI.Graphics();
    const range = TROOP_STATS[commander.type].moveRange;

    // Draw movement range indicator
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === 0) continue;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > range) continue;

        const targetX = commander.position.x + dx;
        const targetY = commander.position.y + dy;

        // Check if position is valid
        if (targetX < 0 || targetX >= 24 || targetY < 0 || targetY >= 24) continue;

        const screenPos = this.worldToScreen({ x: targetX, y: targetY });
        const size = this.tileSize * this.camera.zoom;

        // Check if position is occupied
        let isOccupied = false;
        for (const cmd of state.commanders.values()) {
          if (cmd.position.x === targetX && cmd.position.y === targetY) {
            isOccupied = true;
            break;
          }
        }

        // Check if banner is there
        for (const banner of state.banners.values()) {
          if (banner.position.x === targetX && banner.position.y === targetY && banner.status === 'standing') {
            isOccupied = true;
            break;
          }
        }

        if (!isOccupied) {
          // Valid move - green highlight
          graphics.beginFill(COLORS.VALID_MOVE, 0.3);
          graphics.drawRect(screenPos.x + 2, screenPos.y + 2, size - 4, size - 4);
          graphics.endFill();
        }
      }
    }

    this.uiLayer.addChild(graphics);
  }

  /**
   * Render held status indicators
   */
  private renderHeldStatus(state: GameState): void {
    const graphics = new PIXI.Graphics();
    const activePlayer = state.players.find(p => p.id === state.activePlayerId);
    if (!activePlayer) return;

    for (const commanderId of activePlayer.commanders) {
      const commander = state.commanders.get(commanderId);
      if (!commander) continue;

      // Check if held by enemy infantry
      const isHeld = this.isCommanderHeld(state, commanderId);
      if (isHeld) {
        const screenPos = this.worldToScreen(commander.position);
        const size = this.tileSize * this.camera.zoom;

        // Draw red chain link indicator
        graphics.lineStyle(3, COLORS.INVALID_MOVE, 0.8);
        graphics.drawCircle(screenPos.x + size / 2, screenPos.y + size / 2, size * 0.4);
        
        // Draw chain links
        const linkSize = size * 0.15;
        graphics.lineStyle(2, COLORS.INVALID_MOVE, 1);
        graphics.drawCircle(screenPos.x + size * 0.35, screenPos.y + size / 2, linkSize);
        graphics.drawCircle(screenPos.x + size * 0.65, screenPos.y + size / 2, linkSize);
      }
    }

    this.uiLayer.addChild(graphics);
  }

  /**
   * Check if commander is held by enemy infantry
   */
  private isCommanderHeld(state: GameState, commanderId: CommanderId): boolean {
    const commander = state.commanders.get(commanderId);
    if (!commander) return false;

    const adjacentPositions = [
      { x: commander.position.x - 1, y: commander.position.y },
      { x: commander.position.x + 1, y: commander.position.y },
      { x: commander.position.x, y: commander.position.y - 1 },
      { x: commander.position.x, y: commander.position.y + 1 },
      { x: commander.position.x - 1, y: commander.position.y - 1 },
      { x: commander.position.x + 1, y: commander.position.y - 1 },
      { x: commander.position.x - 1, y: commander.position.y + 1 },
      { x: commander.position.x + 1, y: commander.position.y + 1 },
    ];

    for (const [id, cmd] of state.commanders) {
      if (cmd.playerId !== commander.playerId &&
          cmd.type === 'infantry' &&
          adjacentPositions.some(pos => pos.x === cmd.position.x && pos.y === cmd.position.y)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear all layers
   */
  private clearLayers(): void {
    this.boardLayer.removeChildren();
    this.bannerLayer.removeChildren();
    this.commanderLayer.removeChildren();
    this.uiLayer.removeChildren();
    this.debugLayer.removeChildren();
  }

  /**
   * Render the game board
   */
  private renderBoard(state: GameState, uiState: UIState): void {
    const graphics = new PIXI.Graphics();
    
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const screenPos = this.worldToScreen({ x, y });
        const size = this.tileSize * this.camera.zoom;
        
        // Draw tile background
        const isEven = (x + y) % 2 === 0;
        graphics.beginFill(isEven ? COLORS.GRASS : COLORS.GRASS_DARK);
        graphics.drawRect(screenPos.x, screenPos.y, size, size);
        graphics.endFill();
        
        // Draw grid
        graphics.lineStyle(1, COLORS.GRID, 0.3);
        graphics.drawRect(screenPos.x, screenPos.y, size, size);
        
        // Highlight hovered tile
        if (uiState.hoveredTile?.x === x && uiState.hoveredTile?.y === y) {
          graphics.lineStyle(2, COLORS.SELECTED, 0.5);
          graphics.drawRect(screenPos.x + 2, screenPos.y + 2, size - 4, size - 4);
        }
      }
    }
    
    this.boardLayer.addChild(graphics);
  }

  /**
   * Render all banners
   */
  private renderBanners(state: GameState): void {
    for (const banner of state.banners.values()) {
      if (banner.status === 'captured') continue;
      
      const screenPos = this.worldToScreen(banner.position);
      const size = this.tileSize * this.camera.zoom;
      
      const graphics = new PIXI.Graphics();
      const playerIndex = state.players.findIndex(p => p.id === banner.playerId);
      const playerColor = PLAYER_COLORS[playerIndex] || COLORS.PLAYER_1;
      
      // Draw banner (triangle flag shape)
      graphics.beginFill(COLORS.BANNER);
      graphics.moveTo(screenPos.x + size * 0.3, screenPos.y + size * 0.2);
      graphics.lineTo(screenPos.x + size * 0.7, screenPos.y + size * 0.35);
      graphics.lineTo(screenPos.x + size * 0.3, screenPos.y + size * 0.5);
      graphics.closePath();
      graphics.endFill();
      
      // Draw pole
      graphics.beginFill(0x8d6e63);
      graphics.drawRect(screenPos.x + size * 0.3 - 2, screenPos.y + size * 0.2, 4, size * 0.6);
      graphics.endFill();
      
      // Draw base
      graphics.beginFill(playerColor);
      graphics.drawCircle(screenPos.x + size * 0.3, screenPos.y + size * 0.85, size * 0.12);
      graphics.endFill();
      
      this.bannerLayer.addChild(graphics);
    }
  }

  /**
   * Render all commanders
   */
  private renderCommanders(state: GameState, uiState: UIState): void {
    for (const commander of state.commanders.values()) {
      const screenPos = this.worldToScreen(commander.position);
      const size = this.tileSize * this.camera.zoom;
      
      const container = new PIXI.Container();
      
      const playerIndex = state.players.findIndex(p => p.id === commander.playerId);
      const playerColor = PLAYER_COLORS[playerIndex] || COLORS.PLAYER_1;
      
      // Draw commander base (square for commander)
      const graphics = new PIXI.Graphics();
      
      // Selection highlight
      if (uiState.selectedCommanderId === commander.id) {
        graphics.lineStyle(3, COLORS.SELECTED, 1);
        graphics.beginFill(COLORS.SELECTED, 0.3);
        graphics.drawRect(
          screenPos.x + size * 0.05,
          screenPos.y + size * 0.05,
          size * 0.9,
          size * 0.9
        );
        graphics.endFill();
      }
      
      // Commander body (square with rounded corners)
      graphics.beginFill(playerColor);
      graphics.drawRoundedRect(
        screenPos.x + size * 0.15,
        screenPos.y + size * 0.15,
        size * 0.7,
        size * 0.7,
        size * 0.1
      );
      graphics.endFill();
      
      // Type indicator (inner color)
      let typeColor = COLORS.INFANTRY;
      if (commander.type === 'cavalry') typeColor = COLORS.CAVALRY;
      if (commander.type === 'archer') typeColor = COLORS.ARCHER;
      
      graphics.beginFill(typeColor);
      graphics.drawRoundedRect(
        screenPos.x + size * 0.22,
        screenPos.y + size * 0.22,
        size * 0.56,
        size * 0.56,
        size * 0.08
      );
      graphics.endFill();
      
      // King crown indicator
      if (commander.isKing) {
        graphics.beginFill(COLORS.KING_CROWN);
        // Crown shape
        const crownY = screenPos.y + size * 0.18;
        graphics.moveTo(screenPos.x + size * 0.3, crownY + size * 0.08);
        graphics.lineTo(screenPos.x + size * 0.38, crownY);
        graphics.lineTo(screenPos.x + size * 0.5, crownY + size * 0.06);
        graphics.lineTo(screenPos.x + size * 0.62, crownY);
        graphics.lineTo(screenPos.x + size * 0.7, crownY + size * 0.08);
        graphics.lineTo(screenPos.x + size * 0.7, crownY + size * 0.12);
        graphics.lineTo(screenPos.x + size * 0.3, crownY + size * 0.12);
        graphics.closePath();
        graphics.endFill();
      }
      
      // Unit count dots (show active units)
      const activeUnits = commander.units.filter(u => u?.status === 'active').length;
      const dotSize = size * 0.06;
      const dotSpacing = size * 0.12;
      const startX = screenPos.x + size * 0.3;
      const startY = screenPos.y + size * 0.65;
      
      for (let i = 0; i < 4; i++) {
        const dotX = startX + (i % 2) * dotSpacing;
        const dotY = startY + Math.floor(i / 2) * dotSpacing;
        
        graphics.beginFill(i < activeUnits ? 0xffffff : 0x666666);
        graphics.drawCircle(dotX, dotY, dotSize / 2);
        graphics.endFill();
      }
      
      // Has acted indicator
      if (commander.hasActedThisTurn) {
        graphics.lineStyle(2, 0x999999, 0.8);
        graphics.drawRoundedRect(
          screenPos.x + size * 0.15,
          screenPos.y + size * 0.15,
          size * 0.7,
          size * 0.7,
          size * 0.1
        );
      }
      
      container.addChild(graphics);
      this.commanderLayer.addChild(container);
      
      // Store for interaction
      this.commanderSprites.set(commander.id, container);
    }
  }

  /**
   * Render debug information
   */
  private renderDebug(state: GameState, uiState: UIState): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: COLORS.DEBUG_TEXT,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 1,
    });
    
    const activePlayer = state.players.find(p => p.id === state.activePlayerId);
    
    let debugText = `Turn: ${state.turnNumber}\n`;
    debugText += `Player: ${activePlayer?.name || 'Unknown'}\n`;
    debugText += `Status: ${state.gameStatus}\n`;
    debugText += `Commanders: ${state.commanders.size}\n`;
    debugText += `Banners: ${state.banners.size}\n`;
    
    if (uiState.selectedCommanderId) {
      const cmd = state.commanders.get(uiState.selectedCommanderId);
      if (cmd) {
        debugText += `\nSelected:\n`;
        debugText += `  Type: ${cmd.type}\n`;
        debugText += `  Pos: (${cmd.position.x}, ${cmd.position.y})\n`;
        debugText += `  Move: ${TROOP_STATS[cmd.type].moveRange}\n`;
        debugText += `  Attack: ${TROOP_STATS[cmd.type].attackRange}\n`;
        debugText += `  Acted: ${cmd.hasActedThisTurn}\n`;
      }
    }
    
    const text = new PIXI.Text(debugText, style);
    text.x = 10;
    text.y = 10;
    this.debugLayer.addChild(text);
  }

  /**
   * Clear all rendered content
   */
  clear(): void {
    this.clearLayers();
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
    const x = (screenPos.x - this.camera.viewportWidth / 2) / (this.tileSize * this.camera.zoom) + this.camera.position.x;
    const y = (screenPos.y - this.camera.viewportHeight / 2) / (this.tileSize * this.camera.zoom) + this.camera.position.y;
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: Position): Position {
    const x = (worldPos.x - this.camera.position.x) * this.tileSize * this.camera.zoom + this.camera.viewportWidth / 2;
    const y = (worldPos.y - this.camera.position.y) * this.tileSize * this.camera.zoom + this.camera.viewportHeight / 2;
    return { x, y };
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const parent = this.container.parentElement;
    if (parent) {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      this.app.renderer.resize(width, height);
      this.camera.viewportWidth = width;
      this.camera.viewportHeight = height;
    }
  }

  /**
   * Get animation manager for creating animations
   */
  getAnimationManager(): AnimationManager {
    return this.animationManager;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    window.removeEventListener('resize', () => this.handleResize());
    this.animationManager.dispose();
    this.app.destroy(true);
  }
}

/**
 * Create a game renderer
 */
export function createGameRenderer(
  containerId: string,
  width: number,
  height: number,
  tileSize: number = 64
): GameRenderer {
  return new GameRenderer(containerId, width, height, tileSize);
}
