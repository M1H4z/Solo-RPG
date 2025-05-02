// src/lib/combat/damageCalculator.ts

// --- Tunable Constants ---
/// Controls how strongly defense diminishes incoming damage
const DEFENSE_MITIGATION_BASE = 100;
/// Global power-scale: lower -> bigger numbers
const POWER_DIVISOR = 40;
/// Flat bonus to avoid 0 damage
const DAMAGE_FLAT_ADD = 2;

// Define input structure for clarity
interface DamageCalculationInput {
  attacker: {
    level: number;
    attackPower: number;
    critRate: number; // as percent (0-100)
    critDamage: number; // total multiplier, e.g. 1.5 for +50%
    precision: number; // as percent (0-100)
  };
  defender: {
    defense: number;
  };
  action: {
    actionPower: number; // skill or basic attack power
  };
}

/**
 * Calculate final damage of a single hit
 */
export function calculateDamage({
  attacker,
  defender,
  action,
}: DamageCalculationInput): number {
  // 1) Level-scaled raw damage × defense mitigation
  const levelFactor = 1 + attacker.level / 10;
  const mitigation =
    DEFENSE_MITIGATION_BASE / (DEFENSE_MITIGATION_BASE + defender.defense);
  // Ensure attackPower and actionPower are at least 1 to avoid issues
  const effectiveAttackPower = Math.max(1, attacker.attackPower);
  const effectiveActionPower = Math.max(1, action.actionPower);
  const raw = levelFactor * effectiveAttackPower * effectiveActionPower * mitigation;

  // 2) Base damage with global divisor + flat add
  const baseDamage = Math.max(1, Math.floor(raw / POWER_DIVISOR + DAMAGE_FLAT_ADD)); // Ensure base is at least 1 before variance/crit

  // 3) Critical check
  const isCrit = Math.random() * 100 <= attacker.critRate;
  const critMul = isCrit ? attacker.critDamage : 1.0;

  // 4) Precision-boosted variance floor (Using image recommendation)
  const precisionBonus = (attacker.precision / 100) * 0.15; // Max +15% to min range (0.15)
  const minVariance = Math.min(0.85 + precisionBonus, 1.0); // Base 85%, increases up to 100% with precision
  const randomMultiplier = Math.random() * (1.0 - minVariance) + minVariance; // Random between minVariance and 1.0

  // 5) Final damage: Apply crit and random multiplier, floored once
  let dmg = Math.floor(baseDamage * critMul * randomMultiplier);

  // 6) Ensure at least 1 final damage
  return Math.max(1, dmg);
} 