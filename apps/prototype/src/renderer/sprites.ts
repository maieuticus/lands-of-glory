/**
 * apps/prototype/src/renderer/sprites.ts
 *
 * Sprite factory and helper functions (simplified stub for Phase 2)
 */

// Sprite type definitions
export interface TileSprite {
  type: 'tile';
  size: number;
  color: number;
}

export interface CommanderSprite {
  type: 'commander';
  size: number;
  color: number;
  isKing: boolean;
  isBanner: boolean;
}

export interface UnitSprite {
  type: 'unit';
  size: number;
  color: number;
  troopType: string;
}

export interface HighlightSprite {
  type: 'highlight';
  size: number;
  highlightType: string;
}

export interface TextLabel {
  type: 'text';
  text: string;
  fontSize: number;
  color: number;
}

export interface ButtonSprite {
  type: 'button';
  width: number;
  height: number;
  label: string;
  backgroundColor: number;
}

export interface HealthBar {
  type: 'healthbar';
  width: number;
  height: number;
  currentHealth: number;
  maxHealth: number;
}

export interface Particle {
  type: 'particle';
  position: { x: number; y: number };
  color: number;
}

export interface ParticleEffect {
  sprite: Particle;
  lifespan: number;
}

/**
 * Create a simple colored square sprite for a tile
 */
export function createTileSprite(size: number, color: number): TileSprite {
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
): CommanderSprite {
  return { type: 'commander', size, color, isKing, isBanner };
}

/**
 * Create a unit sprite
 */
export function createUnitSprite(
  size: number,
  color: number,
  troopType: string = 'infantry'
): UnitSprite {
  return { type: 'unit', size, color, troopType };
}

/**
 * Create a highlight sprite for selection/targeting
 */
export function createHighlightSprite(
  size: number,
  highlightType: string = 'selected'
): HighlightSprite {
  return { type: 'highlight', size, highlightType };
}

/**
 * Create a text label
 */
export function createTextLabel(text: string, fontSize: number = 16, color: number = 0xffffff): TextLabel {
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
): ButtonSprite {
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
): HealthBar {
  return { type: 'healthbar', width, height, currentHealth, maxHealth };
}

/**
 * Create a particle effect
 */
export function createParticle(
  position: { x: number; y: number },
  color: number,
  lifespan: number = 500
): ParticleEffect {
  return {
    sprite: { type: 'particle', position, color },
    lifespan,
  };
}
