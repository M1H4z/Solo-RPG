import React from "react";
import { Skill } from "@/types/skill.types";
import { Hunter } from "@/types/hunter.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SKILL_RANK_ORDER } from "@/constants/skills"; // Import rank order

interface SkillCardProps {
  skill: Skill;
  hunter: Hunter | null;
  onUnlock: (skillId: string) => Promise<void>; // Functions to call API
  onEquip: (skillId: string) => Promise<void>;
  onUnequip: (skillId: string) => Promise<void>;
  isLoading: boolean; // Indicate if an action involving this skill is pending
  isEquipped: boolean;
  isUnlocked: boolean;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  hunter,
  onUnlock,
  onEquip,
  onUnequip,
  isLoading,
  isEquipped,
  isUnlocked,
}) => {
  if (!hunter) return null; // Should not happen if page loads correctly

  // Calculate Rank Indices
  const hunterRankIndex = SKILL_RANK_ORDER.indexOf(hunter.rank as any); // Cast hunter rank if needed
  const skillRankIndex = SKILL_RANK_ORDER.indexOf(skill.rank);

  const canUnlock =
    !isUnlocked &&
    hunter.level >= skill.levelRequirement &&
    hunter.skillPoints >= skill.skillPointCost &&
    hunterRankIndex >= skillRankIndex; // Add Rank Check

  const canEquip =
    isUnlocked &&
    skill.type === "active" &&
    !isEquipped &&
    (hunter.equippedSkills?.length ?? 0) < 4 &&
    hunterRankIndex >= skillRankIndex; // Add Rank Check (optional but good practice)

  const canUnequip = isUnlocked && skill.type === "active" && isEquipped;

  const handleUnlockClick = () => {
    if (canUnlock && !isLoading) {
      onUnlock(skill.id);
    }
  };

  const handleEquipClick = () => {
    if (canEquip && !isLoading) {
      onEquip(skill.id);
    }
  };

  const handleUnequipClick = () => {
    if (canUnequip && !isLoading) {
      onUnequip(skill.id);
    }
  };

  const getButton = () => {
    if (isEquipped) {
      return (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleUnequipClick}
          disabled={isLoading || !canUnequip}
        >
          {isLoading ? "..." : "Unequip"}
        </Button>
      );
    }
    if (isUnlocked) {
      if (skill.type === "active") {
        return (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEquipClick}
            disabled={isLoading || !canEquip}
          >
            {isLoading ? "..." : "Equip"}
          </Button>
        );
      } else {
        return <span className="text-xs text-text-disabled">Passive</span>; // Passive skills are always active when unlocked
      }
    }
    // Not unlocked
    return (
      <Button
        variant="default"
        size="sm"
        onClick={handleUnlockClick}
        disabled={isLoading || !canUnlock}
      >
        {isLoading ? "..." : `Unlock (${skill.skillPointCost} SP)`}
      </Button>
    );
  };

  const levelRequirementMet = hunter.level >= skill.levelRequirement;
  const rankRequirementMet = hunterRankIndex >= skillRankIndex;

  // --- FIX: Helper function to render effect details ---
  const renderEffect = (effect: SkillEffect, index: number) => {
    switch (effect.type) {
      case 'damage':
        return <li key={index}>Power: {effect.power}</li>;
      case 'heal':
        return <li key={index}>Heal: {effect.baseAmount} HP</li>;
      case 'buff':
        return (
          <li key={index}>
            Buff: +{effect.amount} {effect.stat}
            {effect.duration ? ` (${effect.duration} turns)` : ''}
          </li>
        );
      // Add cases for other effect types (debuff, status) here
      default:
        return null;
    }
  };
  // --- END FIX ---

  return (
    <Card
      className={cn(
        "flex flex-col justify-between h-full",
        isEquipped
          ? "border-secondary shadow-secondary/30 shadow-md"
          : "border-border-primary",
        // Dim slightly more if rank requirement is not met
        !rankRequirementMet
          ? "opacity-50 bg-background/40"
          : !isUnlocked && !levelRequirementMet
            ? "opacity-60 bg-background/50"
            : "",
        !isUnlocked && levelRequirementMet && rankRequirementMet
          ? "opacity-80"
          : "",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span>{skill.name}</span>
          <span
            className={cn(
              "text-xs font-normal px-1.5 py-0.5 rounded",
              skill.type === "active"
                ? "bg-blue-600/80 text-white"
                : "bg-purple-600/80 text-white",
            )}
          >
            {skill.type === "active" ? "Active" : "Passive"}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          Rank {skill.rank} {skill.manaCost ? `| ${skill.manaCost} MP` : ""}{" "}
          {skill.cooldown ? `| ${skill.cooldown} CD` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="grow py-2 text-sm space-y-2">
        <p>{skill.description}</p>
        {/* --- FIX: Render Effect Details --- */}
        {skill.effects && (
          <div className="text-xs text-text-secondary pt-1 border-t border-border-dark mt-2">
            <p className="font-medium mb-0.5">Effect(s):</p>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {Array.isArray(skill.effects)
                ? skill.effects.map(renderEffect)
                : renderEffect(skill.effects, 0)} 
            </ul>
          </div>
        )}
        {/* --- END FIX --- */}
      </CardContent>
      <CardFooter className="flex items-center justify-between pb-3 pt-2">
        <span
          className={cn(
            "text-xs",
            !rankRequirementMet
              ? "text-danger font-semibold"
              : !isUnlocked && !levelRequirementMet
                ? "text-danger"
                : "text-text-secondary",
          )}
        >
          Req Lvl: {skill.levelRequirement}{" "}
          {rankRequirementMet ? "" : "(Rank Locked)"}
        </span>
        {getButton()}
      </CardFooter>
    </Card>
  );
};

export default SkillCard;
