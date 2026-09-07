/**
 * apps/prototype/src/renderer/combat-animation.ts
 *
 * Combat dice animation system - Single view with rolling dice
 *
 * Shows:
 * - Player badges and VS visible throughout
 * - Rolling dice animation
 * - Würfel stay visible, only additional elements are added
 * - Bonus badges appear on dice
 * - Loss markers appear for losers
 * - Combat results at bottom
 */

import * as PIXI from 'pixi.js';
import { CombatResult, DieRoll } from '@lands-of-glory/game-core';
import { DiceRenderer } from './dice-renderer';

/**
 * Combat animation configuration
 */
export interface CombatAnimationConfig {
  diceSize: number;
  diceSpacing: number;
  pairSpacing: number;
  animationDuration: number;
  rollInterval: number;
  resultDelay: number;
  scale: number;
  positionX: number;
  positionY: number;
}

/**
 * Default configuration - larger dice and display
 */
const DEFAULT_CONFIG: CombatAnimationConfig = {
  diceSize: 72,
  diceSpacing: 25,
  pairSpacing: 220,
  animationDuration: 800,
  rollInterval: 80,
  resultDelay: 400,
  scale: 1.3,
  positionX: 20,
  positionY: 20,
};

/**
 * Predefined dice size configurations
 */
export const DICE_SIZE_CONFIGS: Record<string, CombatAnimationConfig> = {
  small: {
    diceSize: 40,
    diceSpacing: 12,
    pairSpacing: 120,
    animationDuration: 600,
    rollInterval: 60,
    resultDelay: 300,
    scale: 0.8,
    positionX: 10,
    positionY: 10,
  },
  medium: {
    diceSize: 56,
    diceSpacing: 18,
    pairSpacing: 170,
    animationDuration: 700,
    rollInterval: 70,
    resultDelay: 350,
    scale: 1.0,
    positionX: 15,
    positionY: 15,
  },
  large: {
    diceSize: 72,
    diceSpacing: 25,
    pairSpacing: 220,
    animationDuration: 800,
    rollInterval: 80,
    resultDelay: 400,
    scale: 1.3,
    positionX: 20,
    positionY: 20,
  },
};

/**
 * Player colors for dice sides
 */
interface PlayerColors {
  attackerColor: number;
  defenderColor: number;
}

/**
 * Troop type colors matching the demo
 */
const TROOP_COLORS = {
  infantry: 0x2ecc71,  // Green
  cavalry: 0x3498db,   // Blue
  archer: 0xe74c3c,    // Red
};

/**
 * Interface for tracking dice containers
 */
interface DiceRow {
  attackerDice: PIXI.Container;
  defenderDice: PIXI.Container;
  attackerRoll: DieRoll | null;
  defenderRoll: DieRoll | null;
  rowY: number;
}

/**
 * Combat dice animation - single continuous view
 */
export class CombatDiceAnimation {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private diceRenderer: DiceRenderer;
  private config: CombatAnimationConfig;
  private isPlaying = false;
  private onCompleteCallback?: () => void;
  private diceRows: DiceRow[] = [];
  private rollIntervalId?: number;
  private resultTimeoutId?: number;
  private hintAnimationFrameId?: number;
  private disposed = false;

  constructor(
    app: PIXI.Application,
    config: Partial<CombatAnimationConfig> = {}
  ) {
    this.app = app;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.diceRenderer = new DiceRenderer({ size: this.config.diceSize });
    
    // Create overlay container
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.app.stage.addChild(this.container);
  }

  /**
   * Play combat animation - compact top-left view
   */
  play(
    combatResult: CombatResult,
    attackerName: string,
    defenderName: string,
    attackerColor: number,
    defenderColor: number,
    onComplete?: () => void
  ): void {
    if (this.isPlaying || this.disposed) return;

    this.isPlaying = true;
    this.onCompleteCallback = onComplete;
    this.diceRows = [];

    const playerColors: PlayerColors = {
      attackerColor,
      defenderColor,
    };
    
    // Clear previous animation
    this.destroyChildren(this.container);
    this.container.visible = true;
    
    // Create main scaled container for compact view
    const combatView = new PIXI.Container();
    combatView.scale.set(this.config.scale);
    combatView.position.set(this.config.positionX, this.config.positionY);
    this.container.addChild(combatView);
    
    // Calculate view size based on content - larger for bigger dice
    const viewWidth = 680;
    const viewHeight = 850;
    
    // Create combat panel background (dark game field)
    const panelBg = new PIXI.Graphics();
    panelBg.beginFill(0x1a2a1a);  // Dark greenish background
    panelBg.lineStyle(2, 0x2a3a2a, 1);
    panelBg.drawRoundedRect(0, 0, viewWidth, viewHeight, 15);
    panelBg.endFill();
    combatView.addChild(panelBg);
    
    // Add grid pattern to background
    const gridGraphics = new PIXI.Graphics();
    gridGraphics.lineStyle(1, 0x2a4a2a, 0.3);
    for (let x = 0; x <= viewWidth; x += 30) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, viewHeight);
    }
    for (let y = 0; y <= viewHeight; y += 30) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(viewWidth, y);
    }
    combatView.addChild(gridGraphics);
    
    // Add horizontal guide lines for layout visualization
    const guideLines = new PIXI.Graphics();
    guideLines.lineStyle(2, 0x444444, 0.5);
    // Header separator
    guideLines.moveTo(20, 160);
    guideLines.lineTo(viewWidth - 20, 160);
    // Dice area separator
    guideLines.moveTo(20, 500);
    guideLines.lineTo(viewWidth - 20, 500);
    combatView.addChild(guideLines);
    
    // Create semi-transparent overlay for the rest of the screen (outside combat view)
    const overlayBg = new PIXI.Graphics();
    overlayBg.beginFill(0x000000, 0.85);
    overlayBg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    overlayBg.endFill();
    overlayBg.eventMode = 'static';
    this.container.addChildAt(overlayBg, 0);
    
    // Mask out the combat view area from the overlay
    const maskGraphics = new PIXI.Graphics();
    maskGraphics.beginFill(0xffffff);
    maskGraphics.drawRoundedRect(
      this.config.positionX, 
      this.config.positionY, 
      viewWidth * this.config.scale, 
      viewHeight * this.config.scale, 
      15 * this.config.scale
    );
    maskGraphics.endFill();
    
    // Create a hole in the overlay where the combat view is
    const viewBounds = new PIXI.Graphics();
    viewBounds.beginFill(0x000000, 0);
    viewBounds.lineStyle(3, 0xffd700, 0.8);
    viewBounds.drawRoundedRect(0, 0, viewWidth, viewHeight, 15);
    viewBounds.endFill();
    combatView.addChild(viewBounds);

    // Center coordinates within the combat view
    const centerX = viewWidth / 2;
    const centerY = viewHeight / 2;
    
    // Create column headers with icons above dice columns
    this.createColumnHeaders(centerX, centerY, attackerName, defenderName, combatResult, playerColors, combatView);
  }


  
  /**
   * Get German display name for troop type
   */
  private getTroopDisplayName(troopType: string): string {
    switch (troopType) {
      case 'cavalry': return 'Kavallerie';
      case 'archer': return 'Bogenschütze';
      case 'infantry': return 'Infanterie';
      default: return troopType;
    }
  }

  /**
   * Create column headers with icons directly above dice columns
   */
  private createColumnHeaders(
    centerX: number,
    centerY: number,
    attackerName: string,
    defenderName: string,
    combatResult: CombatResult,
    playerColors: PlayerColors,
    parentContainer: PIXI.Container
  ): void {
    const attackerRolls = combatResult.attackerRolls;
    const defenderRolls = combatResult.defenderRolls;
    const maxDice = Math.max(attackerRolls.length, defenderRolls.length);

    if (maxDice === 0) {
      this.showResults(combatResult, centerX, centerY + 100, playerColors, parentContainer);
      return;
    }

    // Helper to get troop info
    const parseTroopInfo = (name: string): { isKing: boolean; troopType: string } => {
      let isKing = false;
      let troopName = name;
      
      if (name.startsWith('König ')) {
        isKing = true;
        troopName = name.substring(6);
      }
      
      let troopType = 'infantry';
      if (troopName.includes('Kavallerie')) troopType = 'cavalry';
      else if (troopName.includes('Bogenschütze')) troopType = 'archer';
      
      return { isKing, troopType };
    };
    
    const attackerInfo = { ...parseTroopInfo(attackerName), troopType: combatResult.attackerType };
    const defenderInfo = { ...parseTroopInfo(defenderName), troopType: combatResult.defenderType };
    
    // Calculate header Y position (above the first dice row) - more space for crown
    const headerY = 65; // Slightly higher to make room
    const diceXSpacing = this.config.pairSpacing;
    const attackerX = centerX - diceXSpacing / 2;
    const defenderX = centerX + diceXSpacing / 2;

    const headersContainer = new PIXI.Container();

    // Attacker column header
    const attackerHeader = new PIXI.Container();
    attackerHeader.position.set(attackerX, headerY);

    // Icon background with player color and gray border - positioned ABOVE label
    const attackerIconBg = new PIXI.Graphics();
    attackerIconBg.beginFill(playerColors.attackerColor, 0.7); // Stronger color visibility
    attackerIconBg.lineStyle(2, 0x888888, 1); // Gray border
    attackerIconBg.drawRoundedRect(-26, -56, 52, 52, 12);
    attackerIconBg.endFill();
    attackerHeader.addChild(attackerIconBg);

    // Icon
    const attackerIcon = new PIXI.Text('⚔️', { fontSize: 28 });
    attackerIcon.anchor.set(0.5);
    attackerIcon.position.set(0, -30);
    attackerHeader.addChild(attackerIcon);

    // Label - positioned BELOW icon
    const attackerLabel = new PIXI.Text('ANGREIFER', {
      fontFamily: 'Arial',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0xaaaaaa,
      letterSpacing: 1,
    });
    attackerLabel.anchor.set(0.5);
    attackerLabel.position.set(0, 8);
    attackerHeader.addChild(attackerLabel);

    // Troop badge
    const attTroopColor = TROOP_COLORS[attackerInfo.troopType as keyof typeof TROOP_COLORS];
    const attTroopBadge = new PIXI.Graphics();
    attTroopBadge.beginFill(attTroopColor, 0.3);
    attTroopBadge.lineStyle(1, attTroopColor, 0.6);
    attTroopBadge.drawRoundedRect(-48, -12, 96, 24, 12);
    attTroopBadge.endFill();
    attTroopBadge.position.set(0, 32);
    attackerHeader.addChild(attTroopBadge);

    const attTroopText = new PIXI.Text(this.getTroopDisplayName(attackerInfo.troopType), {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fill: attTroopColor,
    });
    attTroopText.anchor.set(0.5);
    attTroopText.position.set(0, 32);
    attackerHeader.addChild(attTroopText);

    headersContainer.addChild(attackerHeader);

    // Defender column header
    const defenderHeader = new PIXI.Container();
    defenderHeader.position.set(defenderX, headerY);

    // Icon background with player color and gray border - positioned ABOVE label
    const defenderIconBg = new PIXI.Graphics();
    defenderIconBg.beginFill(playerColors.defenderColor, 0.7); // Stronger color visibility
    defenderIconBg.lineStyle(2, 0x888888, 1); // Gray border
    defenderIconBg.drawRoundedRect(-26, -56, 52, 52, 12);
    defenderIconBg.endFill();
    defenderHeader.addChild(defenderIconBg);

    // Icon
    const defenderIcon = new PIXI.Text('🛡️', { fontSize: 28 });
    defenderIcon.anchor.set(0.5);
    defenderIcon.position.set(0, -30);
    defenderHeader.addChild(defenderIcon);

    // Label - positioned BELOW icon
    const defenderLabel = new PIXI.Text('VERTEIDIGER', {
      fontFamily: 'Arial',
      fontSize: 13,
      fontWeight: 'bold',
      fill: 0xaaaaaa,
      letterSpacing: 1,
    });
    defenderLabel.anchor.set(0.5);
    defenderLabel.position.set(0, 8);
    defenderHeader.addChild(defenderLabel);

    // Troop badge
    const defTroopColor = TROOP_COLORS[defenderInfo.troopType as keyof typeof TROOP_COLORS];
    const defTroopBadge = new PIXI.Graphics();
    defTroopBadge.beginFill(defTroopColor, 0.3);
    defTroopBadge.lineStyle(1, defTroopColor, 0.6);
    defTroopBadge.drawRoundedRect(-48, -12, 96, 24, 12);
    defTroopBadge.endFill();
    defTroopBadge.position.set(0, 32);
    defenderHeader.addChild(defTroopBadge);

    const defTroopText = new PIXI.Text(this.getTroopDisplayName(defenderInfo.troopType), {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fill: defTroopColor,
    });
    defTroopText.anchor.set(0.5);
    defTroopText.position.set(0, 32);
    defenderHeader.addChild(defTroopText);
    
    headersContainer.addChild(defenderHeader);
    
    parentContainer.addChild(headersContainer);
    
    // Create all UI elements and dice
    this.createDiceUI(centerX, centerY, combatResult, playerColors, parentContainer);
  }

  /**
   * Create the complete dice UI and start rolling animation
   * Shows ALL dice from both sides, even if one has more than the other
   */
  private createDiceUI(
    centerX: number,
    centerY: number,
    combatResult: CombatResult,
    playerColors: PlayerColors,
    parentContainer: PIXI.Container
  ): void {
    const attackerRolls = combatResult.attackerRolls;
    const defenderRolls = combatResult.defenderRolls;
    const maxDice = Math.max(attackerRolls.length, defenderRolls.length);

    if (maxDice === 0) {
      this.showResults(combatResult, centerX, centerY + 100, playerColors, parentContainer);
      return;
    }

    // Row settings - fixed positions for clear layout
    const rowHeight = 110;
    const diceXSpacing = this.config.pairSpacing;

    // Fixed starting Y position (more space for crown above dice)
    const firstRowY = 170;
    
    // Create rows container
    const rowsContainer = new PIXI.Container();
    this.diceRows = [];
    
    for (let i = 0; i < maxDice; i++) {
      const rowY = firstRowY + i * rowHeight;
      const attackerDiceX = centerX - diceXSpacing / 2;
      const defenderDiceX = centerX + diceXSpacing / 2;
      
      // Get rolls for this row (if available)
      const attackerRoll = attackerRolls[i];
      const defenderRoll = defenderRolls[i];
      const hasPair = attackerRoll && defenderRoll;
      
      // Create containers for attacker and defender dice
      const attackerDice = new PIXI.Container();
      attackerDice.position.set(attackerDiceX, rowY);
      
      const defenderDice = new PIXI.Container();
      defenderDice.position.set(defenderDiceX, rowY);
      
      // Add initial dice graphics (only if roll exists)
      if (attackerRoll) {
        this.updateDiceDisplay(attackerDice, 1, playerColors.attackerColor, false, 0, false);
        rowsContainer.addChild(attackerDice);
      }
      
      if (defenderRoll) {
        this.updateDiceDisplay(defenderDice, 1, playerColors.defenderColor, false, 0, false);
        rowsContainer.addChild(defenderDice);
      }
      
      // VS label only (no results yet - they appear after rolling)
      if (hasPair) {
        const vsContainer = new PIXI.Container();
        vsContainer.position.set(centerX, rowY);
        
        // VS label only - results will be added in showFinalElements
        const vsText = new PIXI.Text('VS', {
          fontFamily: 'Arial',
          fontSize: 16,
          fontWeight: 'bold',
          fill: 0x666666,
        });
        vsText.anchor.set(0.5);
        vsText.position.set(0, 0);
        vsContainer.addChild(vsText);
        
        // Store reference to add results later
        vsContainer.name = `vsContainer_${i}`;
        
        rowsContainer.addChild(vsContainer);
      }
      
      this.diceRows.push({
        attackerDice,
        defenderDice,
        attackerRoll: attackerRoll ?? null,
        defenderRoll: defenderRoll ?? null,
        rowY,
      });
    }
    
    parentContainer.addChild(rowsContainer);
    
    // Start rolling animation
    this.animateRolling(playerColors, combatResult, centerX, centerY, parentContainer);
  }

  /**
   * Update dice display with value and optional badges
   */
  private updateDiceDisplay(
    container: PIXI.Container,
    value: number,
    playerColor: number,
    showBonus: boolean,
    bonusValue: number,
    hasKingBonus: boolean
  ): void {
    this.destroyChildren(container);
    
    // Create the dice
    const dice = this.diceRenderer.createDice(value, playerColor);
    container.addChild(dice);
    
    // Add king crown ABOVE dice (centered, same height as bonus badge)
    if (hasKingBonus) {
      const crown = new PIXI.Text('👑', { fontSize: 18 });
      crown.anchor.set(0.5);
      crown.position.set(-this.config.diceSize / 2 + 12, -this.config.diceSize / 2 - 8);
      container.addChild(crown);
    }
    
    // Add bonus badge on RIGHT side (always show during rolling and after)
    if (bonusValue > 0) {
      const badge = this.createBonusBadge(bonusValue);
      badge.position.set(this.config.diceSize / 2 - 2, -this.config.diceSize / 2 - 8);
      container.addChild(badge);
    }
  }

  /**
   * Create a bonus badge (without crown)
   */
  private createBonusBadge(bonusValue: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // Badge background
    const badgeBg = new PIXI.Graphics();
    badgeBg.beginFill(0xffd700);
    badgeBg.lineStyle(1, 0xffaa00, 1);
    badgeBg.drawRoundedRect(-15, -10, 30, 20, 10);
    badgeBg.endFill();
    
    // Highlight
    const badgeHighlight = new PIXI.Graphics();
    badgeHighlight.beginFill(0xffec8b, 0.6);
    badgeHighlight.drawRoundedRect(-13, -8, 26, 8, 6);
    badgeHighlight.endFill();
    
    // Text - just the number, no crown
    const badgeText = new PIXI.Text(`+${bonusValue}`, {
      fontFamily: 'Arial',
      fontSize: 10,
      fontWeight: 'bold',
      fill: 0x000000,
    });
    badgeText.anchor.set(0.5);
    
    container.addChild(badgeBg);
    container.addChild(badgeHighlight);
    container.addChild(badgeText);
    
    return container;
  }

  /**
   * Animate dice rolling
   */
  private animateRolling(
    playerColors: PlayerColors,
    combatResult: CombatResult,
    centerX: number,
    centerY: number,
    parentContainer: PIXI.Container
  ): void {
    let rollCount = 0;
    const maxRolls = this.config.animationDuration / this.config.rollInterval;
    
    // Clear any existing intervals first
    if (this.rollIntervalId) {
      clearInterval(this.rollIntervalId);
    }
    if (this.resultTimeoutId) {
      clearTimeout(this.resultTimeoutId);
    }
    
    this.rollIntervalId = window.setInterval(() => {
      rollCount++;
      
      // Update all dice with random values during roll
      this.diceRows.forEach(({ attackerDice, defenderDice, attackerRoll, defenderRoll }) => {
        // Only animate attacker dice if it exists
        if (attackerRoll) {
          const attRandom = Math.floor(Math.random() * 6) + 1;
          this.updateDiceDisplay(attackerDice, attRandom, playerColors.attackerColor, false, 0, false);
        }
        // Only animate defender dice if it exists
        if (defenderRoll) {
          const defRandom = Math.floor(Math.random() * 6) + 1;
          this.updateDiceDisplay(defenderDice, defRandom, playerColors.defenderColor, false, 0, false);
        }
      });
      
      // Show final values
      if (rollCount >= maxRolls) {
        if (this.rollIntervalId) {
          clearInterval(this.rollIntervalId);
          this.rollIntervalId = undefined;
        }
        
        // Show final dice values
        this.diceRows.forEach(({ attackerDice, defenderDice, attackerRoll, defenderRoll }) => {
          // Only update attacker dice if it exists
          if (attackerRoll) {
            const hasAttKing = attackerRoll.kingBonus > 0;
            this.updateDiceDisplay(
              attackerDice,
              attackerRoll.naturalValue,
              playerColors.attackerColor,
              false,
              0,
              hasAttKing
            );
          }
          // Only update defender dice if it exists
          if (defenderRoll) {
            const hasDefKing = defenderRoll.kingBonus > 0;
            this.updateDiceDisplay(
              defenderDice,
              defenderRoll.naturalValue,
              playerColors.defenderColor,
              false,
              0,
              hasDefKing
            );
          }
        });
        
        // After a short delay, show results (bonus badges and loss markers)
        this.resultTimeoutId = window.setTimeout(() => {
          this.resultTimeoutId = undefined;
          this.showFinalElements(playerColors, parentContainer, combatResult);
          // Position losses BELOW dice with clear separation
          const maxDice = Math.max(combatResult.attackerRolls.length, combatResult.defenderRolls.length);
          const rowHeight = 88;
          const firstRowY = 150;
          // Position Verluste deutlich unter den Würfeln
          const lastDiceBottom = firstRowY + ((maxDice - 1) * rowHeight) + 55;
          const lossesY = lastDiceBottom + 80; // 80px Abstand zu den Würfeln
          this.showResults(combatResult, centerX, lossesY, playerColors, parentContainer);
        }, this.config.resultDelay);
      }
    }, this.config.rollInterval);
  }

  /**
   * Show final elements: bonus badges, loss markers, and VS results
   * Würfel stay visible, only add these elements
   */
  private showFinalElements(playerColors: PlayerColors, parentContainer: PIXI.Container, combatResult: CombatResult): void {
    this.diceRows.forEach(({ attackerDice, defenderDice, attackerRoll, defenderRoll }, index) => {
      // Check if this is a complete pair (both sides have dice)
      const hasPair = attackerRoll && defenderRoll;
      
      // Update attacker dice with bonus badge (if exists)
      if (attackerRoll) {
        const hasAttKing = attackerRoll.kingBonus > 0;
        this.updateDiceDisplay(
          attackerDice,
          attackerRoll.naturalValue,
          playerColors.attackerColor,
          true, // show bonus
          attackerRoll.bonusPoints + attackerRoll.kingBonus,
          hasAttKing
        );
      }
      
      // Update defender dice with bonus badge (if exists)
      if (defenderRoll) {
        const hasDefKing = defenderRoll.kingBonus > 0;
        this.updateDiceDisplay(
          defenderDice,
          defenderRoll.naturalValue,
          playerColors.defenderColor,
          true, // show bonus
          defenderRoll.bonusPoints + defenderRoll.kingBonus,
          hasDefKing
        );
      }
      
        // Add VS results and loss markers only if both dice exist
      if (hasPair) {
        const attackerTotal = attackerRoll.effectiveValue;
        const defenderTotal = defenderRoll.effectiveValue;
        const attackerWins = combatResult.pairs[index]?.attackerWins ?? false;
        
        // Find VS container and add results
        const vsContainer = parentContainer.getChildByName(
          `vsContainer_${index}`,
          true,
        ) as PIXI.Container | null;
        
        if (vsContainer) {
          // Clear VS container and rebuild with results
          this.destroyChildren(vsContainer);
          
          // Format: 🎲 Zahl vs Zahl 🎲
          
          // Attacker dice icon
          const attDiceIcon = new PIXI.Text('🎲', {
            fontFamily: 'Arial',
            fontSize: 18,
          });
          attDiceIcon.anchor.set(0.5);
          attDiceIcon.position.set(-55, 0);
          vsContainer.addChild(attDiceIcon);
          
          // Attacker result number
          const attResultText = new PIXI.Text(attackerTotal.toString(), {
            fontFamily: 'Arial',
            fontSize: 22,
            fontWeight: 'bold',
            fill: attackerWins ? 0x2ecc71 : 0xe74c3c, // Green if wins, red if loses
            stroke: 0x000000,
            strokeThickness: 4,
          });
          attResultText.anchor.set(0.5);
          attResultText.position.set(-28, 0);
          vsContainer.addChild(attResultText);
          
          // VS label
          const vsText = new PIXI.Text('VS', {
            fontFamily: 'Arial',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0x666666,
          });
          vsText.anchor.set(0.5);
          vsText.position.set(0, 0);
          vsContainer.addChild(vsText);
          
          // Defender result number
          const defResultText = new PIXI.Text(defenderTotal.toString(), {
            fontFamily: 'Arial',
            fontSize: 22,
            fontWeight: 'bold',
            fill: !attackerWins ? 0x2ecc71 : 0xe74c3c, // Green if wins, red if loses
            stroke: 0x000000,
            strokeThickness: 4,
          });
          defResultText.anchor.set(0.5);
          defResultText.position.set(28, 0);
          vsContainer.addChild(defResultText);
          
          // Defender dice icon
          const defDiceIcon = new PIXI.Text('🎲', {
            fontFamily: 'Arial',
            fontSize: 18,
          });
          defDiceIcon.anchor.set(0.5);
          defDiceIcon.position.set(55, 0);
          vsContainer.addChild(defDiceIcon);
        }

        // Only show loss markers if there are actual casualties for this specific unit
        // This handles archers not showing losses on ranged attacks
        if (!attackerWins) {
          // Check if this specific attacker unit actually has a casualty
          const hasAttackerCasualty = combatResult.attackerCasualties.includes(attackerRoll.unitId);
          if (hasAttackerCasualty) {
            // Attacker loses this unit - show marker
            const lossMarker = new PIXI.Text('❌', {
              fontFamily: 'Arial',
              fontSize: 28,
              fontWeight: 'bold',
            });
            lossMarker.anchor.set(0.5);
            lossMarker.position.set(this.config.diceSize / 2 + 22, 0);
            attackerDice.addChild(lossMarker);
          }
        } else {
          // Check if this specific defender unit actually has a casualty
          const hasDefenderCasualty = combatResult.defenderCasualties.includes(defenderRoll.unitId);
          if (hasDefenderCasualty) {
            // Defender loses this unit - show marker
            const lossMarker = new PIXI.Text('❌', {
              fontFamily: 'Arial',
              fontSize: 28,
              fontWeight: 'bold',
            });
            lossMarker.anchor.set(0.5);
            lossMarker.position.set(-this.config.diceSize / 2 - 22, 0);
            defenderDice.addChild(lossMarker);
          }
        }
      }
    });
  }

  /**
   * Show combat results at bottom
   */
  private showResults(
    combatResult: CombatResult,
    centerX: number,
    startY: number,
    playerColors: PlayerColors,
    parentContainer: PIXI.Container
  ): void {
    const attackerLosses = combatResult.attackerCasualties.length;
    const defenderLosses = combatResult.defenderCasualties.length;
    const viewHeight = 900;

    // Casualties row - badges at bottom
    const casualtiesY = startY + 20;
    const casualtiesContainer = new PIXI.Container();
    casualtiesContainer.position.set(centerX, casualtiesY);

    // Calculate max scale for both sides to keep them balanced
    const maxAttScale = attackerLosses > 0 ? Math.min(2.5, 1.4 + (attackerLosses * 0.4)) : 1;
    const maxDefScale = defenderLosses > 0 ? Math.min(2.5, 1.4 + (defenderLosses * 0.4)) : 1;
    
    // Attacker casualties with scaled skull - NO border/frame, only skull and number
    // Format: 💀 Zahl vs ...
    if (attackerLosses > 0) {
      const skullScale = maxAttScale;
      
      // Scaled skull - left side
      const skull = new PIXI.Text('💀', {
        fontFamily: 'Arial',
        fontSize: 32 * skullScale,
      });
      skull.anchor.set(0.5);
      skull.position.set(-120, 0);
      casualtiesContainer.addChild(skull);
      
      // Number only (no "Verluste" text)
      const attCasualtyText = new PIXI.Text(`${attackerLosses}`, {
        fontFamily: 'Arial',
        fontSize: 26 * skullScale,
        fontWeight: 'bold',
        fill: 0xe74c3c,
      });
      attCasualtyText.anchor.set(0.5);
      attCasualtyText.position.set(-70, 0);
      casualtiesContainer.addChild(attCasualtyText);
    }

    // Defender casualties with scaled skull - NO border/frame, only skull and number
    // Format: ... vs Zahl 💀
    if (defenderLosses > 0) {
      const skullScale = maxDefScale;
      
      // Number first (no "Verluste" text)
      const defCasualtyText = new PIXI.Text(`${defenderLosses}`, {
        fontFamily: 'Arial',
        fontSize: 26 * skullScale,
        fontWeight: 'bold',
        fill: 0xe74c3c,
      });
      defCasualtyText.anchor.set(0.5);
      defCasualtyText.position.set(70, 0);
      casualtiesContainer.addChild(defCasualtyText);
      
      // Scaled skull - right side
      const skull = new PIXI.Text('💀', {
        fontFamily: 'Arial',
        fontSize: 32 * skullScale,
      });
      skull.anchor.set(0.5);
      skull.position.set(120, 0);
      casualtiesContainer.addChild(skull);
    }

    parentContainer.addChild(casualtiesContainer);

    // Click to continue hint
    const hint = new PIXI.Text('KLICKEN ZUM FORTFAHREN', {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: 0x000000,
      strokeThickness: 3,
    });
    hint.anchor.set(0.5);
    hint.position.set(centerX, viewHeight - 50);
    hint.alpha = 0;
    parentContainer.addChild(hint);

    // Fade in hint
    let hintAlpha = 0;
    const fadeInHint = () => {
      hintAlpha += 0.05;
      hint.alpha = hintAlpha;
      if (hintAlpha < 1) {
        this.hintAnimationFrameId = requestAnimationFrame(fadeInHint);
      }
    };
    fadeInHint();

    // Make clickable
    this.container.eventMode = 'static';
    this.container.hitArea = new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    this.container.cursor = 'pointer';
    this.container.once('pointerdown', () => this.close());
  }

  /**
   * Close the animation - comprehensive cleanup to prevent memory leaks
   */
  close(notifyComplete = true): void {
    if (!this.isPlaying && this.diceRows.length === 0) return;

    this.isPlaying = false;
    
    // Clear all intervals and timeouts
    if (this.rollIntervalId) {
      clearInterval(this.rollIntervalId);
      this.rollIntervalId = undefined;
    }
    if (this.resultTimeoutId) {
      clearTimeout(this.resultTimeoutId);
      this.resultTimeoutId = undefined;
    }
    if (this.hintAnimationFrameId) {
      cancelAnimationFrame(this.hintAnimationFrameId);
      this.hintAnimationFrameId = undefined;
    }
    
    // Remove all event listeners
    this.container.eventMode = 'none';
    this.container.hitArea = null;
    this.container.cursor = 'default';
    this.container.removeAllListeners();
    
    // Dice rows belong to the overlay tree. Destroy recursively before dropping references.
    this.destroyChildren(this.container);
    this.diceRows = [];
    
    // Hide container
    this.container.visible = false;

    // Clear callback
    const callback = this.onCompleteCallback;
    this.onCompleteCallback = undefined;
    if (notifyComplete) callback?.();
  }

  /**
   * Check if animation is currently playing
   */
  isAnimating(): boolean {
    return this.isPlaying;
  }

  private destroyChildren(container: PIXI.Container): void {
    for (const child of container.removeChildren()) child.destroy({ children: true });
  }

  /**
   * Dispose animation resources - complete cleanup
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.close(false);
    if (this.container && !this.container.destroyed) {
      this.container.destroy({ children: true });
    }
  }
}
