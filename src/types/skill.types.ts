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

// --- FIX: Add effect type for temporary crit chance on this specific hit ---

type CritChanceOnHitEffect = {
  type: 'crit_chance_on_hit';
  amount: number; // The flat percentage points to add to crit chance for this hit
};

// --- END FIX ---

// --- Define DebuffEffect --- 
// Similar to BuffEffect, but amount is typically negative or affects the target
type DebuffEffect = {
  type: 'debuff';
  stat:
    | 'attackPower' 
    | 'defense' 
    | 'speed'       
    | 'evasion'     
    | 'precision'   
    // Add other targetable stats as needed (e.g., maybe critRate reduction?)
    ; 
  amount: number; // Usually a negative value for debuffs reducing stats
  duration?: number; // Duration in turns
};
// --- END Define DebuffEffect ---

// TODO: Add StatusEffect type here as needed
// type StatusEffect = { type: 'status', statusType: 'poison' | 'burn' | 'stun', chance: number, duration: number };

// Discriminated union for all possible effects
export type SkillEffect = DamageEffect | HealEffect | BuffEffect | CritChanceOnHitEffect | DebuffEffect /* | StatusEffect | ... other types */;

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
