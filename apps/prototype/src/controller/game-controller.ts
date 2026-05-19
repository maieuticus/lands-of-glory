/**
 * apps/prototype/src/controller/game-controller.ts
 *
 * Game controller for input handling and state management
 *
 * Responsible for:
 * - Translating input events into game actions
 * - Managing game state transitions
 * - Coordinating between renderer and game-core
 * - Handling validation and error display
 */

import {
  GameState,
  Position,
  CommanderId,
  createGame,
  startGame,
  endTurn,
  GameConfig,
  GameRuleError,
} from '@lands-of-glory/game-core';
import { GameRenderer, UIState } from '../renderer/game-renderer';

/**
 * Game controller
 */
export class GameController {
  private gameState: GameState;
  private renderer: GameRenderer;
  private uiState: UIState = { debugEnabled: false };
  private selectedCommanderId?: CommanderId;

  constructor(gameState: GameState, renderer: GameRenderer) {
    this.gameState = gameState;
    this.renderer = renderer;
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
   * Initialize game and start playing
   */
  initializeGame(): void {
    this.gameState = startGame(this.gameState);
    this.render();
  }

  /**
   * Handle tile click
   */
  handleTileClick(position: Position, button: number = 0): void {
    if (button !== 0) return;

    const selectedId = this.selectedCommanderId;
    if (!selectedId) {
      // No commander selected, try to select one at this position
      this.selectCommanderAtPosition(position);
      return;
    }

    // Try to move selected commander
    this.tryMoveCommander(selectedId, position);
  }

  /**
   * Handle commander click
   */
  handleCommanderClick(commanderId: CommanderId, button: number = 0): void {
    if (button === 0) {
      // Left click: select commander
      this.selectedCommanderId = commanderId;
    } else if (button === 2) {
      // Right click: deselect
      this.selectedCommanderId = undefined;
    }

    this.render();
  }

  /**
   * Handle key press
   */
  handleKeyDown(key: string, modifiers: { shift: boolean; ctrl: boolean; alt: boolean }): void {
    switch (key.toUpperCase()) {
      case 'D':
        // Toggle debug mode
        this.uiState.debugEnabled = !this.uiState.debugEnabled;
        this.render();
        break;
      case 'E':
        // End turn
        this.tryEndTurn();
        break;
      case 'ESCAPE':
        // Deselect
        this.selectedCommanderId = undefined;
        this.render();
        break;
    }
  }

  /**
   * Select a commander at a given position
   */
  private selectCommanderAtPosition(position: Position): void {
    // Find commander at position
    for (const commander of this.gameState.commanders.values()) {
      if (commander.position.x === position.x && commander.position.y === position.y) {
        // Check if it's this player's commander
        const activePlayer = this.gameState.players.find((p) => p.id === this.gameState.activePlayerId);
        if (activePlayer && activePlayer.commanders.includes(commander.id)) {
          this.selectedCommanderId = commander.id;
          this.render();
          return;
        }
      }
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

      // Validate it's a valid move
      const distance = Math.max(
        Math.abs(commander.position.x - target.x),
        Math.abs(commander.position.y - target.y)
      );

      if (distance === 0) {
        this.showError('Already at that position');
        return;
      }

      if (distance > 3) {
        this.showError('Move too far');
        return;
      }

      // For now, simple implementation: just update position
      const newGameState = {
        ...this.gameState,
        commanders: new Map(this.gameState.commanders),
      };

      const updatedCommander = {
        ...commander,
        position: target,
      };

      newGameState.commanders.set(commanderId, updatedCommander);
      this.gameState = newGameState;

      this.showMessage('Commander moved', 'success');
      this.render();
    } catch (error) {
      if (error instanceof GameRuleError) {
        this.showError(error.message);
      } else {
        this.showError('An error occurred');
      }
    }
  }

  /**
   * Try to end current turn
   */
  private tryEndTurn(): void {
    try {
      this.gameState = endTurn(this.gameState);
      this.selectedCommanderId = undefined;
      this.showMessage('Turn ended', 'info');
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
   * Show error message to player
   */
  private showError(message: string): void {
    console.error(message);
    // TODO: Display in UI
  }

  /**
   * Show message to player
   */
  private showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Display in UI
  }

  /**
   * Render current game state
   */
  private render(): void {
    this.uiState.selectedCommanderId = this.selectedCommanderId;
    this.renderer.render(this.gameState, this.uiState);
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.renderer.dispose();
  }
}

/**
 * Create a game controller
 *
 * @param config - Game configuration
 * @param renderer - Game renderer
 * @returns GameController instance
 */
export function createGameController(
  config: GameConfig,
  renderer: GameRenderer
): GameController {
  const gameState = createGame(config);
  return new GameController(gameState, renderer);
}
