"use client";

import React, { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Hunter, AllocatableStat } from "@/types/hunter.types";
import { SkillRank } from "@/types/skill.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import HunterStatsAllocator from "@/components/hunters/HunterStatsAllocator"; // Import stats component
import SkillsDisplay from "@/components/skills/SkillsDisplay"; // Import skills component
import { getSkillById } from "@/constants/skills"; // Needed for skill handlers
import { calculateDerivedStats } from "@/lib/stats"; // Import from lib/stats.ts
import RealTimeClock from "@/components/ui/RealTimeClock"; // Import the clock
import { CurrencyHistoryChart } from "@/components/game/CurrencyHistoryChart"; // Use named import
import { Input } from "@/components/ui/Input"; // Import Input for amount
import { cn } from "@/lib/utils"; // Import cn for conditional classes

const MAX_EQUIPPED = 4; // Define for equip logic

// --- Profile Content Component ---
function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get("hunterId");

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set()); // For skills
  const [rankFilter, setRankFilter] = useState<SkillRank | "All">("All"); // For skills display
  const [expLoading, setExpLoading] = useState(false); // State for EXP button loading
  const [expToAdd, setExpToAdd] = useState<number>(100); // State for EXP amount
  // Add state for gold adjustment
  const [goldLoading, setGoldLoading] = useState(false);
  const [goldAdjustmentAmount, setGoldAdjustmentAmount] = useState<number>(100);
  const [diamondAmount, setDiamondAmount] = useState<number>(10); // State for diamond amount
  const [isAdjustingGold, setIsAdjustingGold] = useState(false);
  const [isAdjustingDiamonds, setIsAdjustingDiamonds] = useState(false); // State for diamond adjustment loading

  // --- Data Fetching ---
  const fetchHunterData = useCallback(async (isRefetch = false) => {
    if (!hunterId) {
      setError("Hunter ID missing.");
      setLoading(false);
      return;
    }
    if (!isRefetch) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/hunters/${hunterId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/hunters"); return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load hunter data");
      }
      const data = await response.json();
      setHunter(data.hunter);
    } catch (err: any) {
      console.error("Error loading hunter profile:", err);
      setError(err.message);
      setHunter(null);
    } finally {
      if (!isRefetch) setLoading(false);
      // Reset specific loading states after fetch completes
      setActionLoading(new Set()); // Clear skill loading on full refetch
    }
  }, [hunterId, router]);

  useEffect(() => {
    fetchHunterData();
  }, [fetchHunterData]);

  // --- Stat Allocation Logic (Copied/Adapted from Dashboard) ---
   const handleAllocateStat = async (statName: AllocatableStat) => {
      if (!hunterId || !hunter || hunter.statPoints <= 0) return;

      const optimisticHunter = {
        ...hunter,
        statPoints: (hunter.statPoints ?? 0) - 1,
        [statName]: (hunter[statName as keyof Hunter] ?? 0) + 1,
      };
      setHunter(optimisticHunter); // Optimistic Update

      try {
          const result = await fetch(`/api/hunters/${hunterId}/allocate-stat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ statName }),
          });
          const data = await result.json();
          if (!result.ok) throw new Error(data.error || `Failed to allocate point`);

          // On success, DO NOTHING to hunter state. Trust optimistic update.
          toast.success(data.message || `Allocated 1 point to ${statName}.`);
          // Remove state update from response:
          // if (data.hunter) {
          //    setHunter(data.hunter);
          // } else {
          //   console.warn("Allocate stat API did not return hunter data. Relying on optimistic state.")
          // }

      } catch (err: any) {
          console.error(`Error allocating ${statName}:`, err);
          toast.error(`Error allocating ${statName}: ${err.message}. Resyncing...`);
          await fetchHunterData(true); // Refetch on error
      }
  };

  // --- EXP Gain Logic (Copied from Dashboard) ---
  const handleAdjustExp = (change: number) => {
    setExpToAdd((prev) => Math.max(100, prev + change)); // Min 100
  };

  const handleGainExp = async (amount: number) => {
    if (!hunterId || !hunter || expLoading) return;

    // Store previous state for potential rollback
    const previousHunter = hunter ? { ...hunter } : null;

    setExpLoading(true);
    // Perform optimistic update if desired, or wait for API response
    // Example (simple optimistic update - adjust as needed):
    setHunter(currentHunter => {
        if (!currentHunter) return null;
        return {
            ...currentHunter,
            experience: (currentHunter.experience ?? 0) + amount,
        };
    });

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
      toast.success(
        `${result.message}${result.levelUp ? ` | Leveled up to ${result.newLevel}! Points: ${result.statPointsGained} Stat, ${result.skillPointsGained} Skill.` : ""}`,
      );
      // Sync with backend confirmed state (important for level ups/points)
      if (result.updatedHunter) {
        setHunter(result.updatedHunter);
      } else {
        console.warn("API did not return updatedHunter data after gaining EXP. Reverting optimistic update if one was made, otherwise state might be slightly off until next fetch.");
        if (previousHunter) setHunter(previousHunter); // Revert if possible
      }
    } catch (err: any) {
      console.error("Error gaining EXP:", err);
      toast.error(`Error gaining EXP: ${err.message}`);
      // Rollback UI on error if optimistic update was performed
       if (previousHunter) setHunter(previousHunter);
    } finally {
      setExpLoading(false);
    }
  };

  // --- Skill Management Logic (Copied/Adapted from SkillsClientContent) ---
  const handleApiCall = async ( // Generic function for skill API calls
    actionType: "unlock" | "equip" | "unequip",
    skillId: string,
  ) => {
     if (!hunter) {
      console.error("Cannot perform skill action without hunter data.");
      setError("Hunter data not available for skill action.");
      return; // Or throw error
    }
    setError(null);
    const endpointMap = {
      unlock: `/api/hunters/${hunter.id}/unlock-skill`,
      equip: `/api/hunters/${hunter.id}/equip-skill`,
      unequip: `/api/hunters/${hunter.id}/unequip-skill`,
    };

    try {
      const response = await fetch(endpointMap[actionType], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Failed to ${actionType} skill.`);

      console.log(`${actionType} successful:`, result);
      // On success, trust optimistic update (logic from previous step)
    } catch (err: any) {
      console.error(`Failed to ${actionType} skill (${skillId}):`, err);
      setError(err.message || `An error occurred while trying to ${actionType} the skill.`);
      await fetchHunterData(true); // Refetch on error to correct state
    }
  };

  // --- Skill Handlers with Optimistic Updates --- 
  const handleUnlockSkill = async (skillId: string) => {
    if (!hunter || actionLoading.has(skillId) || (hunter.skillPoints ?? 0) <= 0) return;
    const skillToUnlock = getSkillById(skillId);
    if (!skillToUnlock) return;

    setActionLoading((prev) => new Set(prev).add(skillId));
    setHunter(currentHunter => {
      if (!currentHunter) return null;
      return {
        ...currentHunter,
        skillPoints: (currentHunter.skillPoints ?? 0) - skillToUnlock.skillPointCost,
        unlockedSkills: [...(currentHunter.unlockedSkills || []), skillId],
      };
    });

    try {
      await handleApiCall("unlock", skillId);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  const handleEquipSkill = async (skillId: string) => {
    if (!hunter || actionLoading.has(skillId) || (hunter.equippedSkills?.length ?? 0) >= MAX_EQUIPPED) return;

    setActionLoading((prev) => new Set(prev).add(skillId));
    setHunter(currentHunter => {
      if (!currentHunter) return null;
      return {
        ...currentHunter,
        equippedSkills: [...(currentHunter.equippedSkills || []), skillId],
      };
    });

    try {
      await handleApiCall("equip", skillId);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  const handleUnequipSkill = async (skillId: string) => {
    if (!hunter || actionLoading.has(skillId)) return;

    setActionLoading((prev) => new Set(prev).add(skillId));
    setHunter(currentHunter => {
       if (!currentHunter) return null;
       return {
         ...currentHunter,
         equippedSkills: (currentHunter.equippedSkills || []).filter((id) => id !== skillId),
       };
    });

    try {
      await handleApiCall("unequip", skillId);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  // --- Gold Adjustment Logic (New) ---
  const handleGoldAmountChange = (change: number) => {
    setGoldAdjustmentAmount((prev) => Math.max(100, prev + change)); // Min 100
  };

  const handleAdjustGold = async (amount: number) => {
    if (!hunterId || !hunter || goldLoading) return;

    const action = amount > 0 ? "Add" : "Remove";
    const absAmount = Math.abs(amount);

    setGoldLoading(true);

    // Optimistic update (optional, can be simple)
    const previousGold = hunter.gold ?? 0;
    setHunter(currentHunter => {
      if (!currentHunter) return null;
      return {
        ...currentHunter,
        gold: (currentHunter.gold ?? 0) + amount,
      };
    });

    try {
      const response = await fetch(`/api/hunters/${hunterId}/adjust-gold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }), // Send positive or negative amount
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action.toLowerCase()} gold`);
      }
      toast.success(
        `${action === 'Add' ? 'Added' : 'Removed'} ${absAmount} Gold. New balance: ${result.newBalance?.toLocaleString()}`
      );
      // Sync with backend confirmed state
       if (result.updatedHunter) {
         setHunter(prev => prev ? { ...prev, gold: result.updatedHunter.gold } : null);
       } else {
          console.warn("API did not return updatedHunter data after adjusting gold. Relying on optimistic update.");
       }

    } catch (err: any) {
      console.error(`Error ${action.toLowerCase()}ing gold:`, err);
      toast.error(`Error: ${err.message}`);
      // Rollback UI on error
      setHunter(prev => prev ? { ...prev, gold: previousGold } : null);
    } finally {
      setGoldLoading(false);
    }
  };

  // --- Diamond Adjustment Logic (New) ---
  const handleAdjustDiamonds = async (amount: number) => {
    if (!hunterId || !hunter || isAdjustingDiamonds) return;

    const action = amount > 0 ? "Add" : "Remove";
    const absAmount = Math.abs(amount);

    setIsAdjustingDiamonds(true);

    // Optimistic update (optional, can be simple)
    const previousDiamonds = hunter.diamonds ?? 0;
    setHunter(currentHunter => {
      if (!currentHunter) return null;
      return {
        ...currentHunter,
        diamonds: (currentHunter.diamonds ?? 0) + amount,
      };
    });

    try {
      const response = await fetch(`/api/hunters/${hunterId}/adjust-diamonds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }), // Send positive or negative amount
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action.toLowerCase()} diamonds`);
      }
      toast.success(
        `${action === 'Add' ? 'Added' : 'Removed'} ${absAmount} Diamonds. New balance: ${result.newBalance?.toLocaleString()}`
      );
      // Sync with backend confirmed state
       if (result.updatedHunter) {
         setHunter(prev => prev ? { ...prev, diamonds: result.updatedHunter.diamonds } : null);
       } else {
          console.warn("API did not return updatedHunter data after adjusting diamonds. Relying on optimistic update.");
       }

    } catch (err: any) {
      console.error(`Error ${action.toLowerCase()}ing diamonds:`, err);
      toast.error(`Error: ${err.message}`);
      // Rollback UI on error
      setHunter(prev => prev ? { ...prev, diamonds: previousDiamonds } : null);
    } finally {
      setIsAdjustingDiamonds(false);
    }
  };

  // --- Render Logic ---
  if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
  if (error || !hunter) return <div className="p-10 text-center text-danger">Error: {error || "Could not load profile."}</div>;

  // --- Calculate derived values using imported function ---
  const derivedStats = calculateDerivedStats(hunter);

  const currentExp = hunter.experience ?? 0;
  const expForLevelGain = derivedStats.expNeededForNextLevel ?? 1;
  const expProgressInCurrentLevel = derivedStats.expProgressInCurrentLevel ?? 0;
  const isMaxLevel = derivedStats.isMaxLevel ?? false;

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <Toaster position="bottom-right" richColors />
      
      <Card className="mb-6 sm:mb-8 sticky top-0 z-50">
          <CardHeader className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">
              Profile
            </h1>
            <div className="justify-self-center flex items-center">
                <RealTimeClock />
            </div>
            <div className="justify-self-end flex items-center">
                <Button variant="link" className="px-0 text-xs sm:text-sm" asChild>
                  <Link href={`/dashboard?hunterId=${hunterId}`}>
                    &larr; Back to Dashboard
                  </Link>
                </Button>
            </div>
          </CardHeader>
      </Card>

      {/* Main 2-Column Grid Layout - Force equal width columns */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">

        {/* Column 1: Basic Info Card */}
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            {/* Arrange content vertically */}
            <CardContent className="space-y-3 text-sm">
              {/* Text Info Group - Change to single column */}
              <div className="grid grid-cols-1 gap-y-2"> {/* Changed grid-cols-2 to grid-cols-1 and adjusted gap */}
                 <p>Name: <span className="font-semibold">{hunter.name}</span></p>
                 <p>Level: <span className="font-semibold">{hunter.level}</span></p>
                 <p>Class: <span className="font-semibold">{hunter.class}</span></p>
                 <p>Rank: <span className="font-semibold">{hunter.rank}</span></p>
              </div>
              
              <Separator />

              {/* HP Group */}
              <div>
                <p>HP: <span className="font-semibold">{derivedStats.currentHP} / {derivedStats.maxHP}</span></p>
                <div className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-green-500 transition-all duration-300 ease-out" style={{ width: `${(derivedStats.currentHP / derivedStats.maxHP) * 100}%` }} />
                </div>
              </div>
              {/* MP Group */}
              <div>
                <p>MP: <span className="font-semibold">{derivedStats.currentMP} / {derivedStats.maxMP}</span></p>
                <div className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${(derivedStats.currentMP / derivedStats.maxMP) * 100}%` }} />
                </div>
              </div>
              {/* EXP Group */} 
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

                {/* Re-add EXP Test Button Group */}
                <div className="mt-4 border-t border-border-dark pt-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustExp(-100)}
                      disabled={expLoading || expToAdd <= 100}
                      aria-label="Decrease EXP amount by 100"
                      className="px-2"
                    >
                      -
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGainExp(expToAdd)}
                      disabled={expLoading}
                      className="flex-grow"
                    >
                      {expLoading ? "Gaining EXP..." : `Gain ${expToAdd} EXP (Test)`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustExp(100)}
                      disabled={expLoading}
                      aria-label="Increase EXP amount by 100"
                      className="px-2"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Currency Card */}
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Currency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
               {/* Existing Currency Display */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-text-secondary">Gold:</span>
                <span className="font-semibold text-accent">{hunter.gold?.toLocaleString() ?? 0} G</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-text-secondary">Diamonds:</span>
                <span className="font-semibold text-accent-diamond">{hunter.diamonds?.toLocaleString() ?? 0} ♦</span>
              </div>

              {/* Gold Adjustment Test Buttons - Moved below currency display */}
               <div className="flex items-center space-x-2 pt-2"> {/* New flex container */} 
                   <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleGoldAmountChange(-100)}
                       disabled={goldLoading || goldAdjustmentAmount <= 100}
                       aria-label="Decrease gold adjustment amount by 100"
                       className="px-2 h-8" // Adjust height
                   >
                       -
                   </Button>
                   <span className="text-sm font-medium text-center tabular-nums w-12"> {/* Fixed width for amount */}
                      {goldAdjustmentAmount}
                   </span>
                   <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleGoldAmountChange(100)}
                       disabled={goldLoading}
                       aria-label="Increase gold adjustment amount by 100"
                       className="px-2 h-8" // Adjust height
                   >
                       +
                   </Button>
                   <div className="flex-grow" /> {/* Spacer */} 
                   <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleAdjustGold(-goldAdjustmentAmount)} // Remove gold
                       disabled={goldLoading || (hunter?.gold ?? 0) < goldAdjustmentAmount}
                       className="h-8 text-danger hover:text-danger hover:bg-danger/10 border-danger/50 hover:border-danger text-xs px-2" // Smaller text/padding
                   >
                       {goldLoading ? "..." : "Remove"} {/* Shorter text */} 
                   </Button>
                   <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleAdjustGold(goldAdjustmentAmount)} // Add gold
                       disabled={goldLoading}
                       className="h-8 text-success hover:text-success hover:bg-success/10 border-success/50 hover:border-success text-xs px-2" // Smaller text/padding
                   >
                       {goldLoading ? "..." : "Add"} {/* Shorter text */} 
                   </Button>
              </div>

              {/* Diamond Adjustment Test Buttons - Corrected Syntax */}
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  size="sm" variant="outline"
                  onClick={() => setDiamondAmount((prev) => Math.max(1, prev - 1))}
                  disabled={isAdjustingDiamonds} aria-label="Decrease Diamond Amount"
                  className="px-2 h-8"> {/* Match gold button style */}
                  -
                </Button>
                <span className="text-sm font-medium text-center tabular-nums w-12"> {/* Match gold amount style */}
                  {diamondAmount}
                </span>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setDiamondAmount((prev) => prev + 1)}
                  disabled={isAdjustingDiamonds} aria-label="Increase Diamond Amount"
                  className="px-2 h-8"> {/* Match gold button style */}
                  +
                </Button>
                <div className="flex-grow" /> {/* Spacer */}
                <Button
                  size="sm" variant="outline"
                  onClick={() => handleAdjustDiamonds(-diamondAmount)} disabled={isAdjustingDiamonds}
                  className="h-8 text-danger hover:text-danger hover:bg-danger/10 border-danger/50 hover:border-danger text-xs px-2"> {/* Match Remove Gold style */}
                  {isAdjustingDiamonds ? "..." : "Remove"}
                </Button>
                <Button
                  size="sm" variant="outline"
                  onClick={() => handleAdjustDiamonds(diamondAmount)} disabled={isAdjustingDiamonds}
                  className="h-8 text-success hover:text-success hover:bg-success/10 border-success/50 hover:border-success text-xs px-2"> {/* Match Add Gold style */}
                  {isAdjustingDiamonds ? "..." : "Add"}
                </Button>
              </div>

              {/* Separator and Chart */}
              <Separator className="my-4" />
              <h4 className="text-sm font-medium text-text-primary mb-2">Transaction History</h4>
              <CurrencyHistoryChart hunterId={hunter.id} />

            </CardContent>
          </Card>
        </div>

        {/* Allocate Stats Card (Row 2, Span 2 Cols) */}
        <div className="md:col-span-2">
           <Card className="h-full">
             <CardHeader>
               <CardTitle>Allocate Stats</CardTitle>
             </CardHeader>
             <CardContent>
                <HunterStatsAllocator
                  hunter={hunter}
                  derivedStats={derivedStats}
                  onAllocateStat={handleAllocateStat}
                  loading={false}
                />
             </CardContent>
           </Card>
        </div>

        {/* Manage Skills Card (Row 3, Spanning 2 Cols) */}
        <div className="md:col-span-2">
           <Card>
             <CardHeader>
               <CardTitle>Manage Skills</CardTitle>
                 <p className="text-sm text-text-secondary">
                   Skill Points Available: <span className="font-semibold text-secondary">{hunter.skillPoints ?? 0}</span>
                 </p>
             </CardHeader>
             <CardContent>
                 <SkillsDisplay
                   hunter={hunter}
                   handleUnlockSkill={handleUnlockSkill}
                   handleEquipSkill={handleEquipSkill}
                   handleUnequipSkill={handleUnequipSkill}
                   actionLoading={actionLoading}
                   rankFilter={rankFilter}
                   setRankFilter={setRankFilter}
                 />
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

// --- Main Export --- 
export default function ProfileClientContent() {
  // Wrap ProfileContent in Suspense to handle potential async operations within useSearchParams
  return (
    <Suspense fallback={<div>Loading profile content...</div>}>
      <ProfileContent />
    </Suspense>
  );
} 