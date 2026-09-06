/**
 * apps/prototype/src/start-screen.ts
 *
 * Start screen with menu for Lands of Glory
 */

import { applyUIScale, UISize } from './ui-scale';

export type DiceSize = UISize;

export type PlayerCount = 2 | 3 | 4;

export interface GameOptions {
  useTextures: boolean;
  enableSound: boolean;
  showGrid: boolean;
  diceSize: DiceSize;
  playerCount: PlayerCount;
}

export type MenuSelection = 'army-builder' | 'quick-start' | 'options' | null;

export class StartScreen {
  private container: HTMLElement;
  private onSelect: (selection: MenuSelection, options: GameOptions) => void;
  private options: GameOptions;
  private isVisible: boolean = false;

  constructor(
    containerId: string,
    onSelect: (selection: MenuSelection, options: GameOptions) => void
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container #${containerId} not found`);
    }
    this.container = container;
    this.onSelect = onSelect;
    
    // Load saved options or use defaults
    this.options = this.loadOptions();
    
    // Apply UI scale immediately
    applyUIScale(this.options.diceSize);
    
    this.addStyles();
    this.render();
  }

  private loadOptions(): GameOptions {
    const defaults: GameOptions = {
      useTextures: true,
      enableSound: false,
      showGrid: true,
      diceSize: 'large',
      playerCount: 2,
    };
    
    try {
      const saved = localStorage.getItem('lands-of-glory-options');
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          const candidate = parsed as Partial<GameOptions>;
          return {
            useTextures: typeof candidate.useTextures === 'boolean' ? candidate.useTextures : defaults.useTextures,
            enableSound: false,
            showGrid: typeof candidate.showGrid === 'boolean' ? candidate.showGrid : defaults.showGrid,
            diceSize: candidate.diceSize === 'small' || candidate.diceSize === 'medium' || candidate.diceSize === 'large'
              ? candidate.diceSize : defaults.diceSize,
            playerCount: candidate.playerCount === 2 || candidate.playerCount === 3 || candidate.playerCount === 4
              ? candidate.playerCount : defaults.playerCount,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load options:', e);
    }
    return defaults;
  }

  private saveOptions(): void {
    try {
      localStorage.setItem('lands-of-glory-options', JSON.stringify(this.options));
    } catch (e) {
      console.warn('Failed to save options:', e);
    }
  }

  show(): void {
    console.log('StartScreen.show() called');
    this.isVisible = true;
    this.container.style.display = 'block';
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
    console.log('Start screen should now be visible');
  }

  hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  getOptions(): GameOptions {
    console.log('Getting options:', this.options);
    return { ...this.options };
  }

  private render(): void {
    console.log('StartScreen.render() called, container:', this.container);
    this.container.innerHTML = `
      <div class="start-screen">
        <div class="start-screen-content">
          <h1 class="game-title">Lands of Glory</h1>
          <p class="game-subtitle">Taktisches Strategiespiel</p>
          
          <div class="menu-container">
            <button class="menu-btn btn-army-builder" data-action="army-builder" data-testid="army-builder">
              <span class="btn-icon">⚔️</span>
              <span class="btn-text">Einheiten zusammenstellen</span>
              <span class="btn-desc">Erstelle deine eigene Armee</span>
            </button>
            
            <button class="menu-btn btn-quick-start" data-action="quick-start" data-testid="quick-start">
              <span class="btn-icon">⚡</span>
              <span class="btn-text">Schnellstart</span>
              <span class="btn-desc">Starte sofort mit Standard-Armeen</span>
            </button>
            
            <button class="menu-btn btn-options" data-action="options" data-testid="options">
              <span class="btn-icon">⚙️</span>
              <span class="btn-text">Optionen</span>
              <span class="btn-desc">Spieleinstellungen anpassen</span>
            </button>
          </div>
          
          <div class="version-info">Version 1.0</div>
        </div>
        
        <!-- Options Modal -->
        <div class="options-modal" style="display: none;">
          <div class="options-content">
            <h2>Optionen</h2>
            
            <div class="option-item">
              <label class="option-label" for="opt-textures">
                <input type="checkbox" id="opt-textures" name="useTextures" ${this.options.useTextures ? 'checked' : ''}>
                <span class="checkmark"></span>
                <span class="option-text">Texturen verwenden</span>
              </label>
              <span class="option-desc">Detaillierte Gras-Texturen auf dem Spielfeld</span>
            </div>
            
            <div class="option-item">
              <label class="option-label" for="opt-sound">
                <input type="checkbox" id="opt-sound" name="enableSound" ${this.options.enableSound ? 'checked' : ''}>
                <span class="checkmark"></span>
                <span class="option-text">Sound aktivieren</span>
              </label>
              <span class="option-desc">Soundeffekte während des Spiels</span>
            </div>
            
            <div class="option-item">
              <label class="option-label" for="opt-grid">
                <input type="checkbox" id="opt-grid" name="showGrid" ${this.options.showGrid ? 'checked' : ''}>
                <span class="checkmark"></span>
                <span class="option-text">Raster anzeigen</span>
              </label>
              <span class="option-desc">Gitter über dem Spielfeld anzeigen</span>
            </div>
            
            <div class="option-item">
              <label class="option-label" for="opt-players">
                <span class="option-text">Spieleranzahl:</span>
              </label>
              <select id="opt-players" name="playerCount" class="player-count-select">
                <option value="2" ${this.options.playerCount === 2 ? 'selected' : ''}>2 Spieler</option>
                <option value="3" ${this.options.playerCount === 3 ? 'selected' : ''}>3 Spieler</option>
                <option value="4" ${this.options.playerCount === 4 ? 'selected' : ''}>4 Spieler</option>
              </select>
              <span class="option-desc">Anzahl der Spieler (2-4)</span>
            </div>
            
            <div class="option-item dice-size-option">
              <label class="option-label dice-label">
                <span class="option-text">UI-Größe:</span>
              </label>
              <div class="dice-size-buttons">
                <button type="button" class="dice-size-btn ${this.options.diceSize === 'small' ? 'active' : ''}" data-size="small" id="dice-small">
                  <span class="dice-preview small">🎲</span>
                  <span>Klein</span>
                </button>
                <button type="button" class="dice-size-btn ${this.options.diceSize === 'medium' ? 'active' : ''}" data-size="medium" id="dice-medium">
                  <span class="dice-preview medium">🎲</span>
                  <span>Mittel</span>
                </button>
                <button type="button" class="dice-size-btn ${this.options.diceSize === 'large' ? 'active' : ''}" data-size="large" id="dice-large">
                  <span class="dice-preview large">🎲</span>
                  <span>Groß</span>
                </button>
              </div>
              <span class="option-desc">Größe aller Menüs und Fenster</span>
            </div>
            
            <div class="options-buttons">
              <button class="btn-save-options">Speichern</button>
              <button class="btn-cancel-options">Abbrechen</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    console.log('Attaching event listeners to start screen');
    
    // Menu buttons
    const menuButtons = this.container.querySelectorAll('.menu-btn');
    console.log(`Found ${menuButtons.length} menu buttons`);
    
    menuButtons.forEach((btn, index) => {
      const button = btn as HTMLElement;
      const action = button.dataset.action;
      console.log(`Button ${index}: action=${action}`);
      
      button.addEventListener('click', (e) => {
        console.log(`Button clicked: ${action}`);
        e.preventDefault();
        e.stopPropagation();
        
        if (action === 'options') {
          this.showOptions();
        } else {
          console.log(`Calling onSelect with action: ${action}`);
          this.onSelect(action as MenuSelection, this.getOptions());
        }
      });
    });

    // Options modal buttons
    const saveBtn = this.container.querySelector('.btn-save-options');
    const cancelBtn = this.container.querySelector('.btn-cancel-options');

    saveBtn?.addEventListener('click', () => {
      this.saveOptionsFromForm();
      this.hideOptions();
    });

    cancelBtn?.addEventListener('click', () => {
      this.hideOptions();
    });

    // Dice size buttons
    const diceSizeButtons = this.container.querySelectorAll('.dice-size-btn');
    diceSizeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const size = target.dataset.size as DiceSize;
        if (size) {
          this.options.diceSize = size;
          // Update visual state
          diceSizeButtons.forEach(b => b.classList.remove('active'));
          target.classList.add('active');
        }
      });
    });

    // Close modal on outside click
    const modal = this.container.querySelector('.options-modal');
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideOptions();
      }
    });
  }

  private showOptions(): void {
    const modal = this.container.querySelector('.options-modal') as HTMLElement;
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  private hideOptions(): void {
    const modal = this.container.querySelector('.options-modal') as HTMLElement;
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private saveOptionsFromForm(): void {
    const texturesCheckbox = this.container.querySelector('#opt-textures') as HTMLInputElement;
    const gridCheckbox = this.container.querySelector('#opt-grid') as HTMLInputElement;
    const playerCountSelect = this.container.querySelector('#opt-players') as HTMLSelectElement;

    this.options = {
      useTextures: texturesCheckbox?.checked ?? true,
      enableSound: false,
      showGrid: gridCheckbox?.checked ?? true,
      diceSize: this.options.diceSize,
      playerCount: parseInt(playerCountSelect?.value ?? '2') as PlayerCount,
    };

    this.saveOptions();
  }

  private addStyles(): void {
    const styleId = 'start-screen-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #opt-sound,
      label[for="opt-sound"],
      label[for="opt-sound"] + .option-desc {
        display: none;
      }

      .start-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 1000;
        overflow: auto;
      }

      .start-screen-content {
        text-align: center;
        max-width: calc(600px * var(--ui-scale, 1));
        width: 90%;
        padding: calc(40px * var(--ui-scale, 1));
        background: rgba(26, 26, 46, 0.9);
        border-radius: calc(20px * var(--ui-scale, 1));
        border: 2px solid #4a4a6a;
        box-shadow: 0 calc(20px * var(--ui-scale, 1)) calc(60px * var(--ui-scale, 1)) rgba(0, 0, 0, 0.5);
        transform-origin: center;
      }

      .game-title {
        font-size: calc(56px * var(--ui-scale, 1));
        font-weight: bold;
        margin: 0 0 calc(10px * var(--ui-scale, 1)) 0;
        background: linear-gradient(45deg, #ffd700, #ffed4a, #ffd700);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 calc(30px * var(--ui-scale, 1)) rgba(255, 215, 0, 0.3);
        letter-spacing: 2px;
      }

      .game-subtitle {
        font-size: calc(18px * var(--ui-scale, 1));
        color: #9ca3af;
        margin: 0 0 calc(40px * var(--ui-scale, 1)) 0;
        letter-spacing: 3px;
        text-transform: uppercase;
      }

      .menu-container {
        display: flex;
        flex-direction: column;
        gap: calc(15px * var(--ui-scale, 1));
        margin-bottom: calc(30px * var(--ui-scale, 1));
      }

      .menu-btn {
        display: flex;
        align-items: center;
        padding: calc(20px * var(--ui-scale, 1)) calc(25px * var(--ui-scale, 1));
        background: linear-gradient(135deg, #2a2a4a 0%, #1e1e3a 100%);
        border: 2px solid #4a4a6a;
        border-radius: calc(12px * var(--ui-scale, 1));
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
        color: #fff;
        position: relative;
        z-index: 10;
        pointer-events: auto;
      }

      .menu-btn:hover {
        background: linear-gradient(135deg, #3a3a5a 0%, #2e2e4a 100%);
        border-color: #6a6a8a;
        transform: translateY(calc(-2px * var(--ui-scale, 1)));
        box-shadow: 0 calc(8px * var(--ui-scale, 1)) calc(25px * var(--ui-scale, 1)) rgba(0, 0, 0, 0.3);
      }

      .menu-btn:active {
        transform: translateY(0);
      }

      .btn-icon {
        font-size: calc(32px * var(--ui-scale, 1));
        margin-right: calc(20px * var(--ui-scale, 1));
        width: calc(50px * var(--ui-scale, 1));
        text-align: center;
      }

      .btn-text {
        font-size: calc(20px * var(--ui-scale, 1));
        font-weight: bold;
        flex: 1;
      }

      .btn-desc {
        font-size: calc(13px * var(--ui-scale, 1));
        color: #9ca3af;
        margin-left: auto;
      }

      .btn-army-builder:hover {
        border-color: #4ade80;
        box-shadow: 0 calc(8px * var(--ui-scale, 1)) calc(25px * var(--ui-scale, 1)) rgba(74, 222, 128, 0.2);
      }

      .btn-quick-start:hover {
        border-color: #fbbf24;
        box-shadow: 0 calc(8px * var(--ui-scale, 1)) calc(25px * var(--ui-scale, 1)) rgba(251, 191, 36, 0.2);
      }

      .btn-options:hover {
        border-color: #60a5fa;
        box-shadow: 0 calc(8px * var(--ui-scale, 1)) calc(25px * var(--ui-scale, 1)) rgba(96, 165, 250, 0.2);
      }

      .version-info {
        font-size: calc(12px * var(--ui-scale, 1));
        color: #6b7280;
      }

      /* Options Modal */
      .options-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1100;
      }

      .options-content {
        background: #1a1a2e;
        border: 2px solid #4a4a6a;
        border-radius: calc(16px * var(--ui-scale, 1));
        padding: calc(30px * var(--ui-scale, 1)) calc(40px * var(--ui-scale, 1));
        max-width: calc(450px * var(--ui-scale, 1));
        width: 90%;
        box-shadow: 0 calc(20px * var(--ui-scale, 1)) calc(60px * var(--ui-scale, 1)) rgba(0, 0, 0, 0.5);
      }

      .options-content h2 {
        margin: 0 0 calc(25px * var(--ui-scale, 1)) 0;
        color: #ffd700;
        font-size: calc(28px * var(--ui-scale, 1));
        text-align: center;
      }

      .option-item {
        margin-bottom: calc(25px * var(--ui-scale, 1));
      }

      .option-label {
        display: flex;
        align-items: center;
        cursor: pointer;
        position: relative;
        padding-left: calc(35px * var(--ui-scale, 1));
      }

      .option-label input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }

      .checkmark {
        position: absolute;
        left: 0;
        height: calc(24px * var(--ui-scale, 1));
        width: calc(24px * var(--ui-scale, 1));
        background-color: #2a2a4a;
        border: 2px solid #4a4a6a;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .option-label:hover input ~ .checkmark {
        border-color: #6a6a8a;
      }

      .option-label input:checked ~ .checkmark {
        background-color: #4ade80;
        border-color: #4ade80;
      }

      .checkmark:after {
        content: "";
        position: absolute;
        display: none;
        left: calc(7px * var(--ui-scale, 1));
        top: calc(3px * var(--ui-scale, 1));
        width: calc(6px * var(--ui-scale, 1));
        height: calc(12px * var(--ui-scale, 1));
        border: solid #1a1a2e;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }

      .option-label input:checked ~ .checkmark:after {
        display: block;
      }

      .option-text {
        font-size: calc(16px * var(--ui-scale, 1));
        color: #fff;
        font-weight: 600;
      }

      .option-desc {
        display: block;
        font-size: calc(13px * var(--ui-scale, 1));
        color: #9ca3af;
        margin-top: calc(5px * var(--ui-scale, 1));
        margin-left: calc(35px * var(--ui-scale, 1));
      }

      .options-buttons {
        display: flex;
        gap: calc(15px * var(--ui-scale, 1));
        margin-top: calc(30px * var(--ui-scale, 1));
      }

      .options-buttons button {
        flex: 1;
        padding: calc(12px * var(--ui-scale, 1)) calc(24px * var(--ui-scale, 1));
        border: none;
        border-radius: calc(8px * var(--ui-scale, 1));
        font-size: calc(16px * var(--ui-scale, 1));
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-save-options {
        background: #4ade80;
        color: #1a1a2e;
      }

      .btn-save-options:hover {
        background: #22c55e;
      }

      .btn-cancel-options {
        background: #4a4a6a;
        color: #fff;
      }

      .btn-cancel-options:hover {
        background: #5a5a7a;
      }

      .player-count-select {
        width: 100%;
        padding: 8px 12px;
        background: #2a2a4a;
        border: 2px solid #4a4a6a;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        margin-top: 8px;
        cursor: pointer;
      }

      .player-count-select:focus {
        outline: none;
        border-color: #4ade80;
      }

      .player-count-select option {
        background: #1a1a2e;
        color: #fff;
      }

      .dice-size-option {
        margin-top: 20px;
      }

      .dice-label {
        margin-bottom: 10px;
        padding-left: 0 !important;
      }

      .dice-size-buttons {
        display: flex;
        gap: 10px;
        margin-top: 8px;
        margin-left: 35px;
      }

      .dice-size-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 10px 15px;
        background: #2a2a4a;
        border: 2px solid #4a4a6a;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        color: #fff;
        font-size: 12px;
        min-width: 60px;
      }

      .dice-size-btn:hover {
        background: #3a3a5a;
        border-color: #6a6a8a;
      }

      .dice-size-btn.active {
        background: #4ade80;
        border-color: #4ade80;
        color: #1a1a2e;
      }

      .dice-preview {
        display: block;
        line-height: 1;
      }

      .dice-preview.small {
        font-size: 16px;
      }

      .dice-preview.medium {
        font-size: 24px;
      }

      .dice-preview.large {
        font-size: 32px;
      }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    this.container.innerHTML = '';
    const style = document.getElementById('start-screen-styles');
    if (style) {
      style.remove();
    }
  }
}

/**
 * Show start screen
 */
export function showStartScreen(
  containerId: string,
  onSelect: (selection: MenuSelection, options: GameOptions) => void
): StartScreen {
  const screen = new StartScreen(containerId, onSelect);
  screen.show();
  return screen;
}
