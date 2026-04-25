import { useNavigate } from "react-router-dom";
import { Coffee } from "lucide-react";
import { loadLevelIndex, loadBest } from "@/game/storage";
import { ENDLESS_START, TOTAL_LEVELS } from "@/game/levels";

export default function Home() {
  const navigate = useNavigate();
  const currentLevel = loadLevelIndex();
  const best = loadBest();
  const isEndless = currentLevel >= ENDLESS_START;

  // Mock heatmap data for now
  const heatmapData = Array.from({ length: 28 }, () => Math.random() > 0.4);

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background px-6 py-8">
      <div className="flex w-full max-w-md items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-[0.08em] text-foreground">
          FLOW<span className="text-[hsl(var(--dot-3))]">.</span>
        </h1>
        <button className="text-foreground/50 transition hover:text-foreground">
          <Coffee size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mt-12 flex w-full max-w-md flex-col items-center">
        
        {/* Current Level Info */}
        <div className="my-16 flex flex-col items-center gap-2">
          <h2 className="font-display text-4xl font-bold uppercase tracking-widest text-foreground">
            {isEndless ? "ENDLESS" : `LEVEL ${currentLevel + 1}`}
          </h2>
          <div className="font-sans text-sm font-medium tracking-[0.2em] text-foreground/40">
            {isEndless
              ? `BEST: ∞ ${best - ENDLESS_START + 1}`
              : `BEST: LV ${best + 1}`}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex w-full flex-col gap-4">
          <button
            onClick={() => navigate("/game")}
            className="w-full rounded-2xl bg-[hsl(var(--dot-4))] py-4 font-display text-[15px] font-bold tracking-[0.2em] text-[#0E0E0E] transition hover:brightness-110 active:scale-[0.98]"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </main>
  );
}
