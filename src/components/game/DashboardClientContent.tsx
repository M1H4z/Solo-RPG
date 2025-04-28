"use client";

import { redirect, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense, useCallback } from "react"; // Import useCallback
import { Hunter, AllocatableStat } from "@/types/hunter.types"; // Import AllocatableStat
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toaster, toast } from "sonner"; // Import sonner
import HunterStatsAllocator from "@/components/hunters/HunterStatsAllocator"; // Import the new component
import { calculateDerivedStats } from "@/lib/stats"; // Import from lib/stats.ts
import { Separator } from "@/components/ui/Separator"; // Import Separator
import RealTimeClock from "@/components/ui/RealTimeClock"; // Removed .tsx

// Define rank requirements (could be moved to constants later)
const RANK_UP_REQUIREMENTS = {
  E: { level: 15, nextRank: "D" },
  D: { level: 30, nextRank: "C" },
  C: { level: 50, nextRank: "B" },
  B: { level: 75, nextRank: "A" },
  A: { level: 100, nextRank: "S" },
  S: { level: Infinity, nextRank: null }, // Max rank
};

// This component fetches data and uses searchParams
function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hunterId = searchParams.get("hunterId");

    const [hunter, setHunter] = useState<Hunter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expLoading, setExpLoading] = useState(false);
    const [allocationError, setAllocationError] = useState<string | null>(null);
    const [expToAdd, setExpToAdd] = useState<number>(100);

    // Refetch function
    const fetchHunterData = useCallback(async () => { // Wrap in useCallback
      if (!hunterId) return;
      setError(null);
      setAllocationError(null);
      setLoading(true);
      try {
        const response = await fetch(`/api/hunters/${hunterId}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/hunters");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load hunter data");
        }
        const data = await response.json();
        setHunter(data.hunter);
      } catch (err: any) {
        console.error("Error loading hunter on dashboard:", err);
        setError(err.message || "Failed to load hunter data.");
        setHunter(null);
      } finally {
        setLoading(false);
      }
    }, [hunterId, router]); // Add dependencies

    // Initial fetch
    useEffect(() => {
      if (!hunterId) {
        setError("Hunter ID is missing.");
        setLoading(false);
        return;
      }
      fetchHunterData();
    }, [hunterId, fetchHunterData]); // Use fetchHunterData here

    // --- Handler for gaining EXP ---
    const handleGainExp = async (amount: number) => {
      if (!hunterId || !hunter) return;

      // Store previous state
      const previousHunter = { ...hunter };

      // Optimistic Update (simple: just update EXP)
      const optimisticHunter = {
        ...hunter,
        experience: (hunter.experience ?? 0) + amount,
      };
      setHunter(optimisticHunter);
      setExpLoading(true);
      // --- End Optimistic Update

      try {
        const response = await fetch(`/api/hunters/${hunterId}/gain-exp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experienceGained: amount }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to gain EXP");
        }
        console.log("Gain EXP Result:", result);
        toast.success(
          `${result.message}${result.levelUp ? ` | Leveled up to ${result.newLevel}! Points: ${result.statPointsGained} Stat, ${result.skillPointsGained} Skill.` : ""}`,
        );
        // Sync with backend confirmed state (important for level ups/points)
        if (result.updatedHunter) {
          setHunter(result.updatedHunter);
        } else {
          console.warn("API did not return updatedHunter data after gaining EXP. Reverting optimistic update.");
          setHunter(previousHunter); // Revert if no data
        }
      } catch (err: any) {
        console.error("Error gaining EXP:", err);
        toast.error(`Error gaining EXP: ${err.message}`);
        // Rollback UI on error
        setHunter(previousHunter);
      } finally {
        setExpLoading(false);
      }
    };

    // --- Handler for allocating stat points ---
    const handleAllocateStat = async (statName: AllocatableStat) => {
      if (!hunterId || !hunter || hunter.statPoints <= 0) return;

      // Store state BEFORE optimistic update for potential full revert on final error
      // const previousHunter = { ...hunter }; // We will refetch on error instead

      // Optimistic Update - DO THIS BEFORE the await
      setHunter(currentHunter => {
        if (!currentHunter || currentHunter.statPoints <= 0) return currentHunter; // Guard against race conditions
        return {
          ...currentHunter,
          statPoints: (currentHunter.statPoints ?? 0) - 1,
          [statName]: (currentHunter[statName] ?? 0) + 1,
        };
      });
      // setStatLoading(statName); // Remove loading state per button
      setAllocationError(null);

      try {
          const result = await fetch(`/api/hunters/${hunterId}/allocate-stat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ statName }),
          });
          const data = await result.json();

          if (!result.ok) {
              // If API fails, the optimistic update was wrong. Refetch to sync.
              throw new Error(data.error || `Failed to allocate point to ${statName}`);
          }

          // API Succeeded! Trust the optimistic update.
          // We don't need to setHunter from the response here,
          // as the optimistic update already handled the UI change.
          // The fetchHunterData() in the catch block will handle resync on failure.
          toast.success(data.message || `Allocated 1 point to ${statName}.`);

      } catch (err: any) {
          console.error(`Error allocating ${statName}:`, err);
          toast.error(`Error allocating ${statName}: ${err.message}. Resyncing...`);
          // Rollback UI by refetching the source of truth
          await fetchHunterData();
          setAllocationError(err.message || "Failed to allocate point.");
      } finally {
          // setStatLoading(null); // Remove loading state per button
      }
  };

    const handleAdjustExp = (change: number) => {
        setExpToAdd((prev) => Math.max(100, prev + change)); // Min 100
    };

    // --- Loading State ---
    if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <p className="text-lg text-text-secondary">Loading Dashboard...</p>
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
                Error Loading Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6 text-text-secondary">
                {error || "Could not load hunter information."}
              </p>
              <Button variant="outline" asChild>
                <Link href="/hunters">&larr; Back to Hunter Selection</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Calculate derived stats
    const derivedStats = calculateDerivedStats(hunter);

    // Extract values for easier use in JSX (copied from ProfileClientContent)
    const currentExp = hunter.experience ?? 0;
    const expForLevelGain = derivedStats.expNeededForNextLevel ?? 1;
    const expProgressInCurrentLevel = derivedStats.expProgressInCurrentLevel ?? 0;
    const isMaxLevel = derivedStats.isMaxLevel ?? false;

    let isRankUpAvailable = false;
    let nextRank: string | null = null;
    if (hunter.rank !== "S") {
      const currentRankKey = hunter.rank as keyof typeof RANK_UP_REQUIREMENTS;
      const currentRankReq = RANK_UP_REQUIREMENTS[currentRankKey];
      if (currentRankReq && hunter.level >= currentRankReq.level) {
        isRankUpAvailable = true;
        nextRank = currentRankReq.nextRank;
      }
    }

    const handleRankUpClick = () => {
      console.log(`Initiating Rank-Up Quest for Rank ${nextRank}...`);
      // Replace alert with toast
      toast.info(
        `Starting Rank-Up Quest to achieve Rank ${nextRank}! (Not implemented yet)`,
      );
    };

    return (
      <>
        <Toaster position="bottom-right" richColors />
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6">
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Dashboard</h1>
              <div className="justify-self-center">
                <RealTimeClock />
              </div>
              <div className="justify-self-end">
                <Button variant="link" className="px-0 text-sm" asChild>
                  <Link href="/hunters">&larr; Change Hunter</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Basic Info</CardTitle> 
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 gap-y-2">
                   <p>Name: <span className="font-semibold">{hunter.name}</span></p>
                   <p>Level: <span className="font-semibold">{hunter.level}</span></p>
                   <p>Class: <span className="font-semibold">{hunter.class}</span></p>
                   <p>Rank: <span className="font-semibold">{hunter.rank}</span></p>
                </div>
                
                <Separator />

                <div>
                  <p>HP: <span className="font-semibold">{derivedStats.currentHP} / {derivedStats.maxHP}</span></p>
                  <div className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-green-500 transition-all duration-300 ease-out" style={{ width: `${((derivedStats.currentHP ?? 0) / (derivedStats.maxHP ?? 1)) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <p>MP: <span className="font-semibold">{derivedStats.currentMP} / {derivedStats.maxMP}</span></p>
                  <div className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${((derivedStats.currentMP ?? 0) / (derivedStats.maxMP ?? 1)) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <p>EXP: <span className="font-semibold">
                    {isMaxLevel ? `MAX (${currentExp.toLocaleString()})` : `${expProgressInCurrentLevel.toLocaleString()} / ${expForLevelGain.toLocaleString()}`}
                  </span></p>
                  <progress
                    className="[&::-webkit-progress-bar]:bg-background-secondary [&::-webkit-progress-value]:bg-yellow-500 [&::-moz-progress-bar]:bg-yellow-500 h-2 w-full [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg mt-1"
                    value={isMaxLevel ? expForLevelGain : expProgressInCurrentLevel} 
                    max={expForLevelGain <= 0 ? 1 : expForLevelGain} 
                    aria-label={`Experience progress: ${isMaxLevel ? "Max Level" : `${expProgressInCurrentLevel} out of ${expForLevelGain}`}`}
                  />
                </div>
                <div className="mt-4 space-y-1 border-t border-border-dark pt-4">
                  <p>Stat Points: <span className="font-semibold text-primary">{hunter.statPoints ?? 0}</span></p>
                  <p>Skill Points: <span className="font-semibold text-secondary">{hunter.skillPoints ?? 0}</span></p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {isRankUpAvailable && (
                  <Button
                    variant="destructive"
                    className="w-full sm:col-span-2"
                    onClick={handleRankUpClick}
                    aria-label={`Start Rank-Up Quest for Rank ${nextRank}`}
                  >
                    Rank-Up Quest (Rank {nextRank})
                  </Button>
                )}
                <Button variant="default" className="w-full" asChild>
                  <Link
                    href={`/dungeons?hunterId=${hunterId}`}
                    className="flex size-full items-center justify-center"
                  >
                    Enter Gate
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full" asChild>
                  <Link
                    href={`/inventory?hunterId=${hunterId}`}
                    className="flex size-full items-center justify-center"
                  >
                    Inventory
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full" asChild>
                  <Link
                    href={`/shop?hunterId=${hunterId}`}
                    className="flex size-full items-center justify-center"
                  >
                    Shop
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full" asChild>
                   <Link
                     href={`/profile?hunterId=${hunterId}`}
                     className="flex size-full items-center justify-center"
                   >
                     Profile
                   </Link>
                 </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
}

// Wrap the component that uses searchParams with Suspense
export default function DashboardClientContent() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}> {/* Add Fallback UI */}
      <DashboardContent />
    </Suspense>
  );
}