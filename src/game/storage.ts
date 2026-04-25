// Local persistence — fully offline.
const KEY_LEVEL = "flow:level";
const KEY_BEST = "flow:best";
const KEY_SCORE = "flow:score";

export function loadLevelIndex(): number {
  try {
    const v = parseInt(localStorage.getItem(KEY_LEVEL) || "0", 10);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  } catch {
    return 0;
  }
}

export function saveLevelIndex(i: number) {
  try {
    localStorage.setItem(KEY_LEVEL, String(i));
  } catch {}
}

export function loadBest(): number {
  try {
    return parseInt(localStorage.getItem(KEY_BEST) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(i: number) {
  try {
    localStorage.setItem(KEY_BEST, String(i));
  } catch {}
}

export function loadTotalScore(): number {
  try {
    return parseInt(localStorage.getItem(KEY_SCORE) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function saveTotalScore(score: number) {
  try {
    localStorage.setItem(KEY_SCORE, String(score));
  } catch {}
}

const KEY_LIVES = "flow:lives";
const KEY_REFILL_TIME = "flow:refill_time";

export function loadLivesState(): { lives: number; lastRefill: number } {
  try {
    const livesStr = localStorage.getItem(KEY_LIVES);
    const timeStr = localStorage.getItem(KEY_REFILL_TIME);
    
    // Default to 3 lives, current time if never played
    const lives = livesStr ? parseInt(livesStr, 10) : 3;
    const lastRefill = timeStr ? parseInt(timeStr, 10) : Date.now();
    
    return { 
      lives: Number.isFinite(lives) ? lives : 3, 
      lastRefill: Number.isFinite(lastRefill) ? lastRefill : Date.now() 
    };
  } catch {
    return { lives: 3, lastRefill: Date.now() };
  }
}

export function saveLivesState(lives: number, lastRefill: number) {
  try {
    localStorage.setItem(KEY_LIVES, String(lives));
    localStorage.setItem(KEY_REFILL_TIME, String(lastRefill));
  } catch {}
}
