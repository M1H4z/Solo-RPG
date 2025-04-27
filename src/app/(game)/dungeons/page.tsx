"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Hunter } from "@/types/hunter.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Placeholder type for active dungeon state
interface ActiveDungeonInfo {
  id: string;
  type: string; // e.g., "Goblin Dungeon"
  rank: string; // e.g., "E"
  currentDepth: number;
  currentRoom: number;
  timeRemaining?: string; // Optional: Format as needed
}

export default function DungeonsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get("hunterId");

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [activeDungeon, setActiveDungeon] = useState<ActiveDungeonInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hunter data and check for active dungeon
  useEffect(() => {
    if (!hunterId) {
      setError("Hunter ID is missing.");
      setLoading(false);
      return;
    }

    async function loadDungeonStatus() {
      setLoading(true);
      setError(null);
      try {
        // TODO: Implement API call to check for active dungeon & get hunter info
        // For now, we fetch hunter data and simulate dungeon state
        const hunterResponse = await fetch(`/api/hunters/${hunterId}`);
        if (!hunterResponse.ok) {
          throw new Error("Failed to load hunter data");
        }
        const hunterData = await hunterResponse.json();
        setHunter(hunterData.hunter);

        // --- SIMULATED DUNGEON STATE ---
        // Replace this with actual API call logic
        const hasActiveDungeon = false; // Math.random() > 0.5; // Simulate 50% chance
        if (hasActiveDungeon) {
          setActiveDungeon({
            id: "dungeon-123",
            type: "Goblin Dungeon", // Example
            rank: hunterData.hunter?.rank || "E",
            currentDepth: 1,
            currentRoom: 1,
            timeRemaining: "01:58:30", // Example
          });
        } else {
          setActiveDungeon(null);
        }
        // --- END SIMULATION ---
      } catch (err: any) {
        console.error("Error loading dungeon status:", err);
        setError(err.message || "Failed to load dungeon information.");
      } finally {
        setLoading(false);
      }
    }

    loadDungeonStatus();
  }, [hunterId]);

  const handleOpenNewGate = () => {
    // TODO: Implement logic to call API to create/open a new gate
    console.log("Attempting to open new gate...");
    alert("Opening new gate functionality not yet implemented.");
    // On success, should probably update activeDungeon state or redirect
  };

  const handleEnterDungeon = (dungeonId: string) => {
    // TODO: Implement navigation to the actual dungeon instance/view
    console.log("Entering dungeon:", dungeonId);
    alert("Entering dungeon functionality not yet implemented.");
    // router.push(`/dungeons/${dungeonId}?hunterId=${hunterId}`);
  };

  const handleAbandonGate = (dungeonId: string) => {
    // TODO: Implement logic to call API to abandon the gate
    if (
      window.confirm(
        "Are you sure you want to abandon this gate? You won't be able to re-enter.",
      )
    ) {
      console.log("Abandoning dungeon:", dungeonId);
      alert("Abandoning gate functionality not yet implemented.");
      // On success, should set activeDungeon to null
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-lg text-text-secondary">Checking Gate Status...</p>
      </div>
    );
  }

  // --- Error Display ---
  if (error || !hunter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-danger">
          <CardHeader>
            <CardTitle className="text-center text-danger">
              Error Loading Gate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-text-secondary">
              {error || "Could not load dungeon information for this hunter."}
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              &larr; Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Dungeons Display ---
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl sm:text-3xl">The Gate</CardTitle>
            <CardDescription>
              Enter dungeons to gain experience and find loot.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard?hunterId=${hunterId}`)}
          >
            &larr; Back to Dashboard
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {activeDungeon ? (
            // --- Active Gate Display ---
            <div className="space-y-4 text-center">
              <h3 className="text-xl font-semibold text-primary">
                Active Gate Detected!
              </h3>
              <Card className="border-primary/60 bg-surface/50">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {activeDungeon.type} [Rank {activeDungeon.rank}]
                  </CardTitle>
                  <CardDescription>
                    Current Location: Depth {activeDungeon.currentDepth} - Room{" "}
                    {activeDungeon.currentRoom}
                  </CardDescription>
                </CardHeader>
                {activeDungeon.timeRemaining && (
                  <CardContent>
                    <p className="text-sm text-accent">
                      Time Remaining: {activeDungeon.timeRemaining}
                    </p>
                  </CardContent>
                )}
              </Card>
              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <Button
                  size="lg"
                  glow="primary"
                  onClick={() => handleEnterDungeon(activeDungeon.id)}
                >
                  Enter Dungeon
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => handleAbandonGate(activeDungeon.id)}
                >
                  Abandon Gate
                </Button>
              </div>
              <p className="pt-2 text-xs text-text-secondary">
                You must complete or abandon the current gate before opening a
                new one.
              </p>
            </div>
          ) : (
            // --- No Active Gate Display ---
            <div className="space-y-4 text-center">
              <h3 className="text-xl font-semibold text-text-secondary">
                No Active Gate
              </h3>
              <p className="text-text-secondary">
                Dungeons will be randomly selected based on your rank (
                {hunter.rank}).
              </p>
              {/* TODO: Maybe show list of possible dungeon types for the rank */}
              <Button
                size="lg"
                variant="secondary"
                glow="secondary"
                onClick={handleOpenNewGate}
              >
                Open New Gate
              </Button>
              <p className="pt-2 text-xs text-text-secondary">
                Opening a gate will consume [Energy/Key?] and has a time limit.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
