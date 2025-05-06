// src/lib/combat/damageCalculator.ts

import { HunterClass } from "@/constants/classes";
import { EnemyType } from "@/types/enemy.types";
import {
    CLASS_VS_CLASS_MODIFIERS,
    CLASS_VS_ENEMY_TYPE_MODIFIERS,
    ENEMY_TYPE_VS_CLASS_MODIFIERS,
    MODIFIER_STRONG_VALUE,
    MODIFIER_WEAK_VALUE,
    MODIFIER_NEUTRAL_VALUE
} from "@/constants/gameModifiers";

// --- Tunable Constants ---
/// Controls how strongly defense diminishes incoming damage
const DEFENSE_MITIGATION_BASE = 100;
/// Global power-scale: lower -> bigger numbers. Higher values reduce overall damage.
const POWER_DIVISOR = 2; // Re-introduce POWER_DIVISOR
/// Flat bonus to avoid 0 damage

// Define input structure for clarity
interface AttackerStats {
  level: number;
  attackPower: number;
  critRate: number; // as percent (0-100)
  critDamage: number; // total multiplier, e.g. 1.5 for +50%
  precision: number; // as percent (0-100)
  // Add fields for class/type modifiers
  entityCategory: 'hunter' | 'enemy' | 'hunter_npc';
  classOrType: HunterClass | EnemyType;
}

interface DefenderStats {
  level?: number; // Optional for backward compatibility or mobs without levels?
  defense: number;
  isBoss?: boolean; // Optional flag on defender data
  // Add fields for class/type modifiers
  entityCategory: 'hunter' | 'enemy' | 'hunter_npc';
  classOrType: HunterClass | EnemyType;
}

interface ActionDetails {
  actionPower: number; // skill or basic attack power
  temporaryCritChanceBonus?: number; // Add optional bonus crit chance
}

export interface DamageCalculationInput {
  attacker: AttackerStats;
  defender: DefenderStats;
  action: ActionDetails;
  context?: { // Optional context flags passed in
    isPvP?: boolean;
    isBoss?: boolean;
  };
}

// --- Define return type ---
export interface DamageResult {
    damage: number;
    isCrit: boolean;
    debug?: Record<string, any>; // Optional: for debugging/logging
}
// --- End define return type ---

/**
 * Calculate final damage of a single hit, with level diff, crit, variance, and context modifiers.
 */
export function calculateDamage({
  attacker,
  defender,
  action,
  context = {}, // Default to empty object if not provided
}: DamageCalculationInput): DamageResult {
  // 1. Base Damage
    const baseDmg = attacker.attackPower + action.actionPower;

  // 2. Defense Mitigation
    const mitigationFactor = DEFENSE_MITIGATION_BASE / (DEFENSE_MITIGATION_BASE + Math.max(0, defender.defense));
    let mitigatedBaseDmg = baseDmg * mitigationFactor;

  // 3. Level Difference Scaling (±25% cap)
  const attackerLevel = attacker.level ?? 1; // Default level 1 if undefined
  const defenderLevel = defender.level ?? 1; // Default level 1 if undefined
  let levelDiff = attackerLevel - defenderLevel;
  // Apply scaling: More levels = more damage dealt/less taken (adjust divisor for impact)
  let levelFactor = 1 + (levelDiff / 100); // Uses / 100 scaling
  levelFactor = Math.max(0.75, Math.min(1.25, levelFactor)); // cap to ±25%
    let scaledDamage = mitigatedBaseDmg * levelFactor;

  // 4. Power Divisor
  let dividedDamage = Math.max(1, scaledDamage / POWER_DIVISOR);

  // 5. Critical Hit
    let isCrit = false;
    const effectiveCritRate = Math.min(100, attacker.critRate + (action.temporaryCritChanceBonus || 0));
    const critRoll = Math.random() * 100;
  let critMultiplier = 1.0;
  if (critRoll < effectiveCritRate) {
        isCrit = true;
    // Use attacker's crit damage, but cap it
    critMultiplier = Math.min(attacker.critDamage || 1.5, 1.75); // cap crit multiplier (No Math.max needed)
  }
  let critDamage = dividedDamage * critMultiplier;

  // 6. Precision & Variance
  const precisionBonus = (attacker.precision / 100) * 0.25; // Example: Max +25% to min damage
  const minVariance = Math.min(0.75 + precisionBonus, 1.0); // Base 75% min damage, increases up to 100%
  const randomMultiplier = Math.random() * (1.0 - minVariance) + minVariance; // Random between minVariance and 1.0
  let finalDamage = Math.floor(critDamage * randomMultiplier);

  // 6.5. Class/Type Effectiveness Modifier
  let classTypeModifier = MODIFIER_NEUTRAL_VALUE;

  if (attacker.entityCategory === 'hunter' && defender.entityCategory === 'enemy') {
    // Player Hunter attacking Enemy (TypedEnemy)
    const playerClass = attacker.classOrType as HunterClass;
    const enemyType = defender.classOrType as EnemyType;
    const modifiers = CLASS_VS_ENEMY_TYPE_MODIFIERS[playerClass];
    if (modifiers) {
        if (modifiers.strongAgainst.includes(enemyType)) {
            classTypeModifier = MODIFIER_STRONG_VALUE;
        } else if (modifiers.weakAgainst.includes(enemyType)) {
            classTypeModifier = MODIFIER_WEAK_VALUE;
        }
    }
  } else if (attacker.entityCategory === 'enemy' && defender.entityCategory === 'hunter') {
    // Enemy (TypedEnemy) attacking Player Hunter
    const enemyType = attacker.classOrType as EnemyType;
    const playerClass = defender.classOrType as HunterClass;
    const modifiers = ENEMY_TYPE_VS_CLASS_MODIFIERS[enemyType];
    if (modifiers) {
        if (modifiers.strongAgainst.includes(playerClass)) {
            classTypeModifier = MODIFIER_STRONG_VALUE;
        } else if (modifiers.weakAgainst.includes(playerClass)) {
            classTypeModifier = MODIFIER_WEAK_VALUE;
        }
    }
  } else if (
    (attacker.entityCategory === 'hunter' || attacker.entityCategory === 'hunter_npc') &&
    (defender.entityCategory === 'hunter' || defender.entityCategory === 'hunter_npc')
  ) {
    // Hunter vs Hunter (Player vs NPC, NPC vs Player, Player vs Player)
    const attackerClass = attacker.classOrType as HunterClass;
    const defenderClass = defender.classOrType as HunterClass;
    const modifiers = CLASS_VS_CLASS_MODIFIERS[attackerClass];
    if (modifiers) {
        if (modifiers.strongAgainst.includes(defenderClass)) {
            classTypeModifier = MODIFIER_STRONG_VALUE;
        } else if (modifiers.weakAgainst.includes(defenderClass)) {
            classTypeModifier = MODIFIER_WEAK_VALUE;
        }
    }
  } else if (attacker.entityCategory === 'hunter_npc' && defender.entityCategory === 'enemy') {
    // NPC Hunter attacking Typed Enemy
    const npcClass = attacker.classOrType as HunterClass;
    const enemyType = defender.classOrType as EnemyType;
    const modifiers = CLASS_VS_ENEMY_TYPE_MODIFIERS[npcClass];
    if (modifiers) {
        if (modifiers.strongAgainst.includes(enemyType)) {
            classTypeModifier = MODIFIER_STRONG_VALUE;
        } else if (modifiers.weakAgainst.includes(enemyType)) {
            classTypeModifier = MODIFIER_WEAK_VALUE;
        }
    }
  } else if (attacker.entityCategory === 'enemy' && defender.entityCategory === 'hunter_npc') {
    // Typed Enemy attacking NPC Hunter
    const enemyType = attacker.classOrType as EnemyType;
    const npcClass = defender.classOrType as HunterClass;
    const modifiers = ENEMY_TYPE_VS_CLASS_MODIFIERS[enemyType];
    if (modifiers) {
        if (modifiers.strongAgainst.includes(npcClass)) {
            classTypeModifier = MODIFIER_STRONG_VALUE;
        } else if (modifiers.weakAgainst.includes(npcClass)) {
            classTypeModifier = MODIFIER_WEAK_VALUE;
        }
    }
  }
  // Note: Enemy (Typed) vs Enemy (Typed) is not handled by these modifiers currently.
  // If needed, a new ENEMY_TYPE_VS_ENEMY_TYPE_MODIFIERS could be added.

  finalDamage = Math.floor(finalDamage * classTypeModifier);

  // 7. Contextual Modifiers
  if (context.isPvP) {
    finalDamage = Math.floor(finalDamage * 0.85); // PvP damage reduction
  }
  // Check both context flag and defender flag for boss
  if (context.isBoss || defender.isBoss) {
    // Maybe bosses take slightly *less* damage as a base rule?
    finalDamage = Math.floor(finalDamage * 1.10); // Bosses take 10% MORE damage
    // Or maybe they deal more damage (handled if the caller is the boss)
  }

  // 8. Minimum Damage
    finalDamage = Math.max(1, finalDamage); 

  // 9. Return
    return {
        damage: finalDamage,
    isCrit,
    debug: {
        baseDmg,
        mitigationFactor,
        levelFactor,
        scaledDamage,
        dividedDamage,
        critMultiplier,
        minVariance,
        randomMultiplier,
        finalDamageBeforeContext: critDamage * randomMultiplier,
        classTypeModifier,
        finalDamage
    }
    };
} 