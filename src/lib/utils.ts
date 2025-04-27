import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Leveling and EXP Calculations ---

/**
 * Calculates the EXP needed to gain a specific level (e.g., level 2 needs 125).
 * Formula: floor(100 + 25 * (targetLevel - 1)^2)
 */
function getExpNeededForLevelGain(targetLevel: number): number {
  if (targetLevel <= 1) return 0; // No EXP needed to reach level 1
  return Math.floor(100 + 25 * Math.pow(targetLevel - 1, 2));
}

/**
 * Calculates the *cumulative* EXP needed to reach the start of a specific level.
 * E.g., to reach level 3, you need EXP for L1->2 + EXP for L2->3.
 */
export function getCumulativeExpForLevelStart(level: number): number { // EXPORTED
  if (level <= 1) return 0;
  let cumulativeExp = 0;
  for (let L = 2; L <= level; L++) {
    cumulativeExp += getExpNeededForLevelGain(L);
  }
  return cumulativeExp;
}

/**
 * Calculates the current level based on total experience points.
 */
export function calculateLevelFromExp(experience: number): number {
  if (experience < 0) experience = 0; 
  let level = 1;
  while (true) {
    const expNeededForNextLevelGain = getExpNeededForLevelGain(level + 1);
    const cumulativeExpForNextLevelStart = getCumulativeExpForLevelStart(level + 1);
    
    if (experience < cumulativeExpForNextLevelStart) {
      return level; // Haven't reached the threshold for the next level yet
    }
    level++;
    if (level > 999) { 
        console.warn("Max level (999) reached in level calculation loop."); 
        return level; 
    } 
  }
}

/**
 * Calculates the amount of EXP needed to get from the start of the current level to the next.
 */
export function calculateExpForNextLevelGain(currentLevel: number): number {
  if (currentLevel < 0) currentLevel = 0;
  const nextLevel = currentLevel + 1;
  return getExpNeededForLevelGain(nextLevel);
}

// Remove the old threshold function
/*
export function calculateNextLevelExpThreshold(currentLevel: number): number {
  if (currentLevel < 0) currentLevel = 0;
  const nextLevel = currentLevel + 1;
  return getCumulativeExpForLevelStart(nextLevel); 
}
*/ 