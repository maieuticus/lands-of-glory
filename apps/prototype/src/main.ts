import {
  CommanderId,
  DEFAULT_STARTING_BUDGET,
  GameConfig,
  GameState,
  PlayerConfig,
  Position,
  validateArmyConfig,
} from '@lands-of-glory/game-core';
import { showArmyBuilder } from './army-builder-screen';
import { GameController, createGameController } from './controller/game-controller';
import { GameRenderer, createGameRenderer } from './renderer/game-renderer';
import { GameOptions, showStartScreen } from './start-screen';
import { applyUIScale } from './ui-scale';
import './style.css';

const ALL_PLAYER_CONFIGS: PlayerConfig[] = [
  { name: 'Spieler 1', color: '#FF4444' },
  { name: 'Spieler 2', color: '#4444FF' },
  { name: 'Spieler 3', color: '#44BB66' },
  { name: 'Spieler 4', color: '#FFD700' },
];

export let gameOptions: GameOptions = {
  useTextures: true,
  enableSound: false,
  showGrid: true,
  diceSize: 'large',
  playerCount: 2,
};

export type { GameOptions };

let currentController: GameController | undefined;
let currentRenderer: GameRenderer | undefined;

interface BrowserTestApi {
  getState(): GameState | undefined;
  getPhase(): string | undefined;
  drop(commanderId: CommanderId, target: Position): boolean;
  endTurn(): boolean;
  undo(): boolean;
  completeCombat(): boolean;
}

declare global {
  interface Window {
    __LANDS_OF_GLORY_TEST__?: BrowserTestApi;
  }
}

function appContainer(): HTMLElement {
  const container = document.getElementById('app');
  if (!container) throw new Error('App-Container wurde nicht gefunden.');
  return container;
}

function players(count: number): PlayerConfig[] {
  return ALL_PLAYER_CONFIGS.slice(0, count);
}

function cleanupGame(): void {
  currentController?.destroy();
  currentController = undefined;
  currentRenderer?.dispose();
  currentRenderer = undefined;
  delete window.__LANDS_OF_GLORY_TEST__;
  const container = appContainer();
  container.replaceChildren();
  container.style.display = 'block';
}

function exposeTestApi(controller: GameController): void {
  if (!new URLSearchParams(window.location.search).has('e2e')) return;
  window.__LANDS_OF_GLORY_TEST__ = {
    getState: () => currentController?.getGameState(),
    getPhase: () => currentController?.getInteractionPhase(),
    drop: (commanderId, target) => controller.performDrop(commanderId, target),
    endTurn: () => controller.endCurrentTurn(),
    undo: () => controller.undo(),
    completeCombat: () => controller.completeCombatAnimation(),
  };
}

function showStartupError(error: unknown): void {
  cleanupGame();
  const wrapper = document.createElement('main');
  wrapper.className = 'startup-error';
  const title = document.createElement('h1');
  title.textContent = 'Spiel konnte nicht gestartet werden';
  const detail = document.createElement('p');
  detail.textContent = error instanceof Error ? error.message : 'Unbekannter Fehler';
  const retry = document.createElement('button');
  retry.className = 'btn btn-primary';
  retry.textContent = 'Zurück zum Menü';
  retry.addEventListener('click', showMenu, { once: true });
  wrapper.append(title, detail, retry);
  appContainer().appendChild(wrapper);
}

async function startGameWithConfig(config: GameConfig): Promise<void> {
  cleanupGame();
  applyUIScale(gameOptions.diceSize);
  try {
    const renderer = createGameRenderer('app', window.innerWidth, window.innerHeight, 48, {
      useTextures: gameOptions.useTextures,
      showGrid: gameOptions.showGrid,
    });
    currentRenderer = renderer;
    const controller = createGameController(config, renderer, gameOptions.diceSize, showMenu);
    currentController = controller;
    controller.initializeGame();
    exposeTestApi(controller);
  } catch (error) {
    showStartupError(error);
  }
}

function showMenu(): void {
  cleanupGame();
  const screen = showStartScreen('app', async (selection, options) => {
    gameOptions = { ...options, enableSound: false };
    if (selection === 'quick-start') {
      await startGameWithConfig({ players: players(gameOptions.playerCount) });
      return;
    }
    if (selection !== 'army-builder') return;

    screen.hide();
    appContainer().style.display = 'block';
    appContainer().replaceChildren();
    try {
      const result = await showArmyBuilder('app', players(gameOptions.playerCount), DEFAULT_STARTING_BUDGET);
      const invalid = result.configs.flatMap((army, index) =>
        validateArmyConfig(army, result.budget).errors.map(message => `Spieler ${index + 1}: ${message}`));
      if (invalid.length > 0) throw new Error(invalid.join(' · '));
      await startGameWithConfig({
        players: players(gameOptions.playerCount).map((player, index) => ({
          ...player,
          armyConfig: result.configs[index],
        })),
        startingBudget: result.budget,
      });
    } catch (error) {
      if (error instanceof Error && error.message !== 'Army builder cancelled') {
        window.alert(`Armee kann nicht gestartet werden: ${error.message}`);
      }
      showMenu();
    }
  });
  screen.show();
}

document.addEventListener('DOMContentLoaded', showMenu, { once: true });
