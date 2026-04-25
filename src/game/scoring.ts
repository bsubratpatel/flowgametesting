// Scoring rules — all values tuned for a satisfying feel.
export const POINTS_PER_DOT = 10;
export const LOOP_MULTIPLIER = 2;    // loop clears all same-color → 2× pts
export const POINTS_PER_MOVE_LEFT = 50; // completion bonus per unused move
export const FIRST_TRY_BONUS = 500;  // cleared the level with zero restarts

/** Score for a single clear action. */
export function calcClearScore(dotCount: number, isLoop: boolean): number {
  const base = dotCount * POINTS_PER_DOT;
  return isLoop ? Math.round(base * LOOP_MULTIPLIER) : base;
}

/** Bonus awarded when a level is completed (remaining moves). */
export function calcMoveBonus(movesLeft: number): number {
  return Math.max(0, movesLeft) * POINTS_PER_MOVE_LEFT;
}
