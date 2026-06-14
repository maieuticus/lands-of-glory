/**
 * apps/prototype/src/controller/game-controller.ts
 *
 * Game controller for input handling and state management
 * PRODUCTION VERSION with all features
 */

import {
  GameState,
  Position,
  CommanderId,
  Commander,
  Unit,
  createGame,
  startGame,
  endTurn,
  getWinner,
  GameConfig,
  GameRuleError,
  TROOP_STATS,
  resolveCombat,
  applyCombatResult,
  canAttack,
  createRNG,
  Banner,
  CombatResult,
} from '@lands-of-glory/game-core';
import { GameRenderer, UIState, DragCallbacks } from '../renderer/game-renderer';
import { CombatDiceAnimation } from '../renderer/combat-animation';

/**
 * Combat log entry
 */
interface CombatLogEntry {
  id: string;
  turn: number;
  type: 'move' | 'attack' | 'capture' | 'victory' | 'turn_end';
  message: string;
  timestamp: Date;
  details?: {
    attacker?: string;
    defender?: string;
    casualties?: number;
    attackerLosses?: number;
    defenderLosses?: number;
  };
}

/**
 * Game controller - PRODUCTION VERSION
 */
export class GameController {
  private gameState: GameState;
  private renderer: GameRenderer;
  private uiState: UIState = { debugEnabled: false };
  private selectedCommanderId?: CommanderId;
  private combatLog: CombatLogEntry[] = [];
  private logCallbacks: ((entry: CombatLogEntry) => void)[] = [];
  private onVictoryCallbacks: ((winner: string) => void)[] = [];
  private combatAnimation: CombatDiceAnimation;

  constructor(gameState: GameState, renderer: GameRenderer) {
    this.gameState = gameState;
    this.renderer = renderer;
    this.combatAnimation = new CombatDiceAnimation(renderer.getApp());
    this.setupDragCallbacks();
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Get current UI state
   */
  getUIState(): UIState {
    return { ...this.uiState };
  }

  /**
   * Get combat log
   */
  getCombatLog(): CombatLogEntry[] {
    return [...this.combatLog];
  }

  /**
   * Subscribe to combat log updates
   */
  onCombatLog(callback: (entry: CombatLogEntry) => void): () => void {
    this.logCallbacks.push(callback);
    return () => {
      const index = this.logCallbacks.indexOf(callback);
      if (index > -1) {
        this.logCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to victory event
   */
  onVictory(callback: (winner: string) => void): () => void {
    this.onVictoryCallbacks.push(callback);
    return () => {
      const index = this.onVictoryCallbacks.indexOf(callback);
      if (index > -1) {
        this.onVictoryCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Initialize game and start playing
   */
  initializeGame(): void {
    this.gameState = startGame(this.gameState);
    this.addLogEntry({
      type: 'turn_end',
      message: `Game started! ${this.gameState.players[0].name}'s turn.`,
    });
    this.render();
  }

  /**
   * Setup drag-and-drop event callbacks
   */
  private setupDragCallbacks(): void {
    const callbacks: DragCallbacks = {
      onDragStart: (commanderId: CommanderId) => {
        const commander = this.gameState.commanders.get(commanderId);
        if (!commander) return;

        // Check if it's the current player's commander
        const activePlayer = this.gameState.players.find(p => p.id === this.gameState.activePlayerId);
        if (!activePlayer?.commanders.includes(commanderId)) {
          this.showError('Not your commander!');
          return;
        }

        // Check if commander has already acted
        if (commander.hasActedThisTurn) {
          this.showError('Commander has already acted this turn');
          return;
        }

        this.selectedCommanderId = commanderId;
        this.uiState.selectedCommanderId = commanderId;
        this.uiState.draggedCommanderId = commanderId;
        this.render();
      },
      onDragMove: (position: Position) => {
        this.uiState.currentDragTarget = position;
        this.render();
      },
      onDragEnd: (commanderId: CommanderId, target: Position) => {
        this.uiState.draggedCommanderId = undefined;
        this.uiState.currentDragTarget = undefined;

        if (!this.selectedCommanderId) return;

        // Round target position to ensure it's a valid grid coordinate
        const snappedTarget: Position = {
          x: Math.round(target.x),
          y: Math.round(target.y)
        };

        // Check if there's an enemy at target position (potential attack)
        const enemyCommander = this.findEnemyCommanderAtPosition(snappedTarget);
        if (enemyCommander) {
          this.tryAttackCommander(this.selectedCommanderId, enemyCommander.id);
          return;
        }

        // Check if there's an enemy banner at target position
        const enemyBanner = this.findEnemyBannerAtPosition(snappedTarget);
        if (enemyBanner) {
          this.tryAttackBanner(this.selectedCommanderId, enemyBanner);
          return;
        }

        // Try to move selected commander
        this.tryMoveCommander(this.selectedCommanderId, snappedTarget);
      },
    };

    this.renderer.setDragCallbacks(callbacks);
  }

  /**
   * Handle key press
   */
  handleKeyDown(key: string, modifiers: { shift: boolean; ctrl: boolean; alt: boolean }): void {
    switch (key.toUpperCase()) {
      case 'D':
        this.uiState.debugEnabled = !this.uiState.debugEnabled;
        this.render();
        break;
      case 'E':
        this.tryEndTurn();
        break;
      case 'ESCAPE':
        this.selectedCommanderId = undefined;
        this.uiState.selectedCommanderId = undefined;
        this.render();
        break;
    }
  }

  /**
   * Try to move a commander
   */
  private tryMoveCommander(commanderId: CommanderId, target: Position): void {
    try {
      const commander = this.gameState.commanders.get(commanderId);
      if (!commander) {
        this.showError('Commander not found');
        return;
      }

      // Check if commander has already acted this turn
      if (commander.hasActedThisTurn) {
        this.showError('Commander has already acted this turn');
        return;
      }

      // Check if commander is held by enemy infantry
      if (this.isCommanderHeld(commanderId)) {
        this.showError('Commander is held by enemy infantry! Can only attack the holder.');
        return;
      }

      // Validate move distance
      const distance = Math.max(
        Math.abs(commander.position.x - target.x),
        Math.abs(commander.position.y - target.y)
      );

      if (distance === 0) {
        this.showError('Already at that position');
        return;
      }

      const maxDistance = TROOP_STATS[commander.type].moveRange;
      if (distance > maxDistance) {
        this.showError(`Too far! Max ${maxDistance} tiles for ${commander.type}`);
        return;
      }

      // Check if target is occupied
      for (const otherCmd of this.gameState.commanders.values()) {
        if (otherCmd.id !== commanderId &&
            otherCmd.position.x === target.x &&
            otherCmd.position.y === target.y) {
          this.showError('Position occupied');
          return;
        }
      }

      // Check if target is occupied by a banner
      for (const banner of this.gameState.banners.values()) {
        if (banner.position.x === target.x &&
            banner.position.y === target.y &&
            banner.status === 'standing') {
          this.showError('Cannot move onto banner');
          return;
        }
      }

      // Move commander
      const newGameState = {
        ...this.gameState,
        commanders: new Map(this.gameState.commanders),
      };

      const updatedCommander = {
        ...commander,
        position: target,
        hasActedThisTurn: true,
      };

      newGameState.commanders.set(commanderId, updatedCommander);
      this.gameState = newGameState;

      this.selectedCommanderId = undefined;
      this.uiState.selectedCommanderId = undefined;

      // Add to combat log
      this.addLogEntry({
        type: 'move',
        message: `${commander.type} moved to (${target.x}, ${target.y})`,
      });

      this.showMessage(`${commander.type} moved`, 'success');
      this.render();
    } catch (error) {
      if (error instanceof GameRuleError) {
        this.showError(error.message);
      } else {
        this.showError('Move failed');
      }
    }
  }

  /**
   * Check if commander is held by enemy infantry
   * Per Spec 004: Infantry holds adjacent enemy commanders
   */
  private isCommanderHeld(commanderId: CommanderId): boolean {
    const commander = this.gameState.commanders.get(commanderId);
    if (!commander) return false;

    // Check all adjacent positions for enemy infantry
    const adjacentPositions = [
      { x: commander.position.x - 1, y: commander.position.y },
      { x: commander.position.x + 1, y: commander.position.y },
      { x: commander.position.x, y: commander.position.y - 1 },
      { x: commander.position.x, y: commander.position.y + 1 },
      { x: commander.position.x - 1, y: commander.position.y - 1 },
      { x: commander.position.x + 1, y: commander.position.y - 1 },
      { x: commander.position.x - 1, y: commander.position.y + 1 },
      { x: commander.position.x + 1, y: commander.position.y + 1 },
    ];

    for (const [id, cmd] of this.gameState.commanders) {
      if (cmd.playerId !== commander.playerId &&
          cmd.type === 'infantry' &&
          adjacentPositions.some(pos => pos.x === cmd.position.x && pos.y === cmd.position.y)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the commander holding this commander (if any)
   */
  private getHoldingCommander(commanderId: CommanderId): Commander | undefined {
    const commander = this.gameState.commanders.get(commanderId);
    if (!commander) return undefined;

    const adjacentPositions = [
      { x: commander.position.x - 1, y: commander.position.y },
      { x: commander.position.x + 1, y: commander.position.y },
      { x: commander.position.x, y: commander.position.y - 1 },
      { x: commander.position.x, y: commander.position.y + 1 },
      { x: commander.position.x - 1, y: commander.position.y - 1 },
      { x: commander.position.x + 1, y: commander.position.y - 1 },
      { x: commander.position.x - 1, y: commander.position.y + 1 },
      { x: commander.position.x + 1, y: commander.position.y + 1 },
    ];

    for (const [id, cmd] of this.gameState.commanders) {
      if (cmd.playerId !== commander.playerId &&
          cmd.type === 'infantry' &&
          adjacentPositions.some(pos => pos.x === cmd.position.x && pos.y === cmd.position.y)) {
        return cmd;
      }
    }

    return undefined;
  }

  /**
   * Try to attack an enemy commander
   */
  private tryAttackCommander(attackerId: CommanderId, defenderId: CommanderId): void {
    try {
      // Validate attack
      const validation = canAttack(this.gameState, attackerId, defenderId);
      if (!validation.valid) {
        this.showError(validation.reason || 'Invalid attack');
        return;
      }

      const attacker = this.gameState.commanders.get(attackerId);
      const defender = this.gameState.commanders.get(defenderId);

      if (!attacker || !defender) {
        this.showError('Commander not found');
        return;
      }

      // Check archer rule: can only move OR shoot, not both
      if (attacker.type === 'archer' && this.hasCommanderMovedThisTurn(attackerId)) {
        this.showError('Archers can only move OR shoot in a turn, not both');
        return;
      }

      // Note: Held commanders can attack any target, not just the holder

      // Create RNG for combat
      const rng = createRNG(Date.now());

      // Resolve combat
      const combatResult = resolveCombat(this.gameState, attackerId, defenderId, rng);

      // Helper to translate troop type
      const translateTroopType = (type: string): string => {
        switch (type) {
          case 'infantry': return 'Infanterie';
          case 'cavalry': return 'Kavallerie';
          case 'archer': return 'Bogenschütze';
          default: return type;
        }
      };

      // Get names and colors for animation
      const attackerName = `${attacker.isKing ? 'König ' : ''}${translateTroopType(attacker.type)}`;
      const defenderName = `${defender.isKing ? 'König ' : ''}${translateTroopType(defender.type)}`;
      
      // Get player colors from array
      const attackerPlayer = this.gameState.players.find(p => p.id === attacker.playerId);
      const defenderPlayer = this.gameState.players.find(p => p.id === defender.playerId);
      const attackerColor = attackerPlayer?.color ? parseInt(attackerPlayer.color.replace('#', '0x')) : 0xff6b6b;
      const defenderColor = defenderPlayer?.color ? parseInt(defenderPlayer.color.replace('#', '0x')) : 0x4dabf7;

      // Show dice animation
      this.combatAnimation.play(combatResult, attackerName, defenderName, attackerColor, defenderColor, () => {
        // Apply combat result after animation
        this.applyCombatAfterAnimation(combatResult, attackerId, attacker, defender);
      });
    } catch (error) {
      if (error instanceof GameRuleError) {
        this.showError(error.message);
      } else {
        this.showError('Combat failed');
      }
    }
  }

  /**
   * Apply combat result after animation completes
   */
  private applyCombatAfterAnimation(
    combatResult: CombatResult,
    attackerId: CommanderId,
    attacker: Commander,
    defender: Commander
  ): void {
    // Apply combat result
    this.gameState = applyCombatResult(this.gameState, combatResult);

    // Mark attacker as having acted
    const updatedAttacker = this.gameState.commanders.get(attackerId);
    if (updatedAttacker) {
      const updatedCommanders = new Map(this.gameState.commanders);
      updatedCommanders.set(attackerId, { ...updatedAttacker, hasActedThisTurn: true });
      this.gameState = { ...this.gameState, commanders: updatedCommanders };
    }

    // Build result message and log
    this.logCombatResult(combatResult, attacker, defender);

    this.selectedCommanderId = undefined;
    this.uiState.selectedCommanderId = undefined;

    // Check victory conditions
    this.checkVictoryConditions();

    this.render();
  }

  /**
   * Check if commander has already moved this turn
   */
  private hasCommanderMovedThisTurn(commanderId: CommanderId): boolean {
    const commander = this.gameState.commanders.get(commanderId);
    return commander?.hasActedThisTurn ?? false;
  }

  /**
   * Log combat result
   */
  private logCombatResult(
    result: CombatResult,
    attacker: Commander,
    defender: Commander
  ): void {
    const attackerName = `${attacker.isKing ? 'King ' : ''}${attacker.type}`;
    const defenderName = `${defender.isKing ? 'King ' : ''}${defender.type}`;

    let message = `${attackerName} attacked ${defenderName}! `;
    message += `Attacker lost ${result.attackerCasualties.length}, `;
    message += `Defender lost ${result.defenderCasualties.length}.`;

    if (result.attackerCommanderDefeated) {
      message += ` ${attackerName} defeated!`;
    }
    if (result.defenderCommanderDefeated) {
      message += ` ${defenderName} defeated!`;
    }

    this.addLogEntry({
      type: 'attack',
      message,
      details: {
        attacker: attackerName,
        defender: defenderName,
        attackerLosses: result.attackerCasualties.length,
        defenderLosses: result.defenderCasualties.length,
      },
    });

    this.showMessage(message, 'success');
  }

  /**
   * Try to attack an enemy banner
   */
  private tryAttackBanner(attackerId: CommanderId, banner: Banner): void {
    try {
      const attacker = this.gameState.commanders.get(attackerId);
      if (!attacker) {
        this.showError('Attacker not found');
        return;
      }

      if (attacker.hasActedThisTurn) {
        this.showError('Commander has already acted this turn');
        return;
      }

      // Check range (must be adjacent - distance 1 for melee)
      const distance = Math.max(
        Math.abs(attacker.position.x - banner.position.x),
        Math.abs(attacker.position.y - banner.position.y)
      );

      if (distance > 1) {
        this.showError('Must be adjacent to capture banner');
        return;
      }

      // Check troop type (archers cannot capture banners - Spec 005)
      if (attacker.type === 'archer') {
        this.showError('Archers cannot capture banners in melee');
        return;
      }

      // Capture the banner
      const updatedBanners = new Map(this.gameState.banners);
      updatedBanners.set(banner.id, { ...banner, status: 'captured' });

      // Mark attacker as having acted
      const updatedCommanders = new Map(this.gameState.commanders);
      updatedCommanders.set(attackerId, { ...attacker, hasActedThisTurn: true });

      this.gameState = {
        ...this.gameState,
        banners: updatedBanners,
        commanders: updatedCommanders,
      };

      this.selectedCommanderId = undefined;
      this.uiState.selectedCommanderId = undefined;

      // Add to log
      const player = this.gameState.players.find(p => p.id === attacker.playerId);
      this.addLogEntry({
        type: 'capture',
        message: `${player?.name} captured the enemy banner!`,
      });

      this.showMessage('Banner captured!', 'success');

      // Check victory
      this.checkVictoryConditions();
      this.render();
    } catch (error) {
      if (error instanceof GameRuleError) {
        this.showError(error.message);
      } else {
        this.showError('Banner capture failed');
      }
    }
  }

  /**
   * Try to end current turn
   */
  private tryEndTurn(): void {
    try {
      const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.activePlayerId);

      this.gameState = endTurn(this.gameState);
      this.selectedCommanderId = undefined;
      this.uiState.selectedCommanderId = undefined;

      const nextPlayer = this.gameState.players.find(p => p.id === this.gameState.activePlayerId);

      this.addLogEntry({
        type: 'turn_end',
        message: `Turn ${this.gameState.turnNumber} - ${nextPlayer?.name}'s turn`,
      });

      this.showMessage(`Turn ended. ${nextPlayer?.name}'s turn.`, 'info');
      this.render();
    } catch (error) {
      if (error instanceof GameRuleError) {
        this.showError(error.message);
      } else {
        this.showError('Failed to end turn');
      }
    }
  }

  /**
   * Check and handle victory conditions
   */
  private checkVictoryConditions(): void {
    if (this.gameState.gameStatus === 'finished') {
      const winner = getWinner(this.gameState);
      if (winner) {
        this.addLogEntry({
          type: 'victory',
          message: `🎉 ${winner.name} wins the game!`,
        });

        // Notify callbacks
        this.onVictoryCallbacks.forEach(cb => cb(winner.name));

        this.showMessage(`🎉 ${winner.name} wins!`, 'success');
      }
    }
  }

  /**
   * Find enemy commander at position
   */
  private findEnemyCommanderAtPosition(position: Position): { id: CommanderId; commander: Commander } | undefined {
    for (const [id, cmd] of this.gameState.commanders) {
      if (cmd.position.x === position.x && cmd.position.y === position.y) {
        const activePlayer = this.gameState.players.find(p => p.id === this.gameState.activePlayerId);
        if (activePlayer && !activePlayer.commanders.includes(id)) {
          return { id, commander: cmd };
        }
      }
    }
    return undefined;
  }

  /**
   * Find enemy banner at position
   */
  private findEnemyBannerAtPosition(position: Position): Banner | undefined {
    for (const banner of this.gameState.banners.values()) {
      if (banner.position.x === position.x &&
          banner.position.y === position.y &&
          banner.status === 'standing') {
        const activePlayer = this.gameState.players.find(p => p.id === this.gameState.activePlayerId);
        if (activePlayer && banner.playerId !== activePlayer.id) {
          return banner;
        }
      }
    }
    return undefined;
  }

  /**
   * Add entry to combat log
   */
  private addLogEntry(entry: Omit<CombatLogEntry, 'id' | 'turn' | 'timestamp'>): void {
    const fullEntry: CombatLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      turn: this.gameState.turnNumber,
      timestamp: new Date(),
    };

    this.combatLog.push(fullEntry);

    // Keep only last 50 entries
    if (this.combatLog.length > 50) {
      this.combatLog.shift();
    }

    // Notify callbacks
    this.logCallbacks.forEach(cb => cb(fullEntry));
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    console.error(`❌ ${message}`);
    // Could integrate with UI toast system
  }

  /**
   * Show success/info message
   */
  private showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Could integrate with UI toast system
  }

  /**
   * Render current state
   */
  private render(): void {
    this.uiState.selectedCommanderId = this.selectedCommanderId;
    this.renderer.render(this.gameState, this.uiState);
  }
}

/**
 * Create a game controller
 */
export function createGameController(
  config: GameConfig,
  renderer: GameRenderer
): GameController {
  const gameState = createGame(config);
  return new GameController(gameState, renderer);
}
