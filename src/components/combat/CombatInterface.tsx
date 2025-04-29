"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
// Updated Icon Imports (Using DoorOpen for Flee)
import { Swords, ShoppingBag, Sparkles, DoorOpen, Star } from 'lucide-react'; 
import VictoryRewardsPopup from './VictoryRewardsPopup'; // Import the popup

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
    // ---------------------

    const addLog = (message: string) => {
        // Only add logs during the fighting phase? Or allow during EXP gain?
        if (combatPhase === 'fighting' || combatPhase === 'exp_gaining') { 
             setMessageLog(prev => [message, ...prev.slice(0, 4)]);
        }
    };

    // --- Combat Actions ---
    const handleAttack = () => { 
        if (!playerTurn || combatPhase !== 'fighting') return; // Only allow during fighting phase
        
        const damageDealt = Math.max(0, hunterData.attackPower - enemyData.defense);
        addLog(`${hunterData.name} attacks ${enemyData.name} for ${damageDealt} damage!`);

        const newEnemyHp = Math.max(0, combatState.enemyHp - damageDealt);

        if (newEnemyHp === 0) {
            // --- Victory --- 
            addLog(`${enemyData.name} has been defeated!`);
            
            const calculatedExpGained = Math.max(1, Math.floor(enemyData.baseExpYield * enemyData.level / hunterData.level)); 
            const finalPlayerExp = combatState.playerExp + calculatedExpGained;
            setExpGainedThisFight(calculatedExpGained); // Store for rewards popup
            addLog(`${hunterData.name} gained ${calculatedExpGained} EXP!`);
            
            // Update state FIRST (triggers EXP bar animation via CSS)
            setCombatState(prev => ({ 
                ...prev, 
                enemyHp: 0,
                playerExp: finalPlayerExp
            }));
            // Change phase to allow animation to run
            setCombatPhase('exp_gaining'); 

            // Set timer for popup to match animation duration
            setTimeout(() => {
                setCombatPhase('showing_rewards');
            }, 3000); // Set delay to 3 seconds
            return; 
        } else {
             // Enemy survives
             setCombatState(prev => ({ ...prev, enemyHp: newEnemyHp }));
             setPlayerTurn(false);
             setTimeout(handleEnemyTurn, 1000); 
        }
     };

    const handleSkills = () => { toast.info("Skills not implemented."); };
    const handleItems = () => { toast.info("Items not implemented."); };

    const handleFlee = () => { 
        if (!playerTurn || combatPhase !== 'fighting') return;
        addLog(`${hunterData.name} attempts to flee...`);
        toast.success("Successfully fled (simulated)!");
        onCombatEnd('flee');
     };

    const handleEnemyTurn = () => {
        // Ensure enemy turn doesn't proceed if not in fighting phase (e.g., player won)
        if (combatPhase !== 'fighting') return;
        
        const damageReceived = Math.max(0, enemyData.attackPower - hunterData.defense);
        addLog(`${enemyData.name} attacks ${hunterData.name} for ${damageReceived} damage!`);

        const newPlayerHp = Math.max(0, combatState.playerHp - damageReceived);
        setCombatState(prev => ({ ...prev, playerHp: newPlayerHp }));

        if (newPlayerHp === 0) {
            // --- Defeat --- 
            addLog(`${hunterData.name} has been defeated!`);
            setCombatPhase('loss'); // Set loss phase
             setTimeout(() => {
                toast.error("Defeat!"); 
                onCombatEnd('loss'); // Exit combat after delay
            }, 500); 
            return; 
        }
        setPlayerTurn(true);
    };

    // --- Rewards Popup Handler ---
    const handleVictoryContinue = () => {
        console.log("Continuing after victory...");
        toast.success("Victory!"); 
        onCombatEnd('win');
    };

    return (
        // Main container
        <div className="h-full w-full bg-background text-text-primary relative overflow-hidden p-4">
            
            {/* Enemy Info Box (Top Right Corner) */}
            <div className="absolute top-4 right-4 w-64 bg-background-secondary p-2 rounded-md shadow-md border border-border-accent z-20">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-base uppercase text-text-primary">{enemyData.name}</span>
                    <span className="text-sm text-text-secondary">Lv.{enemyData.level}</span>
                </div>
                <Progress 
                    value={(combatState.enemyHp / enemyData.maxHp) * 100}
                    className="h-2 w-full bg-neutral-700 border border-border" 
                    aria-label={`${enemyData.name} HP`} 
                />
            </div>

             {/* Enemy Sprite Placeholder (Top Center-Right Area) */}
             <div className="absolute top-20 right-[23%] h-28 w-28 bg-neutral-700 border-2 border-border rounded-md flex items-center justify-center text-4xl font-bold z-10 shadow-lg">
                 E
             </div>

            {/* Player Info Box (Bottom Left Corner, raised slightly) */}
            <div className="absolute bottom-16 left-4 w-64 bg-background-secondary p-2 rounded-md shadow-md border border-border-accent z-20">
                 <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-base uppercase text-text-primary">{hunterData.name}</span>
                    <span className="text-sm text-text-secondary">Lv.{hunterData.level}</span>
                 </div>
                 <Progress 
                    value={(combatState.playerHp / hunterData.maxHp) * 100}
                    className="h-2 w-full bg-neutral-700 border border-border mb-1"
                    aria-label={`${hunterData.name} HP`} 
                 />
                 <div className="text-xs text-text-secondary mt-1 text-right mb-2">
                     {combatState.playerHp} / {hunterData.maxHp}
                 </div>
                 <Progress 
                    value={(combatState.playerExp / hunterData.expToNextLevel) * 100}
                    className="h-1.5 w-full bg-neutral-700 border border-border transition-transform duration-3000 ease-linear"
                    aria-label={`${hunterData.name} EXP`} 
                 />
            </div>

             {/* Player Sprite Placeholder (Bottom Center-Left Area) */}
            <div className="absolute bottom-36 left-[23%] h-32 w-32 bg-neutral-700 border-2 border-border rounded-md flex items-center justify-center text-5xl font-bold z-10 shadow-lg">
                P
            </div>

            {/* Conditionally Render Main UI vs Rewards */}
            {combatPhase !== 'showing_rewards' && (
                <> 
                    {/* Message Log */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3/5 h-12 bg-background-secondary/80 rounded p-2 overflow-y-auto text-sm text-text-secondary backdrop-blur-sm scrollbar-thin scrollbar-thumb-border-accent scrollbar-track-transparent z-30 text-center">
                        {messageLog.map((msg, index) => (
                            <p key={index} className="mb-1 leading-tight">{msg}</p> 
                        ))}
                    </div>

                    {/* Action Menu - Disable buttons if not fighting */}
                    <div className="absolute bottom-4 right-4 w-48 flex flex-col gap-1 z-30">
                        <Button className="w-full justify-center px-3 py-2" variant="outline" onClick={handleAttack} disabled={!playerTurn || combatPhase !== 'fighting'}>
                            <Swords className="mr-2 h-4 w-4" /> Fight
                        </Button>
                        <Button className="w-full justify-center px-3 py-2" variant="outline" onClick={handleItems} disabled={combatPhase !== 'fighting'}> {/* Disable entirely if not fighting */}
                            <ShoppingBag className="mr-2 h-4 w-4" /> Item 
                        </Button>
                        <Button className="w-full justify-center px-3 py-2" variant="outline" onClick={handleSkills} disabled={combatPhase !== 'fighting'}>
                             <Sparkles className="mr-2 h-4 w-4" /> Skills 
                        </Button>
                        <Button className="w-full justify-center px-3 py-2 text-destructive" variant="outline" onClick={handleFlee} disabled={!playerTurn || combatPhase !== 'fighting'}>
                            <DoorOpen className="mr-2 h-4 w-4" /> Flee 
                        </Button>
                    </div>
                </>
            )}

            {/* Conditionally Render Victory Popup */} 
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