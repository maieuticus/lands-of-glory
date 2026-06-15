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
import { CombatResult, DieRoll, PairResult } from '@lands-of-glory/game-core';
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
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CombatAnimationConfig = {
  diceSize: 55,
  diceSpacing: 20,
  pairSpacing: 200,
  animationDuration: 800,
  rollInterval: 80,
  resultDelay: 400,
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
   * Play combat animation
   */
  play(
    combatResult: CombatResult,
    attackerName: string,
    defenderName: string,
    attackerColor: number,
    defenderColor: number,
    onComplete?: () => void
  ): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.onCompleteCallback = onComplete;
    this.diceRows = [];

    // Unit info panel ausblenden
    const unitInfoPanel = document.getElementById('unit-info-panel');
    if (unitInfoPanel) {
      unitInfoPanel.style.display = 'none';
    }
    
    const playerColors: PlayerColors = {
      attackerColor,
      defenderColor,
    };
    
    // Clear previous animation
    this.container.removeChildren();
    this.container.visible = true;
    
    // Create semi-transparent background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.endFill();
    bg.eventMode = 'static';
    this.container.addChild(bg);

    // Center the animation
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    
    // Create title
    const title = new PIXI.Text('⚔️ KAMPF ⚔️', {
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: 0x000000,
      strokeThickness: 4,
    });
    title.anchor.set(0.5);
    title.position.set(centerX, 50);
    this.container.addChild(title);

    // Create player labels (visible throughout)
    this.createPlayerLabels(centerX, 110, attackerName, defenderName, playerColors);

    // Create all UI elements and dice (visible throughout)
    this.createDiceUI(centerX, centerY, combatResult, playerColors);
  }

  /**
   * Create player badges like in dice-visual-demo.html
   */
  private createPlayerLabels(
    centerX: number,
    y: number,
    attackerName: string,
    defenderName: string,
    playerColors: PlayerColors
  ): void {
    const container = new PIXI.Container();
    
    // Helper to get troop type and color from name
    const parseTroopInfo = (name: string): { isKing: boolean; troopType: string; troopColor: number } => {
      let isKing = false;
      let troopName = name;
      
      if (name.startsWith('König ')) {
        isKing = true;
        troopName = name.substring(6);
      }
      
      let troopColor = TROOP_COLORS.infantry;
      let troopType = 'infantry';
      
      if (troopName.includes('Kavallerie')) {
        troopColor = TROOP_COLORS.cavalry;
        troopType = 'cavalry';
      } else if (troopName.includes('Bogenschütze')) {
        troopColor = TROOP_COLORS.archer;
        troopType = 'archer';
      }
      
      return { isKing, troopType, troopColor };
    };
    
    const attackerInfo = parseTroopInfo(attackerName);
    const defenderInfo = parseTroopInfo(defenderName);
    
    // ===== ATTACKER BADGE (left side) =====
    const attackerContainer = new PIXI.Container();
    attackerContainer.position.set(-160, 0);
    
    // Attacker color box with icon
    const attackerBox = new PIXI.Graphics();
    attackerBox.beginFill(0xffffff);
    attackerBox.lineStyle(2, 0xcccccc, 1);
    attackerBox.drawRoundedRect(-18, -18, 36, 36, 8);
    attackerBox.endFill();
    attackerContainer.addChild(attackerBox);
    
    const attackerIcon = new PIXI.Text('⚔️', { fontSize: 18 });
    attackerIcon.anchor.set(0.5);
    attackerContainer.addChild(attackerIcon);
    
    const attackerRoleLabel = new PIXI.Text('ANGREIFER', {
      fontFamily: 'Arial',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0xaaaaaa,
      letterSpacing: 1,
    });
    attackerRoleLabel.anchor.set(0.5);
    attackerRoleLabel.position.set(0, 32);
    attackerContainer.addChild(attackerRoleLabel);
    
    const attTroopBadge = new PIXI.Graphics();
    attTroopBadge.beginFill(attackerInfo.troopColor, 0.3);
    attTroopBadge.lineStyle(1, attackerInfo.troopColor, 0.6);
    attTroopBadge.drawRoundedRect(-35, -10, 70, 20, 10);
    attTroopBadge.endFill();
    attTroopBadge.position.set(0, 50);
    attackerContainer.addChild(attTroopBadge);
    
    const attTroopText = new PIXI.Text(this.getTroopDisplayName(attackerInfo.troopType), {
      fontFamily: 'Arial',
      fontSize: 10,
      fontWeight: 'bold',
      fill: attackerInfo.troopColor,
    });
    attTroopText.anchor.set(0.5);
    attTroopText.position.set(0, 50);
    attackerContainer.addChild(attTroopText);
    
    container.addChild(attackerContainer);

    // ===== VS LABEL (center) =====
    const vsLabel = new PIXI.Text('VS', {
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: 0x000000,
      strokeThickness: 2,
    });
    vsLabel.anchor.set(0.5);
    vsLabel.position.set(0, -5);
    container.addChild(vsLabel);

    // ===== DEFENDER BADGE (right side) =====
    const defenderContainer = new PIXI.Container();
    defenderContainer.position.set(160, 0);
    
    const defenderBox = new PIXI.Graphics();
    defenderBox.beginFill(0x2a2a2a);
    defenderBox.lineStyle(2, 0x555555, 1);
    defenderBox.drawRoundedRect(-18, -18, 36, 36, 8);
    defenderBox.endFill();
    defenderContainer.addChild(defenderBox);
    
    const defenderIcon = new PIXI.Text('🛡️', { fontSize: 18 });
    defenderIcon.anchor.set(0.5);
    defenderContainer.addChild(defenderIcon);
    
    const defenderRoleLabel = new PIXI.Text('VERTEIDIGER', {
      fontFamily: 'Arial',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0xaaaaaa,
      letterSpacing: 1,
    });
    defenderRoleLabel.anchor.set(0.5);
    defenderRoleLabel.position.set(0, 32);
    defenderContainer.addChild(defenderRoleLabel);
    
    const defTroopBadge = new PIXI.Graphics();
    defTroopBadge.beginFill(defenderInfo.troopColor, 0.3);
    defTroopBadge.lineStyle(1, defenderInfo.troopColor, 0.6);
    defTroopBadge.drawRoundedRect(-35, -10, 70, 20, 10);
    defTroopBadge.endFill();
    defTroopBadge.position.set(0, 50);
    defenderContainer.addChild(defTroopBadge);
    
    const defTroopText = new PIXI.Text(this.getTroopDisplayName(defenderInfo.troopType), {
      fontFamily: 'Arial',
      fontSize: 10,
      fontWeight: 'bold',
      fill: defenderInfo.troopColor,
    });
    defTroopText.anchor.set(0.5);
    defTroopText.position.set(0, 50);
    defenderContainer.addChild(defTroopText);
    
    container.addChild(defenderContainer);

    container.position.set(centerX, y);
    this.container.addChild(container);
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
   * Create the complete dice UI and start rolling animation
   * Shows ALL dice from both sides, even if one has more than the other
   */
  private createDiceUI(
    centerX: number,
    centerY: number,
    combatResult: CombatResult,
    playerColors: PlayerColors
  ): void {
    const attackerRolls = combatResult.attackerRolls;
    const defenderRolls = combatResult.defenderRolls;
    const maxDice = Math.max(attackerRolls.length, defenderRolls.length);
    
    if (maxDice === 0) {
      this.showResults(combatResult, centerX, centerY + 100, playerColors);
      return;
    }
    
    // Row settings - increased height to accommodate loss markers below dice
    const rowHeight = 90;
    const diceXSpacing = this.config.pairSpacing;
    
    // Calculate positions
    const totalHeight = maxDice * rowHeight;
    const firstRowY = centerY - totalHeight / 2 + rowHeight / 2;
    
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
      
      // VS label only if both sides have dice in this row
      if (hasPair) {
        const vsText = new PIXI.Text('VS', {
          fontFamily: 'Arial',
          fontSize: 14,
          fontWeight: 'bold',
          fill: 0x666666,
        });
        vsText.anchor.set(0.5);
        vsText.position.set(centerX, rowY);
        rowsContainer.addChild(vsText);
      }
      
      this.diceRows.push({
        attackerDice,
        defenderDice,
        attackerRoll: attackerRoll || null as any,
        defenderRoll: defenderRoll || null as any,
        rowY,
      });
    }
    
    this.container.addChild(rowsContainer);
    
    // Start rolling animation
    this.animateRolling(playerColors, combatResult, centerX, centerY);
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
    container.removeChildren();
    
    // Create the dice
    const dice = this.diceRenderer.createDice(value, playerColor);
    container.addChild(dice);
    
    // Add bonus badge if needed
    if (showBonus && bonusValue > 0) {
      const badge = this.createBonusBadge(bonusValue, hasKingBonus);
      badge.position.set(this.config.diceSize / 2 - 5, -this.config.diceSize / 2 + 5);
      container.addChild(badge);
    }
    
    // Add king crown if needed
    if (hasKingBonus) {
      const crown = new PIXI.Text('👑', { fontSize: 14 });
      crown.anchor.set(0.5);
      crown.position.set(0, -this.config.diceSize / 2 - 12);
      container.addChild(crown);
    }
  }

  /**
   * Create a bonus badge
   */
  private createBonusBadge(bonusValue: number, hasKing: boolean): PIXI.Container {
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
    
    // Text
    let text = `+${bonusValue}`;
    if (hasKing) {
      text = `+${bonusValue}👑`;
    }
    
    const badgeText = new PIXI.Text(text, {
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
    centerY: number
  ): void {
    let rollCount = 0;
    const maxRolls = this.config.animationDuration / this.config.rollInterval;
    
    const rollInterval = setInterval(() => {
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
        clearInterval(rollInterval);
        
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
        setTimeout(() => {
          this.showFinalElements(playerColors);
          this.showResults(combatResult, centerX, centerY + 140, playerColors);
        }, this.config.resultDelay);
      }
    }, this.config.rollInterval);
  }

  /**
   * Show final elements: bonus badges and loss markers
   * Würfel stay visible, only add these elements
   */
  private showFinalElements(playerColors: PlayerColors): void {
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
      
      // Add loss marker for loser only if both dice exist (it's a pair comparison)
      if (hasPair) {
        const attackerTotal = attackerRoll.effectiveValue;
        const defenderTotal = defenderRoll.effectiveValue;
        const attackerWins = attackerTotal > defenderTotal;
        
        if (!attackerWins) {
          // Attacker loses
          const lossMarker = new PIXI.Text('❌', {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
          });
          lossMarker.anchor.set(0.5);
          lossMarker.position.set(0, this.config.diceSize / 2 + 15);
          attackerDice.addChild(lossMarker);
        } else {
          // Defender loses
          const lossMarker = new PIXI.Text('❌', {
            fontFamily: 'Arial',
            fontSize: 20,
            fontWeight: 'bold',
          });
          lossMarker.anchor.set(0.5);
          lossMarker.position.set(0, this.config.diceSize / 2 + 15);
          defenderDice.addChild(lossMarker);
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
    playerColors: PlayerColors
  ): void {
    const attackerLosses = combatResult.attackerCasualties.length;
    const defenderLosses = combatResult.defenderCasualties.length;
    
    // Casualties row - positioned higher to avoid overlap
    const casualtiesY = startY;
    const casualtiesContainer = new PIXI.Container();
    casualtiesContainer.position.set(centerX, casualtiesY);
    
    // Attacker casualties
    if (attackerLosses > 0) {
      const attCasualtyBox = new PIXI.Graphics();
      attCasualtyBox.beginFill(0xe74c3c, 0.15);
      attCasualtyBox.lineStyle(1, 0xe74c3c, 0.3);
      attCasualtyBox.drawRoundedRect(-70, -15, 140, 30, 8);
      attCasualtyBox.endFill();
      attCasualtyBox.position.set(-80, 0);
      casualtiesContainer.addChild(attCasualtyBox);
      
      const attCasualtyText = new PIXI.Text(`💀 ${attackerLosses} Verluste`, {
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xe74c3c,
      });
      attCasualtyText.anchor.set(0.5);
      attCasualtyText.position.set(-80, 0);
      casualtiesContainer.addChild(attCasualtyText);
    }
    
    // Defender casualties
    if (defenderLosses > 0) {
      const defCasualtyBox = new PIXI.Graphics();
      defCasualtyBox.beginFill(0xe74c3c, 0.15);
      defCasualtyBox.lineStyle(1, 0xe74c3c, 0.3);
      defCasualtyBox.drawRoundedRect(-70, -15, 140, 30, 8);
      defCasualtyBox.endFill();
      defCasualtyBox.position.set(80, 0);
      casualtiesContainer.addChild(defCasualtyBox);
      
      const defCasualtyText = new PIXI.Text(`💀 ${defenderLosses} Verluste`, {
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xe74c3c,
      });
      defCasualtyText.anchor.set(0.5);
      defCasualtyText.position.set(80, 0);
      casualtiesContainer.addChild(defCasualtyText);
    }
    
    this.container.addChild(casualtiesContainer);

    // Click to continue hint
    const hint = new PIXI.Text('KLICKEN ZUM FORTFAHREN', {
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: 0x000000,
      strokeThickness: 2,
    });
    hint.anchor.set(0.5);
    hint.position.set(centerX, this.app.screen.height - 50);
    hint.alpha = 0;
    this.container.addChild(hint);

    // Fade in hint
    let hintAlpha = 0;
    const fadeInHint = () => {
      hintAlpha += 0.05;
      hint.alpha = hintAlpha;
      if (hintAlpha < 1) {
        requestAnimationFrame(fadeInHint);
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
   * Close the animation
   */
  close(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.container.visible = false;
    this.container.removeChildren();
    this.diceRows = [];

    // Unit info panel wieder anzeigen
    const unitInfoPanel = document.getElementById('unit-info-panel');
    if (unitInfoPanel) {
      unitInfoPanel.style.display = 'block';
    }

    if (this.onCompleteCallback) {
      this.onCompleteCallback();
      this.onCompleteCallback = undefined;
    }
  }

  /**
   * Check if animation is currently playing
   */
  isAnimating(): boolean {
    return this.isPlaying;
  }

  /**
   * Dispose animation resources
   */
  dispose(): void {
    this.close();
    this.container.destroy();
  }
}
