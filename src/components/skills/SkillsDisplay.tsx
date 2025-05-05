"use client";

import React from "react";
import { Hunter } from "@/types/hunter.types";
import { Skill, SkillRank, SkillEffect } from "@/types/skill.types";
import { ALL_SKILLS, getSkillById, SKILL_RANK_ORDER } from "@/constants/skills";
import SkillCard from "@/components/skills/SkillCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";

interface SkillsDisplayProps {
  hunter: Hunter | null;
  handleUnlockSkill: (skillId: string) => Promise<void>;
  handleEquipSkill: (skillId: string) => Promise<void>;
  handleUnequipSkill: (skillId: string) => Promise<void>;
  actionLoading: Set<string>; // Set of loading skill IDs
  rankFilter: SkillRank | "All";
  setRankFilter: (rank: SkillRank | "All") => void;
}

const MAX_EQUIPPED = 4; // Define constant here or import

export const SkillsDisplay: React.FC<SkillsDisplayProps> = ({
  hunter,
  handleUnlockSkill,
  handleEquipSkill,
  handleUnequipSkill,
  actionLoading,
  rankFilter,
  setRankFilter,
}) => {
  if (!hunter) return null;

  const formatPassiveEffect = (effect: SkillEffect): string | null => {
    switch (effect.type) {
      case 'buff':
        const formattedStat = effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1);
        return `+${effect.amount} ${formattedStat}`;
      default:
        return null;
    }
  };

  const unlockedSkillsSet = new Set(hunter.unlockedSkills || []);
  const equippedSkillsSet = new Set(hunter.equippedSkills || []);
  const skillRanks: SkillRank[] = ["E", "D", "C", "B", "A", "S"]; // Keep locally or import

  const equippedSkillDetails =
    hunter.equippedSkills
      ?.map((id) => getSkillById(id))
      .filter((s): s is Skill => s !== undefined) ?? [];

  const unlockedPassiveSkills = ALL_SKILLS.filter(
    (skill) => skill.type === "passive" && unlockedSkillsSet.has(skill.id),
  );

  const availableSkillsToDisplay = ALL_SKILLS.filter((skill) => {
    const rankMatch = rankFilter === "All" || skill.rank === rankFilter;
    if (!rankMatch) return false;

    const classMatch = 
      !skill.classRequirement ||
      skill.classRequirement.length === 0 ||
      skill.classRequirement.includes(hunter.class as HunterClass);
    if (!classMatch) return false;

    return true;
  }).sort((a, b) => {
    const rankOrder =
      SKILL_RANK_ORDER.indexOf(a.rank) - SKILL_RANK_ORDER.indexOf(b.rank);
    if (rankOrder !== 0) return rankOrder;
    return a.levelRequirement - b.levelRequirement;
  });

  return (
    <div className="space-y-8">
      {/* Equipped and Passive Sections */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Equipped Active Skills Card */}
        <Card className="border-secondary/80">
          <CardHeader>
            <CardTitle className="text-xl text-secondary">
              Equipped Active Skills ({equippedSkillDetails.length}/
              {MAX_EQUIPPED})
            </CardTitle>
            <CardDescription>
              These skills are usable in combat.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[150px]">
            {equippedSkillDetails.length === 0 ? (
              <p className="pt-4 text-center text-sm italic text-text-disabled">
                No active skills equipped.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {equippedSkillDetails.map((skill) => (
                  <SkillCard
                    key={`equipped-${skill.id}`}
                    skill={skill}
                    hunter={hunter}
                    onUnlock={handleUnlockSkill}
                    onEquip={handleEquipSkill}
                    onUnequip={handleUnequipSkill}
                    isLoading={actionLoading.has(skill.id)}
                    isEquipped={true}
                    isUnlocked={true}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unlocked Passive Skills Card */}
        <Card className="border-accent/80">
          <CardHeader>
            <CardTitle className="text-xl text-accent">
              Unlocked Passive Skills
            </CardTitle>
            <CardDescription>
              These skills provide permanent bonuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[150px]">
            {unlockedPassiveSkills.length === 0 ? (
              <p className="pt-4 text-center text-sm italic text-text-disabled">
                No passive skills unlocked.
              </p>
            ) : (
              <ul className="space-y-2">
                {unlockedPassiveSkills.map((skill) => {
                  // Format effects for display, handling both single object and array
                  let formattedEffects: (string | null)[] = [];
                  if (skill.effects) {
                    if (Array.isArray(skill.effects)) {
                      formattedEffects = skill.effects.map(formatPassiveEffect);
                    } else {
                      // Handle case where effects is a single object
                      formattedEffects = [formatPassiveEffect(skill.effects)];
                    }
                  }

                  const effectsDescription = formattedEffects
                    .filter((desc): desc is string => desc !== null) // Filter out nulls
                    .join(', '); // Join multiple effects if any

                  return (
                  <li
                    key={`passive-${skill.id}`}
                      className="bg-background-alt border-border-primary rounded border p-3 text-sm space-y-1"
                  >
                      <div>
                    <span className="text-accent-foreground font-semibold">
                      {skill.name} (Rank {skill.rank}):
                    </span>
                    <span className="ml-2 text-text-secondary">
                      {skill.description}
                    </span>
                      </div>
                      {effectsDescription && (
                        <div className="text-xs text-green-400 italic">
                          Effect: {effectsDescription}
                        </div>
                      )}
                  </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Available Skills Section */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Available Skills</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={rankFilter === "All" ? "default" : "outline"}
            size="sm"
            onClick={() => setRankFilter("All")}
          >
            All Ranks
          </Button>
          {skillRanks.map((rank) => (
            <Button
              key={rank}
              variant={rankFilter === rank ? "default" : "outline"}
              size="sm"
              onClick={() => setRankFilter(rank)}
            >
              Rank {rank}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {availableSkillsToDisplay.map((skill) => {
            const isUnlocked = unlockedSkillsSet.has(skill.id);
            const isEquipped = equippedSkillsSet.has(skill.id);
            return (
              <SkillCard
                key={`available-${skill.id}`}
                skill={skill}
                hunter={hunter}
                onUnlock={handleUnlockSkill}
                onEquip={handleEquipSkill}
                onUnequip={handleUnequipSkill}
                isLoading={actionLoading.has(skill.id)}
                isEquipped={isEquipped}
                isUnlocked={isUnlocked}
              />
            );
          })}
          {availableSkillsToDisplay.length === 0 && (
            <p className="col-span-full py-4 text-center italic text-text-disabled">
              No skills match the current filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsDisplay; 