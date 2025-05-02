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
                id: 'goblin-1', 
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
    const handleCombatResolved = async (result: 'win' | 'loss' | 'flee', payload?: { expGained?: number, finalPlayerHp?: number }) => {
        console.log(`Combat resolved with result: ${result}, payload:`, payload);

        // --- Save Final HP FIRST ---
        if (payload?.finalPlayerHp !== undefined) {
            try {
                toast.info("Saving final HP...");
                const hpUpdateResponse = await fetch(`/api/hunters/${hunterId}/update-current-stats`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentHp: payload.finalPlayerHp })
                });
                const hpUpdateResult = await hpUpdateResponse.json();
                if (!hpUpdateResponse.ok) {
                    // Log error, but maybe don't block progression? Depends on design.
                    console.error("Error saving final HP:", hpUpdateResult.error);
                    toast.error("Failed to save final HP state", { description: hpUpdateResult.error });
                    // If saving HP fails, should we stop? For now, let's continue but log it.
                } else {
                     console.log("Final HP saved successfully.");
                }
            } catch (err: any) {
                console.error("Unexpected error saving final HP:", err);
                toast.error("Failed to save final HP state", { description: err.message });
                // Continue processing even if HP save fails?
            }
        }
        // --- End HP Save ---

        // Reset enemy
        setEnemyCombatData(null);

        if (result === 'win') {
            let gainedExpSuccessfully = false;
            // --- Mark Room as Cleared on Backend FIRST ---
            try {
                setRoomStatus('loading');
                toast.info("Saving room clear status...");
                const clearRoomResponse = await fetch(`/api/dungeons/${gateId}/clear-room`, { method: 'PUT' });
                const clearRoomResult = await clearRoomResponse.json();
                if (!clearRoomResponse.ok) throw new Error(clearRoomResult.error || `Failed to mark room as cleared`);
                console.log("Room successfully marked as cleared on backend.");

                // --- Award Experience --- 
                const expToAward = payload?.expGained;
                if (expToAward && expToAward > 0) {
                    toast.info(`Awarding ${expToAward} EXP...`);
                    const gainExpResponse = await fetch(`/api/hunters/${hunterId}/gain-exp`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ experienceGained: expToAward }),
                    });
                    const gainExpResult = await gainExpResponse.json();
                    if (!gainExpResponse.ok) {
                        // Log error but don't necessarily stop progression if clearing room worked
                        console.error("Error awarding EXP:", gainExpResult.error);
                        toast.error("Failed to award EXP", { description: gainExpResult.error });
                        // gainedExpSuccessfully remains false
                    } else {
                        toast.success(
                            `${gainExpResult.message}${gainExpResult.levelUp ? ` | Leveled up to ${gainExpResult.newLevel}!` : ""}`
                        );
                        gainedExpSuccessfully = true;
                        // Use the hunter data returned from gain-exp if available
                        if (gainExpResult.updatedHunter) {
                             setFullHunterData(gainExpResult.updatedHunter as Hunter);
                        }
                    }
                } else {
                    console.log("No EXP to award or payload missing.");
                    gainedExpSuccessfully = true; // Consider it successful if no EXP needed awarding
                }

            } catch (err: any) {
                console.error("Error during post-combat processing (clear room or gain exp):", err);
                toast.error("Failed to process combat results", { description: err.message });
                // If clearing failed, progression might be blocked. If EXP failed, it's less critical for progression.
                // Setting status to cleared optimistically so player isn't stuck if only EXP failed.
                setRoomStatus('cleared'); 
                return; 
            }
            // --- End Backend Updates ---

            // --- Refetch Hunter Data ONLY if gain-exp didn't return it OR if gain-exp failed ---
            if (!gainedExpSuccessfully || !(payload?.expGained && payload.expGained > 0)) {
                 try {
                    toast.info("Updating hunter stats...");
                    const response = await fetch(`/api/hunters/${hunterId}`);
                    const hunterResult = await response.json();
                    if (!response.ok) throw new Error(hunterResult.error || 'Failed to refetch hunter after win');
                    setFullHunterData(hunterResult.hunter as Hunter);
                 } catch (err: any) {
                     console.error("Error refetching hunter data after combat win:", err);
                     toast.error("Error updating stats after win", { description: err.message });
                      // Fallback: Keep room pending? Or maybe cleared but with potentially stale display stats?
                     setRoomStatus('cleared'); // Still mark as cleared locally, but stats might be off until next load
                 }
            }

            // Recalculate combat stats based on the potentially updated fullHunterData
            if (fullHunterData) { // Check if fullHunterData is available
                 const derivedStats = calculateDerivedStats(fullHunterData);
                 setPlayerCombatStats({
                    id: fullHunterData.id,
                    name: fullHunterData.name,
                    currentHp: derivedStats.currentHP ?? 0, // Use recalculated HP (for level up recovery)
                    maxHp: derivedStats.maxHP ?? 1,
                    level: fullHunterData.level ?? 1,
                    attackPower: derivedStats.attackPower ?? 0,
                    defense: derivedStats.defense ?? 0,
                    currentExp: fullHunterData.experience ?? 0,
                    expToNextLevel: derivedStats.expNeededForNextLevel ?? 1,
                    critRate: derivedStats.critRate ?? 0,
                    critDamage: derivedStats.critDamage ?? 1.5,
                    precision: derivedStats.precision ?? 0,
                    expProgressInCurrentLevel: derivedStats.expProgressInCurrentLevel ?? 0,
                 });
            }
            // Set status to cleared AFTER backend updates and stat refresh attempt
            setRoomStatus('cleared');

        } else if (result === 'loss') {
            toast.error("Defeated!", { description: "Returning to the Gate Hub..." }); // Or apply penalties
            // TODO: Implement death penalties (EXP loss, etc.)
            // Redirect back to Gate Hub for now
            setTimeout(() => router.push(`/gate?hunterId=${hunterId}`), 2000);
             setRoomStatus('loading'); // Prevent further actions while redirecting
        } else { // flee
            toast.info("Escaped!", { description: "Returned to the room entrance." });
            // Reset player position to entrance, keep room pending
            setPlayerPos({ x: 0, y: Math.floor(gridSize.height / 2) });
            setRoomStatus('pending');
        }
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