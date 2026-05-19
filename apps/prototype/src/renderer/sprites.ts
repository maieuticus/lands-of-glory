/**
 * apps/prototype/src/renderer/sprites.ts
 *
 * Sprite factory and helper functions (simplified stub for Phase 2)
 */

/**
 * Create a simple colored square sprite for a tile
 */
export function createTileSprite(size: number, color: number): any {
  return { type: 'tile', size, color };
}

/**
 * Create a commander sprite
 */
export function createCommanderSprite(
  size: number,
  color: number,
  isKing: boolean = false,
  isBanner: boolean = false
): any {
  return { type: 'commander', size, color, isKing, isBanner };
}

/**
 * Create a unit sprite
 */
export function createUnitSprite(
  size: number,
  color: number,
  troopType: string = 'infantry'
): any {
  return { type: 'unit', size, color, troopType };
}

/**
 * Create a highlight sprite for selection/targeting
 */
export function createHighlightSprite(
  size: number,
  highlightType: string = 'selected'
): any {
  return { type: 'highlight', size, highlightType };
}

/**
 * Create a text label
 */
export function createTextLabel(text: string, fontSize: number = 16, color: number = 0xffffff): any {
  return { type: 'text', text, fontSize, color };
}

/**
 * Create a button sprite
 */
export function createButton(
  width: number,
  height: number,
  label: string,
  backgroundColor: number = 0x4444ff
): any {
  return { type: 'button', width, height, label, backgroundColor };
}

/**
 * Create a damage/health bar
 */
export function createHealthBar(
  width: number,
  height: number,
  currentHealth: number,
  maxHealth: number
): any {
  return { type: 'healthbar', width, height, currentHealth, maxHealth };
}

/**
 * Create a particle effect
 */
export function createParticle(
  position: { x: number; y: number },
  color: number,
  lifespan: number = 500
): { sprite: any; lifespan: number } {
  return {
    sprite: { type: 'particle', position, color },
    lifespan,
  };
}
