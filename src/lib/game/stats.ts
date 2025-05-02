import { Hunter } from "@/types/hunter.types";
import {
  calculateLevelFromExp,
  getCumulativeExpForLevelStart,
  calculateExpForNextLevelGain,
} from "@/lib/utils"; // Import EXP helpers

// --- Base Stat Effects ---
const HP_PER_VIT = 10;
const DEF_PER_VIT = 0.5;
const MP_PER_INT = 5;
const COOLDOWN_REDUCTION_PER_INT = 0.5; // No level scaling recommended
const ATK_PER_STR = 1.2;
const PRECISION_PER_PER = 0.1; // Percentage of min damage increase
const CRIT_RATE_PER_AGI = 0.1; // Percentage
const CRIT_DMG_PER_AGI = 0.05; // Percentage multiplier increase (e.g., 1.5x -> 1.55x) - No level scaling recommended
const SPEED_PER_AGI = 0.2;
const EVASION_PER_AGI = 0.08; // Percentage

// --- Per Level Bonuses (Based on image) ---
const HP_PER_LEVEL = 5;
const MP_PER_LEVEL = 2;
const ATK_PER_LEVEL = 2;
const DEF_PER_LEVEL = 1.5; // Using lower end of recommendation
const CRIT_RATE_PER_LEVEL = 0.2; // Optional, adding it
// No Crit Damage per level
const SPEED_PER_LEVEL = 1;
const EVASION_PER_LEVEL = 0.15; // Optional, adding middle value
const PRECISION_PER_LEVEL = 0.35; // Using middle value
// No Cooldown Reduction per level

// --- Caps ---
const MAX_CRIT_RATE = 75.0; // Cap recommended 50-75%
const MAX_EVASION = 50.0; // Arbitrary cap, adjust as needed
const MAX_PRECISION = 50.0; // Current cap
const MAX_COOLDOWN_REDUCTION = 50.0; // Current cap

// --- Derived Stats Calculation Functions ---

export const calculateMaxHP = (vitality: number, level: number): number => {
  const baseHp = 100;
  return baseHp + Math.floor(vitality * HP_PER_VIT) + Math.floor(level * HP_PER_LEVEL);
};

export const calculateMaxMP = (intelligence: number, level: number): number => {
  const baseMp = 50;
  return baseMp + Math.floor(intelligence * MP_PER_INT) + Math.floor(level * MP_PER_LEVEL);
};

export const calculateDefense = (vitality: number, level: number): number => {
  const baseDef = 5;
  return baseDef + Math.floor(vitality * DEF_PER_VIT) + Math.floor(level * DEF_PER_LEVEL);
};

export const calculateAttackPower = (strength: number, level: number): number => {
  const baseAtk = 10;
  return baseAtk + Math.floor(strength * ATK_PER_STR) + Math.floor(level * ATK_PER_LEVEL);
};

export const calculateCritRate = (agility: number, level: number): number => {
  const baseCritRate = 5.0; // 5%
  const rate = baseCritRate + (agility * CRIT_RATE_PER_AGI) + (level * CRIT_RATE_PER_LEVEL);
  return parseFloat(Math.min(rate, MAX_CRIT_RATE).toFixed(2));
};

export const calculateCritDamage = (agility: number): number => {
  const baseCritDmg = 1.5; // 150%
  // No level component added here
  return parseFloat((baseCritDmg + agility * CRIT_DMG_PER_AGI).toFixed(2));
};

export const calculateSpeed = (agility: number, level: number): number => {
  const baseSpeed = 10;
  return baseSpeed + Math.floor(agility * SPEED_PER_AGI) + Math.floor(level * SPEED_PER_LEVEL);
};

export const calculateEvasion = (agility: number, level: number): number => {
  const baseEvasion = 2.0; // 2%
  const evasionValue = baseEvasion + (agility * EVASION_PER_AGI) + (level * EVASION_PER_LEVEL);
  return parseFloat(Math.min(evasionValue, MAX_EVASION).toFixed(2));
};

export const calculatePrecision = (perception: number, level: number): number => {
  const basePrecision = 0.0; // Starts at 0% min damage boost
  const precisionValue = basePrecision + (perception * PRECISION_PER_PER) + (level * PRECISION_PER_LEVEL);
  return parseFloat(Math.min(precisionValue, MAX_PRECISION).toFixed(2));
};

export const calculateCooldownReduction = (intelligence: number): number => {
  // No level component added here
  return Math.min(MAX_COOLDOWN_REDUCTION, Math.floor(intelligence * COOLDOWN_REDUCTION_PER_INT));
};

// --- Updated Interface ---
export interface DerivedStats {
  // Core Derived Stats
  maxHP: number;
  maxMP: number;
  defense: number;
  attackPower: number;
  critRate: number;
  critDamage: number;
  speed: number;
  evasion: number;
  precision: number; // Min damage bonus %
  cooldownReduction: number; // Added

  // Current State & Experience
  currentHP: number; // Added
  currentMP: number; // Added
  expNeededForNextLevel: number; // Added (Exp needed for *gain*, not cumulative)
  currentLevelStartExp: number; // Added (Cumulative exp to reach current level start)
  expProgressInCurrentLevel: number; // Added (Exp accumulated within the current level)
  isMaxLevel: boolean; // Added
}

// --- Updated Helper to get all derived stats ---
export const calculateDerivedStats = (hunter: Hunter | null): Partial<DerivedStats> => {
  if (!hunter) return {};

  const {
    strength,
    vitality,
    agility,
    intelligence,
    perception,
    currentHp,
    currentMp,
    experience,
    level: hunterLevel, // Rename to avoid conflict with loop variable 'level'
  } = hunter;

  // Calculate current level if not provided or invalid
  const currentLevel = (hunterLevel && hunterLevel > 0) ? hunterLevel : calculateLevelFromExp(experience ?? 0);

  // Calculate core derived stats using helper functions, passing level
  const maxHP = calculateMaxHP(vitality, currentLevel);
  const maxMP = calculateMaxMP(intelligence, currentLevel);
  const defense = calculateDefense(vitality, currentLevel);
  const attackPower = calculateAttackPower(strength, currentLevel);
  const critRate = calculateCritRate(agility, currentLevel);
  const critDamage = calculateCritDamage(agility); // Level not needed
  const speed = calculateSpeed(agility, currentLevel);
  const evasion = calculateEvasion(agility, currentLevel);
  const precision = calculatePrecision(perception, currentLevel);
  const cooldownReduction = calculateCooldownReduction(intelligence); // Level not needed

  // Handle Current HP/MP
  const finalCurrentHP = currentHp ?? maxHP;
  const finalCurrentMP = currentMp ?? maxMP;

  // Calculate Experience Stats using utils
  const expNeededForNextLevel = calculateExpForNextLevelGain(currentLevel);
  const currentLevelStartExp = getCumulativeExpForLevelStart(currentLevel);
  const expProgressInCurrentLevel = Math.max(0, (experience ?? 0) - currentLevelStartExp);
  const isMaxLevel = expNeededForNextLevel <= 0; // Or based on a max level constant

  return {
    maxHP,
    maxMP,
    defense,
    attackPower,
    critRate,
    critDamage,
    speed,
    evasion,
    precision,
    cooldownReduction,
    currentHP: finalCurrentHP,
    currentMP: finalCurrentMP,
    expNeededForNextLevel,
    currentLevelStartExp,
    expProgressInCurrentLevel,
    isMaxLevel,
  };
};
