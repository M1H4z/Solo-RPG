"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Re-add Image import to potentially resolve linter issue
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Swords, ShoppingBag, Sparkles, DoorOpen, Star } from 'lucide-react'; 
import VictoryRewardsPopup from './VictoryRewardsPopup';
import PlayerSprite, { PlayerAnimationState } from './PlayerSprite'; // Import PlayerSprite
import EnemySprite, { EnemyAnimationState } from './EnemySprite'; // Import EnemySprite
import { calculateDamage, DamageResult } from '@/lib/combat/damageCalculator'; // <-- Import the calculator and DamageResult type
import { determineLoot, LootResult } from '@/lib/game/lootService'; // Import loot service
import { LootDrop } from '@/constants/lootTables.constants'; // Import type
import { InventoryItem } from '@/types/item.types'; // Import InventoryItem type
import { Skill, SkillEffect } from "@/types/skill.types"; 
import { getSkillById } from "@/constants/skills";
import { HunterClass } from "@/constants/classes"; // Corrected import: HunterClass
import { EnemyType, EnemyDefinition } from "@/types/enemy.types";

// Updated interfaces
interface EnemyCombatEntity {
    id: string;
    name: string;
    currentHp: number;
    maxHp: number;
    level: number;
    attackPower: number; 
    defense: number;     
    baseExpYield: number; // Added EXP yield
    isBoss?: boolean; // Add optional isBoss flag
    // Add stats needed for hit/miss and turn order
    precision: number; // percent (0-100)
    evasion: number;   // percent (0-100)
    speed: number;     // determines turn order
    // Add entity category and class/type for modifiers
    entityCategory: 'enemy' | 'hunter_npc'; 
    classOrType: HunterClass | EnemyType; // Corrected type: HunterClass
    spriteKey: string; // For rendering the correct enemy sprite
}
interface PlayerCombatEntity {
    id: string;
    name: string;
    currentHp: number;
    maxHp: number;
    level: number;
    attackPower: number; 
    defense: number;     
    currentExp: number;      // Added Player EXP
    expToNextLevel: number; // Added Player EXP Goal
    critRate: number;
    critDamage: number;
    precision: number;
    // Add progress within current level
    expProgressInCurrentLevel: number;
    currentMp: number;
    maxMp: number;
    equippedSkills: string[];
    // Add missing stats for hit/miss and turn order
    evasion: number;   // percent (0-100)
    speed: number;     // determines turn order
    cooldownReduction?: number; // e.g., 0.2 for 20% CDR
    class: HunterClass; // Corrected type: HunterClass
    entityCategory: 'hunter'; // Player is always 'hunter'
}

interface CombatInterfaceProps {
    gateId: string;
    hunterData: PlayerCombatEntity;
    enemyData: EnemyCombatEntity;
    onCombatResolved: (result: 'win' | 'loss' | 'flee', payload?: { 
        expGained?: number, 
        finalPlayerHp?: number,
        finalPlayerMp?: number,
        loot?: LootResult 
    }) => void;
}

// State to hold mutable combat values
interface CombatState {
    playerHp: number;
    enemyHp: number;
    playerMp: number;
}

// New state for combat phases
type CombatPhase = 'fighting' | 'exp_gaining' | 'showing_rewards' | 'loss';

// Add type for skill info needed in combat
interface CombatSkillInfo {
    id: string;
    name: string;
    mpCost: number;
    // Add power, effects etc. later when implementing skill logic
}

// --- Add type for Active Effects ---
interface ActiveEffect {
    id: string; // Unique instance ID for this effect application
    sourceId: string; // ID of the skill/item that applied it
    stat: string; // Stat being modified
    amount: number; // Amount of modification
    duration: number; // Remaining duration in player turns
}
// --- END Add type ---

// --- Add Base Combat Stats type for calculation helper ---
// Defines stats potentially modified by ActiveEffects
interface ModifiableCombatStats {
    attackPower?: number;
    defense?: number;
    critRate?: number;
    critDamage?: number;
    precision?: number;
    speed?: number;
    evasion?: number;
    // Add other potentially modified stats here
}
// --- END Add Type ---

// --- Add Logging Helper Component ---
const DebugLogProps = ({ data, label }: { data: any, label: string }) => {
    console.log(`[${label} Render Log]`, data);
    return null; // This component doesn't render anything visually
};
// --- END Logging Helper Component ---

export default function CombatInterface({ 
    gateId, 
    hunterData, 
    enemyData, 
    onCombatResolved 
}: CombatInterfaceProps) {
    // --- Component State ---
    const [messageLog, setMessageLog] = useState<string[]>([`A wild ${enemyData.name} appeared!`]);
    // Initialize playerTurn based on speed comparison, default to true if data is missing initially
    const [playerTurn, setPlayerTurn] = useState<boolean>(() => {
        // Initial check during component mount, before useEffect runs
        return hunterData.speed >= enemyData.speed;
    }); 
    const [combatState, setCombatState] = useState<CombatState>({
        playerHp: hunterData.currentHp,
        enemyHp: enemyData.currentHp,
        playerMp: hunterData.currentMp,
    });
    const [combatPhase, setCombatPhase] = useState<CombatPhase>('fighting'); // Added phase state
    const [expGainedThisFight, setExpGainedThisFight] = useState<number>(0); // Store calculated EXP gain
    const [playerAnimation, setPlayerAnimation] = useState<PlayerAnimationState>('idle'); // Add animation state
    const [enemyAnimation, setEnemyAnimation] = useState<EnemyAnimationState>('idle'); // Add enemy animation state
    const [isProcessingAction, setIsProcessingAction] = useState(false); // Prevent spamming actions
    const [playerIsHit, setPlayerIsHit] = useState(false); // Add player hit state
    const [enemyIsHit, setEnemyIsHit] = useState(false);   // Add enemy hit state
    // Add state to hold the determined loot for the popup
    const [determinedLoot, setDeterminedLoot] = useState<LootResult | null>(null);
    // --- Add State for Active Effects ---
    const [playerActiveEffects, setPlayerActiveEffects] = useState<ActiveEffect[]>([]);
    // --- Add State for Effect ID Counter ---
    const [nextEffectId, setNextEffectId] = useState(0);
    // --- Add State for Enemy Effects & Counter ---
    const [enemyActiveEffects, setEnemyActiveEffects] = useState<ActiveEffect[]>([]);
    const [nextEnemyEffectId, setNextEnemyEffectId] = useState(0);
    // --- END State ---

    // --- State for Calculated Effective Stats --- 
    // Initialize with base stats, will be updated at turn start
    const [currentEffectivePlayerStats, setCurrentEffectivePlayerStats] = useState<PlayerCombatEntity>(() => hunterData);
    const [currentEffectiveEnemyStats, setCurrentEffectiveEnemyStats] = useState<EnemyCombatEntity>(() => enemyData);
    // --- END State ---

    // --- State for Item Menu ---
    const [isItemMenuOpen, setIsItemMenuOpen] = useState(false);
    const [consumableItems, setConsumableItems] = useState<InventoryItem[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    
    // --- State for Skill Menu ---
    const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
    const [usableSkills, setUsableSkills] = useState<Skill[]>([]);
    const [isLoadingSkills, setIsLoadingSkills] = useState(false);
    // --- State for Skill Cooldowns ---
    const [skillCooldowns, setSkillCooldowns] = useState<{ [skillId: string]: number }>({});
    // --- END State ---

    // --- State for Round Tracking ---

    // --- Effect to determine initial turn order --- 
    useEffect(() => {
        // 1. Calculate initial effective stats on mount
        const { effectivePlayer, effectiveEnemy } = calculateAndSetEffectiveStats();

        // 2. Determine who goes first based on calculated effective speed
        const playerGoesFirst = effectivePlayer.speed >= effectiveEnemy.speed;
        setPlayerTurn(playerGoesFirst); // Set initial turn state
        addLog(`Combat Start! ${playerGoesFirst ? hunterData.name : enemyData.name} moves first.`);
        console.log(`Initial turn: Player Speed (${effectivePlayer.speed}) vs Enemy Speed (${effectiveEnemy.speed}) -> Player First: ${playerGoesFirst}`);

        // 3. If the enemy goes first, trigger their turn
        if (!playerGoesFirst) {
            setIsProcessingAction(true); // Prevent player actions
            setTimeout(() => {
                // Pass initial calculated stats
                handleEnemyTurn(effectiveEnemy, effectivePlayer); 
            }, 1500); // Delay for readability
        } else {
            // If player goes first, ensure actions are enabled
            setIsProcessingAction(false); 
        }
        // Dependencies: Base data IDs should be enough to trigger recalculation if entities change
    }, [hunterData.id, enemyData.id]); // Simplified dependencies

    const addLog = (message: string) => {
        // --- FIX: Append to log, keeping last N messages --- 
        const MAX_LOG_MESSAGES = 3; // Keep the last 3 messages
        setMessageLog(prevLog => 
            [...prevLog, message].slice(-MAX_LOG_MESSAGES)
        );
        // --- END FIX ---
    };

    // --- Helper function to calculate effective stats for ANY entity ---
    const calculateEffectiveCombatStats = <T extends ModifiableCombatStats>(
        baseStats: T, 
        activeEffects: ActiveEffect[]
    ): T => {
        let effectiveStats = { ...baseStats }; // Start with base stats 
        // Log base stats before applying effects
        // console.log(`[calculateEffectiveCombatStats] Base Stats:`, baseStats);

        activeEffects.forEach(effect => {
            const statName = effect.stat as keyof ModifiableCombatStats;
            // Log each effect being processed
            // console.log(`[calculateEffectiveCombatStats] Processing effect:`, effect);

            if (statName in effectiveStats && typeof effectiveStats[statName] === 'number') {
                const originalValue = effectiveStats[statName] as number;
                (effectiveStats as any)[statName] = originalValue + effect.amount;
                // --- ADD specific log for Defense changes ---
                if (statName === 'defense') {
                    console.log(`[calculateEffectiveCombatStats] Applying Defense change: Base(${originalValue}) + Amount(${effect.amount}) -> New(${effectiveStats[statName]}) for source ${effect.sourceId}`);
                }
                // --- END log ---

                // Clamping logic
                 if ((statName === 'defense' || statName === 'attackPower') && effectiveStats[statName]! < 0) {
                     effectiveStats[statName] = 0;
                 }
            } else {
                 console.warn(`[calculateEffectiveCombatStats] Attempted to apply effect to unknown or non-numeric stat: ${effect.stat}`);
            }
        });

        // Log final effective stats
        // console.log(`[calculateEffectiveCombatStats] Final Effective Stats:`, effectiveStats);
        return effectiveStats;
    };
    // --- END Helper function ---

    // --- Helper to Calculate and SET Effective Stats State ---
    const calculateAndSetEffectiveStats = () => {
        const effectivePlayer = calculateEffectiveCombatStats(hunterData, playerActiveEffects);
        const effectiveEnemy = calculateEffectiveCombatStats(enemyData, enemyActiveEffects);
        setCurrentEffectivePlayerStats(effectivePlayer);
        setCurrentEffectiveEnemyStats(effectiveEnemy);
        console.log("Updated Effective Stats -> Player:", effectivePlayer, "Enemy:", effectiveEnemy);
        // Return the calculated stats directly for immediate use if needed
        return { effectivePlayer, effectiveEnemy }; 
    };
    // --- END Helper ---

    // --- Hit/Miss Calculation Helper ---
    // Base hit chance can be adjusted. 85% means even with 0 precision vs 0 evasion, there's a 15% miss chance.
    const BASE_HIT_CHANCE = 90; // 90% base chance to hit
    const attackHits = (attackerPrecision: number, defenderEvasion: number): boolean => {
        const precisionBonus = attackerPrecision || 0;
        const evasionPenalty = defenderEvasion || 0;
        // Calculate final hit chance, clamped between 5% and 95% (adjust caps as needed)
        const hitChance = Math.max(5, Math.min(95, BASE_HIT_CHANCE + precisionBonus - evasionPenalty));
        const roll = Math.random() * 100;
        const doesHit = roll < hitChance;
        console.log(`Attack Roll: ${roll.toFixed(2)} vs Hit Chance: ${hitChance.toFixed(2)} (Prec: ${precisionBonus}, Eva: ${evasionPenalty}) -> ${doesHit ? 'HIT' : 'MISS'}`);
        return doesHit;
    };
    // --- END Helper function ---

    // --- Function to End the Current Turn and Start the Next Phase (Simplified Round Logic) ---
    const endTurn = (actorWasPlayer: boolean) => {
        console.log(`[End Turn v3 Start]: Called by ${actorWasPlayer ? 'Player' : 'Enemy'}.`);

        // 1. Recalculate effective stats first, reflecting changes from the completed action
        const { effectivePlayer, effectiveEnemy } = calculateAndSetEffectiveStats();

        // 2. Decrement appropriate buffs/debuffs based on who just acted
        if (actorWasPlayer) {
            decrementPlayerBuffDurations();
        } else {
            decrementEnemyDebuffDurations();
        }

        // 3. Determine next step based on who just acted
        if (actorWasPlayer) {
            // --- Player just finished -> Mid-Round: Force turn to Enemy --- 
            console.log("[End Turn v3 - Mid-Round]: Player finished. Forcing turn to Enemy.");
            setPlayerTurn(false); // Enemy always goes second in the round

            addLog(`${enemyData.name}'s turn.`);
            console.log("[End Turn v3 - Mid-Round]: Scheduling Enemy for second action.");
            setIsProcessingAction(true);
            setTimeout(() => handleEnemyTurn(effectiveEnemy, effectivePlayer), 1000);

        } else {
            // --- Enemy just finished -> ROUND COMPLETE: Determine START of NEXT round via speed check --- 
            console.log("[End Turn v3 - Round Complete]: Enemy finished. Re-evaluating speed for next round.");
            
            // --- DECREMENT PLAYER SKILL COOLDOWNS HERE --- 
            // decrementSkillCooldowns(); // REMOVED FROM HERE
            // ---------------------------------------------

            // Add console.log for dynamic turn order check
            console.log(`[Dynamic Turn Order Check] Effective Player Speed: ${effectivePlayer.speed}, Effective Enemy Speed: ${effectiveEnemy.speed}`);
            const playerStartsNextRound = effectivePlayer.speed >= effectiveEnemy.speed;
            console.log(`[End Turn v3 - Next Round Check]: Player Speed (${effectivePlayer.speed}) vs Enemy Speed (${effectiveEnemy.speed}) -> Player Starts Next: ${playerStartsNextRound}`);
            
            setPlayerTurn(playerStartsNextRound); // Set turn for the start of the new round

            // Schedule the action for the entity starting the new round
            if (playerStartsNextRound) {
                addLog(`${hunterData.name}'s turn.`);
                console.log("[End Turn v3 - Round Complete]: Starting next round with Player.");
                // --- Decrement Cooldowns JUST BEFORE Player Turn Starts ---
                decrementSkillCooldowns(); 
                // ----------------------------------------------------------
                setIsProcessingAction(false); // Enable player actions
            } else {
                addLog(`${enemyData.name}'s turn.`);
                 console.log("[End Turn v3 - Round Complete]: Starting next round with Enemy.");
                // Cooldowns will decrement later when this enemy turn finishes and player gets turn
                setIsProcessingAction(true);
                setTimeout(() => handleEnemyTurn(effectiveEnemy, effectivePlayer), 1000);
            }
        }
        // We don't need to log playerTurn state here as it might not have updated yet
        // console.log(`[End Turn Finish]: State after logic -> playerTurn: ${playerTurn}`); 
    };
    // --- END New End Turn Function ---

    // --- Combat Actions --- 
    // handleAttack, handleSkills, handleItems, handleFlee, handleEnemyTurn now come AFTER endTurn definition
    const handleAttack = () => { 
        if (!playerTurn || combatPhase !== 'fighting' || isProcessingAction) return;
        setIsProcessingAction(true);
        setPlayerAnimation('attack');

        const effectivePlayerStats = currentEffectivePlayerStats; 
        const effectiveEnemyStats = currentEffectiveEnemyStats; 

        setTimeout(() => {
            setPlayerAnimation('idle');

            if (attackHits(effectivePlayerStats.precision, effectiveEnemyStats.evasion)) {
                const damageResult: DamageResult = calculateDamage({
                    attacker: {
                        level: effectivePlayerStats.level,
                        attackPower: effectivePlayerStats.attackPower,
                        critRate: effectivePlayerStats.critRate,
                        critDamage: effectivePlayerStats.critDamage,
                        precision: effectivePlayerStats.precision,
                        entityCategory: effectivePlayerStats.entityCategory,
                        classOrType: effectivePlayerStats.class,
                    },
                    defender: {
                        level: enemyData.level, 
                        defense: effectiveEnemyStats.defense, 
                        isBoss: enemyData.isBoss,
                        entityCategory: effectiveEnemyStats.entityCategory,
                        classOrType: effectiveEnemyStats.classOrType,
                    },
                    action: {
                        actionPower: 10, 
                    },
                    context: { isBoss: enemyData.isBoss }
                });
                console.log("Player Basic Attack Debug (HIT):", damageResult.debug);
                const damageDealt = damageResult.damage;
                addLog(`${hunterData.name} attacks ${enemyData.name} for ${damageDealt} damage! ${damageResult.isCrit ? '(Critical!)' : ''}`);
                const newEnemyHp = Math.max(0, combatState.enemyHp - damageDealt);
                setEnemyIsHit(true);
                setTimeout(() => setEnemyIsHit(false), 150);

                if (newEnemyHp === 0) {
                    // --- Victory sequence (no change needed here, handled outside turn transition) ---
                    addLog(`${enemyData.name} has been defeated!`);
                    setEnemyAnimation('defeat');
                    const calculatedExpGained = Math.max(1, Math.floor(enemyData.baseExpYield * enemyData.level / hunterData.level)); 
                    setExpGainedThisFight(calculatedExpGained);
                    addLog(`${hunterData.name} gained ${calculatedExpGained} EXP!`);
                    setCombatState(prev => ({ ...prev, enemyHp: 0 }));
                    const lootContext = { enemyId: enemyData.id }; 
                    const lootResult = determineLoot(lootContext);
                    setDeterminedLoot(lootResult);
                    setCombatPhase('exp_gaining'); 
                    setTimeout(() => {
                        setCombatPhase('showing_rewards');
                        setIsProcessingAction(false); // Enable rewards interaction
                    }, 1500); 
                    return; // Combat ends here, no turn transition
                } else {
                    // --- Enemy survives hit ---
                    setEnemyAnimation('hurt');
                    setCombatState(prev => ({ ...prev, enemyHp: newEnemyHp }));
                    setTimeout(() => {
                        setEnemyAnimation('idle');
                        // --- Decrement buffs & Transition Turn ---
                        decrementPlayerBuffDurations(); 
                        endTurn(true); // Remove argument
                        // --- END ---
                    }, 300); 
                }
            } else {
                 // --- MISS --- 
                 addLog(`${hunterData.name}'s attack missed ${enemyData.name}!`);
                 // --- Decrement buffs & Transition Turn ---
                 decrementPlayerBuffDurations(); 
                 endTurn(true); // Remove argument
                 // --- END ---
            }
        }, 1250); // Animation delay
     };

    // Updated handleSkills
    const handleSkills = async () => { 
        if (isProcessingAction) return;

        if (isSkillMenuOpen) {
            setIsSkillMenuOpen(false);
            return;
        }

        // Close item menu if it's open
        if (isItemMenuOpen) setIsItemMenuOpen(false);

        setIsLoadingSkills(true);
        setIsSkillMenuOpen(true);
        setUsableSkills([]);

        try {
            // --- FIX: Fetch skills based on ACTUAL equipped skills --- 
            // Ensure hunterData has equippedSkills (type is now updated)
            const equippedSkillIds = hunterData.equippedSkills || [];
            console.log("Equipped Skill IDs:", equippedSkillIds);
            
            const fetchedSkills: Skill[] = equippedSkillIds
                .map((id: string) => getSkillById(id))
                .filter((s): s is Skill => s !== undefined); // Filter out undefined results
            // --- END FIX ---

            console.log("Fetched Skills for Menu:", fetchedSkills);
            setUsableSkills(fetchedSkills); 

        } catch (error: any) {
            console.error("Error fetching usable skills:", error);
            toast.error("Error loading skills", { description: error.message });
            setIsSkillMenuOpen(false);
        } finally {
            setIsLoadingSkills(false);
        }
    };

    // Updated handleItems
    const handleItems = async () => { 
        if (isProcessingAction) return;

        // If menu is open, just close it
        if (isItemMenuOpen) {
            setIsItemMenuOpen(false);
            return;
        }

        // Open menu and fetch items
        setIsLoadingItems(true);
        setIsItemMenuOpen(true);
        setConsumableItems([]); // Clear previous items

        try {
            // Fetch full hunter data to get inventory
            // Note: This assumes hunterData passed in might be stale regarding inventory
            const response = await fetch(`/api/hunters/${hunterData.id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch inventory");
            }
            const data = await response.json();
            const currentInventory: InventoryItem[] = data.hunter?.inventory || [];
            
            // Filter for consumables
            const availableConsumables = currentInventory.filter(
                item => item.type === 'Consumable' && item.quantity > 0
            );
            setConsumableItems(availableConsumables);

        } catch (error: any) {
            console.error("Error fetching consumables:", error);
            toast.error("Error loading items", { description: error.message });
            setIsItemMenuOpen(false); // Close menu on error
        } finally {
            setIsLoadingItems(false);
        }
    };

    const handleFlee = () => { 
        if (!playerTurn || combatPhase !== 'fighting' || isProcessingAction) return;
        setIsProcessingAction(true); // Prevent other actions while fleeing
        addLog(`${hunterData.name} attempts to flee...`);

        // Trigger flee animation
        setPlayerAnimation('flee');

        // Wait for flee animation to finish before calling onCombatEnd
        // Values from PlayerSprite.tsx
        const fleeAnimationDuration = 4 * 200; // totalFleeFrames * fleeFrameDuration
        setTimeout(() => {
        toast.success("Successfully fled (simulated)!");
        // Pass final HP & MP on flee
        onCombatResolved('flee', { 
            finalPlayerHp: combatState.playerHp, 
            finalPlayerMp: combatState.playerMp 
        }); 
        }, fleeAnimationDuration + 250); // Wait for animation + LONGER buffer (800 + 250 = 1050ms)
     };

    // Modify handleEnemyTurn to accept stats as parameters
    const handleEnemyTurn = (enemyEffectiveStats: EnemyCombatEntity, playerEffectiveStats: PlayerCombatEntity) => {
        console.log("[handleEnemyTurn]: Start of function execution."); 
        if (combatPhase !== 'fighting') {
            console.log("[handleEnemyTurn]: Exiting because combatPhase is not 'fighting'.");
            return;
        }
        
        // Ensure processing is true
        if (!isProcessingAction) {
            console.warn("[handleEnemyTurn]: Started but isProcessingAction was false. Setting true.");
            setIsProcessingAction(true); 
        }

        // --- Use effective stats PASSED IN as arguments ---
        const effectivePlayerStats_EnemyTurn = playerEffectiveStats; 
        const effectiveEnemyStats_EnemyTurn = enemyEffectiveStats; 
        
        console.log("[handleEnemyTurn]: Using effective stats:", { player: effectivePlayerStats_EnemyTurn, enemy: effectiveEnemyStats_EnemyTurn });

        addLog(`${enemyData.name} attacks...`);
        setEnemyAnimation('attack');
        const enemyAttackDuration = 4 * 300;
        
        setTimeout(() => {
             setEnemyAnimation('idle'); 

            // --- Check for Hit --- 
            if (attackHits(effectiveEnemyStats_EnemyTurn.precision, effectivePlayerStats_EnemyTurn.evasion)) {
                 // --- HIT --- 
                const damageResult: DamageResult = calculateDamage({
                    attacker: {
                        level: enemyData.level,
                        attackPower: effectiveEnemyStats_EnemyTurn.attackPower, 
                        critRate: 5, 
                        critDamage: 1.5, 
                        precision: effectiveEnemyStats_EnemyTurn.precision, 
                        entityCategory: effectiveEnemyStats_EnemyTurn.entityCategory,
                        classOrType: effectiveEnemyStats_EnemyTurn.classOrType,
                    },
                    defender: {
                        level: effectivePlayerStats_EnemyTurn.level, // Use effective level if modified?
                        defense: effectivePlayerStats_EnemyTurn.defense, 
                        isBoss: false, 
                        entityCategory: effectivePlayerStats_EnemyTurn.entityCategory,
                        classOrType: effectivePlayerStats_EnemyTurn.class,
                    },
                    action: {
                        actionPower: 10, 
                    },
                });
                console.log("Enemy Basic Attack Debug (HIT):", damageResult.debug);
                const damageReceived = damageResult.damage;
                 addLog(`${enemyData.name} hits ${hunterData.name} for ${damageReceived} damage! ${damageResult.isCrit ? '(Critical!)' : ''}`);

                 setPlayerIsHit(true);
                 setTimeout(() => setPlayerIsHit(false), 150);

                 let playerDefeated = false; 
                 let finalPlayerHp = 0; 

                 setCombatState(prevState => {
                     finalPlayerHp = Math.max(0, prevState.playerHp - damageReceived); 
                     if (finalPlayerHp === 0) {
                        playerDefeated = true; 
                        return { ...prevState, playerHp: 0 }; 
                     } else {
                        return { ...prevState, playerHp: finalPlayerHp }; 
                     }
                 });

                 if (playerDefeated) {
                    // --- Defeat sequence (no change needed here) ---
                     triggerDefeatSequence(combatState.playerMp); 
                    // Combat ends, no turn transition
                 } else {
                    // --- Decrement debuffs & Transition Turn ---
                     console.log("[handleEnemyTurn - HIT] Enemy turn finished.");
                     decrementEnemyDebuffDurations(); 
                     endTurn(false); // Remove argument
                     // --- END ---
                 }
             } else {
                 // --- MISS --- 
                 addLog(`${enemyData.name}'s attack missed ${hunterData.name}!`);
                 // --- Decrement debuffs & Transition Turn ---
                 console.log("[handleEnemyTurn - MISS] Enemy turn finished.");
                 decrementEnemyDebuffDurations(); 
                 endTurn(false); // Remove argument
                 // --- END ---
             }
        }, enemyAttackDuration + 50); // Delay after animation
    };

    // --- Helper function for defeat sequence ---
    const triggerDefeatSequence = (finalMp: number) => {
        // Ensure phase is set immediately to help prevent race conditions
                setCombatPhase('loss');
        // Ensure actions are disabled
        setPlayerTurn(false); 
        setIsProcessingAction(true); 
        // Wait a bit before calling the callback
             setTimeout(() => {
                toast.error("Defeat!");
                onCombatResolved('loss', { 
                finalPlayerHp: 0, 
                finalPlayerMp: finalMp 
                }); 
                }, 1000); 
    };

    // --- Rewards Popup Handler ---
    const handleVictoryContinue = () => {
        console.log("Victory popup continue clicked. Resolving combat as win.");
        // Pass final HP, MP, EXP, and determined Loot on win confirmation
        onCombatResolved('win', {
            expGained: expGainedThisFight,
            finalPlayerHp: combatState.playerHp,
            finalPlayerMp: combatState.playerMp,
            loot: determinedLoot ?? { droppedItems: [], droppedGold: 0 } 
        });
    };

    // --- Function to handle using an item from the combat menu ---
    const handleUseCombatItem = async (inventoryId: string) => {
        if (!hunterData?.id || isProcessingAction || !playerTurn) return; // Add playerTurn check
        
        console.log(`Combat: Attempting use for item instance ${inventoryId}`);
        setIsProcessingAction(true); // Block other actions
        setIsItemMenuOpen(false); // Close menu immediately

        try {
            const response = await fetch('/api/items/use', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    hunterId: hunterData.id, 
                    inventoryInstanceId: inventoryId, 
                    // Send current client-side HP/MP
                    currentHp: combatState.playerHp, 
                    currentMp: combatState.playerMp,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || `Failed to use item (status: ${response.status})`);
            }

            // Success!
            toast.success(result.message || 'Item used!');
            addLog(result.message || `Used an item.`); // Add to combat log

            // Update combat state (HP/MP) if the API provided updated stats
            if (result.updatedStats) {
                console.log('[CombatInterface] Received updatedStats from item use:', result.updatedStats); 
                setCombatState(prevState => {
                    const newState = {
                    ...prevState,
                    playerHp: result.updatedStats.currentHp ?? prevState.playerHp,
                    playerMp: result.updatedStats.currentMp ?? prevState.playerMp,
                    };
                    console.log('[CombatInterface] Setting new combatState from item use:', newState);
                    return newState;
                });
                // Potentially update base hunterData if needed, or rely on effect calc
                // hunterData.currentHp = result.updatedStats.currentHp; 
                // hunterData.currentMp = result.updatedStats.currentMp; 
            }

            // Apply item effects (like temporary buffs) - TODO: Needs item effect definitions
            // addPlayerEffect(itemEffect); // Example

            // --- Decrement buffs & Transition Turn ---
            decrementPlayerBuffDurations(); 
            endTurn(true); // Remove argument
            // --- END ---

        } catch (err: any) {
            console.error(`Combat use item error (${inventoryId}):`, err);
            toast.error(`Failed to use item: ${err.message}`);
            // Even on failure, the turn likely passes
            // --- Decrement buffs & Transition Turn ---
            decrementPlayerBuffDurations(); 
            endTurn(true); // Remove argument
            // --- END ---
        } 
        // No finally block needed as transition handles setIsProcessingAction(false) for player turn
    };

    // --- Handle Using Skill ---
    const handleUseSkill = async (skillId: string) => {
        const usedSkill = usableSkills.find(s => s.id === skillId);
        if (!playerTurn || combatPhase !== 'fighting' || isProcessingAction || !usedSkill || usedSkill.type !== 'active') return;

        // --- Check Cooldown FIRST ---
        const currentCooldown = skillCooldowns[skillId] || 0;
        if (currentCooldown > 0) {
            addLog(`${usedSkill.name} is on cooldown (${currentCooldown} turn${currentCooldown > 1 ? 's' : ''} left).`);
            toast.warning(`${usedSkill.name} on Cooldown`, { description: `${currentCooldown} turn${currentCooldown > 1 ? 's' : ''} remaining.` });
            return;
        }
        // --- END Cooldown Check ---

        if (!usedSkill.manaCost || combatState.playerMp < usedSkill.manaCost) {
            addLog(`Not enough MP for ${usedSkill.name}.`);
            toast.warning(`Not enough MP`, { description: `Required: ${usedSkill.manaCost}, Have: ${combatState.playerMp}` });
            return; 
        }

        // --- Process Skill Use --- 
        setIsProcessingAction(true);
        setIsSkillMenuOpen(false); 
        const currentMp = combatState.playerMp;
        setCombatState(prev => ({ ...prev, playerMp: prev.playerMp - usedSkill.manaCost! })); 
        addLog(`${hunterData.name} uses ${usedSkill.name}!`);

        // --- Set Cooldown AFTER successful use ---
        if (usedSkill.cooldown && usedSkill.cooldown > 0) {
            const cdrPercentage = currentEffectivePlayerStats.cooldownReduction || 0; // Get CDR, default to 0
            const baseSkillCooldown = usedSkill.cooldown;

            // Calculate the number of turns the player actually has to wait
            // If baseSkillCooldown is 1 and CDR makes it <0.5, it rounds to 0 wait turns (usable next turn).
            const actualWaitTime = Math.max(0, Math.round(baseSkillCooldown * (1 - cdrPercentage)));

            console.log(`[handleUseSkill] Base CD: ${baseSkillCooldown}, CDR: ${cdrPercentage * 100}%, Actual Wait: ${actualWaitTime} turns. Setting stored CD for ${usedSkill.name} (${usedSkill.id})`);
            
            // The value stored is actualWaitTime + 1 because decrementSkillCooldowns runs at the end of the turn sequence.
            // This means if actualWaitTime is 0, it's stored as 1, and becomes available after the current turn's decrement.
             setSkillCooldowns(prevCooldowns => ({
                  ...prevCooldowns, // Keep existing cooldowns
                [skillId]: actualWaitTime + 1 
             })); 
        }
        // --- END Set Cooldown ---

        setPlayerAnimation('attack'); 
        
        // --- Use current effective stats from state ---
        const effectivePlayerStats_Skill = currentEffectivePlayerStats; 
        const effectiveEnemyStats_Skill = currentEffectiveEnemyStats; 

        setTimeout(() => {
            setPlayerAnimation('idle'); 
            let enemyDefeated = false;
            let turnEnded = false; 
            const effects = Array.isArray(usedSkill.effects) ? usedSkill.effects : [usedSkill.effects];

            // Process non-damage effects (Buffs/Heals/Debuffs) - This logic can stay
            // It modifies the *activeEffects* state, which will be used on the *next* turn's calculation
            effects.forEach(effect => {
                 switch (effect.type) {
                    case 'heal':
                        { 
                            const healStat = 'hp'; 
                            const maxVal = hunterData.maxHp;
                            const currentVal = combatState.playerHp;
                            const healAmount = Math.min(maxVal - currentVal, effect.baseAmount);
                            if (healAmount > 0) {
                                setCombatState(prev => ({ ...prev, playerHp: prev.playerHp + healAmount }));
                                addLog(`${usedSkill.name} restores ${healAmount} HP.`);
                            } else {
                                addLog(`${usedSkill.name} has no effect (HP already full).`);
                            }
                        }
                        break;
                    case 'buff':
                        console.log("[handleUseSkill] Processing 'buff' effect:", effect); // <-- Add diagnostic log
                        if (effect.duration && effect.duration > 0) {
                            const newEffect: ActiveEffect = {
                                id: `skill-effect-${nextEffectId}`,
                                sourceId: usedSkill.id,
                                stat: effect.stat,
                                amount: effect.amount,
                                duration: effect.duration,
                            };
                            setPlayerActiveEffects(prev => [...prev, newEffect]);
                            setNextEffectId(prevId => prevId + 1);
                            addLog(`${hunterData.name} gained buff: +${effect.amount} ${effect.stat} for ${effect.duration} turns.`);
                       } else {
                            addLog(`${usedSkill.name} buff has no duration, effect not applied persistently.`);
                        }
                        break;
                    case 'debuff':
                         if (effect.duration && effect.duration > 0) {
                            const newEffect: ActiveEffect = {
                                id: `enemy-effect-${nextEnemyEffectId}`, 
                                sourceId: usedSkill.id,
                                stat: effect.stat,
                                amount: effect.amount, 
                                duration: effect.duration,
                            };
                            setEnemyActiveEffects(prev => [...prev, newEffect]);
                            setNextEnemyEffectId(prevId => prevId + 1);
                            addLog(`${enemyData.name} afflicted with debuff: ${effect.amount} ${effect.stat} for ${effect.duration} turns.`);
                        } else {
                             addLog(`${usedSkill.name} debuff has no duration, effect not applied persistently.`);
                        }
                        break;
                 }
            });

            // --- Process Damage effect (if it exists) using current effective stats ---
            const damageEffect = effects.find(e => e.type === 'damage');
            if (damageEffect) {
                 if (attackHits(effectivePlayerStats_Skill.precision, effectiveEnemyStats_Skill.evasion)) {
                    // --- HIT --- 
                    const damageResult = calculateDamage({
                        attacker: {
                           level: effectivePlayerStats_Skill.level,
                           attackPower: effectivePlayerStats_Skill.attackPower,
                           critRate: effectivePlayerStats_Skill.critRate,
                           critDamage: effectivePlayerStats_Skill.critDamage,
                           precision: effectivePlayerStats_Skill.precision,
                           entityCategory: effectivePlayerStats_Skill.entityCategory,
                           classOrType: effectivePlayerStats_Skill.class,
                        },
                        defender: {
                            level: enemyData.level, 
                            defense: effectiveEnemyStats_Skill.defense,
                            isBoss: enemyData.isBoss,
                            entityCategory: effectiveEnemyStats_Skill.entityCategory,
                            classOrType: effectiveEnemyStats_Skill.classOrType,
                        },
                        action: {
                            actionPower: damageEffect.power || 10, 
                            temporaryCritChanceBonus: effects.find(e => e.type === 'crit_chance_on_hit')?.amount || 0
                        },
                        context: { isBoss: enemyData.isBoss } 
                    });
                    console.log(`Player Skill (${usedSkill.name}) Debug (HIT):`, damageResult.debug);
                    let damageDealt = damageResult.damage;
                    let wasCrit = damageResult.isCrit;
                    addLog(`${usedSkill.name} hits ${enemyData.name} for ${damageDealt} damage! ${wasCrit ? '(Critical!)' : ''}`);
                    const newEnemyHp = Math.max(0, combatState.enemyHp - damageDealt);
                    setEnemyIsHit(true);
                    setTimeout(() => setEnemyIsHit(false), 150);

                    if (newEnemyHp === 0) {
                        // --- Victory sequence (no change needed here) ---
                        addLog(`${enemyData.name} has been defeated!`);
                        setEnemyAnimation('defeat');
                        const calculatedExpGained = Math.max(1, Math.floor(enemyData.baseExpYield * enemyData.level / hunterData.level)); 
                        setExpGainedThisFight(calculatedExpGained);
                        addLog(`${hunterData.name} gained ${calculatedExpGained} EXP!`);
                        setCombatState(prev => ({ ...prev, enemyHp: 0 }));
                        const lootContext = { enemyId: enemyData.id }; 
                        const lootResult = determineLoot(lootContext);
                        setDeterminedLoot(lootResult);
                        setCombatPhase('exp_gaining'); 
                        setTimeout(() => {
                            setCombatPhase('showing_rewards');
                            setIsProcessingAction(false);
                        }, 1500);
                        enemyDefeated = true; 
                        // Combat ends, no turn transition
                    } else {
                        // --- Enemy survives hit ---
                        setEnemyAnimation('hurt');
                        setCombatState(prev => ({ ...prev, enemyHp: newEnemyHp }));
                        setTimeout(() => setEnemyAnimation('idle'), 300);
                        // --- Decrement buffs & Transition Turn ---
                        decrementPlayerBuffDurations();
                        endTurn(true); // Remove argument
                        // --- END ---
                        turnEnded = true;
                    }
                 } else {
                    // --- MISS --- 
                    addLog(`${usedSkill.name} missed ${enemyData.name}!`);
                    // --- Decrement buffs & Transition Turn ---
                    decrementPlayerBuffDurations(); 
                    endTurn(true); // Remove argument
                    // --- END ---
                    turnEnded = true;
                 }
            } 
            
            // --- If skill had NO damage effect, end turn now ---
            if (!damageEffect && !enemyDefeated && !turnEnded) {
                addLog(`${usedSkill.name} has finished casting.`);
                 // --- Decrement buffs & Transition Turn ---
                decrementPlayerBuffDurations(); 
                endTurn(true); // Remove argument
                 // --- END ---
            }

        }, 300); // Short delay before effects resolve
    };

    // Determine if main action buttons should be disabled
    const buttonsDisabled = !playerTurn || combatPhase !== 'fighting' || isProcessingAction || isItemMenuOpen || isSkillMenuOpen; // Add skill menu check

    // --- FIX: Add function to decrement player buff durations ---
    const decrementPlayerBuffDurations = () => {
        console.log("[Decrement Player Buffs]: Checking effects:", playerActiveEffects);
        let changed = false;
        const nextEffects = playerActiveEffects
            .map(effect => {
                const newDuration = effect.duration - 1;
                if (newDuration <= 0) {
                    console.log(`[Decrement Player Buffs]: Effect expired: ${effect.stat} (${effect.sourceId})`);
                    changed = true;
                }
                return { ...effect, duration: newDuration };
            })
            .filter(effect => effect.duration > 0);
        
        if (changed) {
            console.log("[Decrement Player Buffs]: New effects state:", nextEffects);
            setPlayerActiveEffects(nextEffects);
        } else {
            console.log("[Decrement Player Buffs]: No effects expired or changed.");
        }
    };
    // --- END FIX ---

    // --- Add function to decrement ENEMY debuff durations ---
    const decrementEnemyDebuffDurations = () => {
        setEnemyActiveEffects(prevEffects => 
            prevEffects
                .map(effect => ({ ...effect, duration: effect.duration - 1 })) // Decrement duration
                .filter(effect => effect.duration > 0) // Remove expired effects
        );
    };
    // --- END FIX ---

    // --- Add function to decrement SKILL cooldowns (Restored Functional Update) ---
    const decrementSkillCooldowns = () => {
        console.log("[Decrement Skill Cooldowns - Functional]: Checking state before update call.");

        // Use functional update to guarantee atomicity based on latest state
        setSkillCooldowns(prevCooldowns => {
            console.log("[Decrement Skill Cooldowns - Functional]: Processing state:", prevCooldowns);
            const finalNextCooldowns: { [skillId: string]: number } = {};
            let actuallyChanged = false;
            for (const skillId in prevCooldowns) {
                const remaining = prevCooldowns[skillId];
                if (remaining > 1) {
                    finalNextCooldowns[skillId] = remaining - 1;
                    actuallyChanged = true;
                } else {
                     console.log(`[Decrement Skill Cooldowns - Functional]: Cooldown ended for ${skillId}`);
                     actuallyChanged = true; 
                }
            }
            
            if (actuallyChanged) {
                 console.log("[Decrement Skill Cooldowns - Functional]: New state determined:", finalNextCooldowns);
                 return finalNextCooldowns;
            } else {
                 console.log("[Decrement Skill Cooldowns - Functional]: No change needed based on latest state.");
                 return prevCooldowns; // Return previous state if no changes occurred
            }
        });
    };
    // --- END ---

    return (
        // Main container
        <div 
            className="h-full w-full text-text-primary relative overflow-hidden p-4"
            style={{
                backgroundImage: "url('/images/backgrounds/dungeon.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* Semi-transparent white overlay to brighten background */}
            <div className="absolute inset-0 bg-white/10 z-0"></div>
            
            {/* Enemy Info Box (Top Right Corner) */}
            <div className="absolute top-2 right-2 w-48 p-1 md:top-4 md:right-4 md:w-64 md:p-2 bg-background-secondary rounded-md shadow-md border border-border-accent z-20">
                <div className="flex justify-between items-center mb-0.5 md:mb-1">
                    <span className="font-semibold text-sm md:text-base uppercase text-text-primary">{enemyData.name}</span>
                    <span className="text-xs md:text-sm text-text-secondary">Lv.{enemyData.level}</span>
                </div>
                <Progress 
                    value={(combatState.enemyHp / enemyData.maxHp) * 100}
                    className="h-2 w-full bg-neutral-700 border border-border [&>div]:bg-green-600" 
                    aria-label={`${enemyData.name} HP`} 
                />
            </div>

             {/* Enemy Sprite - Pass isHit prop */}
             <div> 
                 <EnemySprite animationState={enemyAnimation} flip={true} isHit={enemyIsHit} />
             </div>

            {/* Player Info Box (Bottom Left Corner, raised slightly) */}
            <div className="absolute bottom-20 left-2 w-48 p-1 md:bottom-16 md:left-4 md:w-64 md:p-2 bg-background-secondary rounded-md shadow-md border border-border-accent z-20">
                 {/* Name & Level */}
                 <div className="flex justify-between items-center mb-0.5 md:mb-1">
                    <span className="font-semibold text-sm md:text-base uppercase text-text-primary">{hunterData.name}</span>
                    <span className="text-xs md:text-sm text-text-secondary">Lv.{hunterData.level}</span>
                 </div>
                 {/* HP Bar & Text */}
                 <Progress 
                    value={(combatState.playerHp / hunterData.maxHp) * 100}
                    className="h-2 w-full bg-neutral-700 border border-border mb-0.5 [&>div]:bg-green-600"
                    aria-label={`${hunterData.name} HP`} 
                 />
                 <div className="text-[10px] md:text-xs text-text-secondary mt-0 text-right mb-1 md:mb-1.5">
                     {combatState.playerHp} / {hunterData.maxHp}
                 </div>
                 {/* MP Bar & Text */}
                 <Progress 
                    value={(combatState.playerMp / hunterData.maxMp) * 100}
                    className="h-2 w-full bg-neutral-700 border border-border mb-0.5 [&>div]:bg-blue-500"
                    aria-label={`${hunterData.name} MP`} 
                 />
                 <div className="text-[10px] md:text-xs text-text-secondary mt-0 text-right">
                     {combatState.playerMp} / {hunterData.maxMp}
                 </div>
            </div>

            {/* Separate Container for EXP Bar - Positioned directly below the main info box */}
            <div className="absolute bottom-[74px] left-2 w-48 md:bottom-[58px] md:left-4 md:w-64 z-20 px-1 md:px-2"> 
                 <Progress 
                    value={hunterData.expToNextLevel > 0 ? (hunterData.expProgressInCurrentLevel / hunterData.expToNextLevel) * 100 : 0} // Handle division by zero
                    // Remove top border by specifying only bottom, left, right borders
                    className="h-1.5 w-full bg-neutral-700 border-b border-l border-r border-border [&>div]:bg-sky-400" 
                    aria-label={`${hunterData.name} EXP`} 
                 />
            </div>

             {/* Player Sprite Wrapper - Pass isHit prop */}
            <div> 
                 <PlayerSprite animationState={playerAnimation} isHit={playerIsHit} />
            </div>

            {/* Message Log - Moved outside action menu block, always centered except during rewards */}
            {combatPhase !== 'showing_rewards' && (
                <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-1 text-sm text-white rounded text-center pointer-events-auto z-30" // Added z-30
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }} 
                >
                    {messageLog.map((msg, index) => (
                        <p key={index} className="mb-1 leading-tight">{msg}</p> 
                    ))}
                </div>
            )}

            {/* Conditionally Render Action Menu OR Item Menu OR Skill Menu */}
            {!isItemMenuOpen && !isSkillMenuOpen && combatPhase !== 'showing_rewards' && (
                 // Container ONLY for Action Buttons now
                 <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2 md:bottom-4 md:left-auto md:right-4 md:w-48 md:flex-col md:justify-start pointer-events-auto z-30"> {/* Added z-30 */} 
                    {/* Message Log REMOVED from here */}
                    {/* Action Buttons ... */}
                    <Button className="flex-1 md:w-full justify-center px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm" variant="outline" onClick={handleAttack} disabled={buttonsDisabled}>
                            <Swords className="mr-1 h-4 w-4 md:mr-2" /> Fight
                        </Button>
                        <Button className="flex-1 md:w-full justify-center px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm" variant="outline" onClick={handleItems} disabled={buttonsDisabled || isProcessingAction}>
                            <ShoppingBag className="mr-1 h-4 w-4 md:mr-2" /> Item 
                        </Button>
                        <Button className="flex-1 md:w-full justify-center px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm" variant="outline" onClick={handleSkills} disabled={buttonsDisabled || isProcessingAction}>
                             <Sparkles className="mr-1 h-4 w-4 md:mr-2" /> Skills 
                        </Button>
                        <Button className="flex-1 md:w-full justify-center px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm text-destructive" variant="outline" onClick={handleFlee} disabled={buttonsDisabled}>
                            <DoorOpen className="mr-1 h-4 w-4 md:mr-2" /> Flee 
                        </Button>
                 </div>
            )}

            {/* Item Selection Menu */}
            {isItemMenuOpen && (
                <div className="absolute bottom-2 left-2 right-2 flex flex-col justify-end gap-2 md:bottom-4 md:left-auto md:right-4 md:w-48 md:justify-start pointer-events-auto z-30">
                    {/* Scrollable container - remove pr-1 */}
                    <div className="flex flex-col-reverse md:flex-col gap-2 overflow-y-auto max-h-40"> 
                        {isLoadingItems ? (
                            <p className="text-xs text-center text-text-secondary italic p-2">Loading items...</p>
                        ) : consumableItems.length > 0 ? (
                            consumableItems.map(item => (
                                <Button 
                                    key={item.inventoryId}
                                    variant="outline" 
                                    className="w-full justify-center text-xs md:text-sm px-2 py-1 md:px-3 md:py-2 whitespace-nowrap overflow-hidden text-ellipsis"
                                    onClick={() => handleUseCombatItem(item.inventoryId)}
                                    disabled={isProcessingAction} 
                                >
                                    {item.name} (x{item.quantity})
                                </Button>
                            ))
                        ) : (
                            <p className="text-xs text-center text-text-secondary italic p-2">No consumable items.</p>
                        )}
                    </div>
                     {/* Back Button */}
                    <Button 
                        variant="outline" 
                        className="w-full justify-center text-xs md:text-sm px-2 py-1 md:px-3 md:py-2 text-destructive" 
                        onClick={() => setIsItemMenuOpen(false)} 
                        disabled={isLoadingItems || isProcessingAction}
                    >
                         &larr; Back 
                    </Button>
                </div>
            )}

             {/* Skill Selection Menu */}
            {isSkillMenuOpen && (
                <>
                    {/* Use helper component to log state when menu renders */}
                    <DebugLogProps data={skillCooldowns} label="Skill Menu" />
                    <div className="absolute bottom-2 left-2 right-2 flex flex-col justify-end gap-2 md:bottom-4 md:left-auto md:right-4 md:w-48 md:justify-start pointer-events-auto z-30">
                        {/* Scrollable container for skill buttons */}
                        <div className="flex flex-col-reverse md:flex-col gap-2 overflow-y-auto max-h-40"> 
                            {isLoadingSkills ? (
                                <p className="text-xs text-center text-text-secondary italic p-2">Loading skills...</p>
                            ) : usableSkills.length > 0 ? (
                                usableSkills.map(skill => {
                                    const remainingCooldown = skillCooldowns[skill.id] || 0;
                                    const hasEnoughMp = combatState.playerMp >= (skill.manaCost ?? 0);
                                    const isOnCooldown = remainingCooldown > 0;
                                    const isDisabled = isProcessingAction || !hasEnoughMp || isOnCooldown;

                                    return (
                                        <Button 
                                            key={skill.id}
                                            variant="outline" 
                                            className="w-full justify-between text-xs md:text-sm px-2 py-1 md:px-3 md:py-2 whitespace-nowrap overflow-hidden text-ellipsis disabled:opacity-50"
                                            onClick={() => handleUseSkill(skill.id)}
                                            disabled={isDisabled} 
                                            title={`${skill.name}${skill.manaCost ? ` - Cost: ${skill.manaCost} MP` : ''}${isOnCooldown ? ` - CD: ${remainingCooldown}` : ''}`}
                                        >
                                            <span className="truncate">{skill.name}</span> 
                                            {/* Show MP cost OR Cooldown remaining */}
                                            {isOnCooldown ? (
                                                <span className="ml-2 text-yellow-400 shrink-0">CD: {remainingCooldown}</span>
                                            ) : skill.manaCost ? (
                                                <span className={`ml-2 shrink-0 ${hasEnoughMp ? 'text-blue-400' : 'text-red-500'}`}>{skill.manaCost} MP</span>
                                            ) : null}
                                        </Button>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-center text-text-secondary italic p-2">No skills equipped or available.</p>
                            )}
                        </div>
                         {/* Back Button */}
                        <Button 
                            variant="outline" 
                            className="w-full justify-center text-xs md:text-sm px-2 py-1 md:px-3 md:py-2 text-destructive" 
                            onClick={() => setIsSkillMenuOpen(false)} 
                            disabled={isLoadingSkills || isProcessingAction}
                        >
                             &larr; Back 
                        </Button>
                    </div>
                </>
            )}

            {/* Victory Popup */}
            {combatPhase === 'showing_rewards' && determinedLoot && (
                <VictoryRewardsPopup 
                    expGained={expGainedThisFight}
                    // Pass determined loot to the popup
                    goldGained={determinedLoot.droppedGold}
                    itemsDropped={determinedLoot.droppedItems}
                    onContinue={handleVictoryContinue}
                />
            )}     
        </div>
    );
}