import type { CommanderId, GameState, Position } from '@lands-of-glory/game-core';

interface TestApi {
  getState(): GameState | undefined;
  getPhase(): string | undefined;
  drop(commanderId: CommanderId, target: Position): boolean;
  endTurn(): boolean;
  undo(): boolean;
  completeCombat(): boolean;
}

type TestWindow = Window & { __LANDS_OF_GLORY_TEST__?: TestApi };

function options(playerCount: 2 | 3 | 4): void {
  window.localStorage.setItem('lands-of-glory-options', JSON.stringify({
    useTextures: false,
    enableSound: true,
    showGrid: true,
    diceSize: 'small',
    playerCount,
  }));
}

function quickStart(playerCount: 2 | 3 | 4 = 2): void {
  cy.visit('/?e2e=1', { onBeforeLoad: () => options(playerCount) });
  cy.get('[data-testid="quick-start"]').click();
  cy.get('canvas').should('be.visible');
  cy.get('.game-topbar').should('be.visible');
}

function withApi(callback: (api: TestApi) => void): void {
  cy.window().then(value => {
    const api = (value as unknown as TestWindow).__LANDS_OF_GLORY_TEST__;
    expect(api, 'test bridge').to.exist;
    callback(api!);
  });
}

describe('Startmenü und Armee-Editor', () => {
  it('validiert gespeicherte Optionen und kehrt nach Abbruch wiederholt ins Menü zurück', () => {
    cy.visit('/?e2e=1', {
      onBeforeLoad(win) {
        win.localStorage.setItem('lands-of-glory-options', '{"playerCount":99,"diceSize":"giant"}');
      },
    });
    cy.get('[data-testid="options"]').click();
    cy.get('#opt-players').should('have.value', '2');
    cy.get('#dice-large').should('have.class', 'active');
    cy.get('#opt-sound').should('not.be.visible');
    cy.get('.btn-cancel-options').click();

    for (let attempt = 0; attempt < 2; attempt++) {
      cy.get('[data-testid="army-builder"]').click();
      cy.get('.army-builder-screen').should('be.visible');
      cy.get('.btn-cancel').first().click();
      cy.get('[data-testid="quick-start"]').should('be.visible');
    }
  });

  for (const playerCount of [2, 3, 4] as const) {
    it(`startet eine gültige Partie mit ${playerCount} Spielern`, () => {
      quickStart(playerCount);
      withApi(api => {
        expect(api.getState()?.players).to.have.length(playerCount);
        expect(api.getState()?.gameStatus).to.equal('active');
      });
    });
  }
});

describe('Brettaktionen und Core-Synchronisierung', () => {
  beforeEach(() => quickStart(2));

  it('führt echtes Pointer-Drag-and-drop aus und verwirft eine ungültige Aktion unverändert', () => {
    withApi(api => {
      const state = api.getState()!;
      const commanderId = state.players[0].commanders[0];
      expect(state.commanders.get(commanderId)?.position).to.deep.equal({ x: 6, y: 5 });
    });

    cy.get('canvas')
      .trigger('pointerdown', { clientX: 336, clientY: 288, pointerId: 1, pointerType: 'mouse', button: 0, force: true })
      .trigger('pointermove', { clientX: 336, clientY: 336, pointerId: 1, pointerType: 'mouse', buttons: 1, force: true })
      .trigger('pointerup', { clientX: 336, clientY: 336, pointerId: 1, pointerType: 'mouse', button: 0, force: true });

    withApi(api => {
      const state = api.getState()!;
      const commanderId = state.players[0].commanders[0];
      expect(state.commanders.get(commanderId)?.position).to.deep.equal({ x: 6, y: 6 });
      const before = api.getState();
      expect(api.drop(commanderId, { x: 99, y: 99 })).to.equal(false);
      expect(api.getState()).to.equal(before);
    });
    cy.get('#game-notification')
      .should('not.have.attr', 'hidden')
      .and('have.class', 'error');
  });

  it('erzwingt die Festhalte-Auswahl und sperrt während der Kampfanimation weitere Eingaben', () => {
    withApi(api => {
      const initial = api.getState()!;
      const first = initial.players[0].commanders[0];
      const second = initial.players[1].commanders[0];
      const firstTargets = [{ x: 7, y: 6 }, { x: 8, y: 7 }, { x: 9, y: 8 }, { x: 10, y: 9 }, { x: 11, y: 10 }, { x: 12, y: 11 }];
      const secondTargets = [{ x: 16, y: 17 }, { x: 15, y: 16 }, { x: 14, y: 15 }, { x: 13, y: 14 }, { x: 12, y: 13 }, { x: 12, y: 12 }];
      firstTargets.forEach((target, index) => {
        expect(api.drop(first, target), `move first ${index}`).to.equal(true);
        expect(api.endTurn()).to.equal(true);
        expect(api.drop(second, secondTargets[index]), `move second ${index}`).to.equal(true);
        if (index < firstTargets.length - 1) expect(api.endTurn()).to.equal(true);
      });
      expect(api.getPhase()).to.equal('holding');
    });

    cy.get('[data-testid="holding-dialog"]').should('be.visible');
    cy.get('[data-testid="holding-dialog"] .holding-options .btn-primary').first().click();
    cy.get('#holding-status button').should('be.visible').click();
    cy.get('#holding-status').should('not.be.visible');
    withApi(api => {
      expect(api.getPhase()).to.equal('idle');
      expect(api.endTurn()).to.equal(true);
      expect(api.getPhase()).to.equal('holding');
    });
    cy.get('[data-testid="hold-waive"]').click();

    withApi(api => {
      const state = api.getState()!;
      const attacker = state.players[0].commanders[0];
      const defender = state.players[1].commanders[0];
      const defenderPosition = state.commanders.get(defender)!.position;
      const turn = state.turnNumber;
      expect(api.drop(attacker, defenderPosition)).to.equal(true);
      expect(api.getPhase()).to.equal('combat');
      expect(api.endTurn()).to.equal(false);
      expect(api.getState()?.turnNumber).to.equal(turn);
      expect(api.completeCombat()).to.equal(true);
      expect(api.completeCombat()).to.equal(false);
      expect(api.getState()?.log.some(action => action.type === 'attack')).to.equal(true);
    });
  });

  it('beendet das Spiel nach einer Banner-Eroberung und zeigt den Core-Grund', () => {
    withApi(api => {
      const state = api.getState()!;
      const cavalry = state.players[0].commanders[3];
      const route = [{ x: 10, y: 7 }, { x: 11, y: 9 }, { x: 12, y: 11 }, { x: 12, y: 13 }, { x: 12, y: 15 }];
      route.forEach((target, index) => {
        expect(api.drop(cavalry, target), `cavalry move ${index}`).to.equal(true);
        expect(api.endTurn()).to.equal(true);
        expect(api.endTurn()).to.equal(true);
      });
      expect(api.drop(cavalry, { x: 12, y: 17 })).to.equal(true);
      expect(api.getState()?.gameStatus).to.equal('finished');
      expect(api.getState()?.finishReason).to.equal('banner_captured');
    });
    cy.get('[data-testid="end-turn"]').should('be.disabled');
    cy.get('#combat-log-entries').should('contain.text', 'Spiel beendet');
  });
});
