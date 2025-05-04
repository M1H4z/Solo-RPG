export type SkillType = "active" | "passive";
export type SkillRank = "E" | "D" | "C" | "B" | "A" | "S"; // Add more ranks as needed

// --- BEGIN NEW EFFECT TYPE DEFINITIONS ---

// Define specific effect types
type DamageEffect = { 
  type: 'damage'; 
  power: number; 
  // TODO: Maybe add element (e.g., 'fire', 'physical') later
};

type HealEffect = { 
  type: 'heal'; 
  baseAmount: number; 
  // TODO: Maybe add scaling factor (e.g., based on INT) later
};

type BuffEffect = { 
  type: 'buff'; 
  stat: 
    | 'strength' 
    | 'agility' 
    | 'perception' 
    | 'intelligence' 
    | 'vitality' 
    | 'attackPower' 
    | 'defense' 
    | 'critRate' 
    | 'critDamage'
    | 'speed'       // Added
    | 'evasion'     // Added
    | 'precision'   // Added
    | 'cooldownReduction'; // Added (Extend as needed)
  amount: number; 
  duration?: number; // Duration in turns/seconds?
};

// TODO: Add DebuffEffect, StatusEffect types here as needed
// type StatusEffect = { type: 'status', statusType: 'poison' | 'burn' | 'stun', chance: number, duration: number };
// type DebuffEffect = { type: 'debuff', stat: string, amount: number, duration: number };

// Discriminated union for all possible effects
export type SkillEffect = DamageEffect | HealEffect | BuffEffect /* | StatusEffect | DebuffEffect | ... other types */;

// --- END NEW EFFECT TYPE DEFINITIONS ---

// --- FIX: Import HunterClass type ---
import { HunterClass } from '@/constants/classes'; 

export interface Skill {
  id: string; // Unique identifier (e.g., 'basic-heal', 'power-strike')
  name: string;
  description: string;
  type: SkillType;
  rank: SkillRank;
  levelRequirement: number;
  skillPointCost: number;
  // --- FIX: Add optional class requirement --- 
  classRequirement?: HunterClass[]; // If omitted, skill is universal
  effects: SkillEffect | SkillEffect[];
  cooldown?: number; // Turns for cooldown (active skills)
  manaCost?: number; // MP cost (active skills)
}
