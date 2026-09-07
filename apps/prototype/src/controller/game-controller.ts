/**
 * Browser controller. The game core is the only authority for legal actions
 * and state transitions; this class only coordinates input, animation and UI.
 */
import {
  Action,
  Banner,
  CommanderId,
  CombatResult,
  GameConfig,
  GameRuleError,
  GameState,
  Position,
  TROOP_STATS,
  applyCommand,
  applyCombatResult,
  calculateGameResults,
  canAttack,
  canCaptureBanner,
  canMove,
  createGame,
  getEffectiveTroopType,
  getHoldingCommander,
  getPendingHoldingChoices,
  getValidAttacks,
  getValidMoves,
  getWinner,
  resolveCombat,
  setHoldingTarget,
  startGame,
} from '@lands-of-glory/game-core';
import { CombatDiceAnimation, DICE_SIZE_CONFIGS } from '../renderer/combat-animation';
import { DragCallbacks, GameRenderer, UIState } from '../renderer/game-renderer';

export type InteractionPhase = 'idle' | 'combat' | 'holding' | 'disposed';

export interface CombatLogEntry {
  id: string;
  turn: number;
  type: Action['type'];
  message: string;
  timestamp: Date;
}

interface HistoryEntry {
  state: GameState;
  description: string;
}

interface PendingCombat {
  token: number;
  sourceState: GameState;
  result: CombatResult;
}

function playerColorToNumber(color: string): number {
  const normalized = color.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized, 16) : 0xffffff;
}

function troopName(type: string): string {
  if (type === 'infantry') return 'Infanterie';
  if (type === 'cavalry') return 'Kavallerie';
  if (type === 'archer') return 'Bogenschützen';
  return type;
}

function actionMessage(action: Action): string {
  const details = action.details;
  switch (action.type) {
    case 'gameStart': return 'Spiel gestartet.';
    case 'move': return `Kommandeur nach ${JSON.stringify(details.to)} bewegt.`;
    case 'attack': {
      const attackerLosses = Array.isArray(details.attackerCasualties) ? details.attackerCasualties.length : 0;
      const defenderLosses = Array.isArray(details.defenderCasualties) ? details.defenderCasualties.length : 0;
      return `Kampf beendet – Verluste ${attackerLosses}:${defenderLosses}.`;
    }
    case 'capture': return 'Gegnerisches Banner erobert.';
    case 'hold': return details.targetId ? 'Gegnerischer Kommandeur festgehalten.' : 'Auf Festhalten verzichtet.';
    case 'playerDefeated': return `Spieler ausgeschieden (${String(details.reason)}).`;
    case 'endTurn': return 'Zug beendet.';
    case 'gameEnd': return `Spiel beendet (${String(details.reason)}).`;
  }
}

export class GameController {
  private gameState: GameState;
  private readonly renderer: GameRenderer;
  private readonly combatAnimation: CombatDiceAnimation;
  private readonly onExit?: () => void;
  private uiState: UIState = { debugEnabled: false };
  private selectedCommanderId?: CommanderId;
  private phase: InteractionPhase = 'idle';
  private pendingCombat?: PendingCombat;
  private operationToken = 0;
  private history: HistoryEntry[] = [];
  private readonly maxHistorySize = 20;
  private readonly cleanupCallbacks: Array<() => void> = [];
  private readonly stateCallbacks: Array<(state: GameState) => void> = [];
  private readonly logCallbacks: Array<(entry: CombatLogEntry) => void> = [];
  private readonly victoryCallbacks: Array<(winner: string) => void> = [];
  private uiRoot?: HTMLElement;
  private notificationTimer?: number;
  private presentedVictoryFor?: GameState;

  constructor(gameState: GameState, renderer: GameRenderer, diceSize = 'large', onExit?: () => void) {
    this.gameState = gameState;
    this.renderer = renderer;
    this.onExit = onExit;
    const diceConfig = DICE_SIZE_CONFIGS[diceSize] ?? DICE_SIZE_CONFIGS.large;
    this.combatAnimation = new CombatDiceAnimation(renderer.getApp(), diceConfig);
    this.setupDragCallbacks();
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getUIState(): UIState {
    return { ...this.uiState };
  }

  getInteractionPhase(): InteractionPhase {
    return this.phase;
  }

  getCombatLog(): CombatLogEntry[] {
    return this.gameState.log.map((action, index) => this.toLogEntry(action, index));
  }

  onStateChange(callback: (state: GameState) => void): () => void {
    this.stateCallbacks.push(callback);
    return () => this.removeCallback(this.stateCallbacks, callback);
  }

  onCombatLog(callback: (entry: CombatLogEntry) => void): () => void {
    this.logCallbacks.push(callback);
    return () => this.removeCallback(this.logCallbacks, callback);
  }

  onVictory(callback: (winner: string) => void): () => void {
    this.victoryCallbacks.push(callback);
    return () => this.removeCallback(this.victoryCallbacks, callback);
  }

  initializeGame(): void {
    if (this.phase === 'disposed') return;
    if (this.gameState.gameStatus === 'setup') this.gameState = startGame(this.gameState);
    this.history = [{ state: this.gameState, description: 'Spielstart' }];
    this.mountUi();
    this.installInputListeners();
    this.updatePassivePhase();
    this.render();
  }

  handleKeyDown(key: string, modifiers: { shift: boolean; ctrl: boolean; alt: boolean }): void {
    if (this.phase === 'disposed') return;
    switch (key.toUpperCase()) {
      case 'D':
        if (this.phase !== 'combat') {
          this.uiState = { ...this.uiState, debugEnabled: !this.uiState.debugEnabled };
          this.render();
        }
        break;
      case 'E':
        this.endCurrentTurn();
        break;
      case 'Z':
        if (modifiers.ctrl) this.undo();
        break;
      case 'ESCAPE':
        if (this.phase === 'idle') {
          this.clearSelection();
          this.render();
        }
        break;
    }
  }

  /** Public for the DOM controls and the narrow Cypress bridge. */
  endCurrentTurn(): boolean {
    if (!this.requireIdle('Der Zug kann während einer Auswahl oder Kampfanimation nicht beendet werden.')) return false;
    return this.applyCoreAction(
      () => applyCommand(this.gameState, { type: 'endTurn', playerId: this.gameState.activePlayerId }),
      'Zug beendet',
    );
  }

  undo(): boolean {
    if (this.phase !== 'idle') {
      this.showMessage('Während einer Auswahl oder Kampfanimation ist Rückgängig nicht möglich.', 'warning');
      return false;
    }
    if (this.history.length <= 1) {
      this.showMessage('Nichts zum Rückgängigmachen.', 'error');
      return false;
    }
    const undone = this.history.pop()!;
    const previous = this.history[this.history.length - 1];
    this.gameState = previous.state;
    this.presentedVictoryFor = undefined;
    this.clearSelection();
    this.updatePassivePhase();
    this.showMessage(`Rückgängig: ${undone.description}`, 'info');
    this.render();
    return true;
  }

  canUndo(): boolean {
    return this.phase === 'idle' && this.history.length > 1;
  }

  getUndoHistory(): string[] {
    return this.history.map(entry => entry.description);
  }

  /** Executes the same drop route used by Pixi. Kept public for browser-flow tests. */
  performDrop(commanderId: CommanderId, target: Position): boolean {
    if (!this.requireIdle('Bitte zuerst die aktuelle Auswahl abschließen.')) return false;
    const snapped = { x: Math.round(target.x), y: Math.round(target.y) };
    this.clearSelection();
    const enemy = this.findEnemyCommanderAt(snapped);
    if (enemy) return this.beginCombat(commanderId, enemy.id);
    const banner = this.findEnemyBannerAt(snapped);
    if (banner) {
      const validation = canCaptureBanner(this.gameState, commanderId, banner.id);
      if (!validation.valid) return this.reject(validation.reason);
      return this.applyCoreAction(() => applyCommand(this.gameState, {
        type: 'capture', playerId: this.gameState.activePlayerId, attackerId: commanderId, bannerId: banner.id,
      }), 'Banner erobert');
    }
    const validation = canMove(this.gameState, commanderId, snapped);
    if (!validation.valid) return this.reject(validation.reason);
    return this.applyCoreAction(() => applyCommand(this.gameState, {
      type: 'move', playerId: this.gameState.activePlayerId, commanderId, target: snapped,
    }), `Bewegung nach ${snapped.x}/${snapped.y}`);
  }

  chooseHoldingTarget(holderId: CommanderId, targetId: CommanderId | null): boolean {
    if (this.phase !== 'holding') {
      this.showMessage('Es gibt keine offene Festhalte-Auswahl.', 'error');
      return false;
    }
    const choice = getPendingHoldingChoices(this.gameState)[0];
    if (!choice || choice.holderId !== holderId) return this.reject('Die Festhalte-Auswahl ist nicht mehr aktuell.');
    try {
      const next = setHoldingTarget(this.gameState, choice.playerId, holderId, targetId);
      this.commit(next, targetId ? 'Festhalteziel gewählt' : 'Auf Festhalten verzichtet');
      return true;
    } catch (error) {
      return this.handleRuleError(error);
    }
  }

  completeCombatAnimation(): boolean {
    if (this.phase !== 'combat') return false;
    this.combatAnimation.close();
    return true;
  }

  /** In local hot-seat play the holding owner may release their existing target. */
  releaseHoldingTarget(holderId: CommanderId): boolean {
    if (!this.requireIdle('Bitte zuerst die aktuelle Auswahl oder Kampfanimation abschließen.')) return false;
    const decision = this.gameState.holdingDecisions?.find(item => item.holderId === holderId && item.targetId !== null);
    const holder = decision?.targetId ? getHoldingCommander(this.gameState, decision.targetId) : undefined;
    if (!holder || holder.id !== holderId) return this.reject('Diese Festhaltung besteht nicht mehr.');
    return this.applyCoreAction(
      () => setHoldingTarget(this.gameState, holder.playerId, holderId, null),
      'Festhaltung gelöst',
    );
  }

  destroy(): void {
    if (this.phase === 'disposed') return;
    this.operationToken++;
    this.pendingCombat = undefined;
    this.phase = 'disposed';
    if (this.notificationTimer !== undefined) window.clearTimeout(this.notificationTimer);
    this.combatAnimation.dispose();
    this.renderer.setDragCallbacks({});
    for (const cleanup of this.cleanupCallbacks.splice(0)) cleanup();
    this.uiRoot?.remove();
    this.uiRoot = undefined;
    this.stateCallbacks.length = 0;
    this.logCallbacks.length = 0;
    this.victoryCallbacks.length = 0;
  }

  private setupDragCallbacks(): void {
    const callbacks: DragCallbacks = {
      onDragStart: commanderId => {
        if (!this.requireIdle('Eingabe während der laufenden Auflösung gesperrt.')) return;
        const commander = this.gameState.commanders.get(commanderId);
        if (!commander || commander.playerId !== this.gameState.activePlayerId) {
          this.showMessage('Dieser Kommandeur gehört nicht zum aktiven Spieler.', 'error');
          return;
        }
        const hasAction = getValidMoves(this.gameState, commanderId).length > 0 ||
          getValidAttacks(this.gameState, commanderId).length > 0 ||
          [...this.gameState.banners.values()].some(banner => canCaptureBanner(this.gameState, commanderId, banner.id).valid);
        if (!hasAction) {
          this.showMessage('Dieser Kommandeur kann derzeit keine gültige Aktion ausführen.', 'error');
          return;
        }
        this.selectedCommanderId = commanderId;
        this.uiState = { ...this.uiState, selectedCommanderId: commanderId, draggedCommanderId: commanderId };
        this.render();
      },
      onDragMove: position => {
        if (this.phase !== 'idle' || !this.selectedCommanderId) return;
        this.uiState = { ...this.uiState, currentDragTarget: position };
        this.render();
      },
      onDragEnd: (commanderId, target) => {
        this.uiState = { ...this.uiState, draggedCommanderId: undefined, currentDragTarget: undefined };
        if (this.selectedCommanderId !== commanderId) {
          this.clearSelection();
          this.render();
          return;
        }
        this.performDrop(commanderId, target);
      },
    };
    this.renderer.setDragCallbacks(callbacks);
  }

  private beginCombat(attackerId: CommanderId, defenderId: CommanderId): boolean {
    const validation = canAttack(this.gameState, attackerId, defenderId);
    if (!validation.valid) return this.reject(validation.reason);
    try {
      const sourceState = this.gameState;
      const result = resolveCombat(sourceState, attackerId, defenderId);
      const attacker = sourceState.commanders.get(attackerId)!;
      const defender = sourceState.commanders.get(defenderId)!;
      const attackerPlayer = sourceState.players.find(player => player.id === attacker.playerId)!;
      const defenderPlayer = sourceState.players.find(player => player.id === defender.playerId)!;
      const token = ++this.operationToken;
      this.phase = 'combat';
      this.pendingCombat = { token, sourceState, result };
      this.render();
      this.combatAnimation.play(
        result,
        `${attacker.isKing ? 'König ' : ''}${troopName(result.attackerType)}`,
        `${defender.isKing ? 'König ' : ''}${troopName(result.defenderType)}`,
        playerColorToNumber(attackerPlayer.color),
        playerColorToNumber(defenderPlayer.color),
        () => this.finishCombat(token),
      );
      return true;
    } catch (error) {
      this.operationToken++;
      this.combatAnimation.close(false);
      this.phase = 'idle';
      this.pendingCombat = undefined;
      return this.handleRuleError(error);
    }
  }

  private finishCombat(token: number): void {
    const pending = this.pendingCombat;
    if (this.phase !== 'combat' || !pending || pending.token !== token ||
        pending.sourceState !== this.gameState || token !== this.operationToken) return;
    this.pendingCombat = undefined;
    try {
      const next = applyCombatResult(pending.sourceState, pending.result);
      this.phase = 'idle';
      this.commit(next, 'Kampf aufgelöst');
    } catch (error) {
      this.phase = 'idle';
      this.handleRuleError(error);
      this.render();
    }
  }

  private applyCoreAction(action: () => GameState, description: string): boolean {
    try {
      this.commit(action(), description);
      return true;
    } catch (error) {
      return this.handleRuleError(error);
    }
  }

  private commit(next: GameState, description: string): void {
    const previousLogLength = this.gameState.log.length;
    this.gameState = next;
    this.history.push({ state: next, description });
    if (this.history.length > this.maxHistorySize) this.history.shift();
    this.clearSelection();
    this.updatePassivePhase();
    const newActions = next.log.slice(previousLogLength);
    newActions.forEach((action, index) => {
      const entry = this.toLogEntry(action, previousLogLength + index);
      this.logCallbacks.forEach(callback => callback(entry));
    });
    this.render();
  }

  private updatePassivePhase(): void {
    if (this.phase === 'disposed' || this.phase === 'combat') return;
    this.phase = getPendingHoldingChoices(this.gameState).length > 0 ? 'holding' : 'idle';
  }

  private requireIdle(message: string): boolean {
    if (this.phase === 'idle' && this.gameState.gameStatus === 'active') return true;
    this.showMessage(this.gameState.gameStatus === 'finished' ? 'Das Spiel ist beendet.' : message, 'warning');
    return false;
  }

  private reject(reason?: string): false {
    this.clearSelection();
    this.showMessage(reason ?? 'Ungültige Aktion.', 'error');
    this.render();
    return false;
  }

  private handleRuleError(error: unknown): false {
    const message = error instanceof GameRuleError || error instanceof Error ? error.message : 'Unbekannter Regelfehler.';
    return this.reject(message);
  }

  private clearSelection(): void {
    this.selectedCommanderId = undefined;
    this.uiState = {
      ...this.uiState,
      selectedCommanderId: undefined,
      draggedCommanderId: undefined,
      currentDragTarget: undefined,
    };
  }

  private findEnemyCommanderAt(position: Position) {
    return [...this.gameState.commanders.values()].find(commander =>
      commander.playerId !== this.gameState.activePlayerId &&
      commander.position.x === position.x && commander.position.y === position.y);
  }

  private findEnemyBannerAt(position: Position): Banner | undefined {
    return [...this.gameState.banners.values()].find(banner =>
      banner.playerId !== this.gameState.activePlayerId && banner.status === 'standing' &&
      banner.position.x === position.x && banner.position.y === position.y);
  }

  private installInputListeners(): void {
    const keydown = (event: KeyboardEvent) => this.handleKeyDown(event.key, {
      shift: event.shiftKey, ctrl: event.ctrlKey, alt: event.altKey,
    });
    window.addEventListener('keydown', keydown);
    this.cleanupCallbacks.push(() => window.removeEventListener('keydown', keydown));

    const canvas = this.renderer.getApp().view as HTMLCanvasElement;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      this.renderer.setZoom(this.renderer.getCamera().zoom * (event.deltaY > 0 ? 0.9 : 1.1));
      this.render();
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    this.cleanupCallbacks.push(() => canvas.removeEventListener('wheel', wheel));
  }

  private mountUi(): void {
    const host = (this.renderer.getApp().view as HTMLCanvasElement).parentElement;
    if (!host) return;
    this.uiRoot = document.createElement('div');
    this.uiRoot.id = 'game-ui';
    this.uiRoot.className = 'ui-overlay';
    this.uiRoot.innerHTML = `
      <header class="game-topbar ui-panel">
        <div class="turn-summary"><span id="active-player-color"></span><strong id="active-player-name"></strong><span id="round-label"></span></div>
        <div class="game-actions">
          <button id="undo-action" class="btn btn-secondary" data-testid="undo">Rückgängig</button>
          <button id="debug-action" class="btn btn-secondary" data-testid="debug">Debug</button>
          <button id="end-turn-action" class="btn btn-primary" data-testid="end-turn">Zug beenden</button>
          <button id="menu-action" class="btn btn-secondary" data-testid="menu">Menü</button>
        </div>
      </header>
      <aside id="unit-info-panel" class="selected-info ui-panel" hidden></aside>
      <aside id="holding-status" class="holding-status ui-panel" hidden></aside>
      <aside class="combat-log ui-panel"><h3>Spielprotokoll</h3><div id="combat-log-entries"></div></aside>
      <div class="controls-help ui-panel">Ziehen: Bewegen/Angreifen · <kbd>E</kbd> Zugende · <kbd>Strg+Z</kbd> Rückgängig · <kbd>D</kbd> Debug</div>
      <div id="game-notification" class="game-notification" role="status" aria-live="polite" hidden></div>
      <div id="holding-dialog-host"></div>`;
    host.appendChild(this.uiRoot);
    this.listenToUi('#undo-action', () => this.undo());
    this.listenToUi('#debug-action', () => this.handleKeyDown('D', { shift: false, ctrl: false, alt: false }));
    this.listenToUi('#end-turn-action', () => this.endCurrentTurn());
    this.listenToUi('#menu-action', () => this.onExit?.());
  }

  private listenToUi(selector: string, callback: () => void): void {
    const element = this.uiRoot?.querySelector(selector);
    if (!element) return;
    element.addEventListener('click', callback);
    this.cleanupCallbacks.push(() => element.removeEventListener('click', callback));
  }

  private render(): void {
    if (this.phase === 'disposed') return;
    this.uiState = { ...this.uiState, selectedCommanderId: this.selectedCommanderId };
    this.renderer.render(this.gameState, this.uiState);
    this.renderUi();
    this.stateCallbacks.forEach(callback => callback(this.gameState));
    if (this.gameState.gameStatus === 'finished' && this.presentedVictoryFor !== this.gameState) {
      this.presentedVictoryFor = this.gameState;
      const results = calculateGameResults(this.gameState);
      if (results) this.renderer.showGameResults(results);
      const winner = getWinner(this.gameState);
      if (winner) this.victoryCallbacks.forEach(callback => callback(winner.name));
    }
  }

  private renderUi(): void {
    if (!this.uiRoot) return;
    const activePlayer = this.gameState.players.find(player => player.id === this.gameState.activePlayerId);
    this.setText('#active-player-name', activePlayer?.name ?? '–');
    this.setText('#round-label', `Runde ${this.gameState.turnNumber}`);
    const color = this.uiRoot.querySelector<HTMLElement>('#active-player-color');
    if (color) color.style.backgroundColor = activePlayer?.color ?? '#fff';
    this.uiRoot.classList.toggle('debug-mode', this.uiState.debugEnabled);
    const busy = this.phase !== 'idle' || this.gameState.gameStatus !== 'active';
    this.setDisabled('#end-turn-action', busy);
    this.setDisabled('#undo-action', !this.canUndo());
    this.renderUnitInfo();
    this.renderLog();
    this.renderHoldingDialog();
    this.renderHoldingStatus();
  }

  private renderHoldingStatus(): void {
    const panel = this.uiRoot?.querySelector<HTMLElement>('#holding-status');
    if (!panel) return;
    panel.replaceChildren();
    for (const decision of this.gameState.holdingDecisions ?? []) {
      if (!decision.targetId) continue;
      const holder = getHoldingCommander(this.gameState, decision.targetId);
      const target = this.gameState.commanders.get(decision.targetId);
      if (!holder || !target) continue;
      const owner = this.gameState.players.find(player => player.id === holder.playerId);
      const button = document.createElement('button');
      button.className = 'btn btn-secondary';
      button.dataset.testid = `release-${holder.id}`;
      button.textContent = `${owner?.name ?? 'Spieler'}: Festhaltung bei ${target.position.x}/${target.position.y} lösen`;
      button.disabled = this.phase !== 'idle';
      button.addEventListener('click', () => this.releaseHoldingTarget(holder.id));
      panel.appendChild(button);
    }
    panel.hidden = panel.childElementCount === 0;
  }

  private renderUnitInfo(): void {
    const panel = this.uiRoot?.querySelector<HTMLElement>('#unit-info-panel');
    const commander = this.selectedCommanderId ? this.gameState.commanders.get(this.selectedCommanderId) : undefined;
    if (!panel || !commander) {
      if (panel) panel.hidden = true;
      return;
    }
    const player = this.gameState.players.find(item => item.id === commander.playerId);
    const effectiveType = getEffectiveTroopType(commander);
    const activeUnits = commander.units.filter(unit => unit?.status === 'active').length;
    const holder = getHoldingCommander(this.gameState, commander.id);
    panel.hidden = false;
    panel.innerHTML = '';
    const color = document.createElement('div');
    color.className = 'player-color-box';
    color.style.backgroundColor = player?.color ?? '#fff';
    const title = document.createElement('h4');
    title.textContent = `${commander.isKing ? 'König · ' : ''}${troopName(effectiveType)}${activeUnits === 0 ? ' (leer)' : ''}`;
    const stats = document.createElement('p');
    stats.textContent = `Bewegung ${TROOP_STATS[effectiveType].moveRange} · Reichweite ${effectiveType === 'archer' ? '2–3' : TROOP_STATS[effectiveType].attackRange} · Einheiten ${activeUnits}/4${holder ? ' · festgehalten' : ''}`;
    panel.append(color, title, stats);
  }

  private renderLog(): void {
    const container = this.uiRoot?.querySelector<HTMLElement>('#combat-log-entries');
    if (!container) return;
    container.innerHTML = '';
    this.getCombatLog().slice(-12).reverse().forEach(entry => {
      const element = document.createElement('div');
      element.className = `log-entry ${entry.type}`;
      element.textContent = entry.message;
      container.appendChild(element);
    });
  }

  private renderHoldingDialog(): void {
    const host = this.uiRoot?.querySelector<HTMLElement>('#holding-dialog-host');
    if (!host) return;
    host.innerHTML = '';
    const choice = this.phase === 'holding' ? getPendingHoldingChoices(this.gameState)[0] : undefined;
    if (!choice) return;
    const owner = this.gameState.players.find(player => player.id === choice.playerId);
    const holder = this.gameState.commanders.get(choice.holderId);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay holding-overlay';
    overlay.dataset.testid = 'holding-dialog';
    const dialog = document.createElement('section');
    dialog.className = 'holding-dialog ui-panel';
    const heading = document.createElement('h2');
    heading.textContent = `${owner?.name ?? 'Spieler'}: Festhalten wählen`;
    const explanation = document.createElement('p');
    explanation.textContent = `Die Infanterie bei ${holder?.position.x}/${holder?.position.y} darf genau einen Kommandeur des aktiven Spielers festhalten.`;
    const choices = document.createElement('div');
    choices.className = 'holding-options';
    choice.candidates.forEach(targetId => {
      const target = this.gameState.commanders.get(targetId);
      if (!target) return;
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.dataset.testid = `hold-${targetId}`;
      const count = target.units.filter(unit => unit?.status === 'active').length;
      button.textContent = `${target.isKing ? 'König' : 'Kommandeur'} ${troopName(getEffectiveTroopType(target))} bei ${target.position.x}/${target.position.y}${count === 0 ? ' (leer)' : ''}`;
      button.addEventListener('click', () => this.chooseHoldingTarget(choice.holderId, targetId));
      choices.appendChild(button);
    });
    const waive = document.createElement('button');
    waive.className = 'btn btn-secondary';
    waive.dataset.testid = 'hold-waive';
    waive.textContent = 'Nicht festhalten';
    waive.addEventListener('click', () => this.chooseHoldingTarget(choice.holderId, null));
    choices.appendChild(waive);
    dialog.append(heading, explanation, choices);
    overlay.appendChild(dialog);
    host.appendChild(overlay);
  }

  private showMessage(message: string, type: 'info' | 'warning' | 'error'): void {
    const notification = this.uiRoot?.querySelector<HTMLElement>('#game-notification');
    if (!notification) return;
    notification.textContent = message;
    notification.className = `game-notification ${type}`;
    notification.hidden = false;
    if (this.notificationTimer !== undefined) window.clearTimeout(this.notificationTimer);
    this.notificationTimer = window.setTimeout(() => { notification.hidden = true; }, 8000);
  }

  private toLogEntry(action: Action, index: number): CombatLogEntry {
    return {
      id: `${action.timestamp}-${index}`,
      turn: Number(action.details.turnNumber ?? this.gameState.turnNumber),
      type: action.type,
      message: actionMessage(action),
      timestamp: new Date(action.timestamp),
    };
  }

  private setText(selector: string, value: string): void {
    const element = this.uiRoot?.querySelector(selector);
    if (element) element.textContent = value;
  }

  private setDisabled(selector: string, disabled: boolean): void {
    const button = this.uiRoot?.querySelector<HTMLButtonElement>(selector);
    if (button) button.disabled = disabled;
  }

  private removeCallback<T>(callbacks: T[], callback: T): void {
    const index = callbacks.indexOf(callback);
    if (index >= 0) callbacks.splice(index, 1);
  }
}

export function createGameController(
  config: GameConfig,
  renderer: GameRenderer,
  diceSize = 'large',
  onExit?: () => void,
): GameController {
  return new GameController(createGame(config), renderer, diceSize, onExit);
}
