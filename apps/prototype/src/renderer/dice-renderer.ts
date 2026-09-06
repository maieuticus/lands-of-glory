/**
 * apps/prototype/src/renderer/dice-renderer.ts
 *
 * Visual dice renderer for combat animations
 *
 * Renders dice with dots (1-6) as PixiJS graphics with beautiful gradients
 * Inspired by dice-visual-demo.html
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
  shadowColor: number;
  highlightColor: number;
}

/**
 * Default dice configuration - white dice for attacker
 */
export const DEFAULT_DICE_CONFIG: DiceConfig = {
  size: 55,
  backgroundColor: 0xffffff,
  dotColor: 0x1a1a1a,
  borderColor: 0xbbbbbb,
  borderWidth: 2,
  cornerRadius: 10,
  shadowColor: 0x000000,
  highlightColor: 0xffffff,
};

/**
 * Black dice configuration for defender
 */
export const BLACK_DICE_CONFIG: DiceConfig = {
  size: 55,
  backgroundColor: 0x2a2a2a,
  dotColor: 0xffffff,
  borderColor: 0x555555,
  borderWidth: 2,
  cornerRadius: 10,
  shadowColor: 0x000000,
  highlightColor: 0x444444,
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
   * @param isWinner - Whether this dice won the comparison
   */
  createDice(value: number, playerColor?: number, isWinner: boolean = false): PIXI.Container {
    const container = new PIXI.Container();
    
    const { size, backgroundColor: defaultBgColor, dotColor: defaultDotColor, borderColor, borderWidth, cornerRadius } = this.config;
    const dotRadius = size * 0.10;
    
    // Determine dice colors based on player color
    let bgColor = defaultBgColor;
    let dotColor = defaultDotColor;
    let isBlackDice = false;
    
    if (playerColor !== undefined) {
      // Check if player color is black (or very dark)
      const isBlack = playerColor === 0x000000 || 
                      (playerColor < 0x333333 && playerColor > 0x111111);
      
      if (isBlack) {
        // Black dice with white dots
        bgColor = 0x2a2a2a;
        dotColor = 0xffffff;
        isBlackDice = true;
      } else {
        // White/colored dice with black dots
        bgColor = 0xffffff;
        dotColor = 0x1a1a1a;
      }
    }

    // Draw shadow
    const shadowGraphics = new PIXI.Graphics();
    shadowGraphics.beginFill(0x000000, 0.3);
    shadowGraphics.drawRoundedRect(-size / 2 + 3, -size / 2 + 6, size, size, cornerRadius);
    shadowGraphics.endFill();
    container.addChild(shadowGraphics);

    // Draw dice background with gradient-like effect (top highlight)
    const diceGraphics = new PIXI.Graphics();
    
    // Main dice body
    diceGraphics.beginFill(bgColor);
    diceGraphics.lineStyle(borderWidth, borderColor, 1);
    diceGraphics.drawRoundedRect(-size / 2, -size / 2, size, size, cornerRadius);
    diceGraphics.endFill();
    
    // Add inner highlight at top
    const highlightGraphics = new PIXI.Graphics();
    highlightGraphics.beginFill(isBlackDice ? 0x444444 : 0xffffff, 0.4);
    highlightGraphics.drawRoundedRect(-size / 2 + 4, -size / 2 + 2, size - 8, size * 0.4, cornerRadius * 0.6);
    highlightGraphics.endFill();
    
    // Add darker bottom for depth
    const shadowBottomGraphics = new PIXI.Graphics();
    shadowBottomGraphics.beginFill(isBlackDice ? 0x1a1a1a : 0xd0d0d0, 0.5);
    shadowBottomGraphics.drawRoundedRect(-size / 2 + 2, size / 2 - size * 0.25, size - 4, size * 0.23, cornerRadius * 0.5);
    shadowBottomGraphics.endFill();
    
    container.addChild(diceGraphics);
    container.addChild(highlightGraphics);
    container.addChild(shadowBottomGraphics);

    // Draw dots with radial gradient effect
    const positions = this.getDotPositions(value, size);
    for (const pos of positions) {
      const dotContainer = new PIXI.Container();
      
      // Main dot
      const dotGraphics = new PIXI.Graphics();
      dotGraphics.beginFill(dotColor);
      dotGraphics.drawCircle(pos.x, pos.y, dotRadius);
      dotGraphics.endFill();
      
      // Inner highlight for 3D effect
      const dotHighlight = new PIXI.Graphics();
      dotHighlight.beginFill(dotColor === 0xffffff ? 0xffffff : 0x444444, 0.3);
      dotHighlight.drawCircle(pos.x - dotRadius * 0.3, pos.y - dotRadius * 0.3, dotRadius * 0.4);
      dotHighlight.endFill();
      
      dotContainer.addChild(dotGraphics);
      dotContainer.addChild(dotHighlight);
      container.addChild(dotContainer);
    }

    // Winner crown
    if (isWinner) {
      const crown = new PIXI.Text('👑', {
        fontFamily: 'Arial',
        fontSize: 16,
      });
      crown.anchor.set(0.5);
      crown.position.set(0, -size / 2 - 12);
      crown.scale.set(0.8);
      container.addChild(crown);
    }

    return container;
  }

  /**
   * Create a dice with bonus/king bonus indicators
   * Styled like dice-visual-demo.html
   * 
   * Note: Bonus badges and king crown are now handled by CombatDiceAnimation
   * to allow them to appear after rolling
   */
  createCombatDice(
    naturalValue: number,
    bonusPoints: number,
    kingBonus: number,
    isAttacker: boolean,
    _isWinner: boolean = false
  ): PIXI.Container {
    const container = new PIXI.Container();
    
    // Determine player color (white for attacker, black for defender)
    const playerColor = isAttacker ? 0xffffff : 0x000000;
    
    // Main dice with king crown if applicable
    const dice = this.createDice(naturalValue, playerColor, kingBonus > 0);
    container.addChild(dice);

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
   * @param isWinner - Whether this dice won the comparison
   */
  updateDiceValue(container: PIXI.Container, value: number, playerColor?: number, isWinner: boolean = false): void {
    // Remove old dice graphics (keep only the border background)
    while (container.children.length > 1) {
      container.children[container.children.length - 1].destroy();
    }

    // Create new dice with new value and optional player color
    const newDice = this.createDice(value, playerColor, isWinner);
    
    // Add all children from newDice to container
    while (newDice.children.length > 0) {
      const child = newDice.children[0];
      newDice.removeChild(child);
      container.addChild(child);
    }
    newDice.destroy();
  }

  /**
   * Create a bonus badge like in dice-visual-demo.html
   */
  createBonusBadge(bonusValue: number, x: number, y: number): PIXI.Container {
    const container = new PIXI.Container();
    container.position.set(x, y);
    
    if (bonusValue <= 0) return container;
    
    // Badge background (gold gradient-like)
    const badgeBg = new PIXI.Graphics();
    badgeBg.beginFill(0xffd700);
    badgeBg.lineStyle(1, 0xffaa00, 1);
    badgeBg.drawRoundedRect(-12, -10, 24, 20, 10);
    badgeBg.endFill();
    
    // Highlight on top
    const badgeHighlight = new PIXI.Graphics();
    badgeHighlight.beginFill(0xffec8b, 0.6);
    badgeHighlight.drawRoundedRect(-10, -8, 20, 8, 6);
    badgeHighlight.endFill();
    
    // Text
    const badgeText = new PIXI.Text(`+${bonusValue}`, {
      fontFamily: 'Arial',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0x000000,
    });
    badgeText.anchor.set(0.5);
    
    container.addChild(badgeBg);
    container.addChild(badgeHighlight);
    container.addChild(badgeText);
    
    return container;
  }
}
