import { Skill, SkillRank, SkillEffect } from "@/types/skill.types";
// Import HunterClass to use in requirements
import { HunterClass } from "@/constants/classes";

// Define the order of ranks for comparison
export const SKILL_RANK_ORDER: SkillRank[] = ["E", "D", "C", "B", "A", "S"];

// E Rank Skills
const POWER_STRIKE: Skill = {
  id: "e-power-strike",
  name: "Power Strike",
  description: "A basic but forceful attack.",
  type: "active",
  rank: "E",
  classRequirement: undefined,
  levelRequirement: 1,
  skillPointCost: 1,
  effects: { type: 'damage', power: 10 },
  cooldown: 2,
  manaCost: 5,
};

const FIRST_AID: Skill = {
  id: "e-first-aid",
  name: "First Aid",
  description: "A minor healing technique.",
  type: "active",
  rank: "E",
  classRequirement: ['Healer'],
  levelRequirement: 1,
  skillPointCost: 1,
  effects: { type: 'heal', baseAmount: 15 },
  cooldown: 3,
  manaCost: 8,
};

const TOUGHNESS: Skill = {
  id: "e-toughness",
  name: "Toughness",
  description: "Passively increases Vitality slightly.",
  type: "passive",
  rank: "E",
  classRequirement: undefined,
  levelRequirement: 2,
  skillPointCost: 2,
  effects: { type: 'buff', stat: 'vitality', amount: 1 },
};

const QUICK_STEP: Skill = {
  id: "e-quick-step",
  name: "Quick Step",
  description: "Passively increases Agility slightly.",
  type: "passive",
  rank: "E",
  classRequirement: undefined,
  levelRequirement: 2,
  skillPointCost: 2,
  effects: { type: 'buff', stat: 'agility', amount: 1 },
};

// --- D Rank ---
const HEAVY_STRIKE: Skill = {
  id: "d-heavy-strike",
  name: "Heavy Strike",
  description: "A stronger attack that requires more focus.",
  type: "active",
  rank: "D",
  classRequirement: ['Fighter', 'Tanker'],
  levelRequirement: 5,
  skillPointCost: 3,
  effects: { type: 'damage', power: 25 },
  cooldown: 4,
  manaCost: 12,
};

const MEDITATION: Skill = {
  id: "d-meditation",
  name: "Meditation",
  description: "Passively increases Intelligence.",
  type: "passive",
  rank: "D",
  classRequirement: ['Mage', 'Healer'],
  levelRequirement: 6,
  skillPointCost: 4,
  effects: { type: 'buff', stat: 'intelligence', amount: 2 },
};

// --- STARTING SKILLS (Placeholders) ---

// --- Healer ---
const BASIC_HEAL: Skill = {
    id: "start-basic-heal",
    name: "Basic Heal",
    description: "A fundamental healing spell restoring a small amount of HP.",
    type: "active",
    rank: "E",
    classRequirement: ['Healer'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'heal', baseAmount: 20 },
    cooldown: 2,
    manaCost: 10,
};
const MINOR_RESTORATION: Skill = {
    id: "start-minor-restoration",
    name: "Minor Restoration",
    description: "Passively increases MP regeneration slightly.", // Placeholder effect
    type: "passive",
    rank: "E",
    classRequirement: ['Healer'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'buff', stat: 'intelligence', amount: 1 }, // Placeholder: small INT buff
};

// --- Fighter ---
const DEFENSIVE_STANCE: Skill = {
    id: "start-defensive-stance",
    name: "Defensive Stance",
    description: "Temporarily increases Defense at the cost of Speed.",
    type: "active",
    rank: "E",
    classRequirement: ['Fighter'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: [
        { type: 'buff', stat: 'defense', amount: 5, duration: 3 },
    ],
    cooldown: 5,
    manaCost: 8,
};

// --- Mage ---
const FIREBOLT: Skill = {
    id: "start-firebolt",
    name: "Firebolt",
    description: "Hurls a small bolt of fire at the enemy.",
    type: "active",
    rank: "E",
    classRequirement: ['Mage'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'damage', power: 15 },
    cooldown: 1,
    manaCost: 8,
};
const ARCANE_SHIELD: Skill = {
    id: "start-arcane-shield",
    name: "Arcane Shield",
    description: "Creates a magical barrier that slightly boosts Defense.",
    type: "active",
    rank: "E",
    classRequirement: ['Mage'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'buff', stat: 'defense', amount: 3, duration: 4 },
    cooldown: 6,
    manaCost: 12,
};

// --- Assassin ---
const BACKSTAB: Skill = {
    id: "start-backstab",
    name: "Backstab",
    description: "A quick strike with increased critical chance.",
    type: "active",
    rank: "E",
    classRequirement: ['Assassin'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'damage', power: 8 },
    cooldown: 3,
    manaCost: 6,
};
const SHADOW_STEP: Skill = {
    id: "start-shadow-step",
    name: "Shadow Step",
    description: "Passively increases Evasion slightly.",
    type: "passive",
    rank: "E",
    classRequirement: ['Assassin'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'buff', stat: 'evasion', amount: 2 },
};

// --- Tanker ---
const TAUNT: Skill = {
    id: "start-taunt",
    name: "Taunt",
    description: "Draws enemy attention, potentially lowering their defense.",
    type: "active",
    rank: "E",
    classRequirement: ['Tanker'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'damage', power: 5 }, // Needs better effect definition
    cooldown: 4,
    manaCost: 5,
};
const SHIELD_WALL: Skill = {
    id: "start-shield-wall",
    name: "Shield Wall",
    description: "Significantly boosts Defense for a short duration.",
    type: "active",
    rank: "E",
    classRequirement: ['Tanker'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'buff', stat: 'defense', amount: 10, duration: 2 },
    cooldown: 8,
    manaCost: 15,
};

// --- Ranger ---
const PRECISE_SHOT: Skill = {
    id: "start-precise-shot",
    name: "Precise Shot",
    description: "An aimed shot that slightly increases minimum damage.",
    type: "active",
    rank: "E",
    classRequirement: ['Ranger'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'damage', power: 12 },
    cooldown: 2,
    manaCost: 7,
};
const QUICK_RETREAT: Skill = {
    id: "start-quick-retreat",
    name: "Quick Retreat",
    description: "Quickly move back, slightly increasing Evasion temporarily.",
    type: "active",
    rank: "E",
    classRequirement: ['Ranger'],
    levelRequirement: 1,
    skillPointCost: 1,
    effects: { type: 'buff', stat: 'evasion', amount: 5, duration: 1 },
    cooldown: 5,
    manaCost: 5,
};


export const ALL_SKILLS: Skill[] = [
  // Existing
  POWER_STRIKE,
  FIRST_AID,
  TOUGHNESS,
  QUICK_STEP,
  HEAVY_STRIKE,
  MEDITATION,
  // Added Starting Skills
  BASIC_HEAL,
  MINOR_RESTORATION,
  DEFENSIVE_STANCE,
  FIREBOLT,
  ARCANE_SHIELD,
  BACKSTAB,
  SHADOW_STEP,
  TAUNT,
  SHIELD_WALL,
  PRECISE_SHOT,
  QUICK_RETREAT,
];

// Helper function to get a skill by its ID
export const getSkillById = (id: string): Skill | undefined => {
  return ALL_SKILLS.find((skill) => skill.id === id);
};
