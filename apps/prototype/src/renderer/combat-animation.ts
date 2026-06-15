/**
 * apps/prototype/src/renderer/combat-animation.ts
 *
 * Combat dice animation system - Vertical layout with clear results
 *
 * Shows:
 * - Rolling dice animation (shortened)
 * - Final dice results with bonuses in vertical columns
 * - Player colors on dice sides
 * - Lost dice marked clearly
 * - Strength points displayed
 * - Clear pairwise comparison
 */

import * as PIXI from 'pixi.js';
import { CombatResult, DieRoll, PairResult, CommanderId } from '@lands-of-glory/game-core';
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
 * Default configuration - shortened animation
 */
const DEFAULT_CONFIG: CombatAnimationConfig = {
  diceSize: 44,
  diceSpacing: 4,
  pairSpacing: 70,
  animationDuration: 800, // Shortened from 2000ms
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
 * Combat dice animation
 */
export class CombatDiceAnimation {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private diceRenderer: DiceRenderer;
  private config: CombatAnimationConfig;
  private isPlaying = false;
  private onCompleteCallback?: () => void;

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
    bg.beginFill(0x000000, 0.85);
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
      align: 'center',
    });
    title.anchor.set(0.5);
    title.position.set(centerX, 60);
    this.container.addChild(title);

    // Create player labels with colors
    this.createPlayerLabels(centerX, 110, attackerName, defenderName, playerColors);

    // Play dice rolling animation
    this.animateDiceRolling(
      centerX,
      centerY - 30,
      combatResult,
      playerColors,
      () => {
        // After rolling, show final results
        setTimeout(() => {
          this.showFinalResults(centerX, centerY + 120, combatResult, playerColors);
        }, this.config.resultDelay);
      }
    );
  }

  /**
   * Create player labels with color indicators
   */
  private createPlayerLabels(
    centerX: number,
    y: number,
    attackerName: string,
    defenderName: string,
    playerColors: PlayerColors
  ): void {
    const container = new PIXI.Container();
    
    // Helper function to colorize troop type names
    const colorizeTroopName = (name: string): PIXI.Text[] => {
      const parts: PIXI.Text[] = [];
      let currentX = 0;
      
      // Check for "König " prefix
      if (name.startsWith('König ')) {
        const kingText = new PIXI.Text('König ', {
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 'bold',
          fill: 0xffffff,
          stroke: 0x000000,
          strokeThickness: 2,
        });
        kingText.anchor.set(0, 0.5);
        parts.push(kingText);
        currentX += kingText.width;
        name = name.substring(6); // Remove "König " prefix
      }
      
      // Determine color based on troop type
      let troopColor = 0xffffff;
      if (name.includes('Kavallerie')) troopColor = 0x4169E1; // Blue
      else if (name.includes('Bogenschütze')) troopColor = 0xDC143C; // Red
      else if (name.includes('Infanterie')) troopColor = 0x228B22; // Green
      
      const troopText = new PIXI.Text(name, {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        fill: troopColor,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      troopText.anchor.set(0, 0.5);
      troopText.position.set(currentX, 0);
      parts.push(troopText);
      
      return parts;
    };
    
    // Attacker container
    const attackerContainer = new PIXI.Container();
    
    // Attacker color box
    const attackerColorBox = new PIXI.Graphics();
    attackerColorBox.beginFill(playerColors.attackerColor);
    attackerColorBox.lineStyle(2, 0xffffff);
    attackerColorBox.drawRoundedRect(-12, -12, 24, 24, 4);
    attackerColorBox.endFill();
    attackerContainer.addChild(attackerColorBox);
    
    // "Angreifer" label in attacker color
    const attackerRoleLabel = new PIXI.Text('Angreifer', {
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'bold',
      fill: playerColors.attackerColor,
      stroke: 0x000000,
      strokeThickness: 2,
    });
    attackerRoleLabel.anchor.set(0.5);
    attackerRoleLabel.position.set(0, 28);
    attackerContainer.addChild(attackerRoleLabel);
    
    // Attacker troop name (colorized)
    const attackerTroopContainer = new PIXI.Container();
    const attackerTroopParts = colorizeTroopName(attackerName);
    let attackerTroopWidth = 0;
    attackerTroopParts.forEach(part => {
      part.position.x -= attackerTroopWidth;
      attackerTroopWidth += part.width;
      attackerTroopContainer.addChild(part);
    });
    attackerTroopContainer.position.set(0, 48);
    attackerContainer.addChild(attackerTroopContainer);
    
    attackerContainer.position.set(-140, 0);
    container.addChild(attackerContainer);

    // VS label
    const vsLabel = new PIXI.Text('VS', {
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: 0x000000,
      strokeThickness: 3,
    });
    vsLabel.anchor.set(0.5);
    vsLabel.position.set(0, -5);
    container.addChild(vsLabel);

    // Defender container
    const defenderContainer = new PIXI.Container();
    
    // Defender color box
    const defenderColorBox = new PIXI.Graphics();
    defenderColorBox.beginFill(playerColors.defenderColor);
    defenderColorBox.lineStyle(2, 0xffffff);
    defenderColorBox.drawRoundedRect(-12, -12, 24, 24, 4);
    defenderColorBox.endFill();
    defenderContainer.addChild(defenderColorBox);
    
    // "Verteidiger" label in defender color
    const defenderRoleLabel = new PIXI.Text('Verteidiger', {
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'bold',
      fill: playerColors.defenderColor,
      stroke: 0x000000,
      strokeThickness: 2,
    });
    defenderRoleLabel.anchor.set(0.5);
    defenderRoleLabel.position.set(0, 28);
    defenderContainer.addChild(defenderRoleLabel);
    
    // Defender troop name (colorized)
    const defenderTroopContainer = new PIXI.Container();
    const defenderTroopParts = colorizeTroopName(defenderName);
    let defenderTroopWidth = 0;
    defenderTroopParts.forEach(part => {
      part.position.x -= defenderTroopWidth;
      defenderTroopWidth += part.width;
      defenderTroopContainer.addChild(part);
    });
    defenderTroopContainer.position.set(0, 48);
    defenderContainer.addChild(defenderTroopContainer);
    
    defenderContainer.position.set(140, 0);
    container.addChild(defenderContainer);

    container.position.set(centerX, y);
    this.container.addChild(container);
  }

  /**
   * Animate dice rolling - vertical layout per player
   */
  private animateDiceRolling(
    centerX: number,
    centerY: number,
    combatResult: CombatResult,
    playerColors: PlayerColors,
    onComplete: () => void
  ): void {
    const attackerRolls = combatResult.attackerRolls;
    const defenderRolls = combatResult.defenderRolls;
    const maxDiceCount = Math.max(attackerRolls.length, defenderRolls.length);
    
    // Create rolling dice containers
    const attackerDice: PIXI.Container[] = [];
    const defenderDice: PIXI.Container[] = [];
    
    // Calculate column positions (attacker on left, defender on right)
    const columnSpacing = 120;
    const attackerX = centerX - columnSpacing / 2;
    const defenderX = centerX + columnSpacing / 2;
    
    // Calculate vertical spacing and start position
    const diceSpacing = this.config.diceSize + this.config.diceSpacing + 8;
    const totalHeight = maxDiceCount * diceSpacing;
    const startY = centerY - totalHeight / 2 + diceSpacing / 2;
    
    // Create attacker dice in vertical column (under each other)
    for (let i = 0; i < attackerRolls.length; i++) {
      const diceY = startY + i * diceSpacing;
      const dice = this.createRollingDiceWithColor(playerColors.attackerColor);
      dice.position.set(attackerX, diceY);
      this.container.addChild(dice);
      attackerDice.push(dice);
    }
    
    // Create defender dice in vertical column (under each other)
    for (let i = 0; i < defenderRolls.length; i++) {
      const diceY = startY + i * diceSpacing;
      const dice = this.createRollingDiceWithColor(playerColors.defenderColor);
      dice.position.set(defenderX, diceY);
      this.container.addChild(dice);
      defenderDice.push(dice);
    }

    // Animate rolling
    let rollCount = 0;
    const maxRolls = this.config.animationDuration / this.config.rollInterval;
    
    const rollInterval = setInterval(() => {
      rollCount++;
      
      // Update dice with random values during roll
      attackerDice.forEach((dice) => {
        const randomValue = Math.floor(Math.random() * 6) + 1;
        const playerColor = (dice as any).playerColor;
        this.diceRenderer.updateDiceValue(dice, randomValue, playerColor);
      });
      
      defenderDice.forEach((dice) => {
        const randomValue = Math.floor(Math.random() * 6) + 1;
        const playerColor = (dice as any).playerColor;
        this.diceRenderer.updateDiceValue(dice, randomValue, playerColor);
      });
      
      // Final values
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        
        // Show final dice values
        attackerDice.forEach((dice, i) => {
          const roll = attackerRolls[i];
          const playerColor = (dice as any).playerColor;
          this.diceRenderer.updateDiceValue(dice, roll.naturalValue, playerColor);
        });
        
        defenderDice.forEach((dice, i) => {
          const roll = defenderRolls[i];
          const playerColor = (dice as any).playerColor;
          this.diceRenderer.updateDiceValue(dice, roll.naturalValue, playerColor);
        });
        
        onComplete();
      }
    }, this.config.rollInterval);
  }

  /**
   * Create a rolling dice with colored border
   */
  private createRollingDiceWithColor(playerColor: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // Store player color for later updates during animation
    (container as any).playerColor = playerColor;
    
    // Create colored border/background
    const borderSize = this.config.diceSize + 8;
    const border = new PIXI.Graphics();
    border.beginFill(playerColor, 0.3);
    border.lineStyle(3, playerColor);
    border.drawRoundedRect(-borderSize / 2, -borderSize / 2, borderSize, borderSize, 8);
    border.endFill();
    container.addChild(border);
    
    // Create dice with random initial value and player color
    const dice = this.diceRenderer.createDice(Math.floor(Math.random() * 6) + 1, playerColor);
    container.addChild(dice);
    
    return container;
  }

  /**
   * Show final results with bonuses, losses, and strength points
   * New layout: Table format with Würfel | Bonuspunkte | Gesamt for both sides
   */
  private showFinalResults(
    centerX: number,
    centerY: number,
    combatResult: CombatResult,
    playerColors: PlayerColors
  ): void {
    // Calculate total strength for each side
    const attackerTotalStrength = combatResult.attackerRolls.reduce(
      (sum, roll) => sum + roll.effectiveValue, 0
    );
    const defenderTotalStrength = combatResult.defenderRolls.reduce(
      (sum, roll) => sum + roll.effectiveValue, 0
    );
    
    // Show dice overview table
    this.showDiceOverviewTable(centerX, centerY - 40, combatResult, playerColors);
    
    // Show casualties summary
    const attackerLosses = combatResult.attackerCasualties.length;
    const defenderLosses = combatResult.defenderCasualties.length;
    
    // Result summary box
    const summaryY = centerY + 180;
    
    let resultText = '';
    let resultColor = 0xffffff;
    
    if (attackerLosses === 0 && defenderLosses === 0) {
      resultText = '🛡️ UNENTSCHIEDEN - Keine Verluste! 🛡️';
      resultColor = 0xaaaaaa;
    } else if (defenderLosses > attackerLosses) {
      resultText = `⚔️ ANGREIFER GEWINNT! ${defenderLosses} Verluste beim Verteidiger`;
      resultColor = playerColors.attackerColor;
    } else if (attackerLosses > defenderLosses) {
      resultText = `🛡️ VERTEIDIGER GEWINNT! ${attackerLosses} Verluste beim Angreifer`;
      resultColor = playerColors.defenderColor;
    } else {
      resultText = `⚔️ GLEICHSTAND! ${attackerLosses} Verluste auf beiden Seiten`;
      resultColor = 0xffd700;
    }
    
    // Show result text
    const resultLabel = new PIXI.Text(resultText, {
      fontFamily: 'Arial',
      fontSize: 22,
      fontWeight: 'bold',
      fill: resultColor,
      stroke: 0x000000,
      strokeThickness: 4,
      align: 'center',
    });
    resultLabel.anchor.set(0.5);
    resultLabel.position.set(centerX, summaryY);
    this.container.addChild(resultLabel);

    // Show strength comparison
    const strengthText = `Gesamtstärke: Angreifer ${attackerTotalStrength} vs ${defenderTotalStrength} Verteidiger`;
    const strengthLabel = new PIXI.Text(strengthText, {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xdddddd,
      align: 'center',
    });
    strengthLabel.anchor.set(0.5);
    strengthLabel.position.set(centerX, summaryY + 35);
    this.container.addChild(strengthLabel);

    // Show casualty details
    if (attackerLosses > 0 || defenderLosses > 0) {
      const casualtyText = this.createCasualtyText(combatResult);
      const casualtyLabel = new PIXI.Text(casualtyText, {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xff6b6b,
        align: 'center',
        lineHeight: 18,
      });
      casualtyLabel.anchor.set(0.5);
      casualtyLabel.position.set(centerX, summaryY + 65);
      this.container.addChild(casualtyLabel);
    }

    // Add "Click to continue" hint
    const hint = new PIXI.Text('KLICKEN ZUM FORTFAHREN', {
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: 0x000000,
      strokeThickness: 2,
      align: 'center',
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

    // Make entire container clickable to close
    this.container.eventMode = 'static';
    this.container.hitArea = new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    this.container.cursor = 'pointer';
    this.container.once('pointerdown', () => this.close());
  }

  /**
   * Show dice overview with combined dice and table
   * Structure per row: Würfel Bonus Gesamt X vs X Gesamt Bonus Würfel
   */
  private showDiceOverviewTable(
    centerX: number,
    startY: number,
    combatResult: CombatResult,
    playerColors: PlayerColors
  ): void {
    const tableContainer = new PIXI.Container();
    
    // Column widths and spacing
    const diceColWidth = 50;
    const bonusColWidth = 60;
    const totalColWidth = 55;
    const lossColWidth = 30;
    const vsWidth = 40;
    const colGap = 4;
    
    // Calculate center and side positions
    const leftSideX = centerX - vsWidth / 2 - lossColWidth - totalColWidth - bonusColWidth - diceColWidth - colGap * 3;
    const rightSideX = centerX + vsWidth / 2 + lossColWidth;
    
    // Header row
    const headerY = startY;
    const headerStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0xaaaaaa,
    });
    
    // Attacker headers (left side, reading left to right)
    let currentX = leftSideX;
    const attDiceHeader = new PIXI.Text('Würfel', headerStyle);
    attDiceHeader.anchor.set(0.5, 0);
    attDiceHeader.position.set(currentX + diceColWidth / 2, headerY);
    tableContainer.addChild(attDiceHeader);
    currentX += diceColWidth + colGap;
    
    const attBonusHeader = new PIXI.Text('Bonus', headerStyle);
    attBonusHeader.anchor.set(0.5, 0);
    attBonusHeader.position.set(currentX + bonusColWidth / 2, headerY);
    tableContainer.addChild(attBonusHeader);
    currentX += bonusColWidth + colGap;
    
    const attTotalHeader = new PIXI.Text('Gesamt', headerStyle);
    attTotalHeader.anchor.set(0.5, 0);
    attTotalHeader.position.set(currentX + totalColWidth / 2, headerY);
    tableContainer.addChild(attTotalHeader);
    currentX += totalColWidth + colGap;
    
    // Loss column header (empty)
    currentX += lossColWidth + colGap;
    
    // VS header
    const vsHeader = new PIXI.Text('VS', {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0xffd700,
    });
    vsHeader.anchor.set(0.5, 0);
    vsHeader.position.set(centerX, headerY + 2);
    tableContainer.addChild(vsHeader);
    
    // Defender headers (right side, reading right to left)
    currentX = rightSideX;
    const defTotalHeader = new PIXI.Text('Gesamt', headerStyle);
    defTotalHeader.anchor.set(0.5, 0);
    defTotalHeader.position.set(currentX + totalColWidth / 2, headerY);
    tableContainer.addChild(defTotalHeader);
    currentX += totalColWidth + colGap;
    
    const defBonusHeader = new PIXI.Text('Bonus', headerStyle);
    defBonusHeader.anchor.set(0.5, 0);
    defBonusHeader.position.set(currentX + bonusColWidth / 2, headerY);
    tableContainer.addChild(defBonusHeader);
    currentX += bonusColWidth + colGap;
    
    const defDiceHeader = new PIXI.Text('Würfel', headerStyle);
    defDiceHeader.anchor.set(0.5, 0);
    defDiceHeader.position.set(currentX + diceColWidth / 2, headerY);
    tableContainer.addChild(defDiceHeader);
    
    // Data rows - iterate through pairs
    const rowHeight = 36;
    const dataStartY = headerY + 22;
    
    // Sort pairs by the higher effective value
    const sortedPairs = [...combatResult.pairs].sort((a, b) => {
      const maxA = Math.max(a.attackerDie.effectiveValue, a.defenderDie.effectiveValue);
      const maxB = Math.max(b.attackerDie.effectiveValue, b.defenderDie.effectiveValue);
      return maxB - maxA;
    });
    
    sortedPairs.forEach((pair, i) => {
      const rowY = dataStartY + i * rowHeight;
      const attLost = !pair.attackerWins;
      const defLost = pair.attackerWins;
      
      // Attacker row (left side)
      currentX = leftSideX;
      
      // Würfel value
      const attDiceValue = new PIXI.Text(pair.attackerDie.naturalValue.toString(), {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: attLost ? 0xff6666 : 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      attDiceValue.anchor.set(0.5);
      attDiceValue.position.set(currentX + diceColWidth / 2, rowY);
      tableContainer.addChild(attDiceValue);
      currentX += diceColWidth + colGap;
      
      // Bonus
      let attBonusText = '';
      if (pair.attackerDie.bonusPoints > 0) attBonusText += `+${pair.attackerDie.bonusPoints}⚔️`;
      if (pair.attackerDie.kingBonus > 0) attBonusText += (attBonusText ? '' : '') + '👑';
      if (!attBonusText) attBonusText = '-';
      
      const attBonusValue = new PIXI.Text(attBonusText, {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: pair.attackerDie.bonusPoints > 0 || pair.attackerDie.kingBonus > 0 ? 0xffeb3b : 0x666666,
        align: 'center',
      });
      attBonusValue.anchor.set(0.5);
      attBonusValue.position.set(currentX + bonusColWidth / 2, rowY);
      tableContainer.addChild(attBonusValue);
      currentX += bonusColWidth + colGap;
      
      // Gesamt
      const attTotalValue = new PIXI.Text(pair.attackerDie.effectiveValue.toString(), {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: attLost ? 0xff6666 : playerColors.attackerColor,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      attTotalValue.anchor.set(0.5);
      attTotalValue.position.set(currentX + totalColWidth / 2, rowY);
      tableContainer.addChild(attTotalValue);
      currentX += totalColWidth + colGap;
      
      // X bei Verlust
      if (attLost) {
        const attLossMarker = new PIXI.Text('❌', {
          fontFamily: 'Arial',
          fontSize: 12,
        });
        attLossMarker.anchor.set(0.5);
        attLossMarker.position.set(currentX + lossColWidth / 2, rowY);
        tableContainer.addChild(attLossMarker);
      }
      currentX += lossColWidth + colGap;
      
      // VS indicator
      const vsSymbol = pair.attackerWins ? '>' : '<';
      const vsColor = pair.attackerWins ? playerColors.attackerColor : playerColors.defenderColor;
      const vsIndicator = new PIXI.Text(vsSymbol, {
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: vsColor,
      });
      vsIndicator.anchor.set(0.5);
      vsIndicator.position.set(centerX, rowY);
      tableContainer.addChild(vsIndicator);
      
      // Defender row (right side, mirrored)
      currentX = rightSideX;
      
      // X bei Verlust
      if (defLost) {
        const defLossMarker = new PIXI.Text('❌', {
          fontFamily: 'Arial',
          fontSize: 12,
        });
        defLossMarker.anchor.set(0.5);
        defLossMarker.position.set(currentX + lossColWidth / 2, rowY);
        tableContainer.addChild(defLossMarker);
      }
      currentX += lossColWidth + colGap;
      
      // Gesamt
      const defTotalValue = new PIXI.Text(pair.defenderDie.effectiveValue.toString(), {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: defLost ? 0xff6666 : playerColors.defenderColor,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      defTotalValue.anchor.set(0.5);
      defTotalValue.position.set(currentX + totalColWidth / 2, rowY);
      tableContainer.addChild(defTotalValue);
      currentX += totalColWidth + colGap;
      
      // Bonus
      let defBonusText = '';
      if (pair.defenderDie.bonusPoints > 0) defBonusText += `+${pair.defenderDie.bonusPoints}⚔️`;
      if (pair.defenderDie.kingBonus > 0) defBonusText += (defBonusText ? '' : '') + '👑';
      if (!defBonusText) defBonusText = '-';
      
      const defBonusValue = new PIXI.Text(defBonusText, {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: pair.defenderDie.bonusPoints > 0 || pair.defenderDie.kingBonus > 0 ? 0xffeb3b : 0x666666,
        align: 'center',
      });
      defBonusValue.anchor.set(0.5);
      defBonusValue.position.set(currentX + bonusColWidth / 2, rowY);
      tableContainer.addChild(defBonusValue);
      currentX += bonusColWidth + colGap;
      
      // Würfel value
      const defDiceValue = new PIXI.Text(pair.defenderDie.naturalValue.toString(), {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: defLost ? 0xff6666 : 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      defDiceValue.anchor.set(0.5);
      defDiceValue.position.set(currentX + diceColWidth / 2, rowY);
      tableContainer.addChild(defDiceValue);
    });
    
    // Summenzeile entfernt - keine Total row mehr
    
    this.container.addChild(tableContainer);
  }

  /**
   * Show pair comparisons with strength points and loss indicators
   */
  private showPairComparisons(
    centerX: number,
    startY: number,
    combatResult: CombatResult,
    playerColors: PlayerColors
  ): void {
    const pairCount = combatResult.pairs.length;
    if (pairCount === 0) return;
    
    // Calculate column positions (attacker on left, defender on right)
    const columnSpacing = 140;
    const attackerX = centerX - columnSpacing / 2;
    const defenderX = centerX + columnSpacing / 2;
    
    // Calculate vertical spacing and start position (increased spacing for better visibility)
    const diceSpacing = this.config.diceSize + 70; // Increased from 50 to 70
    const totalHeight = pairCount * diceSpacing;
    const diceStartY = startY - totalHeight / 2 + diceSpacing / 2 + 20; // Added extra top margin (+20)
    
    // Sort pairs by highest dice value (descending) - highest values at top
    const sortedPairs = [...combatResult.pairs].sort((a, b) => {
      const maxA = Math.max(a.attackerDie.effectiveValue, a.defenderDie.effectiveValue);
      const maxB = Math.max(b.attackerDie.effectiveValue, b.defenderDie.effectiveValue);
      return maxB - maxA; // Descending order
    });
    
    sortedPairs.forEach((pair, i) => {
      const diceY = diceStartY + i * diceSpacing;
      
      // Attacker die (left column)
      const attackerWins = pair.attackerWins;
      const attackerLost = !attackerWins;
      
      this.createResultDie(
        attackerX,
        diceY,
        pair.attackerDie,
        playerColors.attackerColor,
        attackerLost,
        'attacker'
      );
      
      // VS indicator (center)
      const vsSymbol = attackerWins ? '>' : '<';
      const vsColor = attackerWins ? playerColors.attackerColor : playerColors.defenderColor;
      const vsLabel = new PIXI.Text(vsSymbol, {
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'bold',
        fill: vsColor,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      vsLabel.anchor.set(0.5);
      vsLabel.position.set(centerX, diceY);
      this.container.addChild(vsLabel);
      
      // Defender die (right column)
      const defenderLost = attackerWins;
      
      this.createResultDie(
        defenderX,
        diceY,
        pair.defenderDie,
        playerColors.defenderColor,
        defenderLost,
        'defender'
      );
    });
  }

  /**
   * Create a result die with all information
   */
  private createResultDie(
    x: number,
    y: number,
    dieRoll: DieRoll,
    playerColor: number,
    isLost: boolean,
    side: 'attacker' | 'defender'
  ): void {
    const container = new PIXI.Container();
    container.position.set(x, y);
    
    // Background with player color
    const bgSize = this.config.diceSize + 12;
    const bg = new PIXI.Graphics();
    
    if (isLost) {
      // Red X background for lost dice
      bg.beginFill(0x330000, 0.8);
      bg.lineStyle(3, 0xff0000);
    } else {
      // Normal player color background
      bg.beginFill(playerColor, 0.2);
      bg.lineStyle(3, playerColor);
    }
    
    bg.drawRoundedRect(-bgSize / 2, -bgSize / 2, bgSize, bgSize, 8);
    bg.endFill();
    container.addChild(bg);
    
    // Add red X for lost dice
    if (isLost) {
      const cross = new PIXI.Graphics();
      cross.lineStyle(4, 0xff0000, 0.8);
      const offset = bgSize / 2 - 6;
      cross.moveTo(-offset, -offset);
      cross.lineTo(offset, offset);
      cross.moveTo(offset, -offset);
      cross.lineTo(-offset, offset);
      container.addChild(cross);
    }
    
    // Dice value (natural) - pass player color for proper coloring
    const dice = this.diceRenderer.createDice(dieRoll.naturalValue, playerColor);
    container.addChild(dice);
    
    // Effective value (large)
    const effectiveValue = dieRoll.effectiveValue;
    const valueLabel = new PIXI.Text(effectiveValue.toString(), {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: isLost ? 0xff6666 : 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    });
    valueLabel.anchor.set(0.5);
    valueLabel.position.set(0, this.config.diceSize / 2 + 15);
    container.addChild(valueLabel);
    
    // Bonus breakdown below
    let bonusText = '';
    if (dieRoll.bonusPoints > 0) {
      bonusText += `+${dieRoll.bonusPoints}⚔️`;
    }
    if (dieRoll.kingBonus > 0) {
      bonusText += bonusText ? ' ' : '';
      bonusText += '+👑';
    }
    
    if (bonusText) {
      const bonusLabel = new PIXI.Text(bonusText, {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: 0xffeb3b,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      bonusLabel.anchor.set(0.5);
      bonusLabel.position.set(0, this.config.diceSize / 2 + 32);
      container.addChild(bonusLabel);
    }
    
    // "VERLOREN" label for lost dice
    if (isLost) {
      const lostLabel = new PIXI.Text('❌', {
        fontFamily: 'Arial',
        fontSize: 24,
      });
      lostLabel.anchor.set(0.5);
      lostLabel.position.set(0, 0);
      container.addChild(lostLabel);
    }
    
    this.container.addChild(container);
  }

  /**
   * Create casualty summary text
   */
  private createCasualtyText(combatResult: CombatResult): string {
    const lines: string[] = [];
    
    if (combatResult.attackerCasualties.length > 0) {
      lines.push(`Angreifer verliert: ${combatResult.attackerCasualties.length} Unit${combatResult.attackerCasualties.length > 1 ? 's' : ''}`);
    }
    
    if (combatResult.defenderCasualties.length > 0) {
      lines.push(`Verteidiger verliert: ${combatResult.defenderCasualties.length} Unit${combatResult.defenderCasualties.length > 1 ? 's' : ''}`);
    }
    
    if (combatResult.attackerCommanderDefeated) {
      lines.push('⚔️ Angreifer besiegt!');
    }
    
    if (combatResult.defenderCommanderDefeated) {
      lines.push('🛡️ Verteidiger besiegt!');
    }
    
    return lines.join('\n');
  }

  /**
   * Close the animation
   */
  close(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.container.visible = false;
    this.container.removeChildren();

    // Unit info panel wieder anzeigen (wird in main.ts basierend auf Auswahl aktualisiert)
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
