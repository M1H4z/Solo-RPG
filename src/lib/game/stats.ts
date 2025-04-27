import { Hunter } from '@/types/hunter.types';

// --- Base Stat Effects --- 
const HP_PER_VIT = 10;
const DEF_PER_VIT = 0.5;
const MP_PER_INT = 8;
const COOLDOWN_REDUCTION_PER_INT = 0.05; // 5% per 100 INT approx
const ATK_PER_STR = 1.2;
const PRECISION_PER_PER = 0.1; // Percentage of min damage increase
const CRIT_RATE_PER_AGI = 0.1; // Percentage
const CRIT_DMG_PER_AGI = 0.05; // Percentage multiplier increase (e.g., 1.5x -> 1.55x)
const SPEED_PER_AGI = 0.2;
const EVASION_PER_AGI = 0.08; // Percentage

// --- Derived Stats Calculation Functions --- 

export const calculateMaxHP = (vitality: number): number => {
    // Base HP + HP from Vitality
    const baseHp = 50;
    return baseHp + Math.floor(vitality * HP_PER_VIT);
};

export const calculateMaxMP = (intelligence: number): number => {
    // Base MP + MP from Intelligence
    const baseMp = 30;
    return baseMp + Math.floor(intelligence * MP_PER_INT);
};

export const calculateDefense = (vitality: number): number => {
    // Base Defense + Defense from Vitality
    const baseDef = 5;
    return baseDef + Math.floor(vitality * DEF_PER_VIT);
};

export const calculateAttackPower = (strength: number): number => {
    // Base Attack + Attack from Strength
    const baseAtk = 10;
    return baseAtk + Math.floor(strength * ATK_PER_STR);
};

export const calculateCritRate = (agility: number): number => {
    // Base Crit Rate + Crit Rate from Agility (as percentage)
    const baseCritRate = 5.0; // 5%
    return parseFloat((baseCritRate + agility * CRIT_RATE_PER_AGI).toFixed(2));
};

export const calculateCritDamage = (agility: number): number => {
    // Base Crit Damage Multiplier + Bonus from Agility
    const baseCritDmg = 1.5; // 150%
    return parseFloat((baseCritDmg + agility * CRIT_DMG_PER_AGI).toFixed(2));
};

export const calculateSpeed = (agility: number): number => {
    // Base Speed + Speed from Agility
    const baseSpeed = 10;
    return baseSpeed + Math.floor(agility * SPEED_PER_AGI);
};

export const calculateEvasion = (agility: number): number => {
    // Base Evasion + Evasion from Agility (as percentage)
    const baseEvasion = 2.0; // 2%
    return parseFloat((baseEvasion + agility * EVASION_PER_AGI).toFixed(2));
};

export const calculatePrecision = (perception: number): number => {
    // Precision affects minimum damage range (as percentage increase)
    const basePrecision = 0.0; // Starts at 0% min damage boost
    // Cap precision effect? e.g., max 50% min damage?
    const precisionValue = basePrecision + perception * PRECISION_PER_PER;
    return parseFloat(Math.min(precisionValue, 50.0).toFixed(2)); // Example cap at 50%
};

// --- Helper to get all derived stats --- 

export interface DerivedStats {
    maxHP: number;
    maxMP: number;
    defense: number;
    attackPower: number;
    critRate: number;
    critDamage: number;
    speed: number;
    evasion: number;
    precision: number; // Min damage bonus %
}

export const calculateDerivedStats = (hunter: Hunter): DerivedStats => {
    return {
        maxHP: calculateMaxHP(hunter.vitality),
        maxMP: calculateMaxMP(hunter.intelligence),
        defense: calculateDefense(hunter.vitality),
        attackPower: calculateAttackPower(hunter.strength),
        critRate: calculateCritRate(hunter.agility),
        critDamage: calculateCritDamage(hunter.agility),
        speed: calculateSpeed(hunter.agility),
        evasion: calculateEvasion(hunter.agility),
        precision: calculatePrecision(hunter.perception),
    };
}; 