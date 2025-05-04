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
                currentHp: derivedStats.currentHP ?? 0, // Use calculated currentHP
                maxHp: derivedStats.maxHP ?? 1,
                level: fetchedHunter.level ?? 1,
                attackPower: derivedStats.attackPower ?? 0,
                defense: derivedStats.defense ?? 0,
                currentExp: fetchedHunter.experience ?? 0,
                expToNextLevel: derivedStats.expNeededForNextLevel ?? 1,
                critRate: derivedStats.critRate ?? 0,
                critDamage: derivedStats.critDamage ?? 1.5, // Default crit damage multiplier
                precision: derivedStats.precision ?? 0,
                expProgressInCurrentLevel: derivedStats.expProgressInCurrentLevel ?? 0,
                currentMp: derivedStats.currentMP ?? 0,
                maxMp: derivedStats.maxMP ?? 1,
                equippedSkills: Array.isArray(fetchedHunter.equippedSkills) ? fetchedHunter.equippedSkills : [],
            };
            setPlayerCombatStats(combatStats); // Store the stats needed for CombatInterface

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
            
            // TODO: Fetch real enemy data based on gate/depth/room
            setEnemyCombatData({
                id: 'goblin-scout',
                name: 'Goblin Scout',
                currentHp: 30, maxHp: 30,
                level: 3,
                attackPower: 10,
                defense: 5,
                baseExpYield: 25
            });
            // ----------------------------------------------
            
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

        // --- Save Final HP & MP (Only if NOT a win) ---
        // If it's a win, the gain-exp process will handle the final state including level-up recovery.
        if (result !== 'win') {
            const statsToUpdate: { currentHp?: number; currentMp?: number } = {};
            if (payload?.finalPlayerHp !== undefined) {
                statsToUpdate.currentHp = payload.finalPlayerHp;
            }
             if (payload?.finalPlayerMp !== undefined) {
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
                    }
                } catch (err: any) {
                    console.error("Unexpected error saving final stats:", err);
                    toast.error("Failed to save final stats state", { description: err.message });
                }
            } else {
                 console.log("No final stats (HP/MP) provided in payload to save.");
            }
        }
        // --- End Stats Save Conditional Logic ---

        // Reset enemy
        setEnemyCombatData(null);

        let combatOutcomeProcessed = false;
        // --- FIX: Declare variable for updated hunter data outside the if block ---
        let hunterDataFromApi: Hunter | null | undefined = undefined; 
        // --- END FIX ---
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
                        // --- FIX: Store the updated hunter data --- 
                        if (gainExpResult.updatedHunter) {
                            hunterDataFromApi = gainExpResult.updatedHunter as Hunter;
                            setFullHunterData(hunterDataFromApi); // Still update the main state too
                        }
                        // --- END FIX ---
                    } else {
                        gainedExpSuccessfully = true; 
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
                        addedLootSuccessfully = true;
                    }

                } catch (err: any) {
                    console.error("Error during post-combat win processing:", err);
                    toast.error("Failed to process all victory results", { description: err.message });
                    // Even if some part failed, mark as cleared so player can move
                    setRoomStatus('cleared'); 
                    // Consider refetching hunter data here anyway to get latest state despite error
                    try {
                        await fetch(`/api/hunters/${hunterId}`)
                            .then(res => res.json())
                            .then(data => setFullHunterData(data.hunter));
                    } catch (fetchErr: any) {
                         console.warn("Failed to refetch hunter data after post-combat error:", fetchErr.message);
                    }
                    return;
                }
                // --- End Backend Updates ---

                // --- Refetch Hunter Data ONLY if gain-exp didn't return it ---
                if (!gainedExpSuccessfully) { // Refetch if EXP award failed or didn't return hunter
                     try {
                        toast.info("Updating hunter stats...");
                        const response = await fetch(`/api/hunters/${hunterId}`);
                        const hunterResult = await response.json();
                        if (!response.ok) throw new Error(hunterResult.error || 'Failed to refetch hunter after win');
                        setFullHunterData(hunterResult.hunter as Hunter);
                     } catch (err: any) {
                         console.error("Error refetching hunter data:", err);
                         toast.error("Error updating stats after win", { description: err.message });
                     }
                }

                // Recalculate combat stats based on the potentially updated fullHunterData
                // --- FIX: Use the stored hunter data from the API call --- 
                const hunterDataForStats = hunterDataFromApi;
                if (hunterDataForStats) { 
                    console.log("Recalculating stats based on hunter data returned by gain-exp API:", hunterDataForStats);
                    const derivedStats = calculateDerivedStats(hunterDataForStats);
                    // --- END FIX ---
                    setPlayerCombatStats({
                        id: hunterDataForStats.id,
                        name: hunterDataForStats.name,
                        currentHp: derivedStats.currentHP ?? 0, // This should now reflect recovery if level up occurred
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
                        currentMp: derivedStats.currentMP ?? 0, // This should now reflect recovery
                        maxMp: derivedStats.maxMP ?? 1,
                        equippedSkills: Array.isArray(hunterDataForStats.equippedSkills) ? hunterDataForStats.equippedSkills : [],
                    });
                } else if (fullHunterData) {
                    // Fallback to existing state if API didn't return hunter (shouldn't happen on success)
                    console.warn("gain-exp API succeeded but didn't return updatedHunter. Using existing state for stats.");
                    const derivedStats = calculateDerivedStats(fullHunterData);
                    setPlayerCombatStats(prevStats => ({ ...prevStats, ...derivedStats })); // Merge updates
                }
                // Set status to cleared AFTER backend updates and stat refresh attempt
                setRoomStatus('cleared');
                combatOutcomeProcessed = true;
            } else if (result === 'loss') {
                toast.error("Defeated!", { description: "Returning to the Gate Hub..." }); 
                // HP was already saved via the initial block in this function
                // TODO: Implement death penalties?
                setTimeout(() => router.push(`/gate?hunterId=${hunterId}`), 2000);
                 setRoomStatus('loading'); 
                combatOutcomeProcessed = true;
            } else { // flee
                toast.info("Escaped!", { description: "Returned to the room entrance." });
                // HP was already saved via the initial block in this function
                setPlayerPos({ x: 0, y: Math.floor(gridSize.height / 2) });
                setRoomStatus('pending');
                combatOutcomeProcessed = true;
            }
            // --- End Process Combat Outcome ---
        } catch (err: any) {
            // Handle errors from EXP/Loot processing if needed
             console.error("Error during combat outcome processing (EXP/Loot):", err);
            // Decide if MP recovery should still happen if EXP/Loot fails?
            // For now, let's assume MP recovery should still attempt if stats were saved.
        }

        /* --- FIX: Temporarily Comment Out MP Recovery to Isolate Issue --- 
        // --- Trigger Post-Combat MP Recovery (if stats were saved or outcome processed) ---
        // Only recover if the combat actually ended (win/loss/flee), not just stat save fail
        if (combatOutcomeProcessed) { 
            console.log(`[MP Recovery Trigger] Combat ended (${result}), attempting MP recovery for ${hunterId}...`);
            try {
                const recoveryResponse = await fetch(`/api/hunters/${hunterId}/recover-mp`, { 
                    method: 'POST' 
                });
                const recoveryResult = await recoveryResponse.json();

                if (!recoveryResponse.ok) {
                    console.error("Error triggering MP recovery:", recoveryResult.error);
                    toast.error("Failed to trigger MP recovery", { description: recoveryResult.error });
                } else {
                    console.log("[MP Recovery Trigger] Success:", recoveryResult.message);
                    // Optionally show a less intrusive notification about recovery
                    if (recoveryResult.recoveredAmount > 0) {
                        toast.info(`${recoveryResult.message}`); 
                    }
                    // Refetch hunter data AFTER recovery to ensure UI (e.g., dashboard) reflects it
                     try {
                         console.log("Refetching hunter data after MP recovery...");
                        const response = await fetch(`/api/hunters/${hunterId}`);
                        const hunterResult = await response.json();
                        if (!response.ok) throw new Error(hunterResult.error || 'Failed to refetch hunter after MP recovery');
                        setFullHunterData(hunterResult.hunter as Hunter);
                        // Also update playerCombatStats if necessary for immediate combat UI update (if player stays on page)
                        if (hunterResult.hunter) {
                            const derivedStats = calculateDerivedStats(hunterResult.hunter);
                            setPlayerCombatStats({
                                id: hunterResult.hunter.id,
                                name: hunterResult.hunter.name,
                                currentHp: derivedStats.currentHP ?? 0, 
                                maxHp: derivedStats.maxHP ?? 1,
                                level: hunterResult.hunter.level ?? 1,
                                attackPower: derivedStats.attackPower ?? 0,
                                defense: derivedStats.defense ?? 0,
                                currentExp: hunterResult.hunter.experience ?? 0,
                                expToNextLevel: derivedStats.expNeededForNextLevel ?? 1,
                                critRate: derivedStats.critRate ?? 0,
                                critDamage: derivedStats.critDamage ?? 1.5,
                                precision: derivedStats.precision ?? 0,
                                expProgressInCurrentLevel: derivedStats.expProgressInCurrentLevel ?? 0,
                                currentMp: derivedStats.currentMP ?? 0, // Update MP here too
                                maxMp: derivedStats.maxMP ?? 1,
                                equippedSkills: Array.isArray(hunterResult.hunter.equippedSkills) ? hunterResult.hunter.equippedSkills : [],
                            });
                        }
                     } catch (err: any) {
                         console.error("Error refetching hunter data after MP recovery:", err);
                         // Don't necessarily block user, but log it
                     }
                }
            } catch (err: any) {
                console.error("Unexpected error calling MP recovery API:", err);
                toast.error("Failed to trigger MP recovery", { description: err.message });
            }
        }
        // --- End MP Recovery ---
        */

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