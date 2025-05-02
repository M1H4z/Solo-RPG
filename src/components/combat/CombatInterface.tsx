"use client";

import React, { useState } from 'react';
import Image from 'next/image'; // Re-add Image import to potentially resolve linter issue
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Swords, ShoppingBag, Sparkles, DoorOpen, Star } from 'lucide-react'; 
import VictoryRewardsPopup from './VictoryRewardsPopup';
import PlayerSprite, { PlayerAnimationState } from './PlayerSprite'; // Import PlayerSprite
import EnemySprite, { EnemyAnimationState } from './EnemySprite'; // Import EnemySprite
import { calculateDamage } from '@/lib/combat/damageCalculator'; // <-- Import the calculator
import { determineLoot, LootResult } from '@/lib/game/lootService'; // Import loot service
import { LootDrop } from '@/constants/lootTables.constants'; // Import type
import { InventoryItem } from '@/types/item.types'; // Import InventoryItem type

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

export default function CombatInterface({ 
    gateId, 
    hunterData, 
    enemyData, 
    onCombatResolved 
}: CombatInterfaceProps) {
    // --- Component State ---
    const [messageLog, setMessageLog] = useState<string[]>([`A wild ${enemyData.name} appeared!`]);
    const [playerTurn, setPlayerTurn] = useState(true); 
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

    // --- State for Item Menu ---
    const [isItemMenuOpen, setIsItemMenuOpen] = useState(false);
    const [consumableItems, setConsumableItems] = useState<InventoryItem[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    
    // --- State for Skill Menu ---
    const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
    const [usableSkills, setUsableSkills] = useState<CombatSkillInfo[]>([]);
    const [isLoadingSkills, setIsLoadingSkills] = useState(false);
    // ---------------------------

    const addLog = (message: string) => {
        if (combatPhase === 'fighting' || combatPhase === 'exp_gaining') { 
             // Keep only the new message
             setMessageLog([message]); 
        }
    };

    // --- Combat Actions ---
    const handleAttack = () => { 
        if (!playerTurn || combatPhase !== 'fighting' || isProcessingAction) return;
        setIsProcessingAction(true);
        setPlayerAnimation('attack');

        setTimeout(() => {
            setPlayerAnimation('idle');

            // Use the new damage calculator for player attack
            const damageDealt = calculateDamage({
                attacker: {
                    level: hunterData.level,
                    attackPower: hunterData.attackPower,
                    // Use derived stats from props
                    critRate: hunterData.critRate,
                    critDamage: hunterData.critDamage,
                    precision: hunterData.precision,
                },
                defender: {
                    defense: enemyData.defense,
                },
                action: {
                    actionPower: 10, // Placeholder power for basic attack
                },
            });

            addLog(`${hunterData.name} attacks ${enemyData.name} for ${damageDealt} damage!`);
            const newEnemyHp = Math.max(0, combatState.enemyHp - damageDealt);
            setEnemyIsHit(true);
            setTimeout(() => setEnemyIsHit(false), 150);

            if (newEnemyHp === 0) {
                // --- Victory --- 
                addLog(`${enemyData.name} has been defeated!`);
                    setEnemyAnimation('defeat'); // Trigger defeat animation
                
                const calculatedExpGained = Math.max(1, Math.floor(enemyData.baseExpYield * enemyData.level / hunterData.level)); 
                setExpGainedThisFight(calculatedExpGained);
                addLog(`${hunterData.name} gained ${calculatedExpGained} EXP!`);
                
                setCombatState(prev => ({ 
                    ...prev, 
                    enemyHp: 0
                }));

                // --- Determine Loot --- 
                const lootContext = { enemyId: enemyData.id }; // Basic context for now
                const lootResult = determineLoot(lootContext);
                setDeterminedLoot(lootResult); // Store for popup display
                console.log("Determined Loot:", lootResult);
                // --- End Determine Loot ---
                
                setCombatPhase('exp_gaining'); 

                setTimeout(() => {
                    setCombatPhase('showing_rewards');
                    setIsProcessingAction(false); // Allow interaction with rewards popup
                }, 1500); // Shortened delay before showing rewards popup (adjust as needed)
                return; 
            } else {
                 // Enemy survives - Trigger hurt animation
                 setEnemyAnimation('hurt');
             setCombatState(prev => ({ ...prev, enemyHp: newEnemyHp }));
             setPlayerTurn(false);
                 // Reset enemy animation back to idle after hurt duration
                 setTimeout(() => {
                    setEnemyAnimation('idle');
                    // Then start enemy turn
                    setTimeout(handleEnemyTurn, 1000); // Start enemy turn after hurt+delay
                 }, 300); // Match HURT_DURATION_MS in EnemySprite
            }
        }, 1250); // Wait slightly longer than new animation (4 * 300ms = 1200ms)
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
            // TODO: Replace with actual fetching of skill details based on hunterData.equippedSkills
            console.log("Simulating fetch for equipped skills...");
            // Assuming hunterData has hunterData.equippedSkills = ['skill_basic_slash', 'skill_fireball']
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
            
            // Placeholder data - replace with actual fetched data
            const fetchedSkills: CombatSkillInfo[] = [
                { id: 'skill_basic_slash', name: 'Basic Slash', mpCost: 5 },
                { id: 'skill_fireball', name: 'Fireball', mpCost: 15 },
                // Add more skills the player might have equipped
            ]; 
            
            // Filter based on actual equipped skills if needed (or assume API does it)
            // const equippedSkillIds = hunterData.equippedSkills || []; 
            // const skillsToDisplay = fetchedSkills.filter(s => equippedSkillIds.includes(s.id));

            setUsableSkills(fetchedSkills); // Using placeholder directly for now

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

    const handleEnemyTurn = () => {
        if (combatPhase !== 'fighting') {
            setIsProcessingAction(false); 
            return;
        }
        
        // Use the new damage calculator for enemy attack
        const damageReceived = calculateDamage({
            attacker: {
                level: enemyData.level,
                attackPower: enemyData.attackPower,
                critRate: 5, // Placeholder for enemy crit rate
                critDamage: 1.5, // Placeholder for enemy crit damage
                precision: 0, // Placeholder for enemy precision
            },
            defender: {
                defense: hunterData.defense,
            },
            action: {
                actionPower: 10, // Placeholder power for basic attack
            },
        });

        addLog(`${enemyData.name} attacks ${hunterData.name} for ${damageReceived} damage!`);

        setEnemyAnimation('attack');
        
        // Calculate the new HP but DON'T update state yet
        const newPlayerHp = Math.max(0, combatState.playerHp - damageReceived);

        // Wait for enemy attack animation to finish
        const enemyAttackDuration = 4 * 300; // totalAttackFrames * ATTACK_FRAME_DURATION_MS
        setTimeout(() => {
             setEnemyAnimation('idle'); // Reset enemy animation

             // Trigger player hit flash
             setPlayerIsHit(true);
             setTimeout(() => setPlayerIsHit(false), 150); // Flash duration

             // Update player HP state NOW, after animation
        setCombatState(prev => ({ ...prev, playerHp: newPlayerHp }));

        if (newPlayerHp === 0) {
            // --- Defeat --- 
            addLog(`${hunterData.name} has been defeated!`);
                setCombatPhase('loss');
             setTimeout(() => {
                toast.error("Defeat!");
                // Pass final HP (0) & MP on loss
                onCombatResolved('loss', { 
                    finalPlayerHp: newPlayerHp, 
                    finalPlayerMp: combatState.playerMp // MP doesn't change on taking damage
                }); 
                }, 1000); 
            return; 
        }
            // If not defeated, allow player turn
        setPlayerTurn(true);
            setIsProcessingAction(false); // Re-enable player actions
        }, enemyAttackDuration + 50); // Wait for animation + small buffer (1200 + 50 = 1250ms)
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
        if (!hunterData?.id) return;
        
        console.log(`Combat: Attempting use for item instance ${inventoryId}`);
        setIsProcessingAction(true); // Block other actions
        setIsItemMenuOpen(false); // Close menu immediately

        try {
            const response = await fetch('/api/items/use', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hunterId: hunterData.id, inventoryInstanceId: inventoryId }),
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
                setCombatState(prevState => ({
                    ...prevState,
                    playerHp: result.updatedStats.currentHp,
                    playerMp: result.updatedStats.currentMp,
                }));
            }

            // Item used successfully, now it's enemy's turn
            setPlayerTurn(false);
            setTimeout(handleEnemyTurn, 1000); // Delay before enemy turn

        } catch (err: any) {
            console.error(`Combat use item error (${inventoryId}):`, err);
            toast.error(`Failed to use item: ${err.message}`);
            // Should we re-open the item menu on failure? Maybe not.
            // Player turn might still pass depending on game rules.
            // For now, just log error and allow player to act again (or enemy turn if applicable)
             setPlayerTurn(false); // Assume turn passes even on fail? TBD rule.
             setTimeout(handleEnemyTurn, 1000);
        } finally {
            setIsProcessingAction(false); // Re-enable actions
        }
    };

    // --- Placeholder for handleUseSkill --- 
    const handleUseSkill = async (skillId: string) => {
        const skill = usableSkills.find(s => s.id === skillId);
        if (!skill || !hunterData?.id) return;

        if (combatState.playerMp < skill.mpCost) {
            toast.error("Not enough MP!", { id: 'mp-error' });
            return;
        }

        console.log(`Combat: Attempting use for skill ${skill.name} (${skillId})`);
        toast.info(`Using ${skill.name}... (WIP - No damage/effect yet)`);
        
        setIsProcessingAction(true);
        setIsSkillMenuOpen(false);

        // TODO: Implement skill animation trigger
        // setPlayerAnimation('skill_cast');

        // TODO: Calculate MP cost
        const newMp = combatState.playerMp - skill.mpCost;
        setCombatState(prev => ({ ...prev, playerMp: newMp }));
        console.log(`MP reduced to ${newMp}`);

        // TODO: Calculate damage using skill power
        // const damageDealt = calculateDamage({ ..., action: { skillPower: skill.power } });
        // addLog(`${hunterData.name} uses ${skill.name}!`); 
        // Apply damage, check enemy HP, etc.

        // Simulate action time & trigger enemy turn (for now)
        await new Promise(resolve => setTimeout(resolve, 1000)); 

        setPlayerTurn(false);
        setIsProcessingAction(false);
        setTimeout(handleEnemyTurn, 500); 
    };
    // ----------------------------------------

    // Determine if main action buttons should be disabled
    const buttonsDisabled = !playerTurn || combatPhase !== 'fighting' || isProcessingAction || isItemMenuOpen || isSkillMenuOpen; // Add skill menu check

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
                    className="h-2 w-full bg-neutral-700 border border-border mb-0.5"
                    aria-label={`${hunterData.name} MP`} 
                 />
                 <div className="text-[10px] md:text-xs text-text-secondary mt-0 text-right">
                     {combatState.playerMp} / {hunterData.maxMp}
                 </div>
            </div>

            {/* Separate Container for EXP Bar - Positioned directly below the main info box */}
            <div className="absolute bottom-[74px] left-2 w-48 md:bottom-[58px] md:left-4 md:w-64 z-20 px-1 md:px-2"> 
                 <Progress 
                    value={(hunterData.expProgressInCurrentLevel / hunterData.expToNextLevel) * 100}
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
                <div className="absolute bottom-2 left-2 right-2 flex flex-col justify-end gap-2 md:bottom-4 md:left-auto md:right-4 md:w-48 md:justify-start pointer-events-auto">
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
                <div className="absolute bottom-2 left-2 right-2 flex flex-col justify-end gap-2 md:bottom-4 md:left-auto md:right-4 md:w-48 md:justify-start pointer-events-auto">
                    {/* Scrollable container for skill buttons */}
                    <div className="flex flex-col-reverse md:flex-col gap-2 overflow-y-auto max-h-40"> 
                        {isLoadingSkills ? (
                            <p className="text-xs text-center text-text-secondary italic p-2">Loading skills...</p>
                        ) : usableSkills.length > 0 ? (
                            usableSkills.map(skill => (
                                <Button 
                                    key={skill.id}
                                    variant="outline" 
                                    className="w-full justify-between text-xs md:text-sm px-2 py-1 md:px-3 md:py-2 whitespace-nowrap overflow-hidden text-ellipsis" // Use justify-between for MP cost
                                    onClick={() => handleUseSkill(skill.id)}
                                    disabled={isProcessingAction || combatState.playerMp < skill.mpCost} // Also disable if not enough MP
                                    title={`${skill.name} - Cost: ${skill.mpCost} MP`}
                                >
                                    <span className="truncate">{skill.name}</span> 
                                    <span className="ml-2 text-blue-400 shrink-0">{skill.mpCost} MP</span>
                                </Button>
                            ))
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