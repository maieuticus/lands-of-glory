import { Application, Container } from 'pixi.js';
import { CombatDiceAnimation } from '../src/renderer/combat-animation';
import { DiceRenderer } from '../src/renderer/dice-renderer';

// Real Pixi containers exercise resource ownership without a WebGL/DOM renderer.
describe('Combat animation resource lifecycle', () => {
  test('close destroys nested graphics and notifies exactly once', () => {
    const stage = new Container();
    const animation = new CombatDiceAnimation({ stage } as Application);
    const panel = new Container();
    const nested = new Container();
    const die = new Container();
    panel.addChild(nested);
    nested.addChild(die);
    (stage.children[0] as Container).addChild(panel);
    const callback = jest.fn();
    Object.assign(animation, { isPlaying: true, onCompleteCallback: callback });
    animation.close();
    animation.close();
    expect(panel.destroyed).toBe(true);
    expect(nested.destroyed).toBe(true);
    expect(die.destroyed).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
    animation.dispose();
    stage.destroy({ children: true });
  });

  test('each rolling update destroys the previous dice graphics', () => {
    const stage = new Container();
    const animation = new CombatDiceAnimation({ stage } as Application);
    const row = new Container();
    const oldDie = new Container();
    const oldDot = new Container();
    oldDie.addChild(oldDot);
    row.addChild(oldDie);
    const replacement = new Container();
    const spy = jest.spyOn(DiceRenderer.prototype, 'createDice').mockReturnValue(replacement);
    const internals = animation as unknown as {
      updateDiceDisplay(container: Container, value: number, color: number, showBonus: boolean, bonus: number, king: boolean): void;
    };
    internals.updateDiceDisplay(row, 6, 0xffffff, false, 0, false);
    expect(oldDie.destroyed).toBe(true);
    expect(oldDot.destroyed).toBe(true);
    expect(row.children).toEqual([replacement]);
    spy.mockRestore();
    row.destroy({ children: true });
    animation.dispose();
    stage.destroy({ children: true });
  });
});
