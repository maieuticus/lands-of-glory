/**
 * apps/prototype/src/renderer/layers.ts
 *
 * Layered rendering architecture (simplified stub for Phase 2)
 *
 * Organizes rendering into distinct layers:
 * 1. Board layer: Tiles and terrain
 * 2. Unit layer: Commanders and units
 * 3. Effect layer: Animations and particles
 * 4. UI layer: Panels, buttons, text
 */

import * as PIXI from 'pixi.js';

/**
 * Render layer interface
 */
export interface RenderLayer {
  name: string;
  priority: number;
  clear(): void;
  dispose(): void;
}

/**
 * Board layer configuration
 */
export interface BoardLayerConfig {
  tileSize: number;
  boardWidth: number;
  boardHeight: number;
}

/**
 * Layer manager for organizing rendering (simplified stub)
 */
export class LayerManager {
  private layers: Map<string, RenderLayer> = new Map();

  constructor() {}

  addLayer(name: string, layer: RenderLayer): void {
    this.layers.set(name, layer);
  }

  getLayer(name: string): RenderLayer | undefined {
    return this.layers.get(name);
  }

  clearAll(): void {
    for (const layer of this.layers.values()) {
      layer.clear();
    }
  }

  disposeAll(): void {
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();
  }
}

/**
 * Board layer implementation (simplified stub)
 */
export class BoardLayer implements RenderLayer {
  name = 'board';
  priority = 0;

  constructor(_config: BoardLayerConfig) {}

  clear(): void {}
  dispose(): void {}
}

/**
 * Unit layer implementation (simplified stub)
 */
export class UnitLayer implements RenderLayer {
  name = 'units';
  priority = 1;

  constructor(_tileSize: number) {}

  clear(): void {}
  dispose(): void {}
}

/**
 * Effect layer implementation (simplified stub)
 */
export class EffectLayer implements RenderLayer {
  name = 'effects';
  priority = 2;

  constructor() {}

  clear(): void {}
  dispose(): void {}
}

/**
 * UI layer implementation (simplified stub)
 */
export class UILayer implements RenderLayer {
  name = 'ui';
  priority = 3;

  constructor() {}

  clear(): void {}
  dispose(): void {}
}

/**
 * Create layer manager with standard layers (simplified stub)
 */
export function createLayerManager(
  root: PIXI.Container,
  boardConfig: BoardLayerConfig
): LayerManager {
  const manager = new LayerManager();

  manager.addLayer('board', new BoardLayer(boardConfig));
  manager.addLayer('units', new UnitLayer(boardConfig.tileSize));
  manager.addLayer('effects', new EffectLayer());
  manager.addLayer('ui', new UILayer());

  return manager;
}
