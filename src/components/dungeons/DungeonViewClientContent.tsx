"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Keep router for potential navigation
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'; // For styling the view area
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Button } from '@/components/ui/Button'; // Corrected casing
import CombatInterface from '@/components/combat/CombatInterface'; // <-- Import CombatInterface
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Hunter } from '@/types/hunter.types'; // Import full Hunter type
import { calculateDerivedStats } from '@/lib/game/stats'; // Import our main stat calculator
import { LootResult } from '@/constants/lootTables.constants'; // Import LootResult type
import { HunterClass } from "@/constants/classes"; // Import HunterClass
import { EnemyType } from "@/types/enemy.types"; // Import EnemyType


import ChatPanel from "@/components/multiplayer/ChatPanel";

// Match interface structure from CombatInterface
interface EnemyCombatEntity {
    id: string;
    name: string;
    currentHp: number;
    maxHp: number;
    level: number;
    attackPower: number;
    defense: number;
    baseExpYield: number;
    precision: number;
    evasion: number;
    speed: number;
    isBoss: boolean;
    // Add fields to match CombatInterface
    entityCategory: 'enemy' | 'hunter_npc'; 
    classOrType: HunterClass | EnemyType;
    spriteKey: string; 
}
interface PlayerCombatEntity {
    id: string;
    name: string;
    currentHp: number;
    maxHp: number;
    level: number;
    attackPower: number;
    defense: number;
    currentExp: number;
    expToNextLevel: number;
    critRate: number;
    critDamage: number;
    precision: number;
    expProgressInCurrentLevel: number;
    currentMp: number;
    maxMp: number;
    equippedSkills: string[];
    evasion: number;
    speed: number;
    cooldownReduction?: number; // Added for CDR
    // Add fields to match CombatInterface's PlayerCombatEntity
    class: HunterClass;
    entityCategory: 'hunter';
}

// Type for the active gate data
type ActiveGateInfo = Database['public']['Tables']['active_gates']['Row'];

type Position = { x: number; y: number };
// Updated RoomStatus to include 'combat' state specifically
type RoomStatus = 'loading' | 'pending' | 'combat' | 'cleared' | 'error';
type GridSize = { width: number; height: number };

interface DungeonViewProps {
    gateId: string;
    hunterId: string; // Keep hunterId for potential future use (e.g., saving state)
}

export default function DungeonViewClientContent({ gateId, hunterId }: DungeonViewProps) {
    const router = useRouter();

    const [gateData, setGateData] = useState<ActiveGateInfo | null>(null);
    const [roomStatus, setRoomStatus] = useState<RoomStatus>('loading');
    const [error, setError] = useState<string | null>(null);

    // --- State for Full Hunter Data & Derived Stats for Combat ---
    const [fullHunterData, setFullHunterData] = useState<Hunter | null>(null); // Store the full hunter object
    const [playerCombatStats, setPlayerCombatStats] = useState<PlayerCombatEntity | null>(null); // Store the calculated stats for combat
    // -------------------
    const [enemyCombatData, setEnemyCombatData] = useState<EnemyCombatEntity | null>(null);

    // --- Static for now, make dynamic later ---
    const gridSize: GridSize = { width: 7, height: 7 }; 
    const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: Math.floor(gridSize.height / 2) }); // Start middle-left
    const [eventPos, setEventPos] = useState<Position>({ x: Math.floor(gridSize.width / 2), y: Math.floor(gridSize.height / 2) }); // Start center
    const [exitPos, setExitPos] = useState<Position>({ x: gridSize.width - 1, y: Math.floor(gridSize.height / 2) }); // Start middle-right
    // ---------------------------------------------

    // Fetch Gate Data AND FULL Hunter Data
    const loadInitialData = useCallback(async () => {
        setRoomStatus('loading');
        setError(null);
        setGateData(null); // Reset previous data
        setFullHunterData(null); // Reset previous full hunter data
        setPlayerCombatStats(null); // Reset combat stats

        try {
            // Fetch gate data and full hunter data concurrently
            const [gateResponse, hunterResponse] = await Promise.all([
                fetch(`/api/dungeons/${gateId}`),
                // Fetch FULL hunter data, not just combat stats
                fetch(`/api/hunters/${hunterId}`)
            ]);

            // Process Gate Data
            const gateResult = await gateResponse.json();
            if (!gateResponse.ok) {
                throw new Error(gateResult.error || `Failed to load dungeon data (status: ${gateResponse.status})`);
            }
            if (!gateResult.activeGate) {
                 throw new Error('Active gate data not found.');
            }
            setGateData(gateResult.activeGate);

            // Process FULL Hunter Data
            const hunterResult = await hunterResponse.json();
            if (!hunterResponse.ok) {
                throw new Error(hunterResult.error || `Failed to load hunter data (status: ${hunterResponse.status})`);
            }
            const fetchedHunter = hunterResult.hunter as Hunter;
            setFullHunterData(fetchedHunter); // Store the full hunter object

            // Calculate combat stats using the fetched hunter data
            const derivedStats = calculateDerivedStats(fetchedHunter);
            const combatStats: PlayerCombatEntity = {
                id: fetchedHunter.id,
                name: fetchedHunter.name,
                currentHp: derivedStats.currentHP ?? 0, 
                maxHp: derivedStats.maxHP ?? 1,
                level: fetchedHunter.level ?? 1,
                attackPower: derivedStats.attackPower ?? 0,
                defense: derivedStats.defense ?? 0,
                currentExp: fetchedHunter.experience ?? 0,
                expToNextLevel: derivedStats.expNeededForNextLevel ?? 1,
                critRate: derivedStats.critRate ?? 0,
                critDamage: derivedStats.critDamage ?? 1.5, 
                precision: derivedStats.precision ?? 0,
                expProgressInCurrentLevel: derivedStats.expProgressInCurrentLevel ?? 0,
                currentMp: derivedStats.currentMP ?? 0,
                maxMp: derivedStats.maxMP ?? 1,
                equippedSkills: Array.isArray(fetchedHunter.equippedSkills) ? fetchedHunter.equippedSkills : [],
                evasion: derivedStats.evasion ?? 0,
                speed: derivedStats.speed ?? 0,
                cooldownReduction: (derivedStats.cooldownReduction ?? 0) / 100, 
                // Populate the new fields
                class: fetchedHunter.class, // Assuming fetchedHunter has a class property
                entityCategory: 'hunter', // Player is always 'hunter'
            };
            setPlayerCombatStats(combatStats); 

            // TODO: Based on gateData.current_room, determine event type/position
            setRoomStatus('pending'); // Ready to interact

        } catch (err: any) {
            console.error("Error loading initial dungeon/hunter data:", err);
            setError(err.message || "Failed to load necessary information.");
            setRoomStatus('error');
        } 
    }, [gateId, hunterId]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // --- Refactored Movement Logic ---
    const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        // Only allow movement when pending or cleared
            if (!gateData || (roomStatus !== 'pending' && roomStatus !== 'cleared')) return;

            setPlayerPos(currentPos => {
                let nextPos = { ...currentPos };

            switch (direction) {
                case 'up':
                        nextPos.y -= 1;
                        break;
                case 'down':
                        nextPos.y += 1;
                        break;
                case 'left':
                        nextPos.x -= 1;
                        break;
                case 'right':
                        nextPos.x += 1;
                        break;
                }

                // Boundary Checks
                if (
                    nextPos.x < 0 ||
                    nextPos.x >= gridSize.width ||
                    nextPos.y < 0 ||
                    nextPos.y >= gridSize.height
                ) {
                    return currentPos; 
                }

            console.log(`Moved ${direction} to: (${nextPos.x}, ${nextPos.y})`);
                return nextPos;
            });
    }, [gateData, roomStatus, gridSize]); // Add gridSize dependency

    // --- Keyboard Movement Listener ---
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
             // Use the refactored movement handler
            switch (event.key.toLowerCase()) { 
                case 'arrowup':
                case 'w':
                    handleMove('up');
                    break;
                case 'arrowdown':
                case 's':
                    handleMove('down');
                    break;
                case 'arrowleft':
                case 'a':
                    handleMove('left');
                    break;
                case 'arrowright':
                case 'd':
                    handleMove('right');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    // Dependencies only include handleMove now
    }, [handleMove]); 

    // --- Interaction Logic ---
    useEffect(() => {
        // Check for event trigger first
        if (roomStatus === 'pending' && playerPos.x === eventPos.x && playerPos.y === eventPos.y) {
            console.log("Player landed on event tile! Initiating Combat...");
            
            // Check if player combat stats are calculated and ready
            if (!playerCombatStats) { // Use the calculated stats state
                console.error("Cannot start combat: Player combat stats not calculated.");
                toast.error("Error starting combat", { description: "Player stats missing. Try reloading." });
                setRoomStatus('error');
                return;
            }
            
            // --- Create MOCK Enemy Data ---
            const mockEnemy: EnemyCombatEntity = {
                id: 'goblin-scout',
                name: 'Goblin Scout',
                currentHp: 50,
                maxHp: 50,
                level: 3,
                attackPower: 12,
                defense: 5,
                baseExpYield: 15,
                precision: 20, 
                evasion: 10,   
                speed: 12,     
                isBoss: false,
                entityCategory: 'enemy', // Correct category
                classOrType: 'Humanoid', // Corrected: Use a defined EnemyType
                spriteKey: 'goblin_scout', // Assuming this key matches an actual sprite
            };
            setEnemyCombatData(mockEnemy);
            // --- END MOCK ---
            
            setRoomStatus('combat'); // Set status to combat only AFTER data is ready
        }

        // Check for moving onto the exit tile *after* the room is cleared
        if (roomStatus === 'cleared' && playerPos.x === exitPos.x && playerPos.y === exitPos.y) {
            console.log("Player reached the exit!");
            setRoomStatus('loading'); // Set to loading while we transition
            toast("Moving to the next room...");

            // --- Call API to update progress ---
            const progressToNextRoom = async () => {
                try {
                    const response = await fetch(`/api/dungeons/${gateId}/progress`, {
                        method: 'PUT',
                    });
                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || `Failed to progress (status: ${response.status})`);
                    }

                    if (result.status === 'cleared') {
                        // Dungeon Complete!
                        toast.success("Dungeon Cleared!", { description: "Returning to Gate Hub..." });
                        // Redirect back to the Gate Hub page (/gate), passing hunterId
                        setTimeout(() => router.push(`/gate?hunterId=${hunterId}`), 2000); 
                        // No need to reload or reset player position here
                        return; // Exit the function early
                    }

                    // On successful API call (progressed), reload data for the new room
                    toast.success("Entered new room!", { description: `Depth: ${result.activeGate?.current_depth}, Room: ${result.activeGate?.current_room}` });
                    loadInitialData();
                    // Reset player position for the new room
                    setPlayerPos({ x: 0, y: Math.floor(gridSize.height / 2) });

                } catch (err: any) {
                    console.error("Error progressing to next room:", err);
                    toast.error("Failed to move to next room", { description: err.message || "Please try again." });
                    // Revert status to allow player to retry moving to exit
                    setRoomStatus('cleared'); 
                }
            };

            progressToNextRoom();
            // ------------------------------------

            return; // Action taken
        }

    }, [playerPos, eventPos, exitPos, roomStatus, loadInitialData, gridSize.height, gateId, router, hunterId, playerCombatStats]); // Added playerCombatStats

    // --- Combat End Handler ---
    const handleCombatResolved = async (result: 'win' | 'loss' | 'flee', payload?: { 
        expGained?: number, 
        finalPlayerHp?: number,
        finalPlayerMp?: number,
        loot?: LootResult
    }) => {
        console.log(`Combat resolved with result: ${result}, payload:`, payload);

        // --- FIX: Always attempt to save final HP/MP regardless of outcome ---
        // Remove the `if (result !== 'win')` condition
        const statsToUpdate: { currentHp?: number; currentMp?: number } = {};
        // We only update HP if it's provided and NOT a level-up win (handled by gain-exp)
        if (payload?.finalPlayerHp !== undefined && !(result === 'win' && payload?.expGained && /* Assume level up check happens in API */ false)) { // TODO: Better level up check needed if API doesnt return it
            statsToUpdate.currentHp = payload.finalPlayerHp;
        }
        // We only update MP if it's provided and NOT a level-up win
        if (payload?.finalPlayerMp !== undefined && !(result === 'win' && payload?.expGained && /* Assume level up check */ false)) { // TODO: Better level up check
            statsToUpdate.currentMp = payload.finalPlayerMp;
        }

        if (Object.keys(statsToUpdate).length > 0) {
            try {
                toast.info("Saving final stats...");
                const statsUpdateResponse = await fetch(`/api/hunters/${hunterId}/update-current-stats`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(statsToUpdate) // Send combined payload
                });
                const statsUpdateResult = await statsUpdateResponse.json();
                if (!statsUpdateResponse.ok) {
                    console.error("Error saving final stats:", statsUpdateResult.error);
                    toast.error("Failed to save final stats state", { description: statsUpdateResult.error });
                } else {
                     console.log("Final stats saved successfully.");
                     // --- FIX: Update local state immediately AFTER successful save ---
                     setFullHunterData(prevHunter => {
                         if (!prevHunter) return null; // Should not happen here
                         return {
                             ...prevHunter,
                             ...(statsToUpdate.currentHp !== undefined && { currentHp: statsToUpdate.currentHp }),
                             ...(statsToUpdate.currentMp !== undefined && { currentMp: statsToUpdate.currentMp })
                         };
                     });
                     // Optionally recalculate playerCombatStats here too if needed immediately
                     // setPlayerCombatStats(prevCombat => ... );
                     // --- END FIX ---
                }
            } catch (err: any) {
                console.error("Unexpected error saving final stats:", err);
                toast.error("Failed to save final stats state", { description: err.message });
            }
        } else {
             console.log("No final stats (HP/MP) provided in payload to save, or it was a level-up win.");
        }
        // --- End Stats Save Logic ---

        // Reset enemy
        setEnemyCombatData(null);

        let combatOutcomeProcessed = false;
        let hunterDataFromApi: Hunter | null | undefined = undefined; 
        
        try {
            // --- Process Combat Outcome --- 
            if (result === 'win') {
                let gainedExpSuccessfully = false;
                let addedLootSuccessfully = false;
                // --- Mark Room as Cleared + Gain EXP + Add Loot ---
                try {
                    setRoomStatus('loading');
                    toast.info("Saving room clear status...");
                    // 1. Clear Room
                    const clearRoomResponse = await fetch(`/api/dungeons/${gateId}/clear-room`, { method: 'PUT' });
                    if (!clearRoomResponse.ok) {
                        const clearRoomResult = await clearRoomResponse.json();
                        throw new Error(clearRoomResult.error || `Failed to mark room as cleared`);
                    }
                    console.log("Room successfully marked as cleared on backend.");

                    // 2. Award Experience 
                    const expToAward = payload?.expGained;
                    if (expToAward && expToAward > 0) {
                        toast.info(`Awarding ${expToAward} EXP...`);
                        const gainExpResponse = await fetch(`/api/hunters/${hunterId}/gain-exp`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ experienceGained: expToAward }),
                        });
                        const gainExpResult = await gainExpResponse.json();
                        if (!gainExpResponse.ok) throw new Error(gainExpResult.error || "Failed to award EXP");
                        toast.success(`${gainExpResult.message}${gainExpResult.levelUp ? ` | Leveled up to ${gainExpResult.newLevel}!` : ""}`);
                        gainedExpSuccessfully = true;
                        
                        if (gainExpResult.updatedHunter) {
                            hunterDataFromApi = gainExpResult.updatedHunter as Hunter;
                            setFullHunterData(hunterDataFromApi); // Update main state
                        }
                        
                    } else {
                        gainedExpSuccessfully = true; // No EXP to award
                    }

                    // 3. Add Loot
                    const lootToAward = payload?.loot;
                    if (lootToAward && (lootToAward.droppedItems.length > 0 || lootToAward.droppedGold > 0)) {
                        toast.info("Adding loot to inventory...");
                        const addLootResponse = await fetch(`/api/hunters/${hunterId}/add-loot`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ items: lootToAward.droppedItems, gold: lootToAward.droppedGold }),
                        });
                        const addLootResult = await addLootResponse.json();
                        if (!addLootResponse.ok) throw new Error(addLootResult.error || "Failed to add loot");
                        toast.success(addLootResult.message || "Loot added!");
                        addedLootSuccessfully = true;
                    } else {
                        addedLootSuccessfully = true; // No loot to add
                    }

                } catch (err: any) {
                    console.error("Error during post-combat win processing:", err);
                    toast.error("Failed to process all victory results", { description: err.message });
                    
                    setRoomStatus('cleared'); 
                    
                    try {
                        await fetch(`/api/hunters/${hunterId}`)
                            .then(res => res.json())
                            .then(data => setFullHunterData(data.hunter));
                    } catch (fetchErr: any) {
                         console.warn("Failed to refetch hunter data after post-combat error:", fetchErr.message);
                    }
                    return;
                }

                // --- FIX: Recalculate stats based on the MOST RECENT hunter data ---
                // Use data from gain-exp if available, otherwise use the potentially updated fullHunterData state
                const hunterDataForStats = hunterDataFromApi ?? fullHunterData;
                if (hunterDataForStats) { 
                    console.log("Recalculating stats based on most recent hunter data:", hunterDataForStats);
                    const derivedStats = calculateDerivedStats(hunterDataForStats);
                    setPlayerCombatStats({
                        id: hunterDataForStats.id,
                        name: hunterDataForStats.name,
                        currentHp: derivedStats.currentHP ?? 0, 
                        maxHp: derivedStats.maxHP ?? 1,
                        level: hunterDataForStats.level ?? 1,
                        attackPower: derivedStats.attackPower ?? 0,
                        defense: derivedStats.defense ?? 0,
                        currentExp: hunterDataForStats.experience ?? 0,
                        expToNextLevel: derivedStats.expNeededForNextLevel ?? 1,
                        critRate: derivedStats.critRate ?? 0,
                        critDamage: derivedStats.critDamage ?? 1.5,
                        precision: derivedStats.precision ?? 0,
                        expProgressInCurrentLevel: derivedStats.expProgressInCurrentLevel ?? 0,
                        currentMp: derivedStats.currentMP ?? 0,
                        maxMp: derivedStats.maxMP ?? 1,
                        equippedSkills: Array.isArray(hunterDataForStats.equippedSkills) ? hunterDataForStats.equippedSkills : [],
                        evasion: derivedStats.evasion ?? 0,
                        speed: derivedStats.speed ?? 0,
                        cooldownReduction: (derivedStats.cooldownReduction ?? 0) / 100, 
                        // Add the missing fields
                        class: hunterDataForStats.class, // Assuming hunterDataForStats contains the class
                        entityCategory: 'hunter',
                    });
                } else {
                    console.error("Cannot recalculate combat stats: No hunter data available after combat resolution.");
                }
                // --- END FIX ---
                
                setRoomStatus('cleared');
                combatOutcomeProcessed = true;
            } else if (result === 'loss') {
                toast.error("Defeated!", { description: "Returning to the Gate Hub..." }); 
                
                setTimeout(() => router.push(`/gate?hunterId=${hunterId}`), 2000);
                 setRoomStatus('loading'); 
                combatOutcomeProcessed = true;
            } else { // flee
                toast.info("Escaped!", { description: "Returned to the room entrance." });
                
                setPlayerPos({ x: 0, y: Math.floor(gridSize.height / 2) });
                setRoomStatus('pending');
                combatOutcomeProcessed = true;
            }
            // --- End Process Combat Outcome ---
        } catch (err: any) {
             console.error("Error during combat outcome processing (EXP/Loot):", err);
        }
        // --- MP Recovery Logic (Uncommented) ---
         // Remove the surrounding /* ... */
        // --- Trigger Post-Combat MP Recovery (if stats were saved or outcome processed) ---
        // Only recover if the combat actually ended (win/loss/flee), not just stat save fail
        if (combatOutcomeProcessed) { 
            console.log(`[MP Recovery Trigger] Combat ended (${result}), attempting MP recovery for ${hunterId}...`);
            try {
                 const mpRecoveryResponse = await fetch(`/api/hunters/${hunterId}/recover-mp`, {
                     method: 'POST',
                });
                 const mpRecoveryResult = await mpRecoveryResponse.json();
                 if (!mpRecoveryResponse.ok) {
                     console.error("Error triggering MP recovery:", mpRecoveryResult.error);
                     // Don't necessarily show error to user unless it failed badly
                } else {
                     console.log("MP recovery initiated.", mpRecoveryResult);
                     // Update local state IF the recovery was immediate and returned data
                     if (mpRecoveryResult.updatedHunter) {
                         console.log("Updating hunter state with immediate MP recovery data.");
                         setFullHunterData(mpRecoveryResult.updatedHunter as Hunter);
                         // Recalculate combat stats again maybe?
                         // Consider adding: 
                         // const derivedStats = calculateDerivedStats(mpRecoveryResult.updatedHunter as Hunter);
                         // setPlayerCombatStats(prev => ({ ...prev, ...derivedStats }));
                     }
                }
            } catch (err: any) {
                 console.error("Unexpected error triggering MP recovery:", err);
            }
        } else {
            console.log("[MP Recovery Trigger] Combat outcome not fully processed, skipping MP recovery attempt.");
        }
        // Remove the surrounding /* ... */
        // --- End MP Recovery ---
    };
    // ------------------------

    // --- Helper to get cell style ---
    const getCellStyle = (x: number, y: number): string => {
        let baseStyle = "border border-border/30 flex items-center justify-center aspect-square relative"; // Added relative for icon positioning
        if (x === playerPos.x && y === playerPos.y) {
            return `${baseStyle} bg-primary/30`; // Player cell
        }
        if (roomStatus === 'pending' && x === eventPos.x && y === eventPos.y) {
            return `${baseStyle} bg-red-500/50 animate-pulse`; // Event cell
        }
        if (x === exitPos.x && y === exitPos.y) {
            return `${baseStyle} ${roomStatus === 'cleared' ? 'bg-green-500/50' : 'bg-neutral-700/30'}`; // Exit cell (green if cleared)
        }
        return `${baseStyle} bg-background-secondary/50`; // Empty cell
    };

    // --- Render Grid Cells --- 
    const renderGridCells = () => {
        const cells = [];
        for (let y = 0; y < gridSize.height; y++) {
            for (let x = 0; x < gridSize.width; x++) {
                cells.push(
            <div key={`${x}-${y}`} className={getCellStyle(x, y)}>
              {/* Simple visual indicators for testing */}
              {x === playerPos.x && y === playerPos.y && <span className="text-xl">P</span>}
              {roomStatus === 'pending' && x === eventPos.x && y === eventPos.y && <span className="text-xl">E</span>}
              {x === exitPos.x && y === exitPos.y && <span className="text-xl">X</span>}
            </div>,
                );
            }
        }
        return cells;
    };

    // --- JSX Return --- 
    return (
        <div className="relative w-full"> {/* Added relative for positioning controls */} 
            {/* Online Players Panel - Fixed position on left side */}
            {fullHunterData && (
                <DungeonPlayersPresenceSection hunter={fullHunterData} />
            )}

            {/* Loading State */}
            {roomStatus === 'loading' && (
                 <div className="flex h-[50vh] w-full items-center justify-center">
                    <Skeleton className="h-64 w-full max-w-lg" />
                 </div>
            )}

            {/* Error State */}
            {roomStatus === 'error' && (
                <Card className="w-full max-w-md mx-auto border-danger mt-10">
                    <CardHeader><CardTitle className="text-center text-danger">Error</CardTitle></CardHeader>
                    <CardContent className="text-center">
                        <p className="mb-4 text-text-secondary">{error}</p>
                        <Button variant="secondary" onClick={loadInitialData}>Retry</Button>
                    </CardContent>
                </Card>
            )}

            {/* --- Status Bar --- */}
            {gateData && roomStatus !== 'loading' && roomStatus !== 'error' && (
                <div className="flex justify-between items-center p-2 mb-4 bg-background-secondary rounded-md shadow text-sm max-w-lg mx-auto">
                    <span className="text-text-secondary">
                        Depth: {gateData.current_depth} | Room: {gateData.current_room}
                    </span>
                    <span className="text-text-secondary capitalize">
                        Status: {roomStatus}
                    </span>
             </div>
            )}
            {/* ------------------ */}

            {/* Combat View */}
            {roomStatus === 'combat' && playerCombatStats && enemyCombatData && (
                <div className="h-[70vh]"> {/* Give combat view fixed height */} 
                 <CombatInterface 
                    gateId={gateId}
                    hunterData={playerCombatStats}
                    enemyData={enemyCombatData}
                    onCombatResolved={handleCombatResolved}
                 />
                </div>
            )}

            {/* Grid View (only when not in combat) */}
            {(roomStatus === 'pending' || roomStatus === 'cleared') && (
                <div 
                    className="grid gap-1 p-1 bg-background rounded-md shadow-lg border border-border max-w-lg mx-auto"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize.width}, minmax(0, 1fr))`, 
                        }}
                     >
                        {renderGridCells()}
                            </div>
                         )}

            {/* --- On-Screen Movement Controls --- */}
            {(roomStatus === 'pending' || roomStatus === 'cleared') && ( 
                <div className="fixed bottom-6 right-6 z-50 grid grid-cols-3 gap-2 w-32">
                    {/* Empty Top Left */}
                    <div></div> 
                    {/* Up Button */}
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="col-start-2 bg-background-secondary/80 hover:bg-background-secondary active:bg-border aspect-square backdrop-blur-sm" 
                        onClick={() => handleMove('up')}
                        aria-label="Move Up"
                    >
                        <ArrowUp className="h-6 w-6" />
                    </Button>
                     {/* Empty Top Right */}
                    <div></div>

                    {/* Left Button */}
                     <Button 
                        variant="outline" 
                        size="icon" 
                        className="col-start-1 bg-background-secondary/80 hover:bg-background-secondary active:bg-border aspect-square backdrop-blur-sm" 
                        onClick={() => handleMove('left')}
                        aria-label="Move Left"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                     {/* Center Placeholder (Optional) */}
                     <div className="col-start-2"></div> 
                    {/* Right Button */}
                     <Button 
                        variant="outline" 
                        size="icon" 
                        className="col-start-3 bg-background-secondary/80 hover:bg-background-secondary active:bg-border aspect-square backdrop-blur-sm" 
                        onClick={() => handleMove('right')}
                        aria-label="Move Right"
                    >
                        <ArrowRight className="h-6 w-6" />
                    </Button>

                     {/* Empty Bottom Left */}
                     <div></div> 
                    {/* Down Button */}
                     <Button 
                        variant="outline" 
                        size="icon" 
                        className="col-start-2 bg-background-secondary/80 hover:bg-background-secondary active:bg-border aspect-square backdrop-blur-sm" 
                        onClick={() => handleMove('down')}
                        aria-label="Move Down"
                            >
                        <ArrowDown className="h-6 w-6" />
                    </Button>
                     {/* Empty Bottom Right */}
                    <div></div>
                           </div>
                         )}
                     </div>
    );
}

// New component to handle presence logic for Dungeon
function DungeonPlayersPresenceSection({ hunter }: { hunter: Hunter }) {
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  return (
    <>
      {/* Floating Chat Panel - Bottom right, can be minimized */}
      <div className="fixed bottom-20 right-4 z-40">
        <ChatPanel
          currentHunter={{
            id: hunter.id,
            userId: hunter.userId,
            name: hunter.name,
            level: hunter.level,
            class: hunter.class,
            rank: hunter.rank,
          }}
          location="dungeon"
          defaultChannel="location"
          isMinimized={isChatMinimized}
          onMinimize={() => setIsChatMinimized(!isChatMinimized)}
          showChannelList={false}
          className={isChatMinimized ? "" : "w-80 h-96"}
        />
      </div>
    </>
  );
} 