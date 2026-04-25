import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, Level } from "@/game/levelGenerator";
import { getLevel, TOTAL_LEVELS, ENDLESS_START } from "@/game/levels";
import {
  initAudio,
  isMuted,
  setMuted,
  playClear,
  playConnect,
  playFail,
  playLevelUp,
  playLoop,
} from "@/game/sound";
import {
  loadBest,
  loadLevelIndex,
  saveBest,
  saveLevelIndex,
  loadTotalScore,
  saveTotalScore,
} from "@/game/storage";
import { recordFail, recordMove, recordSuccess, shouldAssist } from "@/game/assist";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";

const DOT_CLASS: Record<number, string> = {
  1: "bg-dot-1",
  2: "bg-dot-2",
  3: "bg-dot-3",
  4: "bg-dot-4",
  5: "bg-dot-5",
  6: "bg-dot-6",
};
const DOT_VAR: Record<number, string> = {
  1: "var(--dot-1)",
  2: "var(--dot-2)",
  3: "var(--dot-3)",
  4: "var(--dot-4)",
  5: "var(--dot-5)",
  6: "var(--dot-6)",
};

interface Pos {
  r: number;
  c: number;
}

const eq = (a: Pos, b: Pos) => a.r === b.r && a.c === b.c;
const adj = (a: Pos, b: Pos) =>
  Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

function gravity(grid: Cell[][]): Cell[][] {
  const size = grid.length;
  const next: Cell[][] = grid.map((row) => [...row]);
  for (let c = 0; c < size; c++) {
    const stack: number[] = [];
    for (let r = size - 1; r >= 0; r--) {
      if (next[r][c] !== null) stack.push(next[r][c] as number);
    }
    for (let r = size - 1; r >= 0; r--) {
      next[r][c] = stack.length ? (stack.shift() as number) : null;
    }
  }
  const present = new Set<number>();
  grid.flat().forEach((v) => v && present.add(v));
  const palette = Array.from(present);
  if (palette.length === 0) palette.push(1);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (next[r][c] === null) {
        next[r][c] = palette[Math.floor(Math.random() * palette.length)];
      }
    }
  }
  return next;
}

export default function GameBoard() {
  const [levelIndex, setLevelIndex] = useState<number>(() => loadLevelIndex());
  const [level, setLevel] = useState<Level>(() => getLevel(loadLevelIndex()));
  const [grid, setGrid] = useState<Cell[][]>(level.grid);
  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [cleared, setCleared] = useState(0);
  const [path, setPath] = useState<Pos[]>([]);
  const [clearing, setClearing] = useState<Set<string>>(new Set());
  // peakClearing: cells being cleared as a PEAK moment (loop or large cluster)
  const [peakClearing, setPeakClearing] = useState<Set<string>>(new Set());
  // boardShaking: triggers the subtle screen-shake on peak moments
  const [boardShaking, setBoardShaking] = useState(false);
  // showLevelComplete: flashes the end-moment text overlay
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [muted, setMutedState] = useState<boolean>(() => isMuted());
  const [best, setBest] = useState<number>(() => loadBest());
  const [totalScore, setTotalScore] = useState<number>(() => loadTotalScore());

  const boardRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const drawingRef = useRef(false);
  const pathRef = useRef<Pos[]>([]);
  const gridRef = useRef<Cell[][]>(grid);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  // Keep refs in sync (avoid stale closures in pointer handlers)
  useEffect(() => {
    pathRef.current = path;
  }, [path]);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  useEffect(() => {
    return () => clearTransitionTimer();
  }, [clearTransitionTimer]);

  const size = level.size;
  const activeColor = path.length ? grid[path[0].r][path[0].c] : null;

  const loadLevel = useCallback((idx: number) => {
    clearTransitionTimer();
    // No upper cap — allows endless progression beyond level 20
    const assist = shouldAssist(idx);
    const l = getLevel(idx, assist);
    setLevelIndex(idx);
    setLevel(l);
    setGrid(l.grid);
    gridRef.current = l.grid;
    setMovesLeft(l.moves);
    setCleared(0);
    setPath([]);
    pathRef.current = [];
    setClearing(new Set());
    drawingRef.current = false;
    saveLevelIndex(idx);
    if (idx > best) {
      setBest(idx);
      saveBest(idx);
    }
  }, [best, clearTransitionTimer]);

  const levelComplete = useCallback((clearedThisLevel: number) => {
    playLevelUp();
    recordSuccess(levelIndex);
    clearTransitionTimer();
    setTransitioning(true);
    // Accumulate total score
    setTotalScore((prev) => {
      const next = prev + clearedThisLevel;
      saveTotalScore(next);
      return next;
    });
    // END MOMENT: flash "Level Complete" overlay, then advance.
    // Text is rendered in-board — no modal, no layout shift.
    setShowLevelComplete(true);
    transitionTimerRef.current = setTimeout(() => {
      setShowLevelComplete(false);
      loadLevel(levelIndex + 1);
      setTransitioning(false);
      transitionTimerRef.current = null;
    }, 280);
  }, [clearTransitionTimer, levelIndex, loadLevel]);

  const restartCurrentLevel = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    playFail();
    recordFail(levelIndex);
    clearTransitionTimer();
    transitionTimerRef.current = setTimeout(() => {
      loadLevel(levelIndex);
      setTransitioning(false);
      transitionTimerRef.current = null;
    }, 320);
  }, [clearTransitionTimer, levelIndex, loadLevel, transitioning]);

  // Get cell from coordinates using bounding rects (more reliable than elementFromPoint on touch)
  const cellFromPoint = (x: number, y: number): Pos | null => {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
      return null;
    // Find closest cell by checking refs
    let found: Pos | null = null;
    let bestDist = Infinity;
    cellRefs.current.forEach((el, key) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const d = dx * dx + dy * dy;
      // Hit test: pointer must be reasonably close to cell center
      if (d < bestDist && Math.abs(dx) < r.width * 0.6 && Math.abs(dy) < r.height * 0.6) {
        bestDist = d;
        const [rr, cc] = key.split(":").map(Number);
        found = { r: rr, c: cc };
      }
    });
    return found;
  };

  const tryAdd = (pos: Pos) => {
    if (transitioning) return;
    const g = gridRef.current;
    const color = g[pos.r][pos.c];
    if (color === null) return;
    const prev = pathRef.current;
    if (prev.length === 0) {
      pathRef.current = [pos];
      setPath([pos]);
      playConnect(1);
      return;
    }
    const last = prev[prev.length - 1];
    // backtrack
    if (prev.length >= 2 && eq(prev[prev.length - 2], pos)) {
      const next = prev.slice(0, -1);
      pathRef.current = next;
      setPath(next);
      return;
    }
    // already in path?
    if (prev.some((p) => eq(p, pos))) return;
    if (!adj(last, pos)) return;
    if (g[pos.r][pos.c] !== g[prev[0].r][prev[0].c]) return;
    const next = [...prev, pos];
    pathRef.current = next;
    setPath(next);
    playConnect(next.length);
  };

  const startAt = (x: number, y: number) => {
    if (transitioning) return;
    const pos = cellFromPoint(x, y);
    if (!pos) return;
    drawingRef.current = true;
    pathRef.current = [pos];
    setPath([pos]);
    initAudio();
    playConnect(1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    boardRef.current?.setPointerCapture?.(e.pointerId);
    startAt(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const pos = cellFromPoint(e.clientX, e.clientY);
    if (!pos) return;
    const last = pathRef.current[pathRef.current.length - 1];
    if (last && eq(last, pos)) return;
    tryAdd(pos);
  };

  const finalize = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const currentPath = pathRef.current;
    if (currentPath.length < 2) {
      pathRef.current = [];
      setPath([]);
      return;
    }
    const g = gridRef.current;
    const color = g[currentPath[0].r][currentPath[0].c];
    if (color === null) {
      pathRef.current = [];
      setPath([]);
      return;
    }

    // Loop check: any cell in path adjacent to first (non-trivial)
    const first = currentPath[0];
    const last = currentPath[currentPath.length - 1];
    const looped = currentPath.length >= 4 && adj(first, last);

    const toClear = new Set<string>();
    if (looped) {
      for (let r = 0; r < g.length; r++) {
        for (let c = 0; c < g.length; c++) {
          if (g[r][c] === color) toClear.add(`${r}:${c}`);
        }
      }
      playLoop();
    } else {
      currentPath.forEach((p) => toClear.add(`${p.r}:${p.c}`));
      playClear(toClear.size);
    }

    // PEAK MOMENT detection: loop or large cluster (>=6 dots)
    const isPeak = looped || toClear.size >= 6;

    if (isPeak) {
      // Cells get the 'burst' animation (brighter, larger)
      setPeakClearing(toClear);
      setClearing(new Set()); // don't double-animate
      // Board shake: set flag, clear after animation completes (~160ms)
      setBoardShaking(true);
      setTimeout(() => setBoardShaking(false), 160);
    } else {
      setClearing(toClear);
      setPeakClearing(new Set());
    }

    const clearedCount = toClear.size;
    const nextCleared = cleared + clearedCount;
    const nextMovesLeft = movesLeft - 1;

    setTimeout(() => {
      const newGrid = (() => {
        const next = g.map((row) => [...row]);
        toClear.forEach((k) => {
          const [r, c] = k.split(":").map(Number);
          next[r][c] = null;
        });
        return gravity(next);
      })();
      gridRef.current = newGrid;
      setGrid(newGrid);
      setClearing(new Set());
      setPeakClearing(new Set());
      pathRef.current = [];
      setPath([]);

      console.log(`[Game] Move resolved. Cleared: ${nextCleared}/${level.target}, Moves left: ${nextMovesLeft}`);
      recordMove(clearedCount);

      if (nextCleared >= level.target) {
        console.log(`[Game] Level ${levelIndex + 1} complete! Advancing...`);
        setCleared(nextCleared);
        setMovesLeft(nextMovesLeft);
        levelComplete(nextCleared);
        return;
      }

      setCleared(nextCleared);
      setMovesLeft(nextMovesLeft);

      if (nextMovesLeft <= 0) {
        restartCurrentLevel();
      }
    }, 220);
  };

  const onPointerUp = () => finalize();
  const onPointerCancel = () => finalize();

  // SVG line overlay
  const lineOverlay = useMemo(() => {
    if (path.length < 2 || !boardRef.current) return null;
    const board = boardRef.current.getBoundingClientRect();
    const pts = path
      .map((p) => {
        const el = cellRefs.current.get(`${p.r}:${p.c}`);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: rect.left - board.left + rect.width / 2,
          y: rect.top - board.top + rect.height / 2,
        };
      })
      .filter(Boolean) as { x: number; y: number }[];
    if (pts.length < 2) return null;
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const color = activeColor ? DOT_VAR[activeColor] : "var(--foreground)";
    return (
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
      >
        <path
          d={d}
          stroke={`hsl(${color})`}
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.6}
        />
      </svg>
    );
  }, [path, activeColor]);

  const progress = Math.min(100, Math.round((cleared / level.target) * 100));

  const toggleMute = () => {
    const v = !muted;
    setMuted(v);
    setMutedState(v);
  };

  const restart = () => {
    if (transitioning) return;
    loadLevel(levelIndex);
  };

  const isEndless = levelIndex >= ENDLESS_START;

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4 px-4 py-4 no-select">
      {/* Top HUD */}
      <div className="flex w-full max-w-md items-center justify-between text-xs uppercase tracking-[0.2em] text-foreground/50">
        <div className="flex items-center gap-2">
          <span>
            {isEndless
              ? `∞ ${levelIndex - ENDLESS_START + 1}`
              : `Lv ${level.index + 1}/${TOTAL_LEVELS}`}
          </span>
          {isEndless && (
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "0.18em",
                color: "hsl(var(--dot-4) / 0.75)",
                background: "hsl(var(--dot-4) / 0.12)",
                padding: "1px 5px",
                borderRadius: "3px",
                border: "1px solid hsl(var(--dot-4) / 0.25)",
              }}
            >
              ENDLESS
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isEndless && (
            <span style={{ fontSize: "9px", letterSpacing: "0.15em", color: "hsl(var(--foreground) / 0.35)" }}>
              BEST {best >= ENDLESS_START ? `∞${best - ENDLESS_START + 1}` : `LV${best + 1}`}
            </span>
          )}
          <span>Moves {movesLeft}</span>
          <button
            onClick={restart}
            aria-label="Restart level"
            className="rounded p-1 text-foreground/50 transition hover:text-foreground/90"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="rounded p-1 text-foreground/50 transition hover:text-foreground/90"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      {/* Objective bar */}
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-foreground/40">
          <span>Clear {level.target}</span>
          <span>
            {cleared}/{level.target}
          </span>
        </div>
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-cell-border">
          <div
            className="h-full bg-foreground/80 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="relative aspect-square w-full max-w-md touch-none rounded-2xl bg-board p-3"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => {
          /* keep drawing while captured */
        }}
        style={{
          animation: boardShaking
            ? "shake 0.16s cubic-bezier(0.36,0.07,0.19,0.97) both"
            : "fade-up 0.35s ease-out",
          touchAction: "none",
        }}
        key={level.index}
      >
        <div
          className="grid h-full w-full gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, r) =>
            row.map((color, c) => {
              const key = `${r}:${c}`;
              const inPath = path.some((p) => eq(p, { r, c }));
              const isClearing = clearing.has(key);
              const isPeakClearing = peakClearing.has(key);
              return (
                <div
                  key={key}
                  data-cell
                  data-r={r}
                  data-c={c}
                  ref={(el) => cellRefs.current.set(key, el)}
                  className="relative flex items-center justify-center rounded-md bg-cell"
                >
                  {color !== null && (
                    <div
                      className={`h-[62%] w-[62%] rounded-full ${DOT_CLASS[color]} transition-transform duration-150`}
                      style={{
                        // PEAK: stronger glow + larger shadow when in path during peak
                        boxShadow: isPeakClearing
                          ? `0 0 0 3px hsl(${DOT_VAR[color]} / 0.5), 0 0 18px 4px hsl(${DOT_VAR[color]} / 0.65)`
                          : inPath
                          ? `0 0 0 2px hsl(${DOT_VAR[color]} / 0.35), 0 8px 20px -4px hsl(${DOT_VAR[color]} / 0.7)`
                          : `0 0 0 2px hsl(${DOT_VAR[color]} / 0.18), 0 6px 16px -4px hsl(${DOT_VAR[color]} / 0.55)`,
                        transform: inPath ? "scale(1.18)" : "scale(1)",
                        // PEAK clear uses 'burst', regular uses 'pop'
                        animation: isPeakClearing
                          ? "burst 0.28s cubic-bezier(0.16,1,0.3,1) forwards"
                          : isClearing
                          ? "pop 0.22s ease-out forwards"
                          : undefined,
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
        {lineOverlay}
        {/* END MOMENT: minimal, non-blocking level complete flash */}
        {showLevelComplete && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "level-complete-fade 0.22s cubic-bezier(0.16,1,0.3,1) forwards",
              pointerEvents: "none",
              zIndex: 10,
              fontSize: "clamp(14px, 4vw, 20px)",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "hsl(var(--foreground))",
              textShadow: "0 0 18px hsl(var(--foreground) / 0.6)",
              whiteSpace: "nowrap",
            }}
          >
            Level Complete
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="h-4 text-[10px] uppercase tracking-[0.25em] text-foreground/25">
        {transitioning
          ? ""
          : isEndless
          ? `Score ${totalScore}`
          : "Drag to connect • Loop to clear all"}
      </div>
    </div>
  );
}
