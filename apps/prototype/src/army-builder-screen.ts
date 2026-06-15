/**
 * apps/prototype/src/army-builder-screen.ts
 *
 * Army Builder Screen for pre-game configuration
 */

import {
  ArmyConfig,
  getDefaultArmyConfig,
  PlayerConfig,
  DEFAULT_STARTING_BUDGET,
} from '@lands-of-glory/game-core';
import { ArmyBuilderUI, createArmyBuilderStyles, ArmyBuilderCallback } from './army-builder-ui';

/**
 * Callback when army builder is complete
 */
export type ArmyBuilderCompleteCallback = (configs: ArmyConfig[]) => void;

/**
 * Army Builder Screen Controller
 * Manages the army configuration for all players before game start
 */
export class ArmyBuilderScreen {
  private container: HTMLElement;
  private playerConfigs: PlayerConfig[];
  private budget: number;
  private onComplete: ArmyBuilderCompleteCallback;
  private onCancel: () => void;
  
  private currentPlayerIndex: number = 0;
  private playerArmies: ArmyConfig[] = [];
  private armyBuilderUI?: ArmyBuilderUI;

  constructor(
    containerId: string,
    playerConfigs: PlayerConfig[],
    onComplete: ArmyBuilderCompleteCallback,
    onCancel: () => void,
    budget: number = DEFAULT_STARTING_BUDGET
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container #${containerId} not found`);
    }
    this.container = container;
    this.playerConfigs = playerConfigs;
    this.budget = budget;
    this.onComplete = onComplete;
    this.onCancel = onCancel;
    
    // Initialize with default armies
    this.playerArmies = playerConfigs.map(() => getDefaultArmyConfig());
    
    // Add styles to document
    if (!document.getElementById('army-builder-styles')) {
      const styles = createArmyBuilderStyles();
      styles.id = 'army-builder-styles';
      document.head.appendChild(styles);
    }
    
    this.render();
  }

  /**
   * Render the army builder screen
   */
  private render(): void {
    const currentPlayer = this.playerConfigs[this.currentPlayerIndex];
    const isLastPlayer = this.currentPlayerIndex === this.playerConfigs.length - 1;
    
    this.container.innerHTML = `
      <div class="army-builder-screen">
        <div class="army-builder-nav">
          ${this.playerConfigs.map((player, index) => `
            <div class="nav-item ${index === this.currentPlayerIndex ? 'active' : ''} ${index < this.currentPlayerIndex ? 'completed' : ''}">
              <span class="nav-number">${index < this.currentPlayerIndex ? '✓' : index + 1}</span>
              <span class="nav-name" style="color: ${player.color}">${player.name}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="army-builder-player-header">
          <h1>${currentPlayer.name} - Armee zusammenstellen</h1>
          <div class="player-indicator" style="background: ${currentPlayer.color}"></div>
        </div>
        
        <div id="army-builder-container"></div>
        
        <div class="army-builder-footer">
          <button class="btn-cancel">Abbrechen</button>
          <div class="nav-buttons">
            ${this.currentPlayerIndex > 0 ? `
              <button class="btn-prev">← Zurück</button>
            ` : ''}
            <button class="btn-next ${isLastPlayer ? 'btn-start' : ''}">
              ${isLastPlayer ? 'Spiel starten!' : 'Weiter →'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Add screen styles
    this.addScreenStyles();
    
    // Initialize army builder UI
    this.initArmyBuilder();
    
    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Initialize the army builder UI for the current player
   */
  private initArmyBuilder(): void {
    const callback: ArmyBuilderCallback = (config, isValid) => {
      this.playerArmies[this.currentPlayerIndex] = config;
      // Update next button state
      const nextBtn = this.container.querySelector('.btn-next') as HTMLButtonElement;
      if (nextBtn) {
        nextBtn.disabled = !isValid;
      }
    };

    this.armyBuilderUI = new ArmyBuilderUI(
      'army-builder-container',
      this.budget,
      this.playerArmies[this.currentPlayerIndex],
      callback
    );

    // Set initial button state
    const nextBtn = this.container.querySelector('.btn-next') as HTMLButtonElement;
    if (nextBtn) {
      nextBtn.disabled = !this.armyBuilderUI.isValid();
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Cancel button
    const cancelBtn = this.container.querySelector('.btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.onCancel());
    }

    // Previous button
    const prevBtn = this.container.querySelector('.btn-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.handlePrevious());
    }

    // Next/Start button
    const nextBtn = this.container.querySelector('.btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.handleNext());
    }
  }

  /**
   * Handle previous button click
   */
  private handlePrevious(): void {
    if (this.currentPlayerIndex > 0) {
      this.currentPlayerIndex--;
      this.render();
    }
  }

  /**
   * Handle next button click
   */
  private handleNext(): void {
    // Save current army
    if (this.armyBuilderUI) {
      this.playerArmies[this.currentPlayerIndex] = this.armyBuilderUI.getConfig();
    }

    if (this.currentPlayerIndex < this.playerConfigs.length - 1) {
      // Go to next player
      this.currentPlayerIndex++;
      this.render();
    } else {
      // All players configured, start game
      this.onComplete(this.playerArmies);
    }
  }

  /**
   * Add screen-specific styles
   */
  private addScreenStyles(): void {
    const styleId = 'army-builder-screen-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .army-builder-screen {
        min-height: 100vh;
        max-height: 100vh;
        background: #0f0f1e;
        padding: 20px;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
      }

      .army-builder-screen::-webkit-scrollbar {
        width: 10px;
      }

      .army-builder-screen::-webkit-scrollbar-track {
        background: #0f0f1e;
        border-radius: 5px;
      }

      .army-builder-screen::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 5px;
        border: 2px solid #0f0f1e;
      }

      .army-builder-screen::-webkit-scrollbar-thumb:hover {
        background: #555;
      }

      .army-builder-nav {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-bottom: 30px;
        padding: 20px;
        background: #1a1a2e;
        border-radius: 8px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        border-radius: 4px;
        background: #252540;
        opacity: 0.5;
      }

      .nav-item.active {
        opacity: 1;
        background: #33335c;
        box-shadow: 0 0 0 2px #4ade80;
      }

      .nav-item.completed {
        opacity: 1;
        background: #1e3a2f;
      }

      .nav-number {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #444;
        border-radius: 50%;
        font-size: 12px;
        font-weight: bold;
      }

      .nav-item.completed .nav-number {
        background: #4ade80;
        color: #1a1a2e;
      }

      .nav-item.active .nav-number {
        background: #4ade80;
        color: #1a1a2e;
      }

      .nav-name {
        font-weight: bold;
      }

      .army-builder-player-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        margin-bottom: 20px;
      }

      .army-builder-player-header h1 {
        margin: 0;
        color: #fff;
      }

      .player-indicator {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid #fff;
      }

      .army-builder-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 2px solid #333;
      }

      .btn-cancel {
        padding: 12px 24px;
        background: #6b7280;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      }

      .btn-cancel:hover {
        background: #4b5563;
      }

      .nav-buttons {
        display: flex;
        gap: 10px;
      }

      .btn-prev,
      .btn-next {
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.2s;
      }

      .btn-prev {
        background: #4b5563;
        color: #fff;
      }

      .btn-prev:hover {
        background: #374151;
      }

      .btn-next {
        background: #3b82f6;
        color: #fff;
      }

      .btn-next:hover:not(:disabled) {
        background: #2563eb;
      }

      .btn-next:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-next.btn-start {
        background: #4ade80;
        color: #1a1a2e;
      }

      .btn-next.btn-start:hover:not(:disabled) {
        background: #22c55e;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Destroy the screen and clean up
   */
  destroy(): void {
    if (this.armyBuilderUI) {
      this.armyBuilderUI.destroy();
    }
    this.container.innerHTML = '';
  }
}

/**
 * Show the army builder screen
 * Returns a promise that resolves with the army configurations
 */
export function showArmyBuilder(
  containerId: string,
  playerConfigs: PlayerConfig[],
  budget: number = DEFAULT_STARTING_BUDGET
): Promise<ArmyConfig[]> {
  return new Promise((resolve, reject) => {
    const screen = new ArmyBuilderScreen(
      containerId,
      playerConfigs,
      (configs) => {
        screen.destroy();
        resolve(configs);
      },
      () => {
        screen.destroy();
        reject(new Error('Army builder cancelled'));
      },
      budget
    );
  });
}
