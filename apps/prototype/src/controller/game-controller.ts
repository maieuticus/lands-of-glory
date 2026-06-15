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
  calculateGameResults,
  GameResults,
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
 * History entry for undo functionality
 */
interface HistoryEntry {
  gameState: GameState;
  combatLog: CombatLogEntry[];
  action: 'move' | 'attack' | 'capture' | 'turn_end';
  description: string;
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
  private history: HistoryEntry[] = [];
  private maxHistorySize = 20;

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
    // Save initial state
    this.saveToHistory('turn_end', 'Game started');
    this.addLogEntry({
      type: 'turn_end',
      message: `Game started! ${this.gameState.players[0].name}'s turn.`,
    });
    this.render();
  }

  /**
   * Save current state to history for undo functionality
   */
  private saveToHistory(action: HistoryEntry['action'], description: string): void {
    // Deep clone game state
    const stateCopy: GameState = {
      ...this.gameState,
      commanders: new Map(this.gameState.commanders),
      banners: new Map(this.gameState.banners),
      players: [...this.gameState.players],
    };

    const entry: HistoryEntry = {
      gameState: stateCopy,
      combatLog: [...this.combatLog],
      action,
      description,
    };

    this.history.push(entry);

    // Keep only last N entries
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.history.length <= 1) {
      this.showError('Nothing to undo');
      return false;
    }

    // Remove current state
    this.history.pop();

    // Restore previous state
    const previousState = this.history[this.history.length - 1];
    this.gameState = previousState.gameState;
    this.combatLog = previousState.combatLog;

    // Reset selection
    this.selectedCommanderId = undefined;
    this.uiState.selectedCommanderId = undefined;

    this.showMessage(`Rückgängig: ${previousState.description}`, 'info');
    this.render();
    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.history.length > 1;
  }

  /**
   * Get undo history for display
   */
  getUndoHistory(): string[] {
    return this.history.map(h => h.description);
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
      case 'Z':
        if (modifiers.ctrl) {
          this.undo();
        }
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

      // Determine move range - empty commanders move like cavalry (2 tiles)
      const hasActiveUnits = commander.units.some(
        (u) => u !== null && u.status === 'active'
      );
      const maxDistance = hasActiveUnits ? TROOP_STATS[commander.type].moveRange : 2;
      
      if (distance > maxDistance) {
        this.showError(`Too far! Max ${maxDistance} tiles`);
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

      // Save to history
      this.saveToHistory('move', `${commander.type} moved to (${target.x}, ${target.y})`);

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
   * 
   * EXCEPTION: Commander is NOT held if:
   * 1. Commander has no units (empty commanders fight as cavalry and cannot be held)
   * 2. There are multiple adjacent enemy commanders (not just the infantry holder)
   * 3. The infantry owner allows movement (not implemented - requires UI)
   */
  private isCommanderHeld(commanderId: CommanderId): boolean {
    const commander = this.gameState.commanders.get(commanderId);
    if (!commander) return false;

    // Empty commanders (no units) cannot be held - they fight as cavalry
    const hasActiveUnits = commander.units.some(
      (u) => u !== null && u.status === 'active'
    );
    if (!hasActiveUnits) {
      return false;
    }

    // Check all adjacent positions for enemy commanders
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

    let adjacentEnemyInfantry: Commander | null = null;
    let adjacentEnemyCount = 0;

    for (const [id, cmd] of this.gameState.commanders) {
      if (cmd.playerId !== commander.playerId &&
          adjacentPositions.some(pos => pos.x === cmd.position.x && pos.y === cmd.position.y)) {
        adjacentEnemyCount++;
        
        // Only infantry WITH active units can hold other commanders
        // Empty commanders (even infantry type) fight as cavalry and cannot hold
        if (cmd.type === 'infantry') {
          const cmdHasActiveUnits = cmd.units.some(
            (u) => u !== null && u.status === 'active'
          );
          if (cmdHasActiveUnits) {
            adjacentEnemyInfantry = cmd;
          }
        }
      }
    }

    // Held only if:
    // - There is exactly one adjacent enemy infantry
    // - AND there are no other adjacent enemy commanders
    if (adjacentEnemyInfantry && adjacentEnemyCount === 1) {
      return true;
    }

    return false;
  }

  /**
   * Get the commander holding this commander (if any)
   * Returns the holding commander only if this commander is actually held
   */
  private getHoldingCommander(commanderId: CommanderId): Commander | undefined {
    // Only return holding commander if the commander is actually held
    if (!this.isCommanderHeld(commanderId)) {
      return undefined;
    }

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
        // Only return if the infantry has active units (empty commanders cannot hold)
        const cmdHasActiveUnits = cmd.units.some(
          (u) => u !== null && u.status === 'active'
        );
        if (cmdHasActiveUnits) {
          return cmd;
        }
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

      // Check if attacker is empty (no active units) - empty commanders fight as cavalry
      const attackerHasActiveUnits = attacker.units.some(
        (u) => u !== null && u.status === 'active'
      );
      
      // Cavalry moves adjacent to target before attacking
      // Empty commanders (fighting as cavalry) also move adjacent
      if (attacker.type === 'cavalry' || !attackerHasActiveUnits) {
        const dx = Math.abs(attacker.position.x - defender.position.x);
        const dy = Math.abs(attacker.position.y - defender.position.y);
        const distance = Math.max(dx, dy);
        
        if (distance > 1) {
          // Find adjacent position to move to
          const adjacentPos = this.findAdjacentPosition(attacker.position, defender.position);
          if (adjacentPos) {
            // Move attacker to adjacent position
            const newCommanders = new Map(this.gameState.commanders);
            newCommanders.set(attackerId, {
              ...attacker,
              position: adjacentPos,
            });
            this.gameState = {
              ...this.gameState,
              commanders: newCommanders,
            };
            const msg = !attackerHasActiveUnits ? 'Kommandeur (als Kavallerie) rückt vor!' : 'Kavallerie rückt vor!';
            this.showMessage(msg, 'info');
          }
        }
      }

      // Note: Held commanders can attack any target, not just the holder

      // Create RNG for combat
      const rng = createRNG(Date.now());

      // Resolve combat
      const combatResult = resolveCombat(this.gameState, attackerId, defenderId, rng);

      // Helper to translate troop type
      const translateTroopType = (type: string, hasUnits: boolean): string => {
        // Empty commanders fight as cavalry
        if (!hasUnits) return 'Kavallerie';
        switch (type) {
          case 'infantry': return 'Infanterie';
          case 'cavalry': return 'Kavallerie';
          case 'archer': return 'Bogenschütze';
          default: return type;
        }
      };

      // Check if commanders have units
      const attackerHasUnits = attacker.units.some(
        (u) => u !== null && u.status === 'active'
      );
      const defenderHasUnits = defender.units.some(
        (u) => u !== null && u.status === 'active'
      );

      // Get names and colors for animation
      // Empty commanders are displayed as "Kavallerie"
      const attackerName = `${attacker.isKing ? 'König ' : ''}${translateTroopType(attacker.type, attackerHasUnits)}`;
      const defenderName = `${defender.isKing ? 'König ' : ''}${translateTroopType(defender.type, defenderHasUnits)}`;
      
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

      // Save to history after combat
      this.saveToHistory('attack', `${attacker.type} attacked ${defender.type}`);

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

      // Check if attacker has units (empty commanders fight as cavalry)
      const attackerHasUnits = attacker.units.some(
        (u) => u !== null && u.status === 'active'
      );
      
      // Check range - cavalry (and empty commanders) can attack from distance 2
      // Other units must be adjacent (distance 1)
      const distance = Math.max(
        Math.abs(attacker.position.x - banner.position.x),
        Math.abs(attacker.position.y - banner.position.y)
      );
      
      const maxAttackDistance = (attacker.type === 'cavalry' || !attackerHasUnits) ? 2 : 1;

      if (distance > maxAttackDistance) {
        this.showError(`Must be within ${maxAttackDistance} tiles to capture banner`);
        return;
      }
      
      // Cavalry moves adjacent to banner before capturing (if not already adjacent)
      if ((attacker.type === 'cavalry' || !attackerHasUnits) && distance > 1) {
        const adjacentPos = this.findAdjacentPosition(attacker.position, banner.position);
        if (adjacentPos) {
          // Move attacker to adjacent position
          const newCommanders = new Map(this.gameState.commanders);
          newCommanders.set(attackerId, {
            ...attacker,
            position: adjacentPos,
          });
          this.gameState = {
            ...this.gameState,
            commanders: newCommanders,
          };
          const msg = !attackerHasUnits ? 'Kommandeur (als Kavallerie) rückt zum Banner vor!' : 'Kavallerie rückt zum Banner vor!';
          this.showMessage(msg, 'info');
        }
      }

      // Check troop type (archers cannot capture banners - Spec 005)
      // Also check if empty commander - they fight as cavalry and CAN capture
      const attackerHasUnitsForCheck = attacker.units.some(
        (u) => u !== null && u.status === 'active'
      );
      if (attacker.type === 'archer' && attackerHasUnitsForCheck) {
        this.showError('Archers cannot capture banners in melee');
        return;
      }

      // Reload attacker (position may have changed if cavalry moved)
      const updatedAttacker = this.gameState.commanders.get(attackerId);
      if (!updatedAttacker) {
        this.showError('Attacker not found after movement');
        return;
      }

      // Capture the banner - attacker moves to banner position
      const updatedBanners = new Map(this.gameState.banners);
      updatedBanners.set(banner.id, { ...banner, status: 'captured' });

      // Move attacker to banner position and mark as acted
      const updatedCommanders = new Map(this.gameState.commanders);
      updatedCommanders.set(attackerId, { 
        ...updatedAttacker, 
        position: { ...banner.position },
        hasActedThisTurn: true 
      });

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

      // Save to history
      this.saveToHistory('capture', 'Banner captured');

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

      // Save to history
      this.saveToHistory('turn_end', `Turn ended - ${nextPlayer?.name}'s turn`);

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
   * Also checks if a king was defeated and ends the game immediately
   */
  private checkVictoryConditions(): void {
    // Check if game is already finished
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
        
        // Show game results
        this.showGameResults();
      }
      return;
    }
    
    // Check if a king was defeated - end game immediately
    for (const player of this.gameState.players) {
      // Check if player's king still exists
      let kingExists = false;
      for (const commanderId of player.commanders) {
        const commander = this.gameState.commanders.get(commanderId);
        if (commander?.isKing) {
          kingExists = true;
          break;
        }
      }
      
      if (!kingExists) {
        // King was defeated - end game
        const winner = this.gameState.players.find(p => p.id !== player.id);
        if (winner) {
          // Set game as finished
          this.gameState = {
            ...this.gameState,
            gameStatus: 'finished',
            winner: winner.id,
          };
          
          this.addLogEntry({
            type: 'victory',
            message: `🎉 ${winner.name} wins! König ${player.name} wurde besiegt!`,
          });

          // Notify callbacks
          this.onVictoryCallbacks.forEach(cb => cb(winner.name));

          this.showMessage(`🎉 ${winner.name} wins! König besiegt!`, 'success');
          
          // Show game results
          this.showGameResults();
        }
        return;
      }
    }
    
    // Check if a banner was captured
    for (const player of this.gameState.players) {
      let hasStandingBanner = false;
      for (const banner of this.gameState.banners.values()) {
        if (banner.playerId === player.id && banner.status === 'standing') {
          hasStandingBanner = true;
          break;
        }
      }
      
      if (!hasStandingBanner) {
        // Banner captured - end game
        const winner = this.gameState.players.find(p => p.id !== player.id);
        if (winner) {
          // Set game as finished
          this.gameState = {
            ...this.gameState,
            gameStatus: 'finished',
            winner: winner.id,
          };
          
          this.addLogEntry({
            type: 'victory',
            message: `🎉 ${winner.name} wins! Banner von ${player.name} erobert!`,
          });

          // Notify callbacks
          this.onVictoryCallbacks.forEach(cb => cb(winner.name));

          this.showMessage(`🎉 ${winner.name} wins! Banner erobert!`, 'success');
          
          // Show game results
          this.showGameResults();
        }
        return;
      }
    }
  }
  
  /**
   * Show game results dialog
   */
  private showGameResults(): void {
    const results = calculateGameResults(this.gameState);
    if (!results) return;
    
    // Create results display in the renderer
    this.renderer.showGameResults(results);
  }

  /**
   * Find adjacent position to target for cavalry to move to before attacking
   */
  private findAdjacentPosition(from: Position, to: Position): Position | undefined {
    // Get all 8 adjacent positions around target
    const adjacentPositions = [
      { x: to.x - 1, y: to.y },
      { x: to.x + 1, y: to.y },
      { x: to.x, y: to.y - 1 },
      { x: to.x, y: to.y + 1 },
      { x: to.x - 1, y: to.y - 1 },
      { x: to.x + 1, y: to.y - 1 },
      { x: to.x - 1, y: to.y + 1 },
      { x: to.x + 1, y: to.y + 1 },
    ];

    // Filter out positions that are occupied
    const availablePositions = adjacentPositions.filter(pos => {
      // Check if position is within board bounds
      if (pos.x < 0 || pos.x >= 24 || pos.y < 0 || pos.y >= 24) {
        return false;
      }

      // Check if position is occupied by another commander
      for (const cmd of this.gameState.commanders.values()) {
        if (cmd.position.x === pos.x && cmd.position.y === pos.y) {
          return false;
        }
      }

      // Check if position has a standing banner
      for (const banner of this.gameState.banners.values()) {
        if (banner.position.x === pos.x &&
            banner.position.y === pos.y &&
            banner.status === 'standing') {
          return false;
        }
      }

      return true;
    });

    // Find the closest available position to the attacker
    let closestPos: Position | undefined;
    let minDistance = Infinity;

    for (const pos of availablePositions) {
      const distance = Math.max(
        Math.abs(from.x - pos.x),
        Math.abs(from.y - pos.y)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPos = pos;
      }
    }

    return closestPos;
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
