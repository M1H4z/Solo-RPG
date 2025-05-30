"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { processAndCombineHunterData } from "./hunterService"; // Import only needed functions
import { getSkillById } from "@/constants/skills";
import { SKILL_RANK_ORDER } from "@/constants/skills";
import { Hunter } from "@/types/hunter.types";
import { calculateLevelFromExp } from "@/lib/utils"; // For level calculation if needed
import { HUNTER_BASE_COLUMNS } from "@/constants/dbConstants"; // Import from new location

export const unlockSkill = async (
  userId: string,
  hunterId: string,
  skillId: string,
): Promise<{
  success: boolean;
  message: string;
  updatedHunter?: Hunter;
}> => {
  const supabase = createSupabaseServerClient();

  try {
    // 1. Get Skill and Hunter data
    const skill = getSkillById(skillId);
    if (!skill) {
      return { success: false, message: "Skill not found." };
    }

    // Fetch necessary fields including experience for level calc
    const { data: dbHunter, error: hunterError } = await supabase
      .from("hunters")
      .select("id, user_id, experience, rank, unlocked_skills, skill_points")
      .eq("id", hunterId)
      .eq("user_id", userId)
      .single();

    if (hunterError || !dbHunter) {
      return {
        success: false,
        message: hunterError?.message || "Hunter not found or access denied.",
      };
    }

    // Calculate level from experience
    const currentLevel = calculateLevelFromExp(dbHunter.experience ?? 0);

    // 2. Perform ALL validations
    const hunterRankIndex = SKILL_RANK_ORDER.indexOf(dbHunter.rank as any);
    const skillRankIndex = SKILL_RANK_ORDER.indexOf(skill.rank);

    if (dbHunter.unlocked_skills?.includes(skillId)) {
      return { success: false, message: "Skill already unlocked." };
    }
    if (currentLevel < skill.levelRequirement) {
      return {
        success: false,
        message: `Level requirement not met (Req: ${skill.levelRequirement}).`,
      };
    }
    if ((dbHunter.skill_points ?? 0) < skill.skillPointCost) {
      return {
        success: false,
        message: `Not enough skill points (Req: ${skill.skillPointCost}).`,
      };
    }
    if (hunterRankIndex < skillRankIndex) {
      return {
        success: false,
        message: `Rank requirement not met (Req: Rank ${skill.rank}).`,
      };
    }

    // 3. Update Hunter Data
    const newSkillPoints = (dbHunter.skill_points ?? 0) - skill.skillPointCost;
    const newUnlockedSkills = [...(dbHunter.unlocked_skills || []), skillId];

    // Perform the update WITHOUT updated_at
    const { error: updateError } = await supabase
      .from("hunters")
      .update({
        skill_points: newSkillPoints,
        unlocked_skills: newUnlockedSkills,
      })
      .eq("id", hunterId);

    if (updateError) {
      console.error("Error unlocking skill (update phase):", updateError);
      return {
        success: false,
        message: `Failed to update hunter: ${updateError.message}`,
      };
    }

    // Fetch the fully updated hunter data after the update
    const { data: updatedDbHunter, error: fetchError } = await supabase
        .from("hunters")
        .select(HUNTER_BASE_COLUMNS)
        .eq("id", hunterId)
        .single();

    if (fetchError || !updatedDbHunter) {
        console.error("Failed to fetch updated hunter after unlocking skill:", fetchError);
        return {
            success: true,
            message: `Skill '${skill.name}' unlocked, but failed to refetch hunter data.`
        };
    }

    // Process the fetched data
    const processedHunterData = await processAndCombineHunterData(updatedDbHunter);

    return {
        success: true,
        message: `Skill '${skill.name}' unlocked!`,
        updatedHunter: processedHunterData
    };

  } catch (error) {
    console.error("Unexpected error in unlockSkill:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected server error occurred.";
    return { success: false, message };
  }
};

export const equipSkill = async (
  userId: string,
  hunterId: string,
  skillId: string,
): Promise<{
  success: boolean;
  message: string;
  updatedHunter?: Hunter;
}> => {
  const supabase = createSupabaseServerClient();
  try {
    const skill = getSkillById(skillId);
    if (!skill || skill.type !== "active") {
      return {
        success: false,
        message: "Skill not found or is not an active skill.",
      };
    }

    const { data: dbHunter, error: hunterError } = await supabase
      .from("hunters")
      .select("id, user_id, unlocked_skills, equipped_skills, rank")
      .eq("id", hunterId)
      .eq("user_id", userId)
      .single();

    if (hunterError || !dbHunter) {
      return {
        success: false,
        message: hunterError?.message || "Hunter not found or access denied.",
      };
    }

    // Validations
    if (!dbHunter.unlocked_skills?.includes(skillId)) {
      return { success: false, message: "Skill is not unlocked." };
    }
    if (dbHunter.equipped_skills?.includes(skillId)) {
      return { success: false, message: "Skill already equipped." };
    }
    if ((dbHunter.equipped_skills?.length ?? 0) >= 4) {
      return {
        success: false,
        message: "Maximum equipped skills reached (4).",
      };
    }

    // Update WITHOUT updated_at
    const newEquippedSkills = [...(dbHunter.equipped_skills || []), skillId];
    const { error: updateError } = await supabase
      .from("hunters")
      .update({
        equipped_skills: newEquippedSkills,
      })
      .eq("id", hunterId);

    if (updateError) {
      console.error("Error equipping skill (update phase):", updateError);
      return {
        success: false,
        message: `Failed to update hunter: ${updateError.message}`,
      };
    }

    // Fetch the fully updated hunter data after the update
    const { data: updatedDbHunter, error: fetchError } = await supabase
        .from("hunters")
        .select(HUNTER_BASE_COLUMNS)
        .eq("id", hunterId)
        .single();

    if (fetchError || !updatedDbHunter) {
        console.error("Failed to fetch updated hunter after equipping skill:", fetchError);
        return {
            success: true,
            message: `Skill '${skill.name}' equipped, but failed to refetch hunter data.`
        };
    }

    // Process the fetched data
    const processedHunterData = await processAndCombineHunterData(updatedDbHunter);

    return {
        success: true,
        message: `Skill '${skill.name}' equipped!`,
        updatedHunter: processedHunterData
    };

  } catch (error) {
    console.error("Unexpected error in equipSkill:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected server error occurred.";
    return { success: false, message };
  }
};

export const unequipSkill = async (
  userId: string,
  hunterId: string,
  skillId: string,
): Promise<{
  success: boolean;
  message: string;
  updatedHunter?: Hunter;
}> => {
  const supabase = createSupabaseServerClient();
  try {
    const skill = getSkillById(skillId); // Get skill to log name later
    if (!skill) {
      return { success: false, message: "Skill not found." };
    }

    const { data: dbHunter, error: hunterError } = await supabase
      .from("hunters")
      .select("id, user_id, equipped_skills")
      .eq("id", hunterId)
      .eq("user_id", userId)
      .single();

    if (hunterError || !dbHunter) {
      return {
        success: false,
        message: hunterError?.message || "Hunter not found or access denied.",
      };
    }

    // Validation
    if (!dbHunter.equipped_skills?.includes(skillId)) {
      return { success: false, message: "Skill is not currently equipped." };
    }

    // Update WITHOUT updated_at
    const newEquippedSkills = (dbHunter.equipped_skills || []).filter(
      (id) => id !== skillId,
    );
    const { error: updateError } = await supabase
      .from("hunters")
      .update({
        equipped_skills: newEquippedSkills,
      })
      .eq("id", hunterId);

    if (updateError) {
      console.error("Error unequipping skill (update phase):", updateError);
      return {
        success: false,
        message: `Failed to update hunter: ${updateError.message}`,
      };
    }

    // Fetch the fully updated hunter data after the update
    const { data: updatedDbHunter, error: fetchError } = await supabase
        .from("hunters")
        .select(HUNTER_BASE_COLUMNS) // Use the constant for base columns
        .eq("id", hunterId)
        .single();

    if (fetchError || !updatedDbHunter) {
        console.error("Failed to fetch updated hunter after unequipping skill:", fetchError);
        // If fetching fails, we still succeeded in the update, but can't return the data.
        // The client might still revert, but the DB change is persistent.
        return {
            success: true,
            message: `Skill '${skill.name}' unequipped, but failed to refetch hunter data.`
        };
    }

    // Process the fetched data
    const processedHunterData = await processAndCombineHunterData(updatedDbHunter);

    return {
        success: true,
        message: `Skill '${skill.name}' unequipped.`,
        updatedHunter: processedHunterData // Return the processed hunter data
    };

  } catch (error) {
    console.error("Unexpected error in unequipSkill:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected server error occurred.";
    return { success: false, message };
  }
};
