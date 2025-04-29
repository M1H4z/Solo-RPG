"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Keep router for potential navigation
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/Card'; // For styling the view area
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Button } from '@/components/ui/button'; // For the retry button
import CombatInterface from '@/components/combat/CombatInterface'; // <-- Import CombatInterface

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

    // --- Combat State ---
    // TODO: Fetch real hunter data based on hunterId
    const [hunterCombatData, setHunterCombatData] = useState<PlayerCombatEntity | null>(null);
    // TODO: Determine enemy based on gateData, depth, room
    const [enemyCombatData, setEnemyCombatData] = useState<EnemyCombatEntity | null>(null);
    // -------------------

    // --- Static for now, make dynamic later ---
    const gridSize: GridSize = { width: 7, height: 7 }; 
    const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: Math.floor(gridSize.height / 2) }); // Start middle-left
    const [eventPos, setEventPos] = useState<Position>({ x: Math.floor(gridSize.width / 2), y: Math.floor(gridSize.height / 2) }); // Start center
    const [exitPos, setExitPos] = useState<Position>({ x: gridSize.width - 1, y: Math.floor(gridSize.height / 2) }); // Start middle-right
    // ---------------------------------------------

    // Fetch Gate/Room Data
    const loadInitialData = useCallback(async () => {
        setRoomStatus('loading');
        setError(null);
        try {
            const response = await fetch(`/api/dungeons/${gateId}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to load dungeon data (status: ${response.status})`);
            }

            if (!result.activeGate) {
                 throw new Error('Active gate data not found.');
            }
            
            setGateData(result.activeGate);
            // TODO: Based on gateData.current_room, determine event type/position
            // For now, we use the static initial positions
            setRoomStatus('pending'); // Ready to interact

        } catch (err: any) {
            console.error("Error loading dungeon view:", err);
            setError(err.message || "Failed to load dungeon information.");
            setRoomStatus('error');
        } 
    }, [gateId]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // --- Movement Logic --- 
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only allow movement when pending or cleared (to reach exit)
            if (!gateData || (roomStatus !== 'pending' && roomStatus !== 'cleared')) return;

            setPlayerPos(currentPos => {
                let nextPos = { ...currentPos };

                switch (event.key.toLowerCase()) { // Use toLowerCase for WASD
                    case 'arrowup':
                    case 'w':
                        nextPos.y -= 1;
                        break;
                    case 'arrowdown':
                    case 's':
                        nextPos.y += 1;
                        break;
                    case 'arrowleft':
                    case 'a':
                        nextPos.x -= 1;
                        break;
                    case 'arrowright':
                    case 'd':
                        nextPos.x += 1;
                        break;
                    default:
                        return currentPos; 
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

                console.log(`Moved to: (${nextPos.x}, ${nextPos.y})`);
                return nextPos;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gridSize, gateData, roomStatus]); // Add roomStatus dependency

    // --- Interaction Logic ---
    useEffect(() => {
        // Check for event trigger first
        if (roomStatus === 'pending' && playerPos.x === eventPos.x && playerPos.y === eventPos.y) {
            console.log("Player landed on event tile! Initiating Combat...");
            
            // --- Setup Placeholder Combat Data with Stats & EXP ---
            // TODO: Fetch real hunter/enemy data
            setHunterCombatData({ 
                id: hunterId, 
                name: 'Hero', 
                currentHp: 90, maxHp: 100, 
                level: 5, 
                attackPower: 15, 
                defense: 8,     
                currentExp: 30,      // Example EXP
                expToNextLevel: 100  // Example EXP Goal
            });
            setEnemyCombatData({ 
                id: 'goblin-1', 
                name: 'Goblin Scout', 
                currentHp: 30, maxHp: 30, 
                level: 3,
                attackPower: 10, 
                defense: 5,     
                baseExpYield: 25     // Example EXP Yield
            });
            // ----------------------------------------------
            
            setRoomStatus('combat'); 
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
                        toast.success("Dungeon Cleared!", { description: "Returning to dashboard..." });
                        // Redirect or update UI accordingly
                        setTimeout(() => router.push('/dashboard'), 2000); // Redirect after a short delay
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

    }, [playerPos, eventPos, exitPos, roomStatus, loadInitialData, gridSize.height, gateId, router, hunterId]); // Added hunterId

    // --- Combat End Handler ---
    const handleCombatEnd = (result: 'win' | 'loss' | 'flee') => {
        console.log(`Combat ended with result: ${result}`);
        // TODO: Implement proper handling for loss/flee (penalties, redirect?)
        if (result === 'win') {
            toast.success("Victory!", { description: "The path forward is clear." });
            setRoomStatus('cleared');
             // TODO: Grant EXP and Loot here
        } else if (result === 'flee') {
            toast.warning("Fled!", { description: "You escaped the encounter." });
            // Reset to pending, maybe move player back?
            setRoomStatus('pending'); 
             setPlayerPos(prev => ({ ...prev, x: Math.max(0, prev.x - 1) })); // Simple move back left
        } else { // loss
            toast.error("Defeated!", { description: "Returning to safety... (Not implemented)" });
            // For now, just clear the room to avoid getting stuck
            setRoomStatus('cleared'); 
             // TODO: Implement death penalty, revive logic, possibly redirect
        }
        // Clear combat data
        setEnemyCombatData(null);
        // Keep hunter data potentially for next fight? Or clear it too?
        // setHunterCombatData(null); 
    };
    // ------------------------

    // --- Render Logic ---
    if (roomStatus === 'loading') {
        return (
            <Card className="h-[60vh]">
                <CardContent className="flex h-full items-center justify-center">
                    <Skeleton className="h-3/4 w-3/4" />
                </CardContent>
             </Card>
        );
    }

    if (roomStatus === 'error' || !gateData) {
        return (
             <Card className="h-[60vh] border-danger">
                 <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                     <h3 className="mb-4 text-lg font-semibold text-danger">Error Loading Dungeon</h3>
                     <p className="mb-6 text-text-secondary">{error || 'Could not load data for this dungeon gate.'}</p>
                     <Button variant="secondary" onClick={loadInitialData}>Retry</Button>
                 </CardContent>
             </Card>
        );
    }

    // --- Grid Rendering --- 
    const renderGridCells = () => {
        const cells = [];
        for (let y = 0; y < gridSize.height; y++) {
            for (let x = 0; x < gridSize.width; x++) {
                cells.push(
                    <div 
                        key={`${x}-${y}`}
                        className="aspect-square border border-border-dark/30 bg-background-secondary/30"
                        // Style for grid positioning (CSS grid lines are 1-based)
                        style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                    ></div>
                );
            }
        }
        return cells;
    };

    // Helper to get style for positioned elements
    const getElementStyle = (pos: Position): React.CSSProperties => ({
        gridColumnStart: pos.x + 1,
        gridRowStart: pos.y + 1,
        zIndex: 10, // Ensure elements are above grid lines
    });

    // --- Render Combat OR Grid ---
    return (
         <Card className="h-[60vh] p-4 flex flex-col"> {/* Keep main card structure */} 
             {/* Header/Info within the card - Conditionally show based on status? */} 
            <div className="mb-2 flex justify-between text-xs text-text-secondary">
                 <span>Depth: {gateData.current_depth} | Room: {gateData.current_room}</span>
                 <span>Status: {roomStatus}</span>
             </div>

             {/* --- CONDITIONAL RENDERING --- */}
             {roomStatus === 'combat' && hunterCombatData && enemyCombatData ? (
                 // --- Render Combat Interface --- 
                 <CombatInterface 
                    gateId={gateId}
                    hunterData={hunterCombatData}
                    enemyData={enemyCombatData}
                    onCombatEnd={handleCombatEnd}
                 />
             ) : (
                 // --- Render Dungeon Grid --- 
                 <div className="relative flex-grow overflow-hidden border border-border-dark bg-background"> 
                     {/* The CSS Grid */}
                     <div 
                        className="absolute inset-0 grid h-full w-full"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize.width}, minmax(0, 1fr))`, 
                            gridTemplateRows: `repeat(${gridSize.height}, minmax(0, 1fr))`,
                        }}
                     >
                         {/* Render the background grid cells */}
                        {renderGridCells()}

                         {/* Player Element - Placeholder */}
                         <div 
                            className="flex items-center justify-center rounded bg-blue-500 text-white text-xs font-bold shadow-md transition-all duration-150 ease-linear"
                            style={getElementStyle(playerPos)}
                            aria-label="Player"
                         >
                             P
                        </div>

                         {/* Event Element - Placeholder (Monster/Treasure) */}
                         {roomStatus === 'pending' && (
                            <div 
                                className="flex items-center justify-center rounded bg-yellow-500 text-black text-xs font-bold shadow-md"
                                style={getElementStyle(eventPos)}
                                aria-label="Event"
                            >
                                ?
                            </div>
                         )}

                         {/* Exit Element - Placeholder (Only show if room cleared later) */}
                         {roomStatus === 'cleared' && ( // Example: Only show when cleared
                            <div 
                               className="flex items-center justify-center rounded bg-green-600 text-white text-xs font-bold shadow-md"
                               style={getElementStyle(exitPos)}
                               aria-label="Exit"
                            >
                               E
                           </div>
                         )}
                     </div>
                 </div>
             )}
             {/* ----------------------------- */} 
        </Card>
    );
} 