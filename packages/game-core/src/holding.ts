import { Commander, CommanderId, GameState, HoldingDecision, PlayerId } from './types';
import { calculateDistance } from './board';
import { activeUnits, logEvent } from './state';
import { GameRuleError, GameErrorCode } from './errors';

export interface HoldingChoice {
  readonly holderId: CommanderId;
  readonly playerId: PlayerId;
  readonly candidates: readonly CommanderId[];
}

function choices(state: GameState): HoldingChoice[] {
  if (state.gameStatus !== 'active') return [];
  const commanders = [...state.commanders.values()];
  return state.players.flatMap(player => commanders
    .filter(cmd => cmd.playerId === player.id && cmd.playerId !== state.activePlayerId &&
      player.status !== 'defeated' && cmd.type === 'infantry' && activeUnits(cmd).length > 0)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(holder => ({
      holderId: holder.id, playerId: holder.playerId,
      candidates: commanders.filter(cmd => cmd.playerId === state.activePlayerId &&
        calculateDistance(holder.position, cmd.position) === 1).map(cmd => cmd.id).sort(),
    }))).filter(choice => choice.candidates.length > 0);
}

export function validDecisions(state: GameState): HoldingDecision[] {
  const current = choices(state);
  const taken = new Set<CommanderId>();
  return (state.holdingDecisions ?? []).filter(decision => {
    const choice = current.find(item => item.holderId === decision.holderId);
    if (!choice) return false;
    if (decision.targetId === null) return choice.candidates.join() === decision.candidates.join();
    if (!choice.candidates.includes(decision.targetId) || taken.has(decision.targetId)) return false;
    taken.add(decision.targetId);
    return true;
  });
}

export function getHoldingCommander(state: GameState, targetId: CommanderId): Commander | undefined {
  const decision = validDecisions(state).find(item => item.targetId === targetId);
  return decision ? state.commanders.get(decision.holderId) : undefined;
}

export function getPendingHoldingChoices(state: GameState): HoldingChoice[] {
  const decisions = validDecisions(state);
  const taken = new Set(decisions.map(item => item.targetId));
  return choices(state).filter(choice => !decisions.some(item => item.holderId === choice.holderId))
    .map(choice => ({ ...choice, candidates: choice.candidates.filter(id => !taken.has(id)) }))
    .filter(choice => choice.candidates.length > 0);
}

/** Resolve the first pending passive response; null explicitly waives holding. */
export function setHoldingTarget(state: GameState, playerId: PlayerId, holderId: CommanderId, targetId: CommanderId | null): GameState {
  const decisions = validDecisions(state);
  const pending = getPendingHoldingChoices(state)[0];
  const existing = decisions.find(item => item.holderId === holderId);
  const holder = state.commanders.get(holderId);
  const release = existing && targetId === null;
  if (state.gameStatus !== 'active' || !holder || holder.playerId !== playerId ||
      (!release && (pending?.holderId !== holderId || (targetId !== null && !pending.candidates.includes(targetId))))) {
    throw new GameRuleError('Invalid holding response', GameErrorCode.INVALID_MOVE);
  }
  const candidates = choices(state).find(item => item.holderId === holderId)!.candidates;
  const next = { ...state, holdingDecisions: [
    ...decisions.filter(item => item.holderId !== holderId), { holderId, targetId, candidates },
  ] };
  return logEvent(next, { type: 'hold', playerId, commanderId: holderId, details: { targetId } });
}
