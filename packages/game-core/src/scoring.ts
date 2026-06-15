/**
 * packages/game-core/src/scoring.ts
 *
 * Game scoring system for end-game results
 * Calculates points based on remaining units, commanders, and strength points
 */

import { GameState, PlayerId, Unit, Commander } from './types';

/**
 * Player score breakdown
 */
export interface PlayerScore {
  playerId: PlayerId;
  playerName: string;
  remainingUnits: number;
  remainingCommanders: number;
  strengthPoints: number;
  totalScore: number;
}

/**
 * Complete game results
 */
export interface GameResults {
  winner: PlayerId;
  winnerName: string;
  finishReason: 'king_defeated' | 'banner_captured' | 'stalemate';
  scores: PlayerScore[];
}

/**
 * Calculate scores for all players at game end
 * 
 * Scoring:
 * - 1 point per remaining unit
 * - 3 points per remaining commander
 * - Sum of all bonusPoints from remaining units as strength points
 * 
 * @param state - Final game state
 * @returns Game results with scores for all players
 */
export function calculateGameResults(state: GameState): GameResults | undefined {
  if (state.gameStatus !== 'finished' || !state.winner) {
    return undefined;
  }

  const winner = state.players.find(p => p.id === state.winner);
  if (!winner) return undefined;

  // Get finish reason from last action
  const lastAction = state.log[state.log.length - 1];
  const finishReason = lastAction?.type === 'gameEnd' 
    ? (lastAction.details as { reason?: 'king_defeated' | 'banner_captured' | 'stalemate' })?.reason 
    : 'stalemate';

  const scores: PlayerScore[] = state.players.map(player => {
    let remainingUnits = 0;
    let remainingCommanders = 0;
    let strengthPoints = 0;

    // Count commanders and their units
    for (const commanderId of player.commanders) {
      const commander = state.commanders.get(commanderId);
      if (commander) {
        remainingCommanders++;
        
        // Count active units and their strength
        for (const unit of commander.units) {
          if (unit && unit.status === 'active') {
            remainingUnits++;
            strengthPoints += unit.bonusPoints;
          }
        }
      }
    }

    // Calculate total score
    const totalScore = remainingUnits + (remainingCommanders * 3) + strengthPoints;

    return {
      playerId: player.id,
      playerName: player.name,
      remainingUnits,
      remainingCommanders,
      strengthPoints,
      totalScore,
    };
  });

  // Sort by total score descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  return {
    winner: winner.id,
    winnerName: winner.name,
    finishReason: finishReason || 'stalemate',
    scores,
  };
}

/**
 * Get detailed unit breakdown for a player
 * Useful for displaying detailed results
 */
export function getPlayerUnitBreakdown(
  state: GameState, 
  playerId: PlayerId
): { commanderType: string; unitCount: number; totalStrength: number }[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const breakdown: { commanderType: string; unitCount: number; totalStrength: number }[] = [];

  for (const commanderId of player.commanders) {
    const commander = state.commanders.get(commanderId);
    if (commander) {
      let unitCount = 0;
      let totalStrength = 0;

      for (const unit of commander.units) {
        if (unit && unit.status === 'active') {
          unitCount++;
          totalStrength += unit.bonusPoints;
        }
      }

      if (unitCount > 0) {
        breakdown.push({
          commanderType: commander.type + (commander.isKing ? ' (King)' : ''),
          unitCount,
          totalStrength,
        });
      }
    }
  }

  return breakdown;
}
