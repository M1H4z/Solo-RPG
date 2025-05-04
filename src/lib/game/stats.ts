import { Hunter } from "@/types/hunter.types";
import {
  calculateLevelFromExp,
  getCumulativeExpForLevelStart,
  calculateExpForNextLevelGain,
} from "@/lib/utils"; // Import EXP helpers
import { Skill, SkillEffect } from "@/types/skill.types";
import { getSkillById } from "@/constants/skills";

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

// --- Derived Stats Calculation Functions (updated parameters for clarity) ---

export const calculateMaxHP = (totalVitality: number, level: number, flatHpBonus: number = 0): number => {
  const baseHp = 100;
  // FIX: Incorporate flat HP bonus from equipment
  return baseHp + Math.floor(totalVitality * HP_PER_VIT) + Math.floor(level * HP_PER_LEVEL) + flatHpBonus;
};

export const calculateMaxMP = (totalIntelligence: number, level: number, flatMpBonus: number = 0): number => {
  const baseMp = 50;
  // FIX: Incorporate flat MP bonus from equipment
  return baseMp + Math.floor(totalIntelligence * MP_PER_INT) + Math.floor(level * MP_PER_LEVEL) + flatMpBonus;
};

export const calculateDefense = (totalVitality: number, level: number, flatDefenseBonus: number = 0): number => {
  const baseDef = 5;
   // FIX: Incorporate flat Defense bonus from equipment
  return baseDef + Math.floor(totalVitality * DEF_PER_VIT) + Math.floor(level * DEF_PER_LEVEL) + flatDefenseBonus;
};

export const calculateAttackPower = (totalStrength: number, level: number, flatAttackBonus: number = 0): number => {
  const baseAtk = 10;
  // FIX: Incorporate flat Attack Power bonus from equipment
  return baseAtk + Math.floor(totalStrength * ATK_PER_STR) + Math.floor(level * ATK_PER_LEVEL) + flatAttackBonus;
};

export const calculateCritRate = (totalAgility: number, level: number, flatCritRateBonus: number = 0): number => {
  const baseCritRate = 5.0; // 5%
  // FIX: Incorporate flat Crit Rate bonus from equipment
  const rate = baseCritRate + (totalAgility * CRIT_RATE_PER_AGI) + (level * CRIT_RATE_PER_LEVEL) + flatCritRateBonus;
  return parseFloat(Math.min(rate, MAX_CRIT_RATE).toFixed(2));
};

export const calculateCritDamage = (totalAgility: number, flatCritDamageBonus: number = 0): number => {
  const baseCritDmg = 1.5; // 150%
  // FIX: Incorporate flat Crit Damage bonus from equipment (additive for now)
  return parseFloat((baseCritDmg + (totalAgility * CRIT_DMG_PER_AGI) + flatCritDamageBonus).toFixed(2));
};

export const calculateSpeed = (totalAgility: number, level: number, flatSpeedBonus: number = 0): number => {
  const baseSpeed = 10;
   // FIX: Incorporate flat Speed bonus from equipment
  return baseSpeed + Math.floor(totalAgility * SPEED_PER_AGI) + Math.floor(level * SPEED_PER_LEVEL) + flatSpeedBonus;
};

export const calculateEvasion = (totalAgility: number, level: number, flatEvasionBonus: number = 0): number => {
  const baseEvasion = 2.0; // 2%
  // FIX: Incorporate flat Evasion bonus from equipment
  const evasionValue = baseEvasion + (totalAgility * EVASION_PER_AGI) + (level * EVASION_PER_LEVEL) + flatEvasionBonus;
  return parseFloat(Math.min(evasionValue, MAX_EVASION).toFixed(2));
};

export const calculatePrecision = (totalPerception: number, level: number, flatPrecisionBonus: number = 0): number => {
  const basePrecision = 0.0; // Starts at 0% min damage boost
  // FIX: Incorporate flat Precision bonus from equipment
  const precisionValue = basePrecision + (totalPerception * PRECISION_PER_PER) + (level * PRECISION_PER_LEVEL) + flatPrecisionBonus;
  return parseFloat(Math.min(precisionValue, MAX_PRECISION).toFixed(2));
};

export const calculateCooldownReduction = (totalIntelligence: number, flatCooldownReductionBonus: number = 0): number => {
  // FIX: Incorporate flat CDR bonus from equipment
  const cdr = Math.floor(totalIntelligence * COOLDOWN_REDUCTION_PER_INT) + flatCooldownReductionBonus;
  return Math.min(MAX_COOLDOWN_REDUCTION, cdr);
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
    level: hunterLevel,
    equipment, // Need equipment data
    unlockedSkills, // Need unlocked skills
  } = hunter;

  // Calculate current level if not provided or invalid
  const currentLevel = (hunterLevel && hunterLevel > 0) ? hunterLevel : calculateLevelFromExp(experience ?? 0);

  // --- Calculate total stats from equipment ---
  let eqStr = 0, eqVit = 0, eqAgi = 0, eqInt = 0, eqPer = 0;
  let eqHP = 0, eqMP = 0, eqAtk = 0, eqDef = 0, eqCritRate = 0;
  let eqCritDmg = 0, eqSpeed = 0, eqEvasion = 0, eqPrecision = 0, eqCDR = 0;

  if (equipment) {
    Object.values(equipment).forEach(item => {
      if (item && item.stats) {
        const stats = item.stats as any; // Cast for easier access
        eqStr += stats.strength || 0;
        eqVit += stats.vitality || 0;
        eqAgi += stats.agility || 0;
        eqInt += stats.intelligence || 0;
        eqPer += stats.perception || 0;
        // Add flat bonuses for derived stats if they exist
        eqHP += stats.maxHp || stats.hp || 0; // Allow maxHp or hp
        eqMP += stats.maxMp || stats.mp || 0; // Allow maxMp or mp
        eqAtk += stats.attackPower || stats.atk || 0;
        eqDef += stats.defense || stats.def || 0;
        eqCritRate += stats.critRate || 0;
        eqCritDmg += stats.critDamage || 0;
        eqSpeed += stats.speed || 0;
        eqEvasion += stats.evasion || 0;
        eqPrecision += stats.precision || 0;
        eqCDR += stats.cooldownReduction || stats.cdr || 0;
      }
    });
  }

  // --- Calculate total stats from PASSIVE SKILLS ---
  let passiveStr = 0, passiveVit = 0, passiveAgi = 0, passiveInt = 0, passivePer = 0;
  // TODO: Consider if passive skills should grant flat derived bonuses too (like equipment)
  // let passiveHP = 0, passiveMP = 0, passiveAtk = 0, etc...

  if (unlockedSkills && Array.isArray(unlockedSkills)) {
      unlockedSkills.forEach(skillId => {
          const skill = getSkillById(skillId);
          if (skill && skill.type === 'passive' && skill.effects) {
              const effectsArray = Array.isArray(skill.effects) ? skill.effects : [skill.effects];
              effectsArray.forEach(effect => {
                  if (effect.type === 'buff') {
                      // Apply buffs to base stats
                      switch (effect.stat) {
                          case 'strength': passiveStr += effect.amount; break;
                          case 'vitality': passiveVit += effect.amount; break;
                          case 'agility': passiveAgi += effect.amount; break;
                          case 'intelligence': passiveInt += effect.amount; break;
                          case 'perception': passivePer += effect.amount; break;
                          // Add cases here if passive skills directly buff derived stats
                          // case 'maxHp': passiveHP += effect.amount; break;
                          // case 'attackPower': passiveAtk += effect.amount; break; 
                          default: break;
                      }
                  }
              });
          }
      });
  }
  // --- End Passive Skill Bonus Calculation ---

  // Calculate total base stats (Hunter Base + Equipment Bonus + Passive Skill Bonus)
  const totalStrength = (strength ?? 0) + eqStr + passiveStr;
  const totalVitality = (vitality ?? 0) + eqVit + passiveVit;
  const totalAgility = (agility ?? 0) + eqAgi + passiveAgi;
  const totalIntelligence = (intelligence ?? 0) + eqInt + passiveInt;
  const totalPerception = (perception ?? 0) + eqPer + passivePer;
  // --- End Calculate total stats ---

  // Calculate core derived stats using TOTAL base stats (including passives) and adding FLAT equipment bonuses
  const maxHP = calculateMaxHP(totalVitality, currentLevel, eqHP); // Passives affect totalVitality, eqHP is flat bonus
  const maxMP = calculateMaxMP(totalIntelligence, currentLevel, eqMP); // Passives affect totalIntelligence, eqMP is flat bonus
  const defense = calculateDefense(totalVitality, currentLevel, eqDef); // Passives affect totalVitality, eqDef is flat bonus
  const attackPower = calculateAttackPower(totalStrength, currentLevel, eqAtk); // Passives affect totalStrength, eqAtk is flat bonus
  const critRate = calculateCritRate(totalAgility, currentLevel, eqCritRate); // Passives affect totalAgility, eqCritRate is flat bonus
  const critDamage = calculateCritDamage(totalAgility, eqCritDmg); // Passives affect totalAgility, eqCritDmg is flat bonus
  const speed = calculateSpeed(totalAgility, currentLevel, eqSpeed); // Passives affect totalAgility, eqSpeed is flat bonus
  const evasion = calculateEvasion(totalAgility, currentLevel, eqEvasion); // Passives affect totalAgility, eqEvasion is flat bonus
  const precision = calculatePrecision(totalPerception, currentLevel, eqPrecision); // Passives affect totalPerception, eqPrecision is flat bonus
  const cooldownReduction = calculateCooldownReduction(totalIntelligence, eqCDR); // Passives affect totalIntelligence, eqCDR is flat bonus

  // Handle Current HP/MP (ensure it doesn't exceed new max)
  const finalCurrentHP = Math.min(currentHp ?? maxHP, maxHP);
  const finalCurrentMP = Math.min(currentMp ?? maxMP, maxMP);

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
