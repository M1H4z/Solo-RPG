import { ClassType } from '@/constants/classes.constants';
import { EquipmentSlots, InventoryItem } from './item.types'; // Import new types

export interface HunterEquipment {
  head?: string; // Item ID
  chest?: string;
  legs?: string;
  feet?: string;
  hands?: string;
  mainHand?: string;
  offHand?: string;
  accessory1?: string;
  accessory2?: string;
}

export interface Hunter {
  id: string;
  userId: string; // Link to the user account
  name: string;
  level: number;
  rank: string; // e.g., 'E', 'D', 'S'
  class: ClassType;
  experience: number;
  currentLevelStartExp: number; // Exp needed for the current level's start
  expNeededForNextLevel: number; // Exp needed to reach the next level from the start of current level
  statPoints: number;
  skillPoints: number;
  // Base Stats
  strength: number;
  agility: number;
  perception: number;
  intelligence: number;
  vitality: number;
  // Derived Stats (optional here, could be calculated on the fly)
  maxHp?: number;
  currentHp?: number;
  maxMp?: number;
  currentMp?: number;
  attackPower?: number;
  defense?: number;
  speed?: number;
  critRate?: number;
  critDamage?: number;
  evasion?: number;
  precision?: number;
  // Inventory & Equipment
  inventory: InventoryItem[];
  equipment: EquipmentSlots;
  // Skills
  unlockedSkills: string[]; // Array of skill IDs
  equippedSkills: string[]; // Array of *active* skill IDs equipped (max 4)
  // Other potential fields
  gold?: number;
  diamonds?: number; // Premium currency
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // TODO: Add skills (active/passive)
} 