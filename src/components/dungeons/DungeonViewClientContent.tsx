"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Keep router for potential navigation
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/Card'; // For styling the view area
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Button } from '@/components/ui/Button'; // Corrected casing
import CombatInterface from '@/components/combat/CombatInterface'; // <-- Import CombatInterface
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

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
            {roomStatus === 'combat' && hunterCombatData && enemyCombatData && (
                <div className="h-[70vh]"> {/* Give combat view fixed height */} 
                 <CombatInterface 
                    gateId={gateId}
                    hunterData={hunterCombatData}
                    enemyData={enemyCombatData}
                    onCombatEnd={handleCombatEnd}
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