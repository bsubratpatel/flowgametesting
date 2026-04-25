import { Share2, RotateCcw, Heart, Zap, Check } from "lucide-react";

interface WinSheetProps {
  levelIndex: number;
  efficiency: "PERFECT" | "CLEAN" | "SOLID";
  breakdown: {
    dots: number;
    loop: number;
    moves: number;
    firstTry: number;
  };
  levelScore: number;
  totalScore: number;
  onNext: () => void;
  onRetry: () => void;
}

export function WinSheet({
  levelIndex,
  efficiency,
  breakdown,
  levelScore,
  totalScore,
  onNext,
  onRetry,
}: WinSheetProps) {
  const efficiencyColor =
    efficiency === "PERFECT"
      ? "hsl(var(--dot-3))"
      : efficiency === "CLEAN"
      ? "hsl(var(--foreground))"
      : "hsl(var(--foreground) / 0.5)";

  const handleShare = () => {
    // Basic share API or clipboard logic
    const text = `FLOW. Level ${levelIndex + 1} Cleared\nEfficiency: ${efficiency}\nScore: ${levelScore}\nPlay at flowgametest.netlify.app`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Score copied to clipboard!");
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/5 bg-[#1A1A1A] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/10" />

      <h2 className="flex items-center font-display text-xl font-bold uppercase tracking-widest text-foreground">
        Level {levelIndex + 1} Cleared <Check className="ml-2 text-white/50" size={20} strokeWidth={3} />
      </h2>

      <div className="mt-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest" style={{ color: efficiencyColor }}>
        <Zap size={14} fill="currentColor" /> {efficiency}
      </div>

      <div className="my-6 h-px w-full bg-white/5" />

      <div className="flex flex-col gap-2 font-mono text-sm text-foreground/80">
        <div className="flex justify-between">
          <span>Dots cleared</span>
          <span>+{breakdown.dots}</span>
        </div>
        {breakdown.loop > 0 && (
          <div className="flex justify-between">
            <span>Loop bonus</span>
            <span>+{breakdown.loop}</span>
          </div>
        )}
        {breakdown.moves > 0 && (
          <div className="flex justify-between">
            <span>Moves bonus</span>
            <span>+{breakdown.moves}</span>
          </div>
        )}
        {breakdown.firstTry > 0 && (
          <div className="flex justify-between text-[hsl(var(--dot-1))]">
            <span>First try</span>
            <span>+{breakdown.firstTry}</span>
          </div>
        )}
      </div>

      <div className="my-6 h-px w-full bg-white/5" />

      <div className="flex flex-col gap-1 font-mono text-[15px] font-bold">
        <div className="flex justify-between text-foreground">
          <span>LEVEL SCORE</span>
          <span>{levelScore}</span>
        </div>
        <div className="flex justify-between text-foreground/50">
          <span>TOTAL</span>
          <span>{totalScore}</span>
        </div>
      </div>

      <div className="my-6 h-px w-full bg-white/5" />

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-[hsl(var(--dot-1))] py-4 font-display text-[13px] font-bold tracking-[0.2em] text-[#0E0E0E] transition hover:brightness-110 active:scale-[0.98]"
      >
        NEXT LEVEL
      </button>

      <div className="mt-4 flex gap-4">
        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 py-3 font-sans text-xs font-medium tracking-[0.1em] text-foreground/70 transition hover:bg-white/10 hover:text-foreground"
        >
          <Share2 size={14} /> SHARE SCORE
        </button>
        <button
          onClick={onRetry}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 py-3 font-sans text-xs font-medium tracking-[0.1em] text-foreground/70 transition hover:bg-white/10 hover:text-foreground"
        >
          <RotateCcw size={14} /> RETRY
        </button>
      </div>
    </div>
  );
}

interface LoseSheetProps {
  onRetry: () => void;
  livesRemaining: number;
}

export function LoseSheet({ onRetry, livesRemaining }: LoseSheetProps) {
  const handleShare = () => {
    const text = `I barely missed a level in FLOW.\nPlay at flowgametest.netlify.app`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/5 bg-[#1A1A1A] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/10" />

      <h2 className="font-display text-xl font-bold uppercase tracking-widest text-foreground">
        Out of Moves
      </h2>

      <div className="mt-2 font-display text-sm font-bold uppercase tracking-widest text-foreground/50">
        BARELY
      </div>

      <div className="my-6 flex items-center justify-between text-sm tracking-widest text-foreground/40">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart 
              key={i} 
              size={14} 
              fill={i < livesRemaining ? "currentColor" : "none"} 
              className={i < livesRemaining ? "text-foreground" : "text-foreground/20"} 
            />
          ))}
        </div>
        <span>-1 life</span>
      </div>

      <button
        onClick={onRetry}
        disabled={livesRemaining === 0}
        className="w-full rounded-xl bg-white/10 py-4 font-display text-[13px] font-bold tracking-[0.2em] text-foreground transition hover:bg-white/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
      >
        {livesRemaining > 0 ? "RETRY" : "OUT OF LIVES"}
      </button>

      <button
        onClick={handleShare}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-sans text-xs font-medium tracking-[0.1em] text-foreground/40 transition hover:text-foreground/70"
      >
        ↑ SHARE ANYWAY
      </button>
    </div>
  );
}
