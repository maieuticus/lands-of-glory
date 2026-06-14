/**
 * apps/prototype/src/renderer/animations.ts
 *
 * Animation system for game effects
 *
 * Implements:
 * - Movement animations
 * - Combat animations
 * - Selection effects
 * - Spawn/despawn effects
 */

import * as PIXI from 'pixi.js';

/**
 * Animation type
 */
export type AnimationType = 'move' | 'attack' | 'damage' | 'death' | 'spawn' | 'select' | 'dice';

/**
 * Sprite with scale property
 */
interface ScalableSprite extends PIXI.DisplayObject {
  scale: PIXI.ObservablePoint;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;  // milliseconds
  easing?: (t: number) => number;
}

/**
 * Easing functions
 */
export const Easing = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};

/**
 * Active animation
 */
interface ActiveAnimation {
  id: string;
  type: AnimationType;
  startTime: number;
  duration: number;
  easing: (t: number) => number;
  sprite: PIXI.DisplayObject;
  from: { x: number; y: number; alpha?: number; scale?: number };
  to: { x: number; y: number; alpha?: number; scale?: number };
  onComplete?: () => void;
}

/**
 * Animation manager
 */
export class AnimationManager {
  private app: PIXI.Application;
  private animations: Map<string, ActiveAnimation> = new Map();
  private animationLayer: PIXI.Container;
  private idCounter = 0;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.animationLayer = new PIXI.Container();
    this.app.stage.addChild(this.animationLayer);
    
    // Start animation loop
    this.app.ticker.add(() => this.updateAnimations());
  }

  /**
   * Animate sprite movement from one position to another
   */
  animateMove(
    sprite: PIXI.DisplayObject,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    config: AnimationConfig = { duration: 300 }
  ): string {
    const id = `move_${this.idCounter++}`;
    
    const animation: ActiveAnimation = {
      id,
      type: 'move',
      startTime: Date.now(),
      duration: config.duration,
      easing: config.easing || Easing.easeInOut,
      sprite,
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY },
    };
    
    this.animations.set(id, animation);
    return id;
  }

  /**
   * Animate attack (lunge toward target)
   */
  animateAttack(
    sprite: PIXI.DisplayObject,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    config: AnimationConfig = { duration: 200 }
  ): string {
    const id = `attack_${this.idCounter++}`;
    
    // Lunge 30% toward target then return
    const lungeX = startX + (targetX - startX) * 0.3;
    const lungeY = startY + (targetY - startY) * 0.3;
    
    const animation: ActiveAnimation = {
      id,
      type: 'attack',
      startTime: Date.now(),
      duration: config.duration,
      easing: Easing.easeInOut,
      sprite,
      from: { x: startX, y: startY },
      to: { x: lungeX, y: lungeY },
      onComplete: () => {
        // Return to start
        this.animateMove(sprite, lungeX, lungeY, startX, startY, { duration: 150 });
      },
    };
    
    this.animations.set(id, animation);
    return id;
  }

  /**
   * Animate damage (flash red and shake)
   */
  animateDamage(
    sprite: PIXI.DisplayObject,
    x: number,
    y: number,
    config: AnimationConfig = { duration: 400 }
  ): string {
    const id = `damage_${this.idCounter++}`;
    
    // Create damage effect overlay
    const flash = new PIXI.Graphics();
    flash.beginFill(0xff0000, 0.5);
    flash.drawRect(-50, -50, 100, 100);
    flash.endFill();
    flash.x = x;
    flash.y = y;
    flash.alpha = 0;
    this.animationLayer.addChild(flash);
    
    const animation: ActiveAnimation = {
      id,
      type: 'damage',
      startTime: Date.now(),
      duration: config.duration,
      easing: Easing.easeOut,
      sprite: flash,
      from: { x, y, alpha: 0.8 },
      to: { x, y, alpha: 0 },
      onComplete: () => {
        flash.destroy();
      },
    };
    
    this.animations.set(id, animation);
    
    // Also shake the target sprite
    this.animateShake(sprite, x, y);
    
    return id;
  }

  /**
   * Animate shake effect
   */
  animateShake(
    sprite: PIXI.DisplayObject,
    baseX: number,
    baseY: number,
    config: AnimationConfig = { duration: 300 }
  ): string {
    const id = `shake_${this.idCounter++}`;
    const startTime = Date.now();
    
    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / config.duration, 1);
      
      if (progress >= 1) {
        sprite.x = baseX;
        sprite.y = baseY;
        return;
      }
      
      const intensity = 5 * (1 - progress);
      sprite.x = baseX + (Math.random() - 0.5) * intensity;
      sprite.y = baseY + (Math.random() - 0.5) * intensity;
      
      requestAnimationFrame(shake);
    };
    
    shake();
    return id;
  }

  /**
   * Animate unit death (fade out and shrink)
   */
  animateDeath(
    sprite: PIXI.DisplayObject,
    x: number,
    y: number,
    config: AnimationConfig = { duration: 500 }
  ): string {
    const id = `death_${this.idCounter++}`;
    
    const animation: ActiveAnimation = {
      id,
      type: 'death',
      startTime: Date.now(),
      duration: config.duration,
      easing: Easing.easeIn,
      sprite,
      from: { x, y, alpha: 1, scale: 1 },
      to: { x, y, alpha: 0, scale: 0.5 },
      onComplete: () => {
        sprite.visible = false;
      },
    };
    
    this.animations.set(id, animation);
    return id;
  }

  /**
   * Animate spawn (scale up from 0)
   */
  animateSpawn(
    sprite: PIXI.DisplayObject,
    x: number,
    y: number,
    config: AnimationConfig = { duration: 300 }
  ): string {
    const id = `spawn_${this.idCounter++}`;
    
    sprite.visible = true;
    sprite.alpha = 0;
    if ('scale' in sprite) {
      (sprite as ScalableSprite).scale.set(0);
    }
    
    const animation: ActiveAnimation = {
      id,
      type: 'spawn',
      startTime: Date.now(),
      duration: config.duration,
      easing: Easing.easeOut,
      sprite,
      from: { x, y, alpha: 0, scale: 0 },
      to: { x, y, alpha: 1, scale: 1 },
    };
    
    this.animations.set(id, animation);
    return id;
  }

  /**
   * Animate selection pulse
   */
  animateSelection(
    sprite: PIXI.DisplayObject,
    x: number,
    y: number
  ): string {
    const id = `select_${this.idCounter++}`;
    
    // Create pulsing ring
    const ring = new PIXI.Graphics();
    ring.lineStyle(3, 0xffeb3b, 0.8);
    ring.drawCircle(0, 0, 40);
    ring.x = x;
    ring.y = y;
    this.animationLayer.addChild(ring);
    
    let startTime = Date.now();
    
    const pulse = () => {
      const elapsed = Date.now() - startTime;
      const cycle = 1000; // 1 second pulse cycle
      const progress = (elapsed % cycle) / cycle;
      
      const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
      const alpha = 0.5 + Math.sin(progress * Math.PI * 2) * 0.3;
      
      ring.scale.set(scale);
      ring.alpha = alpha;
      
      if (this.animations.has(id)) {
        requestAnimationFrame(pulse);
      } else {
        ring.destroy();
      }
    };
    
    pulse();
    
    const animation: ActiveAnimation = {
      id,
      type: 'select',
      startTime,
      duration: Infinity,
      easing: Easing.linear,
      sprite: ring,
      from: { x, y, alpha: 0.5, scale: 1 },
      to: { x, y, alpha: 0.8, scale: 1.1 },
    };
    
    this.animations.set(id, animation);
    return id;
  }

  /**
   * Stop an animation
   */
  stopAnimation(id: string): void {
    const animation = this.animations.get(id);
    if (animation) {
      if (animation.onComplete) {
        animation.onComplete();
      }
      this.animations.delete(id);
    }
  }

  /**
   * Stop all animations
   */
  stopAllAnimations(): void {
    for (const [id, animation] of this.animations) {
      if (animation.onComplete) {
        animation.onComplete();
      }
    }
    this.animations.clear();
  }

  /**
   * Update all active animations
   */
  private updateAnimations(): void {
    const now = Date.now();
    
    for (const [id, animation] of this.animations) {
      const elapsed = now - animation.startTime;
      let progress = Math.min(elapsed / animation.duration, 1);
      
      // Apply easing
      const easedProgress = animation.easing(progress);
      
      // Interpolate values
      const x = animation.from.x + (animation.to.x - animation.from.x) * easedProgress;
      const y = animation.from.y + (animation.to.y - animation.from.y) * easedProgress;
      
      animation.sprite.x = x;
      animation.sprite.y = y;
      
      if (animation.from.alpha !== undefined && animation.to.alpha !== undefined) {
        animation.sprite.alpha = animation.from.alpha + 
          (animation.to.alpha - animation.from.alpha) * easedProgress;
      }
      
      if (animation.from.scale !== undefined && animation.to.scale !== undefined) {
        const scale = animation.from.scale + 
          (animation.to.scale - animation.from.scale) * easedProgress;
        if ('scale' in animation.sprite) {
          (animation.sprite as ScalableSprite).scale.set(scale);
        }
      }
      
      // Check if animation is complete
      if (progress >= 1) {
        if (animation.onComplete) {
          animation.onComplete();
        }
        this.animations.delete(id);
      }
    }
  }

  /**
   * Dispose animation manager
   */
  dispose(): void {
    this.stopAllAnimations();
    this.animationLayer.destroy();
  }
}
