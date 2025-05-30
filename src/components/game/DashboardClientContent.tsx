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
import { calculateDerivedStats } from "@/lib/game/stats"; // Updated Import Path
import { Separator } from "@/components/ui/Separator"; // Import Separator
import RealTimeClock from "@/components/ui/RealTimeClock"; // Removed .tsx
import { HUNTER_CLASSES } from "@/constants/classes";
import { Coins, Gem, Settings, Clock } from "lucide-react"; // Import currency icons
import { WalletConnectButton } from "@/components/solana/WalletConnectButton";
import ChatPanel from "@/components/multiplayer/ChatPanel";
import { StatsRadarChart } from '@/components/hunters/StatsRadarChart';
import { cn } from '@/lib/utils';

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
    const [isChatMinimized, setIsChatMinimized] = useState(false);

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
      <div className="container mx-auto px-4 py-8 sm:py-12 pb-24">
        {/* Make Header Card sticky */}
        <Card className="mb-6 sm:mb-8 sticky top-0 z-50">
            {/* Responsive Header (keep inner styles) */}
            <CardHeader className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
              <h1 className="text-lg font-bold text-text-primary sm:text-xl">
                  Dashboard
              </h1>
              <div className="justify-self-center flex items-center">
                <RealTimeClock />
              </div>
              <div className="justify-self-end flex items-center">
                <Button variant="link" className="px-0 text-xs sm:text-sm" asChild>
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
                   <Separator className="my-2 bg-border-dark" />
                   <p className="flex items-center"> 
                       <Coins className="mr-1.5 h-4 w-4 text-yellow-500" /> 
                       Gold: <span className="font-semibold ml-1">{(hunter.gold ?? 0).toLocaleString()}</span>
                   </p>
                   <p className="flex items-center"> 
                       <Gem className="mr-1.5 h-4 w-4 text-blue-400" /> 
                       Diamonds: <span className="font-semibold ml-1">{(hunter.diamonds ?? 0).toLocaleString()}</span>
                   </p>
                   <WalletConnectButton />
                   <Separator className="my-2 bg-border-dark" />
                </div>
                
                <Separator />

                <div>
                  <p>HP: <span className="font-semibold">{derivedStats.currentHP} / {derivedStats.maxHP}</span></p>
                  <progress
                    className="[&::-webkit-progress-bar]:bg-background-secondary [&::-webkit-progress-value]:bg-green-500 [&::-moz-progress-bar]:bg-green-500 h-2 w-full [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg mt-1"
                    value={derivedStats.currentHP ?? 0}
                    max={derivedStats.maxHP ?? 1}
                    aria-label={`HP: ${derivedStats.currentHP} out of ${derivedStats.maxHP}`}
                  />
                </div>
                <div>
                  <p>MP: <span className="font-semibold">{derivedStats.currentMP} / {derivedStats.maxMP}</span></p>
                  <progress
                    className="[&::-webkit-progress-bar]:bg-background-secondary [&::-webkit-progress-value]:bg-blue-500 [&::-moz-progress-bar]:bg-blue-500 h-2 w-full [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg mt-1"
                    value={derivedStats.currentMP ?? 0}
                    max={derivedStats.maxMP ?? 1}
                    aria-label={`MP: ${derivedStats.currentMP} out of ${derivedStats.maxMP}`}
                  />
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
                  href={`/gate?hunterId=${hunterId}`}
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

      {/* Sticky Chat Panel - Always visible and positioned in bottom-left */}
      {hunter && (
        <div className="fixed bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto z-40">
          <ChatPanel
            currentHunter={{
              id: hunter.id,
              userId: hunter.userId,
              name: hunter.name,
              level: hunter.level,
              class: hunter.class,
              rank: hunter.rank,
            }}
            location="dashboard"
            defaultChannel="global"
            isMinimized={isChatMinimized}
            onMinimize={() => setIsChatMinimized(!isChatMinimized)}
            className={isChatMinimized ? '' : 'w-full sm:w-96 h-56 sm:h-64'}
          />
        </div>
      )}
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