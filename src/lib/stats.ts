import { Hunter } from "@/types/hunter.types";

/**
 * Calculates derived combat and resource stats based on a hunter's base stats.
 * @param hunter - The hunter object.
 * @returns An object containing calculated derived stats.
 */
export const calculateDerivedStats = (hunter: Hunter | null) => {
  if (!hunter) return {};

  // --- Base Stat Contributions ---
  const { strength, vitality, agility, intelligence, perception, level, currentHp, currentMp, experience, currentLevelStartExp, expNeededForNextLevel } = hunter;

  // --- Calculations (Adjust formulas as per game design) ---
  const maxHP = 100 + (vitality * 10) + (level * 5); // Example: Base + Vit + Level Bonus
  const maxMP = 50 + (intelligence * 5) + (level * 2); // Example: Base + Int + Level Bonus

  const defense = 5 + Math.floor(vitality * 0.5); // Example: Base + Vit Bonus

  // Agility Contributions
  const critRate = Math.min(100, 5 + Math.floor(agility * 0.2)); // Base + Agi Bonus, Capped at 100%
  const critDamage = 150 + Math.floor(agility * 1); // Base 150% + Agi Bonus
  const speed = 10 + agility; // Base + Agi
  const evasion = Math.min(75, 5 + Math.floor(agility * 0.15)); // Base + Agi Bonus, Capped at 75%

  // Perception Contribution
  const precision = Math.min(100, 75 + Math.floor(perception * 0.25)); // Base 75% + Per Bonus, Capped at 100%

  // Strength Contribution
  const basicAttack = 10 + Math.floor(strength * 1.5); // Base + Str Bonus

  // Intelligence Contribution
  const cooldownReduction = Math.min(50, Math.floor(intelligence * 0.5)); // Base + Int Bonus, Capped at 50%

  // --- Current Values Handling ---
  const finalCurrentHP = currentHp ?? maxHP; // Default to max if null/undefined
  const finalCurrentMP = currentMp ?? maxMP; // Default to max if null/undefined

  // --- Experience Handling ---
  const finalExpNeeded = expNeededForNextLevel ?? 1; // Avoid division by zero if 0
  const isMaxLevel = finalExpNeeded <= 0; 
  const finalStartExp = currentLevelStartExp ?? 0;
  const expProgress = Math.max(0, (experience ?? 0) - finalStartExp);

  return {
    maxHP,
    currentHP: finalCurrentHP,
    maxMP,
    currentMP: finalCurrentMP,
    defense,
    critRate,
    critDamage,
    speed,
    evasion,
    precision,
    basicAttack,
    cooldownReduction,
    expNeededForNextLevel: finalExpNeeded,
    currentLevelStartExp: finalStartExp,
    expProgressInCurrentLevel: expProgress,
    isMaxLevel,
  };
};

// You could add other stat-related utility functions here in the future 