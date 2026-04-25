// 20 hand-tuned levels for a smooth difficulty curve.
// Falls back to procedural endless generation for index >= 20.
import { Level, applyClusterBias } from "./levelGenerator";

interface LevelSpec {
  size: number;
  colors: number;
  moves: number;
  target: number;
}

// Spec-driven curve:
//  L1–3   → 5x5, 3 colors, 15 moves
//  L4–7   → 6x6, 4 colors, 12 moves
//  L8–10  → 7x7, 5 colors, 10 moves
//  L11–14 → 7x7, 5–6 colors, 9 moves  (steady pressure)
//  L15–17 → 8x8, 6 colors, 9 moves    (bigger board)
//  L18–20 → 8x8, 6 colors, 8 moves    (tighter moves, high targets)
const SPECS: LevelSpec[] = [
  // ── Curated 1–10 ──────────────────────────────────────────────
  { size: 5, colors: 3, moves: 15, target: 10 },
  { size: 5, colors: 3, moves: 15, target: 15 },
  { size: 5, colors: 3, moves: 15, target: 20 },
  { size: 6, colors: 4, moves: 12, target: 25 },
  { size: 6, colors: 4, moves: 12, target: 30 },
  { size: 6, colors: 4, moves: 12, target: 35 },
  { size: 6, colors: 4, moves: 12, target: 38 },
  { size: 7, colors: 5, moves: 10, target: 42 },
  { size: 7, colors: 5, moves: 10, target: 46 },
  { size: 7, colors: 5, moves: 10, target: 50 },
  // ── Curated 11–20 ─────────────────────────────────────────────
  { size: 7, colors: 5, moves: 9,  target: 54 },
  { size: 7, colors: 5, moves: 9,  target: 58 },
  { size: 7, colors: 6, moves: 9,  target: 60 },
  { size: 7, colors: 6, moves: 9,  target: 63 },
  { size: 8, colors: 6, moves: 9,  target: 48 },
  { size: 8, colors: 6, moves: 9,  target: 52 },
  { size: 8, colors: 6, moves: 9,  target: 56 },
  { size: 8, colors: 6, moves: 8,  target: 58 },
  { size: 8, colors: 6, moves: 8,  target: 60 },
  { size: 8, colors: 6, moves: 8,  target: 64 },
];

/** Total number of curated (hand-tuned) levels. */
export const TOTAL_LEVELS = SPECS.length; // 20

/** First endless level index (0-based). Everything >= this is procedural. */
export const ENDLESS_START = 20;

export function getLevel(index: number, assist = false): Level {
  if (index < SPECS.length) {
    const spec = SPECS[index];
    // Soft assist: fewer colors, slightly lower target, cluster-biased grid.
    const colors = assist ? Math.max(3, spec.colors - 1) : spec.colors;
    const target = assist ? Math.max(5, Math.round(spec.target * 0.85)) : spec.target;
    let built = buildCustomGrid(spec.size, colors);
    if (assist) built = applyClusterBias(built, 2);
    return {
      index,
      size: spec.size,
      colors,
      moves: spec.moves,
      target,
      grid: built,
    };
  }

  // ── Endless mode: procedural beyond level 20 ───────────────────
  const lvl = generateEndlessLevel(index);
  if (!assist) return lvl;
  const colors = Math.max(3, lvl.colors - 1);
  return {
    ...lvl,
    colors,
    target: Math.max(5, Math.round(lvl.target * 0.85)),
    grid: applyClusterBias(lvl.grid, 2),
  };
}

/**
 * Endless difficulty ramp (index >= 20).
 * Grid stays at 8x8, colors at 6, but moves tighten and targets rise.
 */
function generateEndlessLevel(index: number): Level {
  const depth = index - ENDLESS_START; // 0-based depth into endless
  const size = 8; // fixed 8×8
  const colors = 6; // always max colors
  // Moves: start at 8, tighten by 1 every 5 depths, floor at 5
  const moves = Math.max(5, 8 - Math.floor(depth / 5));
  // Target: starts at 64 (full board), scales up by 2 per depth (capped at board - 4)
  const target = Math.min(size * size - 4, 64 + depth * 2);

  const grid = buildCustomGrid(size, colors);
  // More cluster bias at higher depths to keep it playable
  const biasedGrid = applyClusterBias(grid, depth < 10 ? 2 : 3);

  return { index, size, colors, moves, target, grid: biasedGrid };
}

function buildCustomGrid(size: number, colors: number) {
  const grid: (number | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null as number | null)
  );
  const total = size * size;
  const base = Math.floor(total / colors);
  const counts = Array.from({ length: colors }, () => base);
  let remainder = total - base * colors;
  while (remainder-- > 0) counts[Math.floor(Math.random() * colors)]++;
  const pool: number[] = [];
  counts.forEach((c, i) => {
    for (let k = 0; k < c; k++) pool.push(i + 1);
  });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  let p = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) grid[r][c] = pool[p++];
  return grid;
}
