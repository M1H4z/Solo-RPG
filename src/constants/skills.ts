import { Skill, SkillRank } from "@/types/skill.types";

// Define the order of ranks for comparison
export const SKILL_RANK_ORDER: SkillRank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

// E Rank Skills
const POWER_STRIKE: Skill = {
  id: 'e-power-strike',
  name: 'Power Strike',
  description: 'A basic but forceful attack.',
  type: 'active',
  rank: 'E',
  levelRequirement: 1,
  skillPointCost: 1,
  effects: { damage: 10 }, // Base damage, calculation happens elsewhere
  cooldown: 2,
  manaCost: 5,
};

const FIRST_AID: Skill = {
  id: 'e-first-aid',
  name: 'First Aid',
  description: 'A minor healing technique.',
  type: 'active',
  rank: 'E',
  levelRequirement: 1,
  skillPointCost: 1,
  effects: { heal: 15 }, // Base heal amount
  cooldown: 3,
  manaCost: 8,
};

const TOUGHNESS: Skill = {
  id: 'e-toughness',
  name: 'Toughness',
  description: 'Passively increases Vitality slightly.',
  type: 'passive',
  rank: 'E',
  levelRequirement: 2,
  skillPointCost: 2,
  effects: { buff: { stat: 'vitality', amount: 1 } }, // Passive buff
};

const QUICK_STEP: Skill = {
  id: 'e-quick-step',
  name: 'Quick Step',
  description: 'Passively increases Agility slightly.',
  type: 'passive',
  rank: 'E',
  levelRequirement: 2,
  skillPointCost: 2,
  effects: { buff: { stat: 'agility', amount: 1 } }, // Passive buff
};

// --- D Rank --- 
const HEAVY_STRIKE: Skill = {
  id: 'd-heavy-strike',
  name: 'Heavy Strike',
  description: 'A stronger attack that requires more focus.',
  type: 'active',
  rank: 'D',
  levelRequirement: 5,
  skillPointCost: 3,
  effects: { damage: 25 },
  cooldown: 4,
  manaCost: 12,
};

const MEDITATION: Skill = {
  id: 'd-meditation',
  name: 'Meditation',
  description: 'Passively increases Intelligence.',
  type: 'passive',
  rank: 'D',
  levelRequirement: 6,
  skillPointCost: 4,
  effects: { buff: { stat: 'intelligence', amount: 2 } },
};

export const ALL_SKILLS: Skill[] = [
  POWER_STRIKE,
  FIRST_AID,
  TOUGHNESS,
  QUICK_STEP,
  HEAVY_STRIKE,
  MEDITATION,
  // Add more D, C, B, A, S rank skills here...
];

// Helper function to get a skill by its ID
export const getSkillById = (id: string): Skill | undefined => {
  return ALL_SKILLS.find(skill => skill.id === id);
}; 