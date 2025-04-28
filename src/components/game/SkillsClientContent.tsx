"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { Hunter } from "@/types/hunter.types";
import { Skill, SkillRank } from "@/types/skill.types";
import { ALL_SKILLS, getSkillById } from "@/constants/skills";
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

// Define possible ranks for filtering
const skillRanks: SkillRank[] = ["E", "D", "C", "B", "A", "S"];

// Inner component that uses the hook
function SkillsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get("hunterId");

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [loading, setLoading] = useState(true); // General page loading
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set()); // Track loading state per skill ID
  const [rankFilter, setRankFilter] = useState<SkillRank | "All">("All");

  const fetchHunterData = useCallback(
    async (isRefetch: boolean = false) => {
      if (!hunterId) return;
      if (!isRefetch) {
        setLoading(true);
        setHunter(null);
      }
      setError(null);
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
        console.error("Error loading hunter on skills page:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setActionLoading(new Set());
      }
    },
    [hunterId, router],
  );

  useEffect(() => {
    if (!hunterId) {
      setError("Hunter ID is missing.");
      setLoading(false);
      return;
    }
    fetchHunterData(false);
  }, [hunterId, fetchHunterData]);

  const handleApiCall = async (
    actionType: "unlock" | "equip" | "unequip",
    skillId: string,
    currentHunter: Hunter
  ) => {
    setError(null);

    const endpointMap = {
      unlock: `/api/hunters/${currentHunter.id}/unlock-skill`,
      equip: `/api/hunters/${currentHunter.id}/equip-skill`,
      unequip: `/api/hunters/${currentHunter.id}/unequip-skill`,
    };

    try {
      const response = await fetch(endpointMap[actionType], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Error in API call ${endpointMap[actionType]}`, result);
        throw new Error(result.error || `Failed to ${actionType} skill.`);
      }

      console.log(`${actionType} successful:`, result);

      // On success, DO NOTHING. Trust the optimistic update.
      // The catch block will handle corrections if the API failed.
      // await fetchHunterData(true); // Remove refetch on success

    } catch (err: any) {
      console.error(`Failed to ${actionType} skill (${skillId}):`, err);
      const errorMessage =
        err.message ||
        `An error occurred while trying to ${actionType} the skill.`;
      setError(errorMessage);
      // On failure, refetch data to correct the optimistic update
      await fetchHunterData(true);
    }
  };

  const handleUnlockSkill = async (skillId: string) => {
    if (!hunter || actionLoading.has(skillId) || (hunter.skillPoints ?? 0) <= 0)
      return;
    const skillToUnlock = getSkillById(skillId);
    if (!skillToUnlock) return;

    const optimisticHunter = {
      ...hunter,
      skillPoints: (hunter.skillPoints ?? 0) - skillToUnlock.skillPointCost,
      unlockedSkills: [...(hunter.unlockedSkills || []), skillId],
    };
    setHunter(optimisticHunter);
    setActionLoading((prev) => new Set(prev).add(skillId));

    try {
      await handleApiCall("unlock", skillId, hunter);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  const handleEquipSkill = async (skillId: string) => {
    if (
      !hunter ||
      actionLoading.has(skillId) ||
      (hunter.equippedSkills?.length ?? 0) >= MAX_EQUIPPED
    )
      return;

    const optimisticHunter = {
      ...hunter,
      equippedSkills: [...(hunter.equippedSkills || []), skillId],
    };
    setHunter(optimisticHunter);
    setActionLoading((prev) => new Set(prev).add(skillId));

    try {
      await handleApiCall("equip", skillId, hunter);
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

    const optimisticHunter = {
      ...hunter,
      equippedSkills: (hunter.equippedSkills || []).filter((id) => id !== skillId),
    };
    setHunter(optimisticHunter);
    setActionLoading((prev) => new Set(prev).add(skillId));

    try {
      await handleApiCall("unequip", skillId, hunter);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading Skills...</div>;
  }

  if (error || !hunter) {
    return (
      <div className="p-10 text-center">
        <p className="mb-4 text-danger">
          Error: {error || "Could not load hunter data."}
        </p>
        <Button variant="outline" asChild>
          <Link
            href={hunterId ? `/dashboard?hunterId=${hunterId}` : "/hunters"}
          >
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const unlockedSkillsSet = new Set(hunter.unlockedSkills || []);
  const equippedSkillsSet = new Set(hunter.equippedSkills || []);

  const equippedSkillDetails =
    hunter.equippedSkills
      ?.map((id) => getSkillById(id))
      .filter((s): s is Skill => s !== undefined) ?? [];

  const unlockedPassiveSkills = ALL_SKILLS.filter(
    (skill) => skill.type === "passive" && unlockedSkillsSet.has(skill.id),
  );

  const availableSkillsToDisplay = ALL_SKILLS.filter(
    (skill) => rankFilter === "All" || skill.rank === rankFilter,
  ).sort((a, b) => {
    const rankOrder = skillRanks.indexOf(a.rank) - skillRanks.indexOf(b.rank);
    if (rankOrder !== 0) return rankOrder;
    return a.levelRequirement - b.levelRequirement;
  });

  const MAX_EQUIPPED = 4;

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Manage Skills
          </h1>
          <p className="text-text-secondary">
            Hunter: {hunter.name} (Level {hunter.level})
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-lg">
            Skill Points:{" "}
            <span className="text-xl font-semibold text-primary">
              {hunter.skillPoints}
            </span>
          </p>
          <Button variant="link" size="sm" asChild>
            <Link href={`/dashboard?hunterId=${hunterId}`}>
              &larr; Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <p className="my-4 rounded border border-danger bg-danger/10 p-2 text-center text-danger">
          Error: {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            {" "}
            {equippedSkillDetails.length === 0 ? (
              <p className="pt-4 text-center text-sm italic text-text-disabled">
                No active skills equipped. Equip skills from the list below.
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
            {" "}
            {unlockedPassiveSkills.length === 0 ? (
              <p className="pt-4 text-center text-sm italic text-text-disabled">
                No passive skills unlocked.
              </p>
            ) : (
              <ul className="space-y-2">
                {unlockedPassiveSkills.map((skill) => (
                  <li
                    key={`passive-${skill.id}`}
                    className="bg-background-alt border-border-primary rounded border p-2 text-sm"
                  >
                    <span className="text-accent-foreground font-semibold">
                      {skill.name} (Rank {skill.rank}):
                    </span>
                    <span className="ml-2 text-text-secondary">
                      {skill.description}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

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
}

// Export the component wrapped in Suspense
export default function SkillsClientContent() {
  return (
    <Suspense fallback={<div>Loading skills...</div>}>
      <SkillsContent />
    </Suspense>
  );
} 