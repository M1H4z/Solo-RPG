export type HunterClass = 
  | 'Healer'
  | 'Fighter'
  | 'Mage'
  | 'Assassin'
  | 'Tanker'
  | 'Ranger';

export interface ClassStats {
  strength: number;
  agility: number;
  perception: number;
  intelligence: number;
  vitality: number;
}

export interface ClassDefinition {
  name: HunterClass;
  description: string;
  baseStats: ClassStats;
  startingSkills: string[];
}

export const HUNTER_CLASSES: Record<HunterClass, ClassDefinition> = {
  Healer: {
    name: 'Healer',
    description: 'Specialists in recovery and support magic. They can heal allies and apply buffs.',
    baseStats: {
      strength: 5,
      agility: 8,
      perception: 10,
      intelligence: 15,
      vitality: 12
    },
    startingSkills: ['Basic Heal', 'Minor Restoration']
  },
  Fighter: {
    name: 'Fighter',
    description: 'Masters of close combat who excel at dealing and taking damage.',
    baseStats: {
      strength: 15,
      agility: 10,
      perception: 8,
      intelligence: 5,
      vitality: 12
    },
    startingSkills: ['Heavy Strike', 'Defensive Stance']
  },
  Mage: {
    name: 'Mage',
    description: 'Controllers of arcane energy who can cast powerful offensive spells.',
    baseStats: {
      strength: 5,
      agility: 8,
      perception: 12,
      intelligence: 17,
      vitality: 8
    },
    startingSkills: ['Firebolt', 'Arcane Shield']
  },
  Assassin: {
    name: 'Assassin',
    description: 'Swift and deadly hunters who excel at dealing critical damage.',
    baseStats: {
      strength: 10,
      agility: 17,
      perception: 12,
      intelligence: 6,
      vitality: 5
    },
    startingSkills: ['Backstab', 'Shadow Step']
  },
  Tanker: {
    name: 'Tanker',
    description: 'Defensive specialists who can absorb massive damage for the team.',
    baseStats: {
      strength: 12,
      agility: 5,
      perception: 8,
      intelligence: 5,
      vitality: 20
    },
    startingSkills: ['Taunt', 'Shield Wall']
  },
  Ranger: {
    name: 'Ranger',
    description: 'Masters of ranged combat who excel at precision and evasion.',
    baseStats: {
      strength: 8,
      agility: 12,
      perception: 15,
      intelligence: 8,
      vitality: 7
    },
    startingSkills: ['Precise Shot', 'Quick Retreat']
  }
}; 