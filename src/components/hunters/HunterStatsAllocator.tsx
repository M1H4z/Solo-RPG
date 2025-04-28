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

  return (
    // Use grid for layout: Chart on left, Stats on right
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 md:gap-6 items-start">
      {/* Left Column: Radar Chart */}
      <div className="w-full h-full flex items-center justify-center p-2">
        <StatsRadarChart hunter={hunter} statsToShow={primaryStatOrder} />
      </div>

      {/* Right Column: Stat Allocation Rows */}
      <div className="space-y-4 border border-border-dark rounded p-2">
        {/* Use space-y for vertical stacking on mobile, map over stats */}
        {primaryStatOrder.map((statKey) => (
          <div
            key={statKey}
            // New 7-col layout: Name, Spacer, Spacer, DerivedName, DerivedValue, Value, Plus
            className="flex flex-col md:grid md:grid-cols-[1fr,1fr,1fr,auto,auto,auto,auto] md:items-center md:gap-x-3 py-2 border-b border-border-dark last:border-b-0"
          >
            {/* Section 1: Stat Name (Col 1) and Derived Stats (Mobile only) */}
            {/* Col 1 */} 
            <div className="flex w-full items-start justify-between md:block md:w-auto md:col-span-1">
               {/* Primary Stat Name */}
               <div className="font-semibold capitalize text-accent text-sm md:text-base">{statKey}</div>
               {/* Derived Stats (Mobile) */}
               <div className="flex flex-col items-end text-right md:hidden"> {/* Mobile: Show derived stats on the right */}
                {statMappings[statKey].map((derived) => (
                   <div key={`${derived.key}-mobile`} className="text-xs leading-tight">
                       <span className="text-text-secondary">{derived.name}: </span>
                       <span className="font-medium">{derivedStats[derived.key] ?? "-"}{derived.suffix}</span>
                   </div>
                ))}
              </div>
            </div>

            {/* Col 4: Derived Names (Desktop) */}
            <div className="hidden md:flex md:col-start-4 md:flex-col md:text-left md:text-text-secondary md:min-w-[6rem]">
                 {statMappings[statKey].map((derived) => (
                   <span key={`${derived.key}-d-name`} className="leading-tight text-xs">{derived.name}</span>
                 ))}
            </div>
            {/* Col 5: Derived Values (Desktop) */}
            <div className="hidden md:flex md:col-start-5 md:flex-col md:text-right md:font-medium md:min-w-[3.5rem]">
                {statMappings[statKey].map((derived) => (
                   <span key={`${derived.key}-d-value`} className="leading-tight text-xs">{derivedStats[derived.key] ?? "-"}{derived.suffix}</span>
                ))}
            </div>

            {/* Section 2: Controls (Mobile: centered below; Desktop: cols 6 & 7) */}
            {/* Mobile controls */}
            <div className="mt-2 flex w-full items-center justify-center space-x-4 md:hidden">
               {/* Primary Stat Value */}
               <div className="text-center font-bold text-base text-primary min-w-[2rem]">
                 {hunter[statKey]}
               </div>
               {/* Plus Button */}
               <Button variant="outline" size="icon" className="size-8 p-0 disabled:opacity-50" onClick={() => onAllocateStat(statKey)} disabled={!hasStatPoints || loading} aria-label={`Increase ${statKey}`}>+</Button>
            </div>
            
            {/* Desktop controls (Cols 6 & 7) - Now using individual column divs */}
            {/* Col 6: Value */}
            <div className="hidden md:flex md:col-start-6 md:justify-center md:items-center">
               <div className="text-center font-bold text-lg text-primary min-w-[2rem]">
                 {hunter[statKey]}
               </div>
            </div>
            {/* Col 7: Plus Button */}
            <div className="hidden md:flex md:col-start-7 md:justify-center md:items-center">
               <Button variant="outline" size="icon" className="size-6 p-0 disabled:opacity-50" onClick={() => onAllocateStat(statKey)} disabled={!hasStatPoints || loading} aria-label={`Increase ${statKey}`}>+</Button>
            </div>
          </div>
        ))}
        {/* Stat Points Available Footer */}
        <div className="p-1 text-right font-semibold text-sm">
          Stat Points Available:{" "}
          <span className="text-primary">{hunter.statPoints ?? 0}</span>
        </div>
      </div>
    </div>
  );
};

export default HunterStatsAllocator; 