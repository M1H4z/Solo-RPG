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
}

interface CombatInterfaceProps {
    gateId: string;
    hunterData: PlayerCombatEntity; // Use specific type
    enemyData: EnemyCombatEntity;   // Use specific type
    onCombatEnd: (result: 'win' | 'loss' | 'flee') => void;
}

// State to hold mutable combat values
interface CombatState {
    playerHp: number;
    enemyHp: number;
    playerExp: number;
}

// New state for combat phases
type CombatPhase = 'fighting' | 'exp_gaining' | 'showing_rewards' | 'loss';

export default function CombatInterface({ 
    gateId, 
    hunterData, 
    enemyData, 
    onCombatEnd 
}: CombatInterfaceProps) {
    // --- Component State ---
    const [messageLog, setMessageLog] = useState<string[]>([`A wild ${enemyData.name} appeared!`]);
    const [playerTurn, setPlayerTurn] = useState(true); 
    const [combatState, setCombatState] = useState<CombatState>({
        playerHp: hunterData.currentHp,
        enemyHp: enemyData.currentHp,
        playerExp: hunterData.currentExp
    });
    const [combatPhase, setCombatPhase] = useState<CombatPhase>('fighting'); // Added phase state
    const [expGainedThisFight, setExpGainedThisFight] = useState<number>(0); // Store calculated EXP gain
    const [playerAnimation, setPlayerAnimation] = useState<PlayerAnimationState>('idle'); // Add animation state
    const [enemyAnimation, setEnemyAnimation] = useState<EnemyAnimationState>('idle'); // Add enemy animation state
    const [isProcessingAction, setIsProcessingAction] = useState(false); // Prevent spamming actions
    const [playerIsHit, setPlayerIsHit] = useState(false); // Add player hit state
    const [enemyIsHit, setEnemyIsHit] = useState(false);   // Add enemy hit state
    // ---------------------

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

        // Trigger attack animation (includes movement)
        setPlayerAnimation('attack');
        
        // Wait for animation (frames only now) to finish before calculating damage
        setTimeout(() => {
            // Reset animation state back to idle *after* sequence completes visually
            setPlayerAnimation('idle');
            
            const damageDealt = Math.max(0, hunterData.attackPower - enemyData.defense);
            addLog(`${hunterData.name} attacks ${enemyData.name} for ${damageDealt} damage!`);

            const newEnemyHp = Math.max(0, combatState.enemyHp - damageDealt);

            // Trigger enemy hit flash
            setEnemyIsHit(true);
            setTimeout(() => setEnemyIsHit(false), 150); // Flash duration

            if (newEnemyHp === 0) {
                // --- Victory --- 
                addLog(`${enemyData.name} has been defeated!`);
                setEnemyAnimation('defeat'); // Trigger defeat animation
                
                const calculatedExpGained = Math.max(1, Math.floor(enemyData.baseExpYield * enemyData.level / hunterData.level)); 
                const finalPlayerExp = combatState.playerExp + calculatedExpGained;
                setExpGainedThisFight(calculatedExpGained);
                addLog(`${hunterData.name} gained ${calculatedExpGained} EXP!`);
                
                setCombatState(prev => ({ 
                    ...prev, 
                    enemyHp: 0,
                    playerExp: finalPlayerExp
                }));
                setCombatPhase('exp_gaining'); 

                setTimeout(() => {
                    setCombatPhase('showing_rewards');
                    setIsProcessingAction(false); 
                }, 3000);
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

    const handleSkills = () => { 
        if (isProcessingAction) return;
        toast.info("Skills not implemented."); 
    };
    const handleItems = () => { 
        if (isProcessingAction) return;
        toast.info("Items not implemented."); 
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
            onCombatEnd('flee');
            // No need to setIsProcessingAction(false) as component unmounts
        }, fleeAnimationDuration + 250); // Wait for animation + LONGER buffer (800 + 250 = 1050ms)
     };

    const handleEnemyTurn = () => {
        if (combatPhase !== 'fighting') {
            setIsProcessingAction(false); 
            return;
        }
        
        const damageReceived = Math.max(0, enemyData.attackPower - hunterData.defense);
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
                    onCombatEnd('loss'); 
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
        console.log("Continuing after victory...");
        toast.success("Victory!"); 
        onCombatEnd('win');
    };

    // --- Determine if buttons should be disabled --- 
    const buttonsDisabled = !playerTurn || combatPhase !== 'fighting' || isProcessingAction;

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
                    className="h-2 w-full bg-neutral-700 border border-border" 
                    aria-label={`${enemyData.name} HP`} 
                />
            </div>

             {/* Enemy Sprite - Pass isHit prop */}
             <div> 
                 <EnemySprite animationState={enemyAnimation} flip={true} isHit={enemyIsHit} />
             </div>

            {/* Player Info Box (Bottom Left Corner, raised slightly) */}
            <div className="absolute bottom-20 left-2 w-48 p-1 md:bottom-16 md:left-4 md:w-64 md:p-2 bg-background-secondary rounded-md shadow-md border border-border-accent z-20">
                 <div className="flex justify-between items-center mb-0.5 md:mb-1">
                    <span className="font-semibold text-sm md:text-base uppercase text-text-primary">{hunterData.name}</span>
                    <span className="text-xs md:text-sm text-text-secondary">Lv.{hunterData.level}</span>
                 </div>
                 <Progress 
                    value={(combatState.playerHp / hunterData.maxHp) * 100}
                    className="h-2 w-full bg-neutral-700 border border-border mb-1"
                    aria-label={`${hunterData.name} HP`} 
                 />
                 <div className="text-[10px] md:text-xs text-text-secondary mt-0.5 md:mt-1 text-right mb-1 md:mb-2">
                     {combatState.playerHp} / {hunterData.maxHp}
                 </div>
                 <Progress 
                    value={(combatState.playerExp / hunterData.expToNextLevel) * 100}
                    className="h-1.5 w-full bg-neutral-700 border border-border transition-transform duration-3000 ease-linear"
                    aria-label={`${hunterData.name} EXP`} 
                 />
            </div>

             {/* Player Sprite Wrapper - Pass isHit prop */}
            <div> 
                 <PlayerSprite animationState={playerAnimation} isHit={playerIsHit} />
            </div>

            {/* Conditionally Render Main UI vs Rewards */}
            {combatPhase !== 'showing_rewards' && (
                // Make wrapper fill the area for correct absolute positioning of children
                <div className="absolute inset-0 z-30 pointer-events-none"> 
                    {/* Message Log - Centered, transparent, max 2 lines */}
                    <div 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-1 text-sm text-white rounded text-center pointer-events-auto"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }} 
                    >
                        {messageLog.map((msg, index) => (
                            <p key={index} className="mb-1 leading-tight">{msg}</p> 
                        ))}
                    </div>

                    {/* Action Menu - Responsive Layout */}
                    {/* Mobile: Horizontal row at bottom */}
                    {/* md+: Vertical stack bottom-right */}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2 md:bottom-4 md:left-auto md:right-4 md:w-48 md:flex-col md:justify-start pointer-events-auto">
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
                </div>
            )}

            {/* Conditionally Render Victory Popup - Remove wrapper div */}
            {combatPhase === 'showing_rewards' && (
                <VictoryRewardsPopup 
                    expGained={expGainedThisFight}
                    // goldGained={...} // TODO: Pass real data later
                    // itemsDropped={...} // TODO: Pass real data later
                    onContinue={handleVictoryContinue}
                />
            )}
             
        </div>
    );
}