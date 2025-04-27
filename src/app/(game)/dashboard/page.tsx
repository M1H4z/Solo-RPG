'use client';

import { redirect, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Hunter } from '@/types/hunter.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Define the expected shape of searchParams for this page
interface DashboardPageProps {
  // searchParams are now handled by the hook
  // searchParams?: { 
  //   hunterId?: string;
  // };
}

// Define the type for the stats we can allocate points to
type AllocatableStat = 'strength' | 'agility' | 'perception' | 'intelligence' | 'vitality';

// Define rank requirements (could be moved to constants later)
const RANK_UP_REQUIREMENTS = {
  E: { level: 15, nextRank: 'D' },
  D: { level: 30, nextRank: 'C' },
  C: { level: 50, nextRank: 'B' },
  B: { level: 75, nextRank: 'A' },
  A: { level: 100, nextRank: 'S' },
  S: { level: Infinity, nextRank: null }, // Max rank
};

// Convert to functional component to use hooks
export default function DashboardPage({ }: DashboardPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Use hook to get search params
  const hunterId = searchParams.get('hunterId'); // Get hunterId from hook

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expLoading, setExpLoading] = useState(false); // State for EXP button loading
  const [statLoading, setStatLoading] = useState<AllocatableStat | null>(null); // Track which stat is being allocated
  const [allocationError, setAllocationError] = useState<string | null>(null); // Specific error for stat allocation

  // Refetch function (extracted for reuse)
  async function fetchHunterData() {
    if (!hunterId) return; // Guard against missing ID
    // Reset errors on refetch
    setError(null);
    setAllocationError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/hunters/${hunterId}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Hunter ${hunterId} not found/access denied, redirecting.`);
          router.push('/hunters');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load hunter data');
      }
      const data = await response.json();
      setHunter(data.hunter);
    } catch (err: any) {
      console.error('Error loading hunter on dashboard:', err);
      setError(err.message || 'Failed to load hunter data.');
      setHunter(null); // Clear hunter data on error
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    if (!hunterId) {
      setError("Hunter ID is missing.");
      setLoading(false);
      // redirect? router.push('/hunters'); 
      return;
    }
    fetchHunterData();
  }, [hunterId, router]); // Rerun if hunterId changes

  // --- Handler for gaining EXP --- 
  const handleGainExp = async (amount: number) => {
    if (!hunterId) return;
    setExpLoading(true);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/gain-exp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceGained: amount })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to gain EXP');
      }
      console.log('Gain EXP Result:', result);
      alert(`${result.message}${result.levelUp ? `\nLeveled up to ${result.newLevel}! Gained ${result.statPointsGained} Stat Points, ${result.skillPointsGained} Skill Points.` : ''}`);
      // Refetch hunter data to update the display
      // In a real app, you might update state directly from the result
      // or use a state management library that handles cache invalidation.
      setLoading(true); // Show general loading while refetching
      fetchHunterData(); // Re-call the fetch function

    } catch (err: any) {
      console.error('Error gaining EXP:', err);
      alert(`Error gaining EXP: ${err.message}`);
    } finally {
      setExpLoading(false);
    }
  };

  // --- Handler for allocating stat points --- 
  const handleAllocateStat = async (statName: AllocatableStat) => {
    if (!hunterId || !hunter || hunter.statPoints <= 0) return;
    setStatLoading(statName);
    setAllocationError(null); // Clear previous allocation errors
    try {
      const response = await fetch(`/api/hunters/${hunterId}/allocate-stat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statName })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to allocate point to ${statName}`);
      }
      console.log('Allocate Stat Result:', result);
      // alert(`Successfully allocated 1 point to ${statName}.`); // Optional: use toast later

      // Refetch data to show updated stats and points
      fetchHunterData();

    } catch (err: any) {
      console.error(`Error allocating ${statName}:`, err);
      setAllocationError(err.message || 'Failed to allocate point.');
      // alert(`Error: ${err.message}`); // Optional: use toast later
    } finally {
      setStatLoading(null); // Clear loading state for this stat
    }
  };

  // --- Loading State --- 
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-text-secondary text-lg">Loading Dashboard...</p>
        {/* TODO: Add a themed loading spinner */}
      </div>
    );
  }

  // --- Error Display --- 
  if (error || !hunter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border-danger">
          <CardHeader>
            <CardTitle className="text-danger text-center">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-text-secondary mb-6">{error || 'Could not load hunter information.'}</p>
            <Button variant="outline" asChild>
              <Link href="/hunters">
                &larr; Back to Hunter Selection
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Dashboard Display --- 
  if (!loading && hunter) {
    const hasStatPoints = (hunter.statPoints ?? 0) > 0;

    // Calculate EXP within the current level using updated property names
    const currentExp = hunter.experience ?? 0;
    const startExpForCurrentLevel = hunter.currentLevelStartExp ?? 0; // Use new property name
    const expNeededForLevelGain = hunter.expNeededForNextLevel ?? 1; // Use new property name, default 1
    const expProgressInCurrentLevel = Math.max(0, currentExp - startExpForCurrentLevel); // Ensure non-negative

    // Check if hunter is at max level (or if data is unusual)
    // If expNeededForLevelGain is 0 or less, it might indicate max level or an issue.
    // For now, we assume expNeededForLevelGain is correctly calculated by the backend.
    // If the backend returns 0, it means the next level requires 0 EXP (implies max level).
    const isMaxLevel = expNeededForLevelGain <= 0;

    // Determine if Rank-Up Quest is available
    let isRankUpAvailable = false;
    let nextRank: string | null = null;
    if (hunter.rank !== 'S') {
      const currentRankKey = hunter.rank as keyof typeof RANK_UP_REQUIREMENTS;
      const currentRankReq = RANK_UP_REQUIREMENTS[currentRankKey];
      if (currentRankReq && hunter.level >= currentRankReq.level) {
        isRankUpAvailable = true;
        nextRank = currentRankReq.nextRank;
      }
    }

    const handleRankUpClick = () => {
      console.log(`Initiating Rank-Up Quest for Rank ${nextRank}...`);
      // TODO: Implement navigation or logic to start the quest
      alert(`Starting Rank-Up Quest to achieve Rank ${nextRank}! (Not implemented yet)`);
    };

    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-text-primary tracking-wider">{hunter.name}</CardTitle>
              <CardDescription className="text-base sm:text-lg">
                Level {hunter.level} {hunter.class} - Rank {hunter.rank}
              </CardDescription>
            </div>
            <Button variant="link" className="mt-2 sm:mt-0 px-0" asChild>
              <Link href="/hunters">
                &larr; Change Hunter
              </Link>
            </Button>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm sm:text-base mb-4">
                {(['strength', 'agility', 'perception', 'intelligence', 'vitality'] as AllocatableStat[]).map((stat) => (
                  <li key={stat} className="flex justify-between items-center">
                    <span className="capitalize">{stat}: <span className="font-semibold text-accent">{hunter[stat]}</span></span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 text-xs border-primary/50 text-primary/80 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleAllocateStat(stat)}
                      disabled={!hasStatPoints || statLoading === stat || loading} // Disable if no points, or currently allocating this stat, or general loading
                      aria-label={`Increase ${stat}`}
                    >
                      {statLoading === stat ? '...' : '+'} { /* Basic loading indicator */}
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-border-dark space-y-2">
                <div className="space-y-1">
                  <p className="text-sm">Stat Points: <span className={`font-semibold ${hasStatPoints ? 'text-primary' : 'text-text-disabled'}`}>{hunter.statPoints ?? 0}</span></p>
                  <p className="text-sm">Skill Points: <span className="font-semibold text-secondary">{hunter.skillPoints ?? 0}</span></p>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-text-secondary">EXP</span>
                    <span className="text-text-secondary">
                      {isMaxLevel
                        ? `MAX (${currentExp.toLocaleString()})`
                        : `${expProgressInCurrentLevel.toLocaleString()} / ${expNeededForLevelGain.toLocaleString()}`}
                    </span>
                  </div>
                  <progress
                    className="w-full h-2 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-background-secondary [&::-webkit-progress-value]:bg-accent-primary [&::-moz-progress-bar]:bg-accent-primary"
                    value={isMaxLevel ? 1 : expProgressInCurrentLevel}
                    max={isMaxLevel ? 1 : expNeededForLevelGain}
                    aria-label={`Experience progress: ${isMaxLevel ? 'Max Level' : `${expProgressInCurrentLevel} out of ${expNeededForLevelGain}`}`}
                  />
                </div>
                {allocationError && <p className="text-xs text-danger mt-1">Allocation Error: {allocationError}</p>}
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGainExp(150)} // Example: Gain 150 EXP
                  disabled={expLoading}
                  className="w-full"
                >
                  {expLoading ? 'Gaining EXP...' : 'Gain 150 EXP (Test)'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Conditional Rank-Up Button */}
              {isRankUpAvailable && (
                <Button
                  variant="destructive" // Use a distinct variant, maybe 'destructive' or a custom one
                  className="w-full sm:col-span-2" // Make it stand out, span full width on small screens
                  onClick={handleRankUpClick}
                  aria-label={`Start Rank-Up Quest for Rank ${nextRank}`}
                >
                  Rank-Up Quest (Rank {nextRank})
                </Button>
              )}

              {/* Existing Action Buttons */}
              <Button variant="default" className="w-full" asChild>
                <Link href={`/dungeons?hunterId=${hunterId}`} className="flex h-full w-full items-center justify-center">
                  Enter Gate
                </Link>
              </Button>
              <Button variant="secondary" className="w-full" asChild>
                <Link href={`/skills?hunterId=${hunterId}`} className="flex h-full w-full items-center justify-center">
                  Skills
                </Link>
              </Button>
              <Button variant="secondary" className="w-full" asChild>
                <Link href={`/inventory?hunterId=${hunterId}`} className="flex h-full w-full items-center justify-center">
                  Inventory
                </Link>
              </Button>
              <Button variant="secondary" className="w-full" asChild>
                <Link href={`/shop?hunterId=${hunterId}`} className="flex h-full w-full items-center justify-center">
                  Shop
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render loading or error state if hunter is null after initial load completes
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md border-danger">
        <CardHeader>
          <CardTitle className="text-danger text-center">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-text-secondary mb-6">{error || 'Could not load hunter information.'}</p>
          <Button variant="outline" asChild>
            <Link href="/hunters">&larr; Back to Hunter Selection</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 