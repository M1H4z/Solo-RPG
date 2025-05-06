import { HunterClassType } from "./classes";
import { EnemyType } from "../types/enemy.types";

export const MODIFIER_STRONG_VALUE = 1.5;  // 1.5x damage
export const MODIFIER_WEAK_VALUE = 0.5;    // 0.5x damage
export const MODIFIER_NEUTRAL_VALUE = 1.0; // 1.0x damage

// Hunter Class vs Target Hunter Class (PvP or Hunter NPC)
export const CLASS_VS_CLASS_MODIFIERS: Record<HunterClassType, { 
  strongAgainst: HunterClassType[], 
  weakAgainst: HunterClassType[] 
}> = {
  Mage: {
    strongAgainst: ["Fighter", "Tanker"],
    weakAgainst: ["Assassin", "Ranger"],
  },
  Healer: {
    strongAgainst: [], // Healer is not primarily offensive against classes, but could be strong vs specific enemy types
    weakAgainst: ["Assassin", "Ranger"],
  },
  Fighter: {
    strongAgainst: ["Assassin", "Ranger"],
    weakAgainst: ["Mage", "Tanker"],
  },
  Assassin: {
    strongAgainst: ["Mage", "Healer"],
    weakAgainst: ["Fighter", "Tanker"],
  },
  Ranger: {
    strongAgainst: ["Mage", "Healer"],
    weakAgainst: ["Fighter", "Tanker"],
  },
  Tanker: {
    strongAgainst: ["Ranger", "Assassin"],
    weakAgainst: ["Mage", "Healer"],
  },
};

// Hunter Class vs Target Enemy Type (PvE)
export const CLASS_VS_ENEMY_TYPE_MODIFIERS: Record<HunterClassType, { 
  strongAgainst: EnemyType[], 
  weakAgainst: EnemyType[] 
}> = {
  Mage: {
    strongAgainst: ["Beast", "Dragonkin"],
    weakAgainst: ["Undead", "Construct"], // Added Construct as example
  },
  Healer: {
    strongAgainst: ["Undead", "Demon"], // Added Demon
    weakAgainst: ["Humanoid", "Dragonkin", "Construct"],
  },
  Fighter: {
    strongAgainst: ["Humanoid", "Beast"],
    weakAgainst: ["Dragonkin", "Elemental"], // Added Elemental
  },
  Assassin: {
    strongAgainst: ["Humanoid", "Undead"],
    weakAgainst: ["Beast", "Construct"],
  },
  Ranger: {
    strongAgainst: ["Dragonkin", "Beast", "Elemental"],
    weakAgainst: ["Undead", "Humanoid"],
  },
  Tanker: {
    strongAgainst: ["Construct", "Demon"], // Changed from your example to be more thematic
    weakAgainst: ["Mage"], // Tankers might be weak to enemy Mages (if we use ClassedEnemy) or magic-heavy Elemental/Demon types
                  // For EnemyType vs Tanker, Mage isn't an EnemyType. This interaction primarily plays out in CLASS_VS_CLASS.
                  // Consider if Tanker should be weak against any *EnemyTypes* specifically.
                  // Perhaps Elementals or magic-heavy Demons?
                  // For now, let's leave this sparse for PvE type weakness unless you have specific ideas.
  },
};

// Enemy Type vs Target Hunter Class (PvE - Enemy Attacking Player)
export const ENEMY_TYPE_VS_CLASS_MODIFIERS: Record<EnemyType, { 
  strongAgainst: HunterClassType[], 
  weakAgainst: HunterClassType[] 
}> = {
  Beast: {
    strongAgainst: ["Assassin", "Ranger"],
    weakAgainst: ["Mage", "Fighter", "Tanker"], // Expanded weakness
  },
  Undead: {
    strongAgainst: ["Mage", "Ranger", "Fighter"], // Expanded strength
    weakAgainst: ["Healer", "Tanker"],
  },
  Humanoid: { // Generic humanoids might have varied strengths/weaknesses or be neutral often
    strongAgainst: ["Healer"], // e.g., bandits targeting healers
    weakAgainst: ["Fighter", "Tanker", "Assassin"], // Generally struggle against combat classes
  },
  Dragonkin: {
    strongAgainst: ["Fighter", "Tanker", "Mage"], // Dragons are tough
    weakAgainst: ["Ranger", "Assassin"], // Nimble classes might have an edge
  },
  Demon: {
    strongAgainst: ["Healer", "Tanker", "Fighter"], // Demonic power vs holy/sturdy/physical
    weakAgainst: ["Mage", "Assassin"], // Arcane or shadow might exploit them
  },
  Elemental: {
    strongAgainst: ["Fighter", "Tanker"], // Raw elemental power
    weakAgainst: ["Mage", "Ranger"], // Mages might absorb/redirect, Rangers exploit range
  },
  Plant: {
    strongAgainst: ["Tanker", "Healer"], // Entangling, poison, regeneration
    weakAgainst: ["Mage", "Fighter", "Assassin"], // Fire, cutting, precise strikes
  },
  Construct: {
    strongAgainst: ["Fighter", "Assassin", "Ranger"], // Armored, precise attacks don't always work
    weakAgainst: ["Mage", "Tanker"], // Magic (e.g. rust, shatter) or overwhelming force
  },
}; 