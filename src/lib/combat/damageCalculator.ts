// src/lib/combat/damageCalculator.ts

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
}

interface DefenderStats {
  level?: number; // Optional for backward compatibility or mobs without levels?
  defense: number;
  isBoss?: boolean; // Optional flag on defender data
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
        finalDamage
    }
    };
} 