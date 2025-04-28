import { ClassType } from "@/constants/classes.constants";
import { EquipmentSlots, InventoryItem } from "./item.types"; // Import new types
import { StaticImageData } from "next/image";
import { ClassInfo } from "./class.types"; // Assuming ClassInfo is defined here
import { SkillRank } from "./skill.types"; // Assuming SkillRank is defined here

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

export type AllocatableStat =
  | "strength"
  | "agility"
  | "perception"
  | "intelligence"
  | "vitality";

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

// Interface for Hunter creation payload (example)
export interface CreateHunterPayload {
  name: string;
  classType: keyof typeof ClassInfo; // Use keys from ClassInfo
  // userId will likely be injected server-side from session
}

// Basic structure for item (expand later)
export interface Item {
  id: string;
  name: string;
  description: string;
  type: string; // e.g., "Weapon", "Armor", "Consumable"
  rarity: string;
  // ... other properties like stats, effects, icon
}
