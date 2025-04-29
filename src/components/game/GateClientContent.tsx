"use client";

import React, { useState, useEffect, Suspense } from "react";
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

// Placeholder type for active gate/dungeon state
interface ActiveGateInfo {
  id: string;
  type: string; // e.g., "Goblin Dungeon"
  rank: string; // e.g., "E"
  currentDepth: number;
  currentRoom: number;
  timeRemaining?: string; // Optional: Format as needed
}

// Inner component that uses the hook
function GateContent() { // Renamed from DungeonsContent
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get("hunterId");

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [activeGate, setActiveGate] = useState<ActiveGateInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hunter data and check for active gate
  useEffect(() => {
    if (!hunterId) {
      setError("Hunter ID is missing.");
      setLoading(false);
      return;
    }

    async function loadGateStatus() { // Renamed from loadDungeonStatus
      setLoading(true);
      setError(null);
      try {
        // TODO: Implement API call to check for active gate & get hunter info
        const hunterResponse = await fetch(`/api/hunters/${hunterId}`);
        if (!hunterResponse.ok) {
          throw new Error("Failed to load hunter data");
        }
        const hunterData = await hunterResponse.json();
        setHunter(hunterData.hunter);

        // --- SIMULATED GATE STATE --- // Updated comment
        const hasActiveGate = false; // Math.random() > 0.5; // Changed variable name
        if (hasActiveGate) {
          setActiveGate({ // Changed state setter name
            id: "gate-123", // Changed ID prefix
            type: "Goblin Dungeon",
            rank: hunterData.hunter?.rank || "E",
            currentDepth: 1,
            currentRoom: 1,
            timeRemaining: "01:58:30",
          });
        } else {
          setActiveGate(null); // Changed state setter name
        }
        // --- END SIMULATION --- //
      } catch (err: any) {
        console.error("Error loading gate status:", err); // Updated log message
        setError(err.message || "Failed to load gate information."); // Updated error message
      } finally {
        setLoading(false);
      }
    }

    loadGateStatus();
  }, [hunterId]);

  const handleOpenNewGate = () => {
    console.log("Attempting to open new gate...");
    // TODO: Implement actual API call to open a gate
    alert("Opening new gate functionality not yet implemented.");
  };

  const handleEnterGate = (gateId: string) => { // Renamed from handleEnterDungeon
    console.log("Entering gate:", gateId); // Updated log message
    // TODO: Navigate to the dungeon/combat interface
    alert("Entering gate functionality not yet implemented.");
  };

  const handleAbandonGate = (gateId: string) => { // Parameter renamed for clarity
    if (
      window.confirm(
        "Are you sure you want to abandon this gate? You won't be able to re-enter.",
      )
    ) {
      console.log("Abandoning gate:", gateId); // Updated log message
      // TODO: Implement API call to abandon the gate
      setActiveGate(null); // Clear the state locally after confirmation (or upon API success)
      alert("Abandoning gate functionality not yet implemented.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-lg text-text-secondary">Checking Gate Status...</p>
      </div>
    );
  }

  if (error || !hunter) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <Card className="w-full max-w-md border-danger">
          <CardHeader>
            <CardTitle className="text-center text-danger">
              Error Loading Gate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-text-secondary">
              {error || "Could not load gate information for this hunter."}
            </p>
            <Button variant="outline" onClick={() => router.back()}> 
              &larr; Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-full px-4 py-8 sm:py-12">
      <Card className="h-full">
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

        <CardContent className="flex h-[calc(100%-theme(space.28))] flex-col items-center justify-center space-y-6"> {/* Adjusted height and centering */} 
          {activeGate ? (
            <div className="w-full max-w-lg space-y-4 text-center"> {/* Added max-width */} 
              <h3 className="text-xl font-semibold text-primary">
                Active Gate Detected!
              </h3>
              <Card className="border-primary/60 bg-surface/50">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {activeGate.type} [Rank {activeGate.rank}]
                  </CardTitle>
                  <CardDescription>
                    Current Location: Depth {activeGate.currentDepth} - Room{" "}
                    {activeGate.currentRoom}
                  </CardDescription>
                </CardHeader>
                {activeGate.timeRemaining && (
                  <CardContent className="pb-4"> {/* Added padding bottom */} 
                    <p className="text-sm text-accent">
                      Time Remaining: {activeGate.timeRemaining}
                    </p>
                  </CardContent>
                )}
              </Card>
              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <Button
                  size="lg"
                  // glow="primary" // Assuming glow is a custom prop
                  onClick={() => handleEnterGate(activeGate.id)} // Updated handler call
                >
                  Enter Gate
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => handleAbandonGate(activeGate.id)} // Updated handler call
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
            <div className="w-full max-w-lg space-y-4 text-center"> {/* Added max-width */} 
              <h3 className="text-xl font-semibold text-text-secondary">
                No Active Gate
              </h3>
              <p className="text-text-secondary">
                Gates will be randomly selected based on your rank (
                {hunter.rank}).
              </p>
              <Button
                size="lg"
                variant="secondary"
                // glow="secondary" // Assuming glow is a custom prop
                onClick={handleOpenNewGate}
              >
                Open New Gate
              </Button>
              <p className="pt-2 text-xs text-text-secondary">
                Opening a gate might consume resources and has a time limit.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export the component wrapped in Suspense
export default function GateClientContent() { // Renamed default export
    return (
        <Suspense fallback={
          <div className="flex h-full w-full items-center justify-center">
             Loading gate content...
          </div>
        }>
            <GateContent />
        </Suspense>
    );
} 