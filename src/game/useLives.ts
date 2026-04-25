import { useState, useEffect } from "react";
import { loadLivesState, saveLivesState } from "./storage";

export const MAX_LIVES = 3;
export const REFILL_MS = 15 * 60 * 1000; // 15 minutes

export function useLives() {
  const [lives, setLives] = useState<number>(3);
  const [lastRefill, setLastRefill] = useState<number>(Date.now());
  const [nextRefillTime, setNextRefillTime] = useState<number | null>(null);

  // Initialize and calculate missed refills on mount
  useEffect(() => {
    const state = loadLivesState();
    let currentLives = state.lives;
    let newLastRefill = state.lastRefill;

    if (currentLives < MAX_LIVES) {
      const now = Date.now();
      const timePassed = now - newLastRefill;
      const earnedLives = Math.floor(timePassed / REFILL_MS);

      if (earnedLives > 0) {
        currentLives = Math.min(MAX_LIVES, currentLives + earnedLives);
        // Advance the refill timer by the exact intervals consumed
        newLastRefill += earnedLives * REFILL_MS;
        
        // If maxed out, just reset refill time to now to prevent immediate refill on next loss
        if (currentLives === MAX_LIVES) {
          newLastRefill = now;
        }
        
        saveLivesState(currentLives, newLastRefill);
      }
    }

    setLives(currentLives);
    setLastRefill(newLastRefill);
  }, []);

  // Set up the interval for continuous refilling while app is open
  useEffect(() => {
    if (lives >= MAX_LIVES) {
      setNextRefillTime(null);
      return;
    }

    const targetTime = lastRefill + REFILL_MS;
    setNextRefillTime(targetTime);

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= targetTime) {
        setLives((prev) => {
          const next = Math.min(MAX_LIVES, prev + 1);
          const newRefill = now; // Update the anchor time
          setLastRefill(newRefill);
          saveLivesState(next, newRefill);
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lives, lastRefill]);

  const deductLife = () => {
    setLives((prev) => {
      if (prev <= 0) return 0;
      const next = prev - 1;
      // If we were at max, start the timer now
      const newRefill = prev === MAX_LIVES ? Date.now() : lastRefill;
      setLastRefill(newRefill);
      saveLivesState(next, newRefill);
      return next;
    });
  };

  const resetLives = () => {
    const now = Date.now();
    setLives(MAX_LIVES);
    setLastRefill(now);
    saveLivesState(MAX_LIVES, now);
  };

  return { lives, deductLife, resetLives, nextRefillTime };
}
