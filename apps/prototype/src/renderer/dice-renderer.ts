/**
 * apps/prototype/src/renderer/dice-renderer.ts
 *
 * Visual dice renderer for combat animations
 *
 * Renders dice with dots (1-6) as PixiJS graphics
 */

import * as PIXI from 'pixi.js';

/**
 * Dice configuration
 */
export interface DiceConfig {
  size: number;
  backgroundColor: number;
  dotColor: number;
  borderColor: number;
  borderWidth: number;
  cornerRadius: number;
}

/**
 * Default dice configuration
 */
export const DEFAULT_DICE_CONFIG: DiceConfig = {
  size: 48,
  backgroundColor: 0xffffff,
  dotColor: 0x1a1a1a,
  borderColor: 0x333333,
  borderWidth: 2,
  cornerRadius: 6,
};

/**
 * Dice renderer - creates visual dice with PixiJS
 */
export class DiceRenderer {
  private config: DiceConfig;

  constructor(config: Partial<DiceConfig> = {}) {
    this.config = { ...DEFAULT_DICE_CONFIG, ...config };
  }

  /**
   * Create a dice sprite with the given value (1-6)
   * @param value - Dice value (1-6)
   * @param playerColor - Player color for dice background (optional, uses config default if not provided)
   */
  createDice(value: number, playerColor?: number): PIXI.Container {
    const container = new PIXI.Container();
    const graphics = new PIXI.Graphics();

    const { size, backgroundColor: defaultBgColor, dotColor: defaultDotColor, borderColor, borderWidth, cornerRadius } = this.config;
    const dotRadius = size * 0.08;
    
    // Determine dice colors based on player color
    let bgColor = defaultBgColor;
    let dotColor = defaultDotColor;
    
    if (playerColor !== undefined) {
      // Check if player color is black (or very dark)
      const isBlack = playerColor === 0x000000 || 
                      (playerColor < 0x333333 && playerColor > 0x111111);
      
      if (isBlack) {
        // Black dice with white dots
        bgColor = 0x000000;
        dotColor = 0xffffff;
      } else {
        // Colored dice with black dots
        bgColor = playerColor;
        dotColor = 0x000000;
      }
    }

    // Draw dice background (rounded rectangle)
    graphics.beginFill(bgColor);
    graphics.lineStyle(borderWidth, borderColor, 1);
    graphics.drawRoundedRect(-size / 2, -size / 2, size, size, cornerRadius);
    graphics.endFill();

    // Draw dots based on value
    graphics.beginFill(dotColor);
    const positions = this.getDotPositions(value, size);
    for (const pos of positions) {
      graphics.drawCircle(pos.x, pos.y, dotRadius);
    }
    graphics.endFill();

    container.addChild(graphics);
    return container;
  }

  /**
   * Create a dice with bonus/king bonus indicators
   */
  createCombatDice(
    naturalValue: number,
    bonusPoints: number,
    kingBonus: number,
    isAttacker: boolean
  ): PIXI.Container {
    const container = new PIXI.Container();
    
    // Main dice
    const dice = this.createDice(naturalValue);
    container.addChild(dice);

    // Add bonus indicators if present
    const { size } = this.config;
    let offsetY = -size / 2 - 12;

    // Bonus points indicator (0-3)
    if (bonusPoints > 0) {
      const bonusLabel = this.createBonusLabel(`+${bonusPoints}`, 0xffeb3b);
      bonusLabel.position.set(size / 2 + 8, 0);
      container.addChild(bonusLabel);
    }

    // King bonus indicator
    if (kingBonus > 0) {
      const kingLabel = this.createBonusLabel('👑', 0xffd700);
      kingLabel.position.set(0, -size / 2 - 10);
      container.addChild(kingLabel);
    }

    return container;
  }

  /**
   * Create a bonus label
   */
  private createBonusLabel(text: string, color: number): PIXI.Container {
    const container = new PIXI.Container();
    const label = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fill: color,
      stroke: 0x000000,
      strokeThickness: 2,
    });
    label.anchor.set(0.5);
    container.addChild(label);
    return container;
  }

  /**
   * Get dot positions for a dice value (1-6)
   * Coordinates are relative to center of dice
   */
  private getDotPositions(value: number, size: number): Array<{ x: number; y: number }> {
    const offset = size * 0.28;
    const smallOffset = size * 0.15;

    switch (value) {
      case 1:
        return [{ x: 0, y: 0 }];
      
      case 2:
        return [
          { x: -offset, y: -offset },
          { x: offset, y: offset },
        ];
      
      case 3:
        return [
          { x: -offset, y: -offset },
          { x: 0, y: 0 },
          { x: offset, y: offset },
        ];
      
      case 4:
        return [
          { x: -offset, y: -offset },
          { x: offset, y: -offset },
          { x: -offset, y: offset },
          { x: offset, y: offset },
        ];
      
      case 5:
        return [
          { x: -offset, y: -offset },
          { x: offset, y: -offset },
          { x: 0, y: 0 },
          { x: -offset, y: offset },
          { x: offset, y: offset },
        ];
      
      case 6:
        return [
          { x: -offset, y: -offset },
          { x: offset, y: -offset },
          { x: -offset, y: 0 },
          { x: offset, y: 0 },
          { x: -offset, y: offset },
          { x: offset, y: offset },
        ];
      
      default:
        return [{ x: 0, y: 0 }];
    }
  }

  /**
   * Create a rolling dice animation container
   */
  createRollingDice(): PIXI.Container {
    const container = new PIXI.Container();
    
    // Create dice with random initial value
    const dice = this.createDice(Math.floor(Math.random() * 6) + 1);
    container.addChild(dice);

    return container;
  }

  /**
   * Update dice value during animation
   * @param container - The dice container
   * @param value - New dice value (1-6)
   * @param playerColor - Player color for dice background (optional)
   */
  updateDiceValue(container: PIXI.Container, value: number, playerColor?: number): void {
    // Remove old dice graphics
    const oldDice = container.children[0];
    if (oldDice) {
      oldDice.destroy();
    }

    // Create new dice with new value and optional player color
    const newDice = this.createDice(value, playerColor);
    container.addChild(newDice);
  }
}
