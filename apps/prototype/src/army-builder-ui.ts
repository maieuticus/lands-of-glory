/**
 * apps/prototype/src/army-builder-ui.ts
 *
 * Army Builder UI for Lands of Glory
 * Allows players to configure their armies within a gold budget
 */

import {
  ArmyConfig,
  CommanderBuildConfig,
  UnitBuildConfig,
  ArmyValidationResult,
  calculateArmyCost,
  validateArmyConfig,
  getDefaultArmyConfig,
  createEmptyCommanderConfig,
  addUnitToCommanderConfig,
  TroopType,
  DEFAULT_STARTING_BUDGET,
  ARMY_BUILDER_COSTS,
  MAX_ARMY_COMMANDERS,
} from '@lands-of-glory/game-core';

/**
 * Callback when army configuration changes
 */
export type ArmyBuilderCallback = (config: ArmyConfig, isValid: boolean) => void;

/**
 * Army Builder UI Controller
 */
export class ArmyBuilderUI {
  private container: HTMLElement;
  private budget: number;
  private currentConfig: ArmyConfig;
  private callback: ArmyBuilderCallback;
  private validation: ArmyValidationResult;

  constructor(
    containerId: string,
    budget: number = DEFAULT_STARTING_BUDGET,
    initialConfig: ArmyConfig = getDefaultArmyConfig(),
    callback: ArmyBuilderCallback
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container #${containerId} not found`);
    }
    this.container = container;
    this.budget = budget;
    this.currentConfig = this.cloneConfig(initialConfig);
    this.callback = callback;
    this.validation = validateArmyConfig(this.currentConfig, this.budget);
    
    this.render();
  }

  /**
   * Get the current army configuration
   */
  getConfig(): ArmyConfig {
    return this.cloneConfig(this.currentConfig);
  }

  /**
   * Check if the current configuration is valid
   */
  isValid(): boolean {
    return this.validation.valid;
  }

  /**
   * Get the current budget
   */
  getBudget(): number {
    return this.budget;
  }

  /**
   * Clone an army configuration
   */
  private cloneConfig(config: ArmyConfig): ArmyConfig {
    return {
      commanders: config.commanders.map(cmd => ({
        type: cmd.type,
        troopType: cmd.troopType,
        slots: cmd.slots.map(slot => ({ ...slot })),
      })),
    };
  }

  /**
   * Update the configuration and re-render
   */
  private updateConfig(newConfig: ArmyConfig): void {
    this.currentConfig = this.cloneConfig(newConfig);
    this.validation = validateArmyConfig(this.currentConfig, this.budget);
    this.callback(this.getConfig(), this.validation.valid);
    this.render();
  }

  /**
   * Render the army builder UI
   */
  private render(): void {
    // Remove focus from any element to prevent auto-scrolling
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Save scroll position before re-render
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    const cost = this.validation.cost;
    const remainingBudget = this.validation.remainingBudget;

    this.container.innerHTML = `
      <div class="army-builder">
        <div class="army-builder-top-bar">
          <div class="budget-display ${remainingBudget < 0 ? 'over-budget' : ''}">
            <span class="budget-label">Gold:</span>
            <span class="budget-value">${cost.totalCost} / ${this.budget}</span>
            <span class="budget-remaining">(${remainingBudget >= 0 ? '+' : ''}${remainingBudget})</span>
          </div>
          <div class="budget-slider">
            <label for="budget-slider">Budget:</label>
            <input type="range" id="budget-slider" name="budget" min="20" max="50" value="${this.budget}" step="5">
            <span class="budget-slider-value">${this.budget}</span>
          </div>
        </div>

        ${this.validation.errors.length > 0 ? `
          <div class="validation-errors">
            ${this.validation.errors.map(err => `<div class="error">${err}</div>`).join('')}
          </div>
        ` : ''}

        <div class="commanders-list">
          ${this.currentConfig.commanders.map((cmd, index) => this.renderCommander(cmd, index)).join('')}
        </div>

        <div class="army-builder-actions">
          <button class="btn-add-captain" ${remainingBudget < ARMY_BUILDER_COSTS.captain || this.currentConfig.commanders.length >= MAX_ARMY_COMMANDERS ? 'disabled' : ''}>
            + Hauptmann (1 Gold)
          </button>
          <button class="btn-reset">Zurücksetzen</button>
        </div>

        <div class="cost-rules compact">
          <span>König: Kostenlos</span>
          <span>Hauptmann: 1 Gold</span>
          <span>Einheit: 1 Gold</span>
          <span>Stärke: 1 Gold</span>
          <span class="bonus-rule">Infanterie: 4. Einheit gratis</span>
        </div>
      </div>
    `;

    this.attachEventListeners();
    
    // Restore scroll position after re-render (multiple times to ensure it sticks)
    const restoreScroll = () => window.scrollTo(0, scrollY);
    restoreScroll();
    requestAnimationFrame(restoreScroll);
    setTimeout(restoreScroll, 10);
  }

  /**
   * Render a single commander card
   */
  private renderCommander(cmd: CommanderBuildConfig, index: number): string {
    const unitCount = cmd.slots.filter(s => s.hasUnit).length;
    const isKing = cmd.type === 'king';
    const canDelete = !isKing;

    const typeNames: Record<TroopType, string> = {
      infantry: 'Infanterie',
      cavalry: 'Kavallerie',
      archer: 'Bogenschützen',
    };

    const canGetFreeUnit = cmd.troopType === 'infantry';

    return `
      <div class="commander-card ${isKing ? 'king' : 'captain'}">
        <div class="commander-header">
          <span class="commander-type-badge ${cmd.type}">${isKing ? '👑 König' : '⚔️ Hauptmann'}</span>
          <span class="commander-troop-type ${cmd.troopType}">${typeNames[cmd.troopType]}</span>
          ${canDelete ? `<button class="btn-remove-commander" data-index="${index}">×</button>` : ''}
        </div>

        <div class="commander-troop-selector">
          ${(['infantry', 'cavalry', 'archer'] as TroopType[]).map(type => `
            <button 
              class="troop-btn ${type} ${cmd.troopType === type ? 'active' : ''}"
              data-commander="${index}"
              data-troop="${type}"
            >
              ${typeNames[type]}
            </button>
          `).join('')}
        </div>

        <div class="commander-units">
          ${cmd.slots.map((slot, slotIndex) => this.renderUnitSlot(cmd, index, slot, slotIndex, unitCount)).join('')}
        </div>

        <div class="unit-count">
          Einheiten: ${unitCount}/4
          ${unitCount === 3 && canGetFreeUnit ? '<span class="bonus-indicator">+1 Gratis (Infanterie)!</span>' : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render a single unit slot
   */
  private renderUnitSlot(
    cmd: CommanderBuildConfig,
    cmdIndex: number,
    slot: UnitBuildConfig,
    slotIndex: number,
    unitCount: number
  ): string {
    if (slot.hasUnit) {
      return `
        <div class="unit-slot filled">
          <div class="unit-avatar ${cmd.troopType}"></div>
          <div class="unit-strength">
            <label for="strength-cmd${cmdIndex}-slot${slotIndex}">Stärke:</label>
            <select id="strength-cmd${cmdIndex}-slot${slotIndex}" name="strength-cmd${cmdIndex}-slot${slotIndex}" class="strength-select" data-commander="${cmdIndex}" data-slot="${slotIndex}">
              ${[0, 1, 2, 3].map(val => `
                <option value="${val}" ${slot.bonusPoints === val ? 'selected' : ''}>+${val}</option>
              `).join('')}
            </select>
          </div>
          <button class="btn-remove-unit" data-commander="${cmdIndex}" data-slot="${slotIndex}">×</button>
        </div>
      `;
    } else {
      // Check if this would be a free bonus unit (4th unit when infantry commander has 3)
      const wouldBeFree = unitCount === 3 && cmd.slots.filter(s => s.hasUnit).length === 3 && cmd.troopType === 'infantry';
      
      return `
        <div class="unit-slot empty">
          <button 
            class="btn-add-unit" 
            data-commander="${cmdIndex}" 
            data-slot="${slotIndex}"
            ${this.validation.remainingBudget < ARMY_BUILDER_COSTS.unit && !wouldBeFree ? 'disabled' : ''}
          >
            + Einheit
            ${wouldBeFree ? '<span class="free-badge">Gratis!</span>' : `<span class="cost">(${ARMY_BUILDER_COSTS.unit} Gold)</span>`}
          </button>
        </div>
      `;
    }
  }

  /**
   * Attach event listeners to the rendered UI
   */
  private attachEventListeners(): void {
    // Add captain button
    const addCaptainBtn = this.container.querySelector('.btn-add-captain');
    if (addCaptainBtn) {
      addCaptainBtn.addEventListener('click', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).blur();
        this.handleAddCaptain();
      });
    }

    // Reset button
    const resetBtn = this.container.querySelector('.btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).blur();
        this.handleReset();
      });
    }

    // Remove commander buttons
    this.container.querySelectorAll('.btn-remove-commander').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).blur();
        const index = parseInt((e.target as HTMLElement).dataset.index || '0');
        this.handleRemoveCommander(index);
      });
    });

    // Troop type buttons
    this.container.querySelectorAll('.troop-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).blur();
        const target = e.target as HTMLElement;
        const cmdIndex = parseInt(target.dataset.commander || '0');
        const troopType = target.dataset.troop as TroopType;
        this.handleChangeTroopType(cmdIndex, troopType);
      });
    });

    // Add unit buttons
    this.container.querySelectorAll('.btn-add-unit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).blur();
        const target = e.target as HTMLElement;
        const cmdIndex = parseInt(target.dataset.commander || '0');
        const slotIndex = parseInt(target.dataset.slot || '0');
        this.handleAddUnit(cmdIndex, slotIndex);
      });
    });

    // Remove unit buttons
    this.container.querySelectorAll('.btn-remove-unit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).blur();
        const target = e.target as HTMLElement;
        const cmdIndex = parseInt(target.dataset.commander || '0');
        const slotIndex = parseInt(target.dataset.slot || '0');
        this.handleRemoveUnit(cmdIndex, slotIndex);
      });
    });

    // Strength select dropdowns
    this.container.querySelectorAll('.strength-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        target.blur();
        const cmdIndex = parseInt(target.dataset.commander || '0');
        const slotIndex = parseInt(target.dataset.slot || '0');
        const bonusPoints = parseInt(target.value) as 0 | 1 | 2 | 3;
        this.handleChangeStrength(cmdIndex, slotIndex, bonusPoints);
      });
    });

    // Budget slider
    const budgetSlider = this.container.querySelector('#budget-slider') as HTMLInputElement;
    if (budgetSlider) {
      // Prevent default scrolling behavior on mousedown
      budgetSlider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        budgetSlider.focus();
      });
      
      // On input: update text without re-rendering
      budgetSlider.addEventListener('input', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as HTMLInputElement;
        const newBudget = parseInt(target.value);
        this.budget = newBudget;
        
        // Update display text only
        const valueDisplay = this.container.querySelector('.budget-slider-value');
        if (valueDisplay) valueDisplay.textContent = newBudget.toString();
        
        // Update budget display
        const budgetDisplay = this.container.querySelector('.budget-value');
        if (budgetDisplay) {
          const cost = calculateArmyCost(this.currentConfig);
          const remaining = newBudget - cost.totalCost;
          budgetDisplay.textContent = `${cost.totalCost} / ${newBudget}`;
          const remainingEl = this.container.querySelector('.budget-remaining');
          if (remainingEl) remainingEl.textContent = `(${remaining >= 0 ? '+' : ''}${remaining})`;
        }
        
        // Update validation
        this.validation = validateArmyConfig(this.currentConfig, this.budget);
        this.callback(this.getConfig(), this.validation.valid);
      });
      
      // On change (user releases): re-render to update all UI state
      budgetSlider.addEventListener('change', () => {
        this.render();
      });
    }
  }

  /**
   * Handle adding a new captain
   */
  private handleAddCaptain(): void {
    const newConfig = this.cloneConfig(this.currentConfig);
    const newCommander = createEmptyCommanderConfig('captain', 'infantry');
    
    // Add two initial units (as per default behavior)
    const withUnits = addUnitToCommanderConfig(newCommander, 0);
    const withTwoUnits = withUnits ? addUnitToCommanderConfig(withUnits, 0) : null;
    
    this.updateConfig({
      commanders: [
        ...newConfig.commanders,
        withTwoUnits || newCommander,
      ],
    });
  }

  /**
   * Handle resetting to default army
   */
  private handleReset(): void {
    if (confirm('Möchtest du wirklich zur Standard-Armee zurücksetzen?')) {
      this.updateConfig(getDefaultArmyConfig());
    }
  }

  /**
   * Handle removing a commander
   */
  private handleRemoveCommander(index: number): void {
    const newConfig = this.cloneConfig(this.currentConfig);
    const commanders = [...newConfig.commanders];
    commanders.splice(index, 1);
    this.updateConfig({ commanders });
  }

  /**
   * Handle changing a commander's troop type
   */
  private handleChangeTroopType(cmdIndex: number, troopType: TroopType): void {
    const newConfig = this.cloneConfig(this.currentConfig);
    const commanders = [...newConfig.commanders];
    commanders[cmdIndex] = {
      ...commanders[cmdIndex],
      troopType,
    };
    this.updateConfig({ commanders });
  }

  /**
   * Handle adding a unit to a slot
   */
  private handleAddUnit(cmdIndex: number, slotIndex: number): void {
    const newConfig = this.cloneConfig(this.currentConfig);
    const commanders = [...newConfig.commanders];
    const commander = commanders[cmdIndex];
    
    const newSlots = [...commander.slots];
    newSlots[slotIndex] = { hasUnit: true, bonusPoints: 0 };
    
    commanders[cmdIndex] = {
      ...commander,
      slots: newSlots,
    };
    
    this.updateConfig({ commanders });
  }

  /**
   * Handle removing a unit from a slot
   */
  private handleRemoveUnit(cmdIndex: number, slotIndex: number): void {
    const newConfig = this.cloneConfig(this.currentConfig);
    const commanders = [...newConfig.commanders];
    const commander = commanders[cmdIndex];
    
    const newSlots = [...commander.slots];
    newSlots[slotIndex] = { hasUnit: false, bonusPoints: 0 };
    
    commanders[cmdIndex] = {
      ...commander,
      slots: newSlots,
    };
    
    this.updateConfig({ commanders });
  }

  /**
   * Handle changing a unit's strength (bonus points)
   */
  private handleChangeStrength(cmdIndex: number, slotIndex: number, bonusPoints: 0 | 1 | 2 | 3): void {
    const newConfig = this.cloneConfig(this.currentConfig);
    const commanders = [...newConfig.commanders];
    const commander = commanders[cmdIndex];
    
    const newSlots = [...commander.slots];
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      bonusPoints,
    };
    
    commanders[cmdIndex] = {
      ...commander,
      slots: newSlots,
    };
    
    this.updateConfig({ commanders });
  }

  /**
   * Destroy the UI and clean up
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}

/**
 * Create army builder styles
 */
export function createArmyBuilderStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = `
    .army-builder {
      background: #1a1a2e;
      color: #eee;
      padding: calc(20px * var(--ui-scale, 1));
      border-radius: calc(8px * var(--ui-scale, 1));
      max-width: calc(900px * var(--ui-scale, 1));
      max-height: calc(100vh - calc(100px * var(--ui-scale, 1)));
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow-y: auto;
      overflow-x: hidden;
      font-size: calc(16px * var(--ui-scale, 1));
    }

    .army-builder::-webkit-scrollbar {
      width: 8px;
    }

    .army-builder::-webkit-scrollbar-track {
      background: #1a1a2e;
      border-radius: 4px;
    }

    .army-builder::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 4px;
    }

    .army-builder::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    .army-builder-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding: 10px 15px;
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 8px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .budget-display {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: bold;
    }

    .budget-display.over-budget {
      color: #ff6b6b;
    }

    .budget-value {
      background: #333;
      padding: 4px 12px;
      border-radius: 4px;
    }

    .budget-remaining {
      color: #4ade80;
    }

    .budget-display.over-budget .budget-remaining {
      color: #ff6b6b;
    }

    .budget-slider {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      position: sticky;
      top: 0;
      background: #1a1a2e;
      padding: 8px 12px;
      border-radius: 6px;
      z-index: 10;
    }

    .budget-slider label {
      color: #9ca3af;
    }

    .budget-slider input[type="range"] {
      width: 100px;
      accent-color: #4ade80;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    }

    .budget-slider input[type="range"]:focus {
      outline: none;
    }

    .budget-slider-value {
      font-weight: bold;
      color: #ffd700;
      min-width: 24px;
    }

    .validation-errors {
      background: #ff6b6b22;
      border: 1px solid #ff6b6b;
      padding: 10px 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }

    .validation-errors .error {
      color: #ff6b6b;
      margin: 3px 0;
      font-size: 13px;
    }

    .commanders-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .commander-card {
      background: #252540;
      border-radius: 8px;
      padding: 15px;
      border: 2px solid #333;
    }

    .commander-card.king {
      border-color: #ffd700;
      background: #2a2a4a;
    }

    .commander-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .commander-type-badge {
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
    }

    .commander-type-badge.king {
      background: #ffd700;
      color: #1a1a2e;
    }

    .commander-type-badge.captain {
      background: #6b7280;
      color: #fff;
    }

    .commander-troop-type {
      color: #9ca3af;
      font-size: 14px;
    }

    .btn-remove-commander {
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }

    .btn-remove-commander:hover {
      background: #ff5252;
    }

    .commander-troop-selector {
      display: flex;
      gap: 5px;
      margin-bottom: 15px;
    }

    .troop-btn {
      flex: 1;
      padding: 8px;
      border: 1px solid #444;
      background: #333;
      color: #ccc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .troop-btn:hover {
      background: #444;
    }

    .troop-btn.active {
      background: #4ade80;
      color: #1a1a2e;
      border-color: #4ade80;
    }

    .troop-btn.active.infantry {
      background: #4ade80;
      border-color: #4ade80;
      color: #1a1a2e;
    }

    .troop-btn.active.cavalry {
      background: #60a5fa;
      border-color: #60a5fa;
      color: #1a1a2e;
    }

    .troop-btn.active.archer {
      background: #f87171;
      border-color: #f87171;
      color: #1a1a2e;
    }

    .commander-units {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .unit-slot {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 8px;
      min-height: 60px;
    }

    .unit-slot.filled {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .unit-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .unit-avatar.infantry {
      background: #4ade80;
    }

    .unit-avatar.cavalry {
      background: #60a5fa;
    }

    .unit-avatar.archer {
      background: #f87171;
    }

    .unit-strength {
      flex: 1;
    }

    .unit-strength label {
      display: block;
      font-size: 11px;
      color: #9ca3af;
      margin-bottom: 2px;
    }

    .strength-select {
      width: 100%;
      padding: 4px;
      background: #333;
      color: #fff;
      border: 1px solid #444;
      border-radius: 4px;
    }

    .btn-remove-unit {
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
    }

    .btn-add-unit {
      width: 100%;
      height: 100%;
      min-height: 60px;
      background: transparent;
      border: 2px dashed #444;
      color: #666;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .btn-add-unit:hover:not(:disabled) {
      border-color: #4ade80;
      color: #4ade80;
    }

    .btn-add-unit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .free-badge {
      color: #4ade80;
      font-size: 11px;
      font-weight: bold;
    }

    .cost {
      font-size: 10px;
      color: #666;
    }

    .unit-count {
      font-size: 14px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bonus-indicator {
      color: #4ade80;
      font-weight: bold;
      font-size: 12px;
    }

    .army-builder-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .btn-add-captain,
    .btn-reset {
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: all 0.2s;
    }

    .btn-add-captain {
      background: #4ade80;
      color: #1a1a2e;
    }

    .btn-add-captain:hover:not(:disabled) {
      background: #22c55e;
    }

    .btn-add-captain:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-reset {
      background: #6b7280;
      color: #fff;
    }

    .btn-reset:hover {
      background: #4b5563;
    }

    .cost-rules {
      background: #252540;
      padding: 15px;
      border-radius: 4px;
      font-size: 14px;
    }

    .cost-rules.compact {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      padding: 10px 15px;
      font-size: 12px;
    }

    .cost-rules.compact span {
      color: #9ca3af;
    }

    .cost-rules.compact .bonus-rule {
      color: #4ade80;
      font-weight: bold;
    }
  `;
  return style;
}
