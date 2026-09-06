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
  TROOP_STATS,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CommanderId,
  GameResults,
  PlayerScore,
  canCaptureBanner,
  getEffectiveTroopType,
  getHoldingCommander,
  getValidAttacks,
  getValidMoves,
} from '@lands-of-glory/game-core';
import * as PIXI from 'pixi.js';
import { AnimationManager } from './animations';

/**
 * UI state that is NOT persisted as part of GameState
 * Per Spec 002: PrototypeUiState contains temporary UI state
 */
export interface UIState {
  selectedCommanderId?: CommanderId;
  hoveredTile?: Position;
  draggedCommanderId?: CommanderId;
  currentDragTarget?: Position;
  debugEnabled: boolean;
}

/**
 * Event callbacks for drag-and-drop
 */
export interface DragCallbacks {
  onDragStart?: (commanderId: CommanderId) => void;
  onDragMove?: (position: Position) => void;
  onDragEnd?: (commanderId: CommanderId, target: Position) => void;
}

/**
 * Drag state
 */
interface DragState {
  isDragging: boolean;
  commanderId?: CommanderId;
  startPosition?: Position;
  dragSprite?: PIXI.Container;
  rangeOverlay?: PIXI.Graphics;
  validMoveTiles: Set<string>;
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
  
  // Players (Black and White for two-player game)
  PLAYER_1: 0xffffff,  // White
  PLAYER_2: 0x1a1a1a,  // Black (dark gray for better visibility)
  PLAYER_3: 0x43a047,  // Green
  PLAYER_4: 0xfdd835,  // Yellow
  
  // Units
  INFANTRY: 0x4caf50,   // Green
  CAVALRY: 0x2196f3,    // Blue
  ARCHER: 0xf44336,     // Red
  
  // Wood color for commanders
  WOOD_LIGHT: 0xd4a373, // Light wood
  WOOD_DARK: 0x8d6e63,  // Dark wood
  
  // Commander background - light yellowish brown
  COMMANDER_BG: 0xf0d5a0, // Light yellowish brown/beige for commander square
  COMMANDER_BG_DARKER: 0xd4b080, // Darker version for empty unit placeholders
  
  // UI
  SELECTED: 0xffeb3b,
  VALID_MOVE: 0x4caf50,
  INVALID_MOVE: 0xf44336,
  BANNER: 0x8e24aa,     // Purple
  KING_CROWN: 0xffd700, // Gold
  CAN_MOVE: 0xffd700,   // Golden yellow for commanders that can still move

  // Debug
  DEBUG_TEXT: 0xffffff,
};

const PLAYER_COLORS = [COLORS.PLAYER_1, COLORS.PLAYER_2, COLORS.PLAYER_3, COLORS.PLAYER_4];

function parsePlayerColor(color: string, fallback: number): number {
  const value = color.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(value) ? Number.parseInt(value, 16) : fallback;
}

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
  private dragLayer: PIXI.Container; // Separate layer for drag-and-drop (not cleared on render)
  private debugLayer: PIXI.Container;
  
  // Cache for sprites
  private tileSprites: Map<string, PIXI.Graphics> = new Map();
  private commanderSprites: Map<string, PIXI.Container> = new Map();
  private bannerSprites: Map<string, PIXI.Graphics> = new Map();
  
  // Drag state
  private dragState: DragState = { isDragging: false, validMoveTiles: new Set() };
  private callbacks: DragCallbacks = {};
  
  // Drag overlay for valid/invalid indicators
  private dragOverlay: PIXI.Graphics | null = null;

  // Panning state for right-click camera movement
  private isPanning: boolean = false;
  private lastPanX: number = 0;
  private lastPanY: number = 0;

  private rendererOptions: { useTextures: boolean; showGrid: boolean };
  private resizeHandler: (() => void) | null = null;
  private inputCleanup: Array<() => void> = [];
  private isDisposed = false;

  constructor(
    containerId: string,
    width: number,
    height: number,
    tileSize: number = 64,
    options?: { useTextures?: boolean; showGrid?: boolean }
  ) {
    this.tileSize = tileSize;
    this.rendererOptions = {
      useTextures: options?.useTextures ?? true,
      showGrid: options?.showGrid ?? true,
    };
    
    // Initialize camera - we'll center the board properly in renderBoard
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
    
    // Ensure canvas is visible and on top
    const canvas = this.app.view as HTMLCanvasElement;
    
    // CRITICAL FIX: Ensure container has size
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.overflow = 'hidden';
    
    // Set canvas styles
    canvas.style.display = 'block';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '0';
    canvas.style.backgroundColor = '#7cb342';
    canvas.style.opacity = '1';
    canvas.style.visibility = 'visible';
    canvas.style.border = '0';
    
    console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);
    console.log('✅ Canvas in DOM:', document.contains(canvas));
    console.log('✅ Container children count:', container.children.length);
    console.log('✅ Container size:', container.clientWidth, 'x', container.clientHeight);
    console.log('✅ Canvas size:', canvas.clientWidth, 'x', canvas.clientHeight);

    // Create layers
    this.boardLayer = new PIXI.Container();
    this.bannerLayer = new PIXI.Container();
    this.commanderLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    this.dragLayer = new PIXI.Container();
    this.dragLayer.sortableChildren = true; // Erlaubt zIndex für Drag-Sprites
    this.debugLayer = new PIXI.Container();

    this.app.stage.addChild(this.boardLayer);
    this.app.stage.addChild(this.bannerLayer);
    this.app.stage.addChild(this.commanderLayer);
    this.app.stage.addChild(this.uiLayer);
    this.app.stage.addChild(this.dragLayer);
    this.app.stage.addChild(this.debugLayer);

    // Start the PixiJS ticker to ensure rendering
    this.app.start();
    console.log('✅ PixiJS ticker started');

    // Initialize animation manager
    this.animationManager = new AnimationManager(this.app);

    // Setup drag-and-drop events
    this.setupDragEvents();

    // Handle resize
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Destroy the renderer and cleanup resources
   */
  destroy(): void {
    this.dispose();
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
    const canvas = this.app.view as HTMLCanvasElement;
    console.log('🔧 setupDragEvents called, canvas:', !!canvas);
    
    // Right-click panning - use capture phase to get events before PIXI
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        console.log('🖱️ RIGHT MOUSEDOWN - starting pan');
        e.preventDefault();
        e.stopPropagation();
        this.isPanning = true;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
        canvas.style.cursor = 'grabbing';
      }
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (this.isPanning) {
        e.preventDefault();
        const deltaX = (e.clientX - this.lastPanX) / (this.tileSize * this.camera.zoom);
        const deltaY = (e.clientY - this.lastPanY) / (this.tileSize * this.camera.zoom);
        
      this.camera = {
        ...this.camera,
        position: {
          x: this.camera.position.x - deltaX,
          y: this.camera.position.y - deltaY,
        },
      };
        
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
        
        if (this.currentState) {
          this.render(this.currentState, { debugEnabled: false });
        }
      }
    };
    
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        console.log('🖱️ RIGHT MOUSEUP - stopping pan');
        this.isPanning = false;
        canvas.style.cursor = 'default';
      }
    };
    
    // Add listeners to canvas with capture phase (gets event before PIXI)
    canvas.addEventListener('mousedown', onMouseDown, true);
    canvas.addEventListener('mousemove', onMouseMove, true);
    canvas.addEventListener('mouseup', onMouseUp, true);
    
    // Prevent context menu on canvas
    const onContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    canvas.addEventListener('contextmenu', onContextMenu, true);

    // PIXI events for commander interaction (left click)
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    
    const onPointerDown = (e: PIXI.FederatedPointerEvent) => {
      if (this.isPanning) return;
      const worldPos = this.screenToWorld({ x: e.global.x, y: e.global.y });
      this.handlePointerDown(worldPos, { x: e.global.x, y: e.global.y });
    };
    this.app.stage.on('pointerdown', onPointerDown);

    const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
      if (this.isPanning) return;
      const worldPos = this.screenToWorld({ x: e.global.x, y: e.global.y });
      this.handlePointerMove(worldPos, { x: e.global.x, y: e.global.y });
    };
    this.app.stage.on('pointermove', onPointerMove);

    const onPointerUp = (e: PIXI.FederatedPointerEvent) => {
      if (this.isPanning) return;
      const worldPos = this.screenToWorld({ x: e.global.x, y: e.global.y });
      this.handlePointerUp(worldPos);
    };
    this.app.stage.on('pointerup', onPointerUp);

    const onPointerUpOutside = () => {
      if (this.isPanning) return;
      this.cancelDrag();
    };
    this.app.stage.on('pointerupoutside', onPointerUpOutside);

    this.inputCleanup.push(
      () => canvas.removeEventListener('mousedown', onMouseDown, true),
      () => canvas.removeEventListener('mousemove', onMouseMove, true),
      () => canvas.removeEventListener('mouseup', onMouseUp, true),
      () => canvas.removeEventListener('contextmenu', onContextMenu, true),
      () => this.app.stage.off('pointerdown', onPointerDown),
      () => this.app.stage.off('pointermove', onPointerMove),
      () => this.app.stage.off('pointerup', onPointerUp),
      () => this.app.stage.off('pointerupoutside', onPointerUpOutside),
    );
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
   * Handle pointer move (update drag and hover)
   */
  private handlePointerMove(worldPos: Position, screenPos: Position): void {
    // Update drag sprite position if dragging
    if (this.dragState.isDragging && this.dragState.dragSprite) {
      // Update drag sprite position to follow mouse exactly
      this.dragState.dragSprite.x = screenPos.x;
      this.dragState.dragSprite.y = screenPos.y;

      // Update hover indicator
      this.updateDragOverlay(worldPos);

      // Notify callback
      if (this.callbacks.onDragMove) {
        this.callbacks.onDragMove(worldPos);
      }
    } else {
      // Not dragging - check for hover over commander to change cursor
      const hoveredCommander = this.findCommanderAtPosition(worldPos);
      const canvas = this.app.view as HTMLCanvasElement;
      if (canvas) {
        if (hoveredCommander) {
          canvas.style.cursor = 'grab';
        } else {
          canvas.style.cursor = 'default';
        }
      }
    }
    
    // Update hovered tile in UI state
    if (this.currentState) {
      // Store hovered position for potential highlighting
    }
  }

  /**
   * Handle pointer up (end drag)
   */
  private handlePointerUp(worldPos: Position): void {
    if (this.dragState.isDragging && this.dragState.commanderId) {
      // Snap to grid - round to nearest tile
      const targetPos: Position = {
        x: Math.round(worldPos.x),
        y: Math.round(worldPos.y)
      };

      // End drag with snapped position
      if (this.callbacks.onDragEnd) {
        this.callbacks.onDragEnd(this.dragState.commanderId, targetPos);
      }
    }
    this.cancelDrag();
    
    // Reset cursor after drag ends
    const canvas = this.app.view as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  /**
   * Start dragging a commander
   */
  private startDrag(commanderId: CommanderId, worldPos: Position, screenPos: Position): void {
    if (!this.currentState) return;

    const commander = this.currentState.commanders.get(commanderId);
    if (!commander) return;

    this.dragState = {
      isDragging: true,
      commanderId,
      startPosition: worldPos,
      validMoveTiles: new Set(),
    };

    // Create drag visual (ghost of the commander) - zeichne eine echte Figurenkopie
    const dragContainer = new PIXI.Container();
    const dragGraphics = new PIXI.Graphics();
    const shadowGraphics = new PIXI.Graphics();
    const size = this.tileSize * this.camera.zoom;

    // Zeichne die Figur wie beim normalen Rendering, aber etwas kleiner für den Drag
    const scale = 0.8; // 80% der normalen Größe für bessere Sichtbarkeit
    const scaledSize = size * scale;
    const padding = 4 * this.camera.zoom * scale;
    const commanderSize = scaledSize - (padding * 2);
    const cornerRadius = 8 * this.camera.zoom * scale;

    // Hintergrundfarbe basierend auf Spieler
    const playerIndex = this.currentState.players.findIndex(p => p.id === commander.playerId);
    const playerColor = parsePlayerColor(this.currentState.players[playerIndex]?.color ?? '', PLAYER_COLORS[playerIndex] || COLORS.PLAYER_1);

    // Einheitenfarben
    const troopColors: Record<string, number> = {
      infantry: COLORS.INFANTRY,
      cavalry: COLORS.CAVALRY,
      archer: COLORS.ARCHER,
    };

    // Zeichne zuerst einen Schatten unter die Figur
    const shadowOffset = 4 * this.camera.zoom * scale;
    shadowGraphics.beginFill(0x000000, 0.3);
    shadowGraphics.drawRoundedRect(
      -commanderSize/2 + shadowOffset,
      -commanderSize/2 + shadowOffset,
      commanderSize,
      commanderSize,
      cornerRadius
    );
    shadowGraphics.endFill();
    // Blur-Effekt für den Schatten durch mehrere überlappende Kreise
    shadowGraphics.beginFill(0x000000, 0.15);
    shadowGraphics.drawRoundedRect(
      -commanderSize/2 + shadowOffset - 2,
      -commanderSize/2 + shadowOffset - 2,
      commanderSize + 4,
      commanderSize + 4,
      cornerRadius + 2
    );
    shadowGraphics.endFill();
    dragContainer.addChild(shadowGraphics);

    // Zeichne den Kommandeur-Hintergrund (hellbraun) - volle Opazität für bessere Sichtbarkeit
    const borderWidth = 0.5 * this.camera.zoom * scale; // Dünnere Randbreite (1/4)
    const uniformBorderColor = 0x333333; // Einheitliche Randfarbe
    dragGraphics.beginFill(COLORS.COMMANDER_BG, 1.0);
    dragGraphics.lineStyle(borderWidth, uniformBorderColor, 1.0); // Einheitlicher Randstil
    dragGraphics.drawRoundedRect(-commanderSize/2, -commanderSize/2, commanderSize, commanderSize, cornerRadius);
    dragGraphics.endFill();

    // Einheitenpositionen (2x2 Grid) - skaliert für Drag-Größe
    const unitRadius = 6 * this.camera.zoom * scale;
    const offset = commanderSize * 0.30; // Weiter nach außen verschoben
    const unitPositions = [
      { x: -offset, y: -offset },
      { x: offset, y: -offset },
      { x: -offset, y: offset },
      { x: offset, y: offset },
    ];

    // Zeichne die vier Einheiten
    for (let i = 0; i < 4; i++) {
      const unit = commander.units[i];
      const pos = unitPositions[i];

        if (unit && unit.status === 'active') {
          const unitColor = troopColors[unit.troopType] || COLORS.INFANTRY;
          dragGraphics.beginFill(unitColor);
          dragGraphics.lineStyle(borderWidth, uniformBorderColor, 1.0);
          dragGraphics.drawCircle(pos.x, pos.y, unitRadius);
          dragGraphics.endFill();

          // Bonuspunkte - besser angeordnet ohne Überlappung
          if (unit.bonusPoints > 0) {
            const bonusRadius = 1.5 * this.camera.zoom * scale; // Noch kleiner
            const maxSpacing = unitRadius * 0.5; // Maximaler Abstand vom Zentrum
            
            if (unit.bonusPoints === 1) {
              // Ein Punkt: mittig
              dragGraphics.beginFill(0xffeb3b);
              dragGraphics.drawCircle(pos.x, pos.y, bonusRadius);
              dragGraphics.endFill();
            } else if (unit.bonusPoints === 2) {
              // Zwei Punkte: horizontal mit ausreichend Abstand
              const spacing = maxSpacing * 0.5;
              dragGraphics.beginFill(0xffeb3b);
              dragGraphics.drawCircle(pos.x - spacing, pos.y, bonusRadius);
              dragGraphics.drawCircle(pos.x + spacing, pos.y, bonusRadius);
              dragGraphics.endFill();
            } else if (unit.bonusPoints >= 3) {
              // Drei Punkte: Dreieck-Anordnung mit ausreichend Abstand
              const spacing = maxSpacing * 0.45;
              dragGraphics.beginFill(0xffeb3b);
              // Unten links und rechts
              dragGraphics.drawCircle(pos.x - spacing, pos.y + spacing * 0.4, bonusRadius);
              dragGraphics.drawCircle(pos.x + spacing, pos.y + spacing * 0.4, bonusRadius);
              // Oben mittig
              dragGraphics.drawCircle(pos.x, pos.y - spacing * 0.6, bonusRadius);
              dragGraphics.endFill();
            }
          }
        } else {
          // Leerer Slot - ausgefüllt mit der Randfarbe
          dragGraphics.beginFill(uniformBorderColor, 0.8);
          dragGraphics.lineStyle(borderWidth, uniformBorderColor, 1.0);
          dragGraphics.drawCircle(pos.x, pos.y, unitRadius);
          dragGraphics.endFill();
        }
    }

    // Spielerfarbe-Kreis in der Mitte für ALLE Kommandeure
    const playerColorRadius = commanderSize * 0.12;
    dragGraphics.beginFill(playerColor, 1);
    dragGraphics.lineStyle(borderWidth, uniformBorderColor, 1.0);
    dragGraphics.drawCircle(0, 0, playerColorRadius);
    dragGraphics.endFill();

    // König-Markierung: Vertikaler Balken von oben bis zur Mitte (zum Spielerfarben-Kreis)
    if (commander.isKing) {
      const barWidth = 4 * this.camera.zoom * scale;
      const barHeight = (commanderSize / 2) - playerColorRadius - (4 * this.camera.zoom * scale * 0.5);
      
      // Zeichne den vertikalen Balken von oben nach unten bis zur Mitte
      if (barHeight > 0) {
        dragGraphics.beginFill(playerColor, 1);
        dragGraphics.drawRoundedRect(
          -barWidth / 2,
          -(commanderSize / 2) + (4 * this.camera.zoom * scale), // Startet oben
          barWidth,
          barHeight,
          barWidth / 2  // Abgerundete Ecken
        );
        dragGraphics.endFill();
      }
    }

    dragContainer.addChild(dragGraphics);
    // WICHTIG: Positioniere den Container am Mauszeiger (Screen-Koordinaten)
    dragContainer.x = screenPos.x;
    dragContainer.y = screenPos.y;
    // Volle Sichtbarkeit
    dragContainer.alpha = 1.0;
    // SortableChildren aktivieren und höchste Priorität setzen
    dragContainer.zIndex = 9999;
    this.uiLayer.sortableChildren = true;
    // Normale Skalierung (1.0) damit die Figur original aussieht
    dragContainer.scale.set(1.0);
    // Sicherstellen dass der Container sichtbar ist
    dragContainer.visible = true;
    
    this.dragLayer.addChild(dragContainer);
    this.dragState.dragSprite = dragContainer;

    // Create overlay showing movement range
    this.createRangeOverlay(commanderId);

    // Create overlay for valid/invalid moves
    this.createDragOverlay();
    
    // Ändere Cursor zu "grabbing" während des Ziehens
    if (this.app.view instanceof HTMLCanvasElement) {
      this.app.view.style.cursor = 'grabbing';
    }

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
    if (this.dragState.rangeOverlay) {
      this.dragState.rangeOverlay.destroy();
    }
    if (this.dragOverlay) {
      this.dragOverlay.destroy();
      this.dragOverlay = null;
    }
    this.dragState = { isDragging: false, validMoveTiles: new Set() };
    
    // Reset cursor
    if (this.app.view instanceof HTMLCanvasElement) {
      this.app.view.style.cursor = 'default';
    }
  }

  /**
   * Create overlay showing movement range
   */
  private createRangeOverlay(commanderId: CommanderId): void {
    if (!this.currentState) return;

    const commander = this.currentState.commanders.get(commanderId);
    if (!commander) return;

    // Empty commanders move like cavalry (2 tiles)
    const range = TROOP_STATS[getEffectiveTroopType(commander)].moveRange;
    const rangeOverlay = new PIXI.Graphics();
    const validTiles = new Set(getValidMoves(this.currentState, commanderId)
      .map(position => `${position.x},${position.y}`));
    const borderWidth = 0.5 * this.camera.zoom; // Dünnere Randbreite (1/4)

    // Draw the maximum movement range area
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        // Use Chebyshev distance for movement range
        if (Math.max(Math.abs(dx), Math.abs(dy)) > range) continue;

        const targetX = commander.position.x + dx;
        const targetY = commander.position.y + dy;

        // Skip if out of bounds
        if (targetX < 0 || targetX >= BOARD_WIDTH || targetY < 0 || targetY >= BOARD_HEIGHT) continue;

        // Skip current position
        if (dx === 0 && dy === 0) continue;

        // Check if position is occupied
        let isOccupied = false;
        for (const cmd of this.currentState.commanders.values()) {
          if (cmd.position.x === targetX && cmd.position.y === targetY) {
            isOccupied = true;
            break;
          }
        }

        // Check if banner is there
        for (const banner of this.currentState.banners.values()) {
          if (banner.position.x === targetX && banner.position.y === targetY && banner.status === 'standing') {
            isOccupied = true;
            break;
          }
        }

        const screenPos = this.worldToScreen({ x: targetX, y: targetY });
        const size = this.tileSize * this.camera.zoom;

        if (!isOccupied && validTiles.has(`${targetX},${targetY}`)) {

          // Draw semi-transparent green highlight
          rangeOverlay.beginFill(COLORS.VALID_MOVE, 0.4);
          rangeOverlay.drawRect(screenPos.x + 1, screenPos.y + 1, size - 2, size - 2);
          rangeOverlay.endFill();

          // Draw border with same thickness as other borders
          rangeOverlay.lineStyle(borderWidth, COLORS.VALID_MOVE, 0.9);
          rangeOverlay.drawRect(screenPos.x + 3, screenPos.y + 3, size - 6, size - 6);
        } else {
          // Occupied - draw red highlight
          rangeOverlay.beginFill(COLORS.INVALID_MOVE, 0.2);
          rangeOverlay.drawRect(screenPos.x + 1, screenPos.y + 1, size - 2, size - 2);
          rangeOverlay.endFill();
        }
      }
    }

    const attackTargets = getValidAttacks(this.currentState, commanderId)
      .map(id => this.currentState!.commanders.get(id)?.position)
      .filter((position): position is Position => position !== undefined);
    const bannerTargets = [...this.currentState.banners.values()]
      .filter(banner => canCaptureBanner(this.currentState!, commanderId, banner.id).valid)
      .map(banner => banner.position);
    for (const target of [...attackTargets, ...bannerTargets]) {
      const screen = this.worldToScreen(target);
      const size = this.tileSize * this.camera.zoom;
      rangeOverlay.beginFill(COLORS.INVALID_MOVE, 0.35);
      rangeOverlay.lineStyle(1 * this.camera.zoom, COLORS.INVALID_MOVE, 0.95);
      rangeOverlay.drawRect(screen.x + 2, screen.y + 2, size - 4, size - 4);
      rangeOverlay.endFill();
    }

    this.dragLayer.addChildAt(rangeOverlay, 0); // Add at bottom so it appears behind drag sprite
    this.dragState.rangeOverlay = rangeOverlay;
    this.dragState.validMoveTiles = validTiles;
  }

  /**
   * Create overlay showing valid/invalid move targets
   */
  private createDragOverlay(): void {
    this.dragOverlay = new PIXI.Graphics();
    this.dragLayer.addChild(this.dragOverlay);
  }

  /**
   * Update drag overlay to show current hover state
   */
  private updateDragOverlay(hoverPos: Position): void {
    if (!this.dragOverlay || !this.dragState.startPosition || !this.currentState) return;

    this.dragOverlay.clear();

    const screenPos = this.worldToScreen(hoverPos);
    const size = this.tileSize * this.camera.zoom;
    const borderWidth = 0.5 * this.camera.zoom; // Dünnere Randbreite (1/4)

    // Check if this is a valid move position
    const isValidMove = this.dragState.validMoveTiles.has(`${hoverPos.x},${hoverPos.y}`);

    // Draw hover indicator based on validity
    if (isValidMove) {
      // Valid target - bright green
      this.dragOverlay.lineStyle(borderWidth, COLORS.VALID_MOVE, 1);
      this.dragOverlay.drawRect(screenPos.x + 2, screenPos.y + 2, size - 4, size - 4);

      // Add glow effect
      this.dragOverlay.lineStyle(borderWidth * 0.5, 0xffffff, 0.5);
      this.dragOverlay.drawRect(screenPos.x + 6, screenPos.y + 6, size - 12, size - 12);
    } else {
      // Invalid target - red
      this.dragOverlay.lineStyle(borderWidth, COLORS.INVALID_MOVE, 0.8);
      this.dragOverlay.drawRect(screenPos.x + 2, screenPos.y + 2, size - 4, size - 4);

      // Draw X mark for invalid
      this.dragOverlay.lineStyle(borderWidth, COLORS.INVALID_MOVE, 0.8);
      this.dragOverlay.moveTo(screenPos.x + 8, screenPos.y + 8);
      this.dragOverlay.lineTo(screenPos.x + size - 8, screenPos.y + size - 8);
      this.dragOverlay.moveTo(screenPos.x + size - 8, screenPos.y + 8);
      this.dragOverlay.lineTo(screenPos.x + 8, screenPos.y + size - 8);
    }
  }

  // Store current state for interaction
  private currentState: GameState | null = null;
  
  // Animation manager
  private animationManager: AnimationManager;

  /**
   * Find commander at a world position
   */
  private findCommanderAtPosition(pos: Position): CommanderId | undefined {
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
    console.log('🎨 Renderer.render() called');
    
    // Store state for interaction handling
    this.currentState = state;
    
    console.log('🎨 Clearing layers...');
    this.clearLayers();
    
    console.log('🎨 Rendering board...');
    this.renderBoard(state, uiState);
    
    console.log('🎨 Rendering valid moves...');
    this.renderValidMoves(state, uiState);
    
    console.log('🎨 Rendering banners...');
    this.renderBanners(state);
    
    console.log('🎨 Rendering commanders...');
    this.renderCommanders(state, uiState);
    
    console.log('🎨 Rendering held status...');
    this.renderHeldStatus(state);
    
    if (uiState.debugEnabled) {
      this.renderDebug(state, uiState);
    }
    
    console.log('✅ Render complete. Stage children:', this.app.stage.children.length);
    console.log('✅ Board layer children:', this.boardLayer.children.length);
    console.log('✅ Commander layer children:', this.commanderLayer.children.length);
  }

  /**
   * Render valid move indicators
   */
  private renderValidMoves(state: GameState, uiState: UIState): void {
    if (!uiState.selectedCommanderId) return;

    const commander = state.commanders.get(uiState.selectedCommanderId);
    if (!commander || commander.hasActedThisTurn) return;

    const graphics = new PIXI.Graphics();
    const range = TROOP_STATS[getEffectiveTroopType(commander)].moveRange;
    const validTiles = new Set(getValidMoves(state, commander.id)
      .map(position => `${position.x},${position.y}`));
    const borderWidth = 0.5 * this.camera.zoom; // Dünnere Randbreite (1/4)

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

        if (!isOccupied && validTiles.has(`${targetX},${targetY}`)) {
          // Valid move - green highlight
          graphics.beginFill(COLORS.VALID_MOVE, 0.4);
          graphics.drawRect(screenPos.x + 1, screenPos.y + 1, size - 2, size - 2);
          graphics.endFill();
          
          // Einheitlicher Rand
          graphics.lineStyle(borderWidth, COLORS.VALID_MOVE, 0.9);
          graphics.drawRect(screenPos.x + 3, screenPos.y + 3, size - 6, size - 6);
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
    const borderWidth = 0.5 * this.camera.zoom; // Dünnere Randbreite (1/4)

    for (const commanderId of activePlayer.commanders) {
      const commander = state.commanders.get(commanderId);
      if (!commander) continue;

      // Check if held by enemy infantry
      const isHeld = getHoldingCommander(state, commanderId) !== undefined;
      if (isHeld) {
        const screenPos = this.worldToScreen(commander.position);
        const size = this.tileSize * this.camera.zoom;

        // Draw red chain link indicator
        graphics.lineStyle(borderWidth, COLORS.INVALID_MOVE, 0.8);
        graphics.drawCircle(screenPos.x + size / 2, screenPos.y + size / 2, size * 0.4);
        
        // Draw chain links
        const linkSize = size * 0.15;
        graphics.lineStyle(borderWidth, COLORS.INVALID_MOVE, 1);
        graphics.drawCircle(screenPos.x + size * 0.35, screenPos.y + size / 2, linkSize);
        graphics.drawCircle(screenPos.x + size * 0.65, screenPos.y + size / 2, linkSize);
      }
    }

    this.uiLayer.addChild(graphics);
  }

  /**
   * Clear all layers (except dragLayer which persists during drag operations)
   */
  private clearLayers(): void {
    this.boardLayer.removeChildren();
    this.bannerLayer.removeChildren();
    this.commanderLayer.removeChildren();
    this.uiLayer.removeChildren();
    this.debugLayer.removeChildren();
    // Note: dragLayer is NOT cleared here - it's managed separately
  }

  /**
   * Render the game board with uniform grass meadow
   */
  private renderBoard(state: GameState, uiState: UIState): void {
    const graphics = new PIXI.Graphics();
    
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const screenPos = this.worldToScreen({ x, y });
        const size = this.tileSize * this.camera.zoom;
        
        // Base grass color - natural meadow green
        graphics.beginFill(COLORS.GRASS);
        graphics.drawRect(screenPos.x, screenPos.y, size, size);
        graphics.endFill();
        
        // Only draw detailed textures if enabled
        if (this.rendererOptions.useTextures) {
          // Grass blades as small lines - same pattern on all tiles
          // Light green blades (sunny grass)
          graphics.lineStyle(1.5 * this.camera.zoom, 0x9ccc65, 0.4);
          const lightBlades = [
            { x: 0.15, y: 0.25, angle: -0.3 },
            { x: 0.65, y: 0.15, angle: 0.2 },
            { x: 0.45, y: 0.55, angle: -0.1 },
            { x: 0.80, y: 0.70, angle: 0.4 },
            { x: 0.30, y: 0.80, angle: -0.2 },
            { x: 0.55, y: 0.35, angle: 0.3 },
            { x: 0.25, y: 0.50, angle: -0.4 },
            { x: 0.70, y: 0.45, angle: 0.1 },
          ];
          for (const blade of lightBlades) {
            const startX = screenPos.x + blade.x * size;
            const startY = screenPos.y + blade.y * size;
            const bladeLength = 4 * this.camera.zoom;
            const endX = startX + Math.cos(blade.angle) * bladeLength;
            const endY = startY + Math.sin(blade.angle) * bladeLength;
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
          }
          
          // Dark green blades (shadow grass)
          graphics.lineStyle(1.5 * this.camera.zoom, 0x558b2f, 0.5);
          const darkBlades = [
            { x: 0.40, y: 0.20, angle: 0.3 },
            { x: 0.75, y: 0.40, angle: -0.2 },
            { x: 0.20, y: 0.60, angle: 0.1 },
            { x: 0.60, y: 0.75, angle: -0.3 },
            { x: 0.85, y: 0.85, angle: 0.2 },
            { x: 0.10, y: 0.40, angle: -0.1 },
            { x: 0.50, y: 0.90, angle: 0.4 },
            { x: 0.90, y: 0.30, angle: -0.4 },
          ];
          for (const blade of darkBlades) {
            const startX = screenPos.x + blade.x * size;
            const startY = screenPos.y + blade.y * size;
            const bladeLength = 3 * this.camera.zoom;
            const endX = startX + Math.cos(blade.angle) * bladeLength;
            const endY = startY + Math.sin(blade.angle) * bladeLength;
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
          }
          
          // Additional tiny grass details
          graphics.lineStyle(1 * this.camera.zoom, 0x7cb342, 0.3);
          const tinyBlades = [
            { x: 0.08, y: 0.12 },
            { x: 0.92, y: 0.08 },
            { x: 0.05, y: 0.95 },
            { x: 0.95, y: 0.92 },
            { x: 0.33, y: 0.05 },
            { x: 0.67, y: 0.95 },
          ];
          for (const blade of tinyBlades) {
            const startX = screenPos.x + blade.x * size;
            const startY = screenPos.y + blade.y * size;
            const bladeLength = 2 * this.camera.zoom;
            const angle = (blade.x + blade.y) * Math.PI;
            const endX = startX + Math.cos(angle) * bladeLength;
            const endY = startY + Math.sin(angle) * bladeLength;
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
          }
        }
        
        // Draw grid if enabled
        if (this.rendererOptions.showGrid) {
          graphics.lineStyle(1, COLORS.GRID, 0.2);
          graphics.drawRect(screenPos.x, screenPos.y, size, size);
        }
        
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
   * Medieval banner/standard with player color
   */
  private renderBanners(state: GameState): void {
    for (const banner of state.banners.values()) {
      if (banner.status === 'captured') continue;
      
      const screenPos = this.worldToScreen(banner.position);
      const size = this.tileSize * this.camera.zoom;
      
      const graphics = new PIXI.Graphics();
      const playerIndex = state.players.findIndex(p => p.id === banner.playerId);
      const playerColor = parsePlayerColor(state.players[playerIndex]?.color ?? '', PLAYER_COLORS[playerIndex] || COLORS.PLAYER_1);
      
      // Banner dimensions
      const bannerWidth = size * 0.5;
      const bannerHeight = size * 0.55;
      const bannerX = screenPos.x + size * 0.5 - bannerWidth / 2;
      const bannerY = screenPos.y + size * 0.15;
      const centerX = bannerX + bannerWidth / 2;
      const bottomY = bannerY + bannerHeight;
      
      // Draw pole (black staff) - vertical line behind banner
      const poleWidth = 3 * this.camera.zoom;
      graphics.beginFill(0x000000);
      graphics.drawRect(centerX - poleWidth / 2, bannerY + bannerHeight * 0.1, poleWidth, size * 0.75);
      graphics.endFill();
      
      // Draw base line (horizontal stand line at bottom of pole) - wider
      const baseLineWidth = size * 0.28;
      const baseLineHeight = 3 * this.camera.zoom;
      graphics.beginFill(0x000000);
      graphics.drawRect(centerX - baseLineWidth / 2, bannerY + size * 0.75, baseLineWidth, baseLineHeight);
      graphics.endFill();
      
      // Draw banner shape (pointed bottom like a pennant/standard)
      // Top edge: horizontal
      // Left and right: vertical straight sides
      // Bottom: pointed (two diagonal lines meeting at center)
      
      // Banner outline (gray border) - same thickness as commander borders
      const borderWidth = 1 * this.camera.zoom;
      graphics.lineStyle(borderWidth, 0x666666, 1);
      graphics.beginFill(playerColor);
      
      // Start at top-left
      graphics.moveTo(bannerX, bannerY);
      // Top edge to top-right
      graphics.lineTo(bannerX + bannerWidth, bannerY);
      // Right edge down
      graphics.lineTo(bannerX + bannerWidth, bannerY + bannerHeight * 0.7);
      // Diagonal to bottom center point
      graphics.lineTo(centerX, bottomY);
      // Diagonal up to left side
      graphics.lineTo(bannerX, bannerY + bannerHeight * 0.7);
      // Close path to top-left
      graphics.closePath();
      graphics.endFill();
      
      // For dark player colors (like black), add a subtle highlight border
      if (playerColor === 0x000000 || playerColor === 0x111111) {
        graphics.lineStyle(borderWidth, 0x888888, 0.5);
        graphics.moveTo(bannerX, bannerY);
        graphics.lineTo(bannerX + bannerWidth, bannerY);
        graphics.lineTo(bannerX + bannerWidth, bannerY + bannerHeight * 0.7);
        graphics.lineTo(centerX, bottomY);
        graphics.lineTo(bannerX, bannerY + bannerHeight * 0.7);
        graphics.closePath();
      }
      
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

      const graphics = new PIXI.Graphics();

      // Definiere den Kommandeur als abgerundetes Quadrat
      // Mit etwas Abstand zum Tile-Rand für den Rahmen
      const padding = 4 * this.camera.zoom;
      const commanderSize = size - (padding * 2);
      const cornerRadius = 8 * this.camera.zoom;

      // 1. Zeichne das Kommandeur-Quadrat mit abgerundeten Ecken
      // Hellbrauner Hintergrund für den Kommandeur
      const playerIndex = state.players.findIndex(p => p.id === commander.playerId);
      const playerColor = parsePlayerColor(state.players[playerIndex]?.color ?? '', PLAYER_COLORS[playerIndex] || COLORS.PLAYER_1);

      // Äußerer Rahmen des Kommandeurs - alle Ränder gleich dick und gleiche Farbe
      const borderWidth = 1 * this.camera.zoom; // Dünnere Randbreite
      const uniformBorderColor = 0x333333; // Einheitliche Randfarbe für alle
      graphics.beginFill(COLORS.COMMANDER_BG, 1.0);
      graphics.lineStyle(borderWidth, uniformBorderColor, 1.0); // Einheitlicher Randstil
      graphics.drawRoundedRect(
        screenPos.x + padding,
        screenPos.y + padding,
        commanderSize,
        commanderSize,
        cornerRadius
      );
      graphics.endFill();

      // 2. Zeichne die vier Units innerhalb des Kommandeur-Quadrats
      // Positionen relativ zum Kommandeur-Zentrum (2x2 Grid)
      // Einheiten sind jetzt größer (7 statt 6) und wachsen nach innen
      const unitRadius = 7 * this.camera.zoom;
      const offset = commanderSize * 0.28 - 1 * this.camera.zoom; // Nach innen verschoben damit Außenabstand gleich bleibt
      const centerX = screenPos.x + size / 2;
      const centerY = screenPos.y + size / 2;

      const unitPositions = [
        { x: centerX - offset, y: centerY - offset }, // Oben links
        { x: centerX + offset, y: centerY - offset }, // Oben rechts
        { x: centerX - offset, y: centerY + offset }, // Unten links
        { x: centerX + offset, y: centerY + offset }, // Unten rechts
      ];

      // Farben für verschiedene Truppentypen
      const troopColors: Record<string, number> = {
        infantry: COLORS.INFANTRY,
        cavalry: COLORS.CAVALRY,
        archer: COLORS.ARCHER,
      };

      for (let i = 0; i < 4; i++) {
        const unit = commander.units[i];
        const pos = unitPositions[i];

        if (unit && unit.status === 'active') {
          const unitColor = troopColors[unit.troopType] || COLORS.INFANTRY;

          // Zeichne Unit als Kreis - gleiche Randfarbe wie Kommandeur
          graphics.beginFill(unitColor);
          graphics.lineStyle(borderWidth, uniformBorderColor, 1.0);
          graphics.drawCircle(pos.x, pos.y, unitRadius);
          graphics.endFill();

          // Zeichne Bonuspunkte als gelbe Punkte (0-3) - am Rand der Einheit positioniert
          if (unit.bonusPoints > 0) {
            const bonusRadius = 1.5 * this.camera.zoom;
            // Abstand vom Zentrum - Punkte sollen weiter auseinander liegen
            // Verwende einen größeren Abstand, damit sich die Punkte nicht überschneiden
            const baseSpacing = unitRadius * 0.55; // Größerer Basisabstand für mehr Abstand zwischen Punkten
            
            if (unit.bonusPoints === 1) {
              // Ein Punkt: mittig
              graphics.beginFill(0xffeb3b); // Gelb
              graphics.drawCircle(pos.x, pos.y, bonusRadius);
              graphics.endFill();
            } else if (unit.bonusPoints === 2) {
              // Zwei Punkte: horizontal mit ausreichend Abstand
              const spacing = baseSpacing * 0.7;
              graphics.beginFill(0xffeb3b);
              graphics.drawCircle(pos.x - spacing, pos.y, bonusRadius);
              graphics.drawCircle(pos.x + spacing, pos.y, bonusRadius);
              graphics.endFill();
            } else if (unit.bonusPoints >= 3) {
              // Drei Punkte: Dreieck-Anordnung mit ausreichend Abstand
              const spacing = baseSpacing * 0.65;
              graphics.beginFill(0xffeb3b);
              // Unten links und rechts
              graphics.drawCircle(pos.x - spacing, pos.y + spacing * 0.4, bonusRadius);
              graphics.drawCircle(pos.x + spacing, pos.y + spacing * 0.4, bonusRadius);
              // Oben mittig
              graphics.drawCircle(pos.x, pos.y - spacing * 0.6, bonusRadius);
              graphics.endFill();
            }
          }
        } else {
          // Leerer Slot - dunkleres Braun wie der Kommandeur
          graphics.beginFill(COLORS.COMMANDER_BG_DARKER, 1.0);
          graphics.lineStyle(borderWidth, uniformBorderColor, 1.0);
          graphics.drawCircle(pos.x, pos.y, unitRadius);
          graphics.endFill();
        }
      }

      // 3. Spielerfarbe-Kreis in der Mitte für ALLE Kommandeure
      const playerColorRadius = commanderSize * 0.12;
      graphics.beginFill(playerColor, 1);
      graphics.lineStyle(borderWidth, uniformBorderColor, 1.0);
      graphics.drawCircle(centerX, centerY, playerColorRadius);
      graphics.endFill();

      // 4. König-Markierung: Vertikaler Balken von oben bis zur Mitte (zum Spielerfarben-Kreis)
      if (commander.isKing) {
        // Der Balken geht von oben bis zur Mitte (zum Spielerfarben-Kreis)
        const barWidth = 4 * this.camera.zoom;
        const barHeight = (commanderSize / 2) - playerColorRadius - (padding * 0.5);
        
        // Zeichne den vertikalen Balken von oben nach unten bis zur Mitte
        if (barHeight > 0) {
          graphics.beginFill(playerColor, 1);
          graphics.drawRoundedRect(
            centerX - barWidth / 2,
            centerY - (commanderSize / 2) + padding, // Startet oben
            barWidth,
            barHeight,
            barWidth / 2  // Abgerundete Ecken
          );
          graphics.endFill();
        }
      }

      // Selection highlight (wenn der Commander selektiert ist) - gleiche Randbreite
      if (uiState.selectedCommanderId === commander.id) {
        graphics.lineStyle(borderWidth, COLORS.SELECTED, 1);
        graphics.drawRoundedRect(
          screenPos.x + padding - 2,
          screenPos.y + padding - 2,
          commanderSize + 4,
          commanderSize + 4,
          cornerRadius + 2
        );
      }

      // Highlight commanders that can still move (belong to active player and haven't acted)
      const activePlayer = state.players.find(p => p.id === state.activePlayerId);
      if (activePlayer && 
          activePlayer.commanders.includes(commander.id) && 
          !commander.hasActedThisTurn &&
          uiState.selectedCommanderId !== commander.id) {
        // Draw a subtle golden border to indicate this commander can still move
        graphics.lineStyle(borderWidth * 1.5, COLORS.CAN_MOVE, 0.8);
        graphics.drawRoundedRect(
          screenPos.x + padding - 3,
          screenPos.y + padding - 3,
          commanderSize + 6,
          commanderSize + 6,
          cornerRadius + 3
        );
      }

      // Wenn dieser Commander gerade gedraggt wird, mache ihn halbtransparent
      if (this.dragState.isDragging && this.dragState.commanderId === commander.id) {
        container.alpha = 0.3;
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
  panCamera(delta: Position, _duration: number = 300): void {
    const newX = this.camera.position.x + delta.x;
    const newY = this.camera.position.y + delta.y;
    this.camera = { ...this.camera, position: { x: newX, y: newY } };
  }

  /**
   * Zoom camera smoothly
   */
  zoomCamera(targetZoom: number, _duration: number = 300): void {
    this.setZoom(targetZoom);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: Position): Position {
    const boardWidth = BOARD_WIDTH * this.tileSize * this.camera.zoom;
    const boardHeight = BOARD_HEIGHT * this.tileSize * this.camera.zoom;
    
    // Calculate offset to center the board (same as in worldToScreen)
    const offsetX = (this.camera.viewportWidth - boardWidth) / 2;
    const offsetY = (this.camera.viewportHeight - boardHeight) / 2;
    
    // Account for camera position
    const x = (screenPos.x - offsetX) / (this.tileSize * this.camera.zoom) + this.camera.position.x;
    const y = (screenPos.y - offsetY) / (this.tileSize * this.camera.zoom) + this.camera.position.y;
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  /**
   * Convert world coordinates to screen coordinates
   * Centers the board in the viewport and applies camera offset
   */
  worldToScreen(worldPos: Position): Position {
    const boardWidth = BOARD_WIDTH * this.tileSize * this.camera.zoom;
    const boardHeight = BOARD_HEIGHT * this.tileSize * this.camera.zoom;
    
    // Calculate offset to center the board
    const offsetX = (this.camera.viewportWidth - boardWidth) / 2;
    const offsetY = (this.camera.viewportHeight - boardHeight) / 2;
    
    // Apply camera position offset
    const x = (worldPos.x - this.camera.position.x) * this.tileSize * this.camera.zoom + offsetX;
    const y = (worldPos.y - this.camera.position.y) * this.tileSize * this.camera.zoom + offsetY;
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
   * Get PixiJS application instance
   */
  getApp(): PIXI.Application {
    return this.app;
  }

  /**
   * Show game results dialog
   */
  showGameResults(results: GameResults): void {
    const container = new PIXI.Container();
    
    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.drawRoundedRect(0, 0, this.camera.viewportWidth, this.camera.viewportHeight, 0);
    bg.endFill();
    container.addChild(bg);
    
    // Title
    const titleStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: 0x000000,
      strokeThickness: 4,
    });
    
    const reasonText = results.finishReason === 'king_defeated' 
      ? 'König besiegt!' 
      : results.finishReason === 'banner_captured' 
        ? 'Banner erobert!' 
        : 'Spiel beendet';
    
    const title = new PIXI.Text(`🎉 ${results.winnerName} gewinnt! 🎉`, titleStyle);
    title.anchor.set(0.5);
    title.position.set(this.camera.viewportWidth / 2, 80);
    container.addChild(title);
    
    const reasonStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
    });
    const reason = new PIXI.Text(reasonText, reasonStyle);
    reason.anchor.set(0.5);
    reason.position.set(this.camera.viewportWidth / 2, 140);
    container.addChild(reason);
    
    // Results table header
    const headerY = 200;
    const colX = [100, 300, 500, 700, 900];
    
    const headerStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffd700,
    });
    
    const headers = ['Spieler', 'Einheiten', 'Kommandeure', 'Stärke', 'Gesamt'];
    headers.forEach((text, i) => {
      const header = new PIXI.Text(text, headerStyle);
      header.anchor.set(0.5);
      header.position.set(colX[i], headerY);
      container.addChild(header);
    });
    
    // Results rows
    const rowStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff,
    });
    
    const winnerStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x2ecc71,
    });
    
    results.scores.forEach((score: PlayerScore, index: number) => {
      const y = headerY + 50 + (index * 40);
      const isWinner = score.playerId === results.winner;
      const style = isWinner ? winnerStyle : rowStyle;
      
      const cells = [
        score.playerName + (isWinner ? ' 👑' : ''),
        score.remainingUnits.toString(),
        score.remainingCommanders.toString(),
        score.strengthPoints.toString(),
        score.totalScore.toString(),
      ];
      
      cells.forEach((text, i) => {
        const cell = new PIXI.Text(text, style);
        cell.anchor.set(0.5);
        cell.position.set(colX[i], y);
        container.addChild(cell);
      });
    });
    
    // Click to continue text
    const continueStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xaaaaaa,
    });
    const continueText = new PIXI.Text('Klicken zum Fortfahren', continueStyle);
    continueText.anchor.set(0.5);
    continueText.position.set(this.camera.viewportWidth / 2, this.camera.viewportHeight - 50);
    container.addChild(continueText);
    
    // Make clickable to close
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.hitArea = new PIXI.Rectangle(0, 0, this.camera.viewportWidth, this.camera.viewportHeight);
    container.once('pointerdown', () => {
      container.destroy({ children: true });
    });
    
    this.app.stage.addChild(container);
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.cancelDrag();
    this.callbacks = {};
    for (const cleanup of this.inputCleanup.splice(0)) cleanup();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    this.animationManager.dispose();
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }
}

/**
 * Create a game renderer
 */
export function createGameRenderer(
  containerId: string,
  width: number,
  height: number,
  tileSize: number = 64,
  options?: { useTextures?: boolean; showGrid?: boolean }
): GameRenderer {
  return new GameRenderer(containerId, width, height, tileSize, options);
}
