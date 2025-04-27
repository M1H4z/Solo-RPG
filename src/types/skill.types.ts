export type SkillType = 'active' | 'passive';
export type SkillRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'; // Add more ranks as needed

export interface Skill {
  id: string; // Unique identifier (e.g., 'basic-heal', 'power-strike')
  name: string;
  description: string;
  type: SkillType;
  rank: SkillRank;
  levelRequirement: number;
  skillPointCost: number;
  // Basic effect structure (can be expanded later)
  effects?: {
    damage?: number; // For damaging skills
    heal?: number;    // For healing skills
    buff?: { stat: string, amount: number, duration?: number }; // Stat buffs
    // Add other effect types: debuffs, status effects, etc.
  };
  cooldown?: number; // Turns for cooldown (active skills)
  manaCost?: number; // MP cost (active skills)
} 