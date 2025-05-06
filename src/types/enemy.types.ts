import { HunterClass } from "@/constants/classes";

// Define specific enemy types
export type EnemyType = 
  | 'Beast' 
  | 'Undead' 
  | 'Humanoid' 
  | 'Dragonkin' 
  | 'Demon' 
  | 'Elemental' 
  | 'Plant' 
  | 'Construct';

// Base properties for all enemies
interface BaseEnemy {
  id: string; // Unique identifier for this specific enemy instance or type
  name: string;
  level: number;
  attackPower: number;
  defense: number;
  precision: number;
  evasion: number;
  speed: number;
  baseExpYield: number;
  maxHp: number; // Max HP for this enemy type/level
  // Potentially add lootTableId here if linking to loot tables
  lootTableId?: string; 
  spriteKey: string; // Key to find the enemy's sprite (e.g., 'goblin_scout')
  isBoss?: boolean;
}

// For enemies that are classified by a general type (e.g., Goblins are Humanoid)
export interface TypedEnemy extends BaseEnemy {
  entityCategory: 'enemy'; // Discriminator
  enemyType: EnemyType;
}

// For enemies that are NPCs with a hunter class (e.g., an enemy Mage)
export interface ClassedEnemy extends BaseEnemy {
  entityCategory: 'hunter_npc'; // Discriminator
  class: HunterClass;
}

// Union type for any enemy definition
export type EnemyDefinition = TypedEnemy | ClassedEnemy;

// Example of how an enemy might be defined in a constants file:
/*
export const GOBLIN_SCOUT: TypedEnemy = {
  id: 'goblin_scout_def',
  name: 'Goblin Scout',
  entityCategory: 'enemy',
  enemyType: 'Humanoid',
  level: 3,
  attackPower: 12,
  defense: 5,
  precision: 60,
  evasion: 10,
  speed: 20,
  baseExpYield: 15,
  maxHp: 40,
  lootTableId: 'goblin-scout',
  spriteKey: 'goblin_scout',
};

export const RIVAL_MAGE: ClassedEnemy = {
  id: 'rival_mage_def',
  name: 'Rival Mage',
  entityCategory: 'hunter_npc',
  class: 'Mage',
  level: 5,
  attackPower: 20,
  defense: 8,
  precision: 70,
  evasion: 5,
  speed: 15,
  baseExpYield: 30,
  maxHp: 50,
  spriteKey: 'rival_mage', // Assumes a sprite exists
};
*/ 