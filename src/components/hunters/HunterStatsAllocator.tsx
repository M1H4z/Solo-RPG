"use client";

import React from "react";
import { Hunter, AllocatableStat } from "@/types/hunter.types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import StatsRadarChart from "./StatsRadarChart"; // Reverted: Removed .tsx extension

// Update DerivedStats interface to match calculateDerivedStats return type
interface DerivedStats {
  maxHP?: number;
  currentHP?: number;
  maxMP?: number;
  currentMP?: number;
  defense?: number;
  critRate?: number;
  critDamage?: number;
  speed?: number;
  evasion?: number;
  precision?: number;
  basicAttack?: number;
  cooldownReduction?: number;
  expNeededForNextLevel?: number;
  currentLevelStartExp?: number;
  expProgressInCurrentLevel?: number;
  isMaxLevel?: boolean; // Add boolean type
}

interface HunterStatsAllocatorProps {
  hunter: Hunter | null;
  derivedStats: DerivedStats;
  onAllocateStat: (statName: AllocatableStat) => Promise<void>;
  // Add future handlers as needed (onDeallocate, onAllocateBulk, onResetTemp?)
  loading: boolean; // Loading state for the allocation action
}

// Define mapping from primary to derived stats
const statMappings: Record<AllocatableStat, Array<{ name: string; key: keyof DerivedStats; suffix?: string }>> = {
  strength: [{ name: "Attack", key: "basicAttack" }],
  vitality: [
    { name: "Defense", key: "defense" },
    { name: "HP", key: "maxHP" },
  ],
  agility: [
    { name: "Crit Rate", key: "critRate", suffix: "%" },
    { name: "Crit Dmg", key: "critDamage", suffix: "%" }, // Abbreviated for space
    { name: "SPD", key: "speed" }, // Add Speed
    { name: "EVA", key: "evasion", suffix: "%" } // Add Evasion
  ],
  intelligence: [
    { name: "MP", key: "maxMP" },
    { name: "CDR", key: "cooldownReduction", suffix: "%" }, // Abbreviated
  ],
  perception: [{ name: "Precision", key: "precision", suffix: "%" }],
};

const primaryStatOrder: AllocatableStat[] = [
  "strength",
  "vitality",
  "agility",
  "intelligence",
  "perception",
];

export const HunterStatsAllocator: React.FC<HunterStatsAllocatorProps> = ({
  hunter,
  derivedStats,
  onAllocateStat,
  loading,
}) => {
  if (!hunter) return null;

  const hasStatPoints = (hunter.statPoints ?? 0) > 0;
  const canAllocateTen = (hunter.statPoints ?? 0) >= 10;

  // Placeholder handlers - NEED CLARIFICATION
  const handleReset = (stat: AllocatableStat) => {
    console.warn("Reset functionality not implemented for", stat);
  };
  const handleDeallocate = (stat: AllocatableStat) => {
    console.warn("Deallocate functionality not implemented for", stat);
  };
   const handleAllocateTen = (stat: AllocatableStat) => {
    console.warn("Allocate +10 functionality not implemented for", stat);
    // Example: Call onAllocateStat 10 times (needs careful implementation)
    // if (canAllocateTen) {
    //   for (let i = 0; i < 10; i++) { onAllocateStat(stat); } 
    // }
  };

  return (
    // Use grid for layout: Chart on left, Stats on right
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 md:gap-6 items-start">
      {/* Left Column: Radar Chart */}
      <div className="w-full h-full flex items-center justify-center p-2">
        <StatsRadarChart hunter={hunter} statsToShow={primaryStatOrder} />
      </div>

      {/* Right Column: Stat Allocation Rows */}
      <div className="space-y-1 border border-border-dark rounded p-2">
        {primaryStatOrder.map((statKey) => (
          <div
            key={statKey}
            className="grid grid-cols-[1fr,auto,auto,auto,auto,auto,auto,auto] items-start gap-x-2 md:gap-x-3 py-1.5 text-xs md:text-sm border-b border-border-dark last:border-b-0"
          >
            {/* Col 1: Primary Stat Name */}
            <div className="font-semibold capitalize text-accent pt-px">
              {statKey}
            </div>

            {/* Col 2: Derived Stat Names */}
            <div className="flex flex-col text-left text-text-secondary min-w-[6rem]">
              {statMappings[statKey].map((derived) => (
                <span key={derived.key} className="leading-tight">{derived.name}</span>
              ))}
            </div>

            {/* Col 3: Derived Stat Values */}
            <div className="flex flex-col text-right font-medium min-w-[3.5rem]">
              {statMappings[statKey].map((derived) => (
                <span key={derived.key} className="leading-tight">
                  {derivedStats[derived.key] ?? "-"}{derived.suffix}
                </span>
              ))}
            </div>

            {/* Col 4: Reset Button (Placeholder) */}
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-text-muted hover:text-text-primary disabled:opacity-50"
              onClick={() => handleReset(statKey)}
              disabled={true} // Needs implementation
              aria-label={`Reset ${statKey} allocation`}
            >
              🔄
            </Button>

            {/* Col 5: Minus Button (Placeholder) */}
            <Button
              variant="outline"
              size="icon"
               className="size-6 p-0 disabled:opacity-50"
              onClick={() => handleDeallocate(statKey)}
              disabled={true} // Needs implementation
               aria-label={`Decrease ${statKey}`}
           >
              -
            </Button>

            {/* Col 6: Primary Stat Value */}
            <div className="text-center font-bold text-lg text-primary">
              {hunter[statKey]}
            </div>

            {/* Col 7: Plus Button */}
            <Button
              variant="outline"
              size="icon"
              className="size-6 p-0 disabled:opacity-50"
              onClick={() => onAllocateStat(statKey)}
              disabled={!hasStatPoints || loading}
              aria-label={`Increase ${statKey}`}
            >
              +
            </Button>

            {/* Col 8: Plus 10 Button (Placeholder) */}
            <Button
              variant="outline"
              size="sm"
              className="px-1.5 h-6 text-xs disabled:opacity-50"
              onClick={() => handleAllocateTen(statKey)}
              disabled={!canAllocateTen || loading} // Needs implementation detail
              aria-label={`Increase ${statKey} by 10`}
            >
              +10
            </Button>
          </div>
        ))}
        <div className="pt-3 text-right font-semibold">
          Stat Points Available:{" "}
          <span className="text-primary">{hunter.statPoints ?? 0}</span>
        </div>
      </div>
    </div>
  );
};

export default HunterStatsAllocator; 