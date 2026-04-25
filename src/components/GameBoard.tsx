import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { recordFail, recordMove, recordSuccess, shouldAssist, isFirstTry } from "@/game/assist";
import { calcClearScore, calcMoveBonus, FIRST_TRY_BONUS } from "@/game/scoring";
import { useLives } from "@/game/useLives";
import { WinSheet, LoseSheet } from "@/components/Sheets";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";

interface ScorePopup { id: number; text: string; x: number; y: number; }

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
  const navigate = useNavigate();
  const [levelIndex, setLevelIndex] = useState<number>(() => loadLevelIndex());
  const [level, setLevel] = useState<Level>(() => getLevel(loadLevelIndex()));
  const [grid, setGrid] = useState<Cell[][]>(level.grid);
  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [cleared, setCleared] = useState(0);
  const [path, setPath] = useState<Pos[]>([]);
  const [clearing, setClearing] = useState<Set<string>>(new Set());
  const [peakClearing, setPeakClearing] = useState<Set<string>>(new Set());
  const [boardShaking, setBoardShaking] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [muted, setMutedState] = useState<boolean>(() => isMuted());
  const [best, setBest] = useState<number>(() => loadBest());
  const [totalScore, setTotalScore] = useState<number>(() => loadTotalScore());
  const [levelScore, setLevelScore] = useState(0);
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  
  const [sheetState, setSheetState] = useState<{ 
    type: "win" | "lose" | null; 
    breakdown?: any; 
    efficiency?: "PERFECT" | "CLEAN" | "SOLID";
  }>({ type: null });

  const { lives, deductLife } = useLives();
  const levelScoreRef = useRef(0);
  const dotsScoreRef = useRef(0);
  const loopScoreRef = useRef(0);
  const popupIdRef = useRef(0);

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
    // Reset per-level score
    levelScoreRef.current = 0;
    dotsScoreRef.current = 0;
    loopScoreRef.current = 0;
    setLevelScore(0);
    setPopups([]);
    if (idx > best) {
      setBest(idx);
      saveBest(idx);
    }
  }, [best, clearTransitionTimer]);

  const spawnPopup = useCallback((text: string, xPct: number, yPct: number) => {
    const id = ++popupIdRef.current;
    setPopups((prev) => [...prev, { id, text, x: xPct, y: yPct }]);
    setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 800);
  }, []);

  const levelComplete = useCallback((nextMovesLeft: number, initialMoves: number) => {
    // Check first-try BEFORE recordSuccess clears the fail count
    const firstTry = isFirstTry(levelIndex);
    playLevelUp();
    recordSuccess(levelIndex);
    clearTransitionTimer();
    setTransitioning(true);
    // Compute completion bonuses
    const moveBonus = calcMoveBonus(nextMovesLeft);
    const ftBonus = firstTry ? FIRST_TRY_BONUS : 0;
    const bonusTotal = moveBonus + ftBonus;
    const fullLevelScore = levelScoreRef.current + bonusTotal;

    const efficiency = nextMovesLeft >= Math.floor(initialMoves * 0.5) ? "PERFECT" : nextMovesLeft > 0 ? "CLEAN" : "SOLID";
    const breakdown = {
      dots: dotsScoreRef.current,
      loop: loopScoreRef.current,
      moves: moveBonus,
      firstTry: ftBonus,
    };

    // Show bonus popup if earned
    if (bonusTotal > 0) {
      const label = firstTry && moveBonus > 0
        ? `+${bonusTotal} PERFECT!`
        : firstTry
        ? `+${ftBonus} FIRST TRY!`
        : `+${moveBonus} BONUS`;
      spawnPopup(label, 50, 42);
    }
    
    // Persist total score
    setTotalScore((prev) => {
      const next = prev + fullLevelScore;
      saveTotalScore(next);
      return next;
    });

    setSheetState({ type: "win", breakdown, efficiency });
  }, [clearTransitionTimer, levelIndex, spawnPopup]);

  const handleLoss = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    playFail();
    recordFail(levelIndex);
    deductLife();
    setSheetState({ type: "lose" });
  }, [transitioning, levelIndex, deductLife]);

  const restartCurrentLevel = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    playFail();
    recordFail(levelIndex);
    deductLife(); // manual restart costs a life
    clearTransitionTimer();
    transitionTimerRef.current = setTimeout(() => {
      loadLevel(levelIndex);
      setTransitioning(false);
      transitionTimerRef.current = null;
    }, 320);
  }, [clearTransitionTimer, levelIndex, loadLevel, transitioning, deductLife]);

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

    // ── Score & popup (computed before DOM changes) ──────────────
    const earned = calcClearScore(toClear.size, looped);
    levelScoreRef.current += earned;
    setLevelScore(levelScoreRef.current);
    // Centroid of cleared cells (% relative to board)
    {
      const board = boardRef.current;
      if (board) {
        const br = board.getBoundingClientRect();
        let sx = 0, sy = 0, n = 0;
        toClear.forEach((k) => {
          const el = cellRefs.current.get(k);
          if (!el) return;
          const r = el.getBoundingClientRect();
          sx += r.left - br.left + r.width / 2;
          sy += r.top - br.top + r.height / 2;
          n++;
        });
        if (n > 0) {
          const label = looped ? `+${earned} LOOP!` : `+${earned}`;
          spawnPopup(label, (sx / n) / br.width * 100, (sy / n) / br.height * 100);
        }
      }
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

      dotsScoreRef.current += clearedCount * 10;
      if (looped) {
        loopScoreRef.current += earned - (clearedCount * 10);
      }

      if (nextCleared >= level.target) {
        console.log(`[Game] Level ${levelIndex + 1} complete! Advancing...`);
        setCleared(nextCleared);
        setMovesLeft(nextMovesLeft);
        levelComplete(nextMovesLeft, level.moves);
        return;
      }

      setCleared(nextCleared);
      setMovesLeft(nextMovesLeft);

      if (nextMovesLeft <= 0) {
        handleLoss();
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
  const movesLow = movesLeft <= 3 && movesLeft > 0;

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4 px-4 py-4 no-select">
      {/* Top HUD Area */}
      <div className="flex w-full max-w-md flex-col gap-5">
        {/* Row 1: Brand & Level */}
        <div className="flex items-center justify-between font-display font-bold uppercase">
          <div className="flex items-center gap-4 text-foreground">
            <span 
              onClick={() => navigate("/")}
              className="cursor-pointer text-foreground/50 transition hover:text-foreground"
            >
              ←
            </span>
            <span className="text-[20px] tracking-[0.08em]">
              FLOW<span style={{ color: activeColor ? `hsl(${DOT_VAR[activeColor]})` : "inherit" }}>.</span>
            </span>
          </div>
          <div className="text-[10px] tracking-[0.18em] text-foreground/50">
            {isEndless ? `∞ ${levelIndex - ENDLESS_START + 1}` : `LV ${level.index + 1}/${TOTAL_LEVELS}`}
          </div>
        </div>

        {/* Row 2: Lives & Moves */}
        <div className="flex items-center justify-between font-sans text-[11px] font-medium tracking-[0.18em]">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lives ? "text-foreground" : "text-foreground/20"}>
                ❤
              </span>
            ))}
          </div>
          <div
            className="flex items-center gap-4"
            style={{
              color: movesLow ? "hsl(var(--dot-1))" : "hsl(var(--foreground) / 0.5)",
              fontWeight: movesLow ? 700 : 500,
            }}
          >
            <span>MOVES {movesLeft}</span>
            {/* Keeping utility buttons subtle next to moves for now */}
            <div className="flex items-center gap-2 text-foreground/30">
              <button onClick={restart} aria-label="Restart level" className="transition hover:text-foreground/80">
                <RotateCcw size={12} />
              </button>
              <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="transition hover:text-foreground/80">
                {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Progress */}
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-foreground/40">
            <span>Clear {level.target}</span>
            <span>
              {cleared}/{level.target}
            </span>
          </div>
          <div className="h-[1.5px] w-full overflow-hidden bg-cell-border">
            <div
              className="h-full bg-foreground transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
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
        {/* Score popups — float up at cleared cell centroid */}
        {popups.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: "float-score 0.75s cubic-bezier(0.16,1,0.3,1) forwards",
              pointerEvents: "none",
              zIndex: 20,
              fontSize: "clamp(11px, 3.2vw, 16px)",
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: "hsl(var(--dot-4))",
              textShadow: "0 0 10px hsl(var(--dot-4) / 0.55)",
              whiteSpace: "nowrap",
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* Bottom hint */}
      <div className="h-4 text-[10px] uppercase tracking-[0.25em] text-foreground/25">
        {transitioning
          ? ""
          : "Drag to connect • Loop to clear all"}
      </div>

      {/* Sheets Overlay */}
      {sheetState.type === "win" && (
        <WinSheet
          levelIndex={levelIndex}
          efficiency={sheetState.efficiency!}
          breakdown={sheetState.breakdown!}
          levelScore={sheetState.breakdown!.dots + sheetState.breakdown!.loop + sheetState.breakdown!.moves + sheetState.breakdown!.firstTry}
          totalScore={totalScore}
          onNext={() => {
            setSheetState({ type: null });
            loadLevel(levelIndex + 1);
            setTransitioning(false);
          }}
          onRetry={() => {
            setSheetState({ type: null });
            loadLevel(levelIndex);
            setTransitioning(false);
          }}
        />
      )}

      {sheetState.type === "lose" && (
        <LoseSheet
          livesRemaining={lives}
          onRetry={() => {
            setSheetState({ type: null });
            loadLevel(levelIndex);
            setTransitioning(false);
          }}
        />
      )}
    </div>
  );
}
