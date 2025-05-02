"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSession } from "./authService"; // Assuming authService is in the same directory
import { Hunter } from "@/types/hunter.types"; // Import Hunter type
import {
  calculateLevelFromExp,
  calculateExpForNextLevelGain,
  getCumulativeExpForLevelStart,
} from "@/lib/utils"; // Import updated leveling utils
// Import new inventory service functions
import { getHunterInventory, getHunterEquipment } from "./inventoryService";
import { EquipmentSlots, InventoryItem } from "@/types/item.types";
import { HUNTER_BASE_COLUMNS } from "@/constants/dbConstants"; // Import the constant
// Import stat calculation functions for HP/MP recovery
import { calculateMaxHP, calculateMaxMP } from "@/lib/game/stats";

/**
 * Processes raw hunter data and combines with inventory/equipment.
 */
export async function processAndCombineHunterData(
  dbHunter: any,
): Promise<Hunter | null> {
  if (!dbHunter) return null;

  const supabase = createSupabaseServerClient(); // Get client instance

  // Fetch inventory and equipment concurrently
  const [inventory, equipment] = await Promise.all([
    getHunterInventory(dbHunter.id, supabase),
    getHunterEquipment(dbHunter.id, supabase),
  ]);

  const currentExperience = dbHunter.experience ?? 0;
  const currentLevel = calculateLevelFromExp(currentExperience);
  const expNeededToLevelUp = calculateExpForNextLevelGain(currentLevel);
  const currentLevelStartExp = getCumulativeExpForLevelStart(currentLevel);

  // Map database columns to Hunter type properties
  const processedHunter: Omit<
    Hunter,
    | "inventory"
    | "equipment"
    | "gold"
    | "diamonds"
    | "updatedAt"
    | "unlockedSkills"
    | "equippedSkills"
  > & { userId: string; createdAt: string } = {
    id: dbHunter.id,
    userId: dbHunter.user_id,
    name: dbHunter.name,
    level: currentLevel,
    rank: dbHunter.rank,
    class: dbHunter.class,
    experience: currentExperience,
    currentLevelStartExp: currentLevelStartExp,
    expNeededForNextLevel: expNeededToLevelUp,
    statPoints: dbHunter.stat_points ?? 0,
    skillPoints: dbHunter.skill_points ?? 0,
    strength: dbHunter.strength ?? 0,
    agility: dbHunter.agility ?? 0,
    perception: dbHunter.perception ?? 0,
    intelligence: dbHunter.intelligence ?? 0,
    vitality: dbHunter.vitality ?? 0,
    createdAt: dbHunter.created_at,
  };

  // Combine processed data with fetched inventory/equipment and skills
  return {
    ...processedHunter,
    // Use the actual gold/diamonds values fetched from the database
    gold: dbHunter.gold ?? 0,
    diamonds: dbHunter.diamonds ?? 0,
    // Add current HP/MP mapping from DB result
    currentHp: dbHunter.current_hp, // Map snake_case from DB to camelCase
    currentMp: dbHunter.current_mp, // Map snake_case from DB to camelCase
    // Use createdAt as placeholder for updatedAt since it's required by type but not in DB
    updatedAt: processedHunter.createdAt || new Date().toISOString(),
    inventory: inventory || [],
    equipment: equipment || {},
    // Ensure skills are arrays, defaulting to empty if DB value is null/not an array
    unlockedSkills: Array.isArray(dbHunter.unlocked_skills)
      ? dbHunter.unlocked_skills
      : [],
    equippedSkills: Array.isArray(dbHunter.equipped_skills)
      ? dbHunter.equipped_skills
      : [],
  } as Hunter;
}

/**
 * Fetches all hunters belonging to the user, including inventory and equipment.
 */
export async function getMyHunters(): Promise<Hunter[]> {
  const session = await getUserSession();
  if (!session?.user) {
    console.log("getMyHunters: No session, returning empty.");
    return [];
  }

  const supabase = createSupabaseServerClient();
  const userId = session.user.id;

  try {
    // Use the defined base columns constant
    const { data, error } = await supabase
      .from("hunters")
      .select(HUNTER_BASE_COLUMNS) // Use constant
      .eq("user_id", userId);

    if (error) {
      console.error("getMyHunters: DB error:", error);
      throw new Error(`Database error fetching hunters: ${error.message}`);
    }

    // Process each hunter
    const processedHunters = await Promise.all(
      (data || []).map((dbHunter) => processAndCombineHunterData(dbHunter)),
    );

    return processedHunters.filter((h): h is Hunter => h !== null);
  } catch (error) {
    console.error("getMyHunters: Unexpected error:", error);
    throw error;
  }
}

/**
 * Deletes a specific hunter belonging to the currently authenticated user.
 * Throws an error if the hunter doesn't exist, doesn't belong to the user,
 * or if there is a database query issue.
 *
 * @param hunterId The ID of the hunter to delete.
 * @returns { success: boolean, error?: string }
 */
export async function deleteMyHunter(
  hunterId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getUserSession();
  if (!session?.user) {
    console.log("No active session found, cannot delete hunter.");
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createSupabaseServerClient();
  const userId = session.user.id;

  console.log(
    `Attempting to delete hunter ID: ${hunterId} for user ID: ${userId}`,
  );

  if (!hunterId) {
    return { success: false, error: "Hunter ID is required." };
  }

  try {
    const { error, count } = await supabase
      .from("hunters")
      .delete()
      .eq("id", hunterId)
      .eq("user_id", userId); // Crucial ownership check

    if (error) {
      console.error("Error deleting hunter:", error);
      throw new Error(`Database error deleting hunter: ${error.message}`);
    }

    if (count === 0) {
      console.warn(
        `Hunter deletion attempt failed: Hunter ${hunterId} not found or does not belong to user ${userId}.`,
      );
      return { success: false, error: "Hunter not found or access denied." };
    }

    console.log(`Successfully deleted hunter ID: ${hunterId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error in deleteMyHunter:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

/**
 * Fetches a specific hunter by ID for the user, including inventory and equipment.
 */
export async function getHunterById(hunterId: string): Promise<Hunter | null> {
  const session = await getUserSession();
  if (!session?.user) {
    console.log("getHunterById: No session, returning null.");
    return null;
  }

  if (!hunterId) {
    console.log("getHunterById: No hunterId provided.");
    return null;
  }

  const supabase = createSupabaseServerClient();
  const userId = session.user.id;

  try {
    // Use the defined base columns constant
    const { data: dbHunter, error } = await supabase
      .from("hunters")
      .select(HUNTER_BASE_COLUMNS) // Use constant
      .eq("id", hunterId)
      .eq("user_id", userId) // Ensure ownership
      .maybeSingle();

    if (error) {
      // No need to check for PGRST116 specifically if using maybeSingle
      console.error("getHunterById: DB error:", error);
      throw new Error(`Database error fetching hunter: ${error.message}`);
    }

    if (!dbHunter) {
      console.log(
        `getHunterById: Hunter ${hunterId} not found or not owned by user ${userId}.`,
      );
      return null;
    }

    // Process raw data
    return await processAndCombineHunterData(dbHunter);
  } catch (error) {
    console.error(
      `getHunterById: Unexpected error for hunter ${hunterId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Allocates a stat point to a hunter.
 *
 * @param hunterId The ID of the hunter to allocate the stat point to.
 * @param statName The name of the stat to allocate.
 * @returns { success: boolean; updatedHunter?: Hunter; error?: string; message?: string }
 */
export async function allocateStatPoint(
  hunterId: string,
  statName: string,
): Promise<{ success: boolean; updatedHunter?: Hunter; error?: string; message?: string }> {
  const session = await getUserSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Basic validation for inputs
  const VALID_STATS = ["strength", "agility", "perception", "intelligence", "vitality"];
  if (!hunterId || !statName || !VALID_STATS.includes(statName)) {
    return { success: false, error: "Hunter ID and a valid Stat Name are required." };
  }

  const supabase = createSupabaseServerClient();
  const userId = session.user.id; // Needed if RPC function also checks owner

  try {
    // Call the database function to perform the atomic update
    // Assumes a function like: allocate_stat_point(hunter_id_in uuid, stat_name_in text, user_id_in uuid)
    // returning the number of rows updated (1 if successful, 0 if no points/wrong user/hunter not found)
    const { data: updatedRowCount, error: rpcError } = await supabase.rpc(
      "allocate_stat_point",
      {
        hunter_id_in: hunterId,
        stat_name_in: statName,
        user_id_in: userId, // Pass user ID for ownership check within the function
      },
    );

    if (rpcError) {
      console.error("allocateStatPoint - RPC Error:", rpcError);
      throw new Error(`Database function error allocating ${statName}: ${rpcError.message}`);
    }

    // Check if the function successfully updated a row
    if (updatedRowCount !== 1) {
      // Could be due to various reasons handled within the function (no points, wrong user, etc.)
      console.warn(`allocate_stat_point RPC for hunter ${hunterId} returned ${updatedRowCount} rows affected.`);
      // Try fetching the hunter to see if points were the issue
      const currentHunter = await supabase.from("hunters").select("stat_points").eq("id", hunterId).eq("user_id", userId).maybeSingle();
      if (currentHunter?.data?.stat_points === 0) {
          return { success: false, error: "No stat points available to allocate." };
      }
      // Otherwise, return a more generic error or specific one if deduced
      return { success: false, error: "Failed to allocate stat point. Hunter not found, no points available, or access denied." };
    }

    // If RPC succeeded (updated 1 row), fetch the complete updated hunter data
    const updatedHunter = await getHunterById(hunterId);
    if (!updatedHunter) {
      // This case should be rare if RPC succeeded, indicates potential inconsistency
      console.error("allocateStatPoint - Failed to fetch hunter after successful RPC update.");
      throw new Error("Inconsistency: Failed to retrieve updated hunter data after allocation.");
    }

    // Return success
    return {
      success: true,
      updatedHunter: updatedHunter,
      message: `Successfully allocated 1 point to ${statName}.`,
    };

  } catch (error: any) {
    console.error("allocateStatPoint - Unexpected Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred allocating stat point.",
    };
  }
}

export async function gainExperience(
  hunterId: string,
  amount: number,
): Promise<{
  success: boolean;
  updatedHunter?: Hunter;
  message?: string;
  error?: string;
  // Optional: Include level up details for the message/toast
  levelUp?: boolean;
  newLevel?: number;
  levelsGained?: number;
  statPointsGained?: number;
  skillPointsGained?: number;
}> {
  const session = await getUserSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  if (!hunterId || amount == null || amount <= 0) {
    return { success: false, error: "Hunter ID and valid positive amount are required." };
  }

  const supabase = createSupabaseServerClient();
  const userId = session.user.id;

  try {
    // 1. Fetch current hunter data - ADD vitality, intelligence
    const { data: currentHunterData, error: fetchError } = await supabase
      .from("hunters")
      // Add vitality and intelligence to select list
      .select("experience, level, stat_points, skill_points, vitality, intelligence") 
      .eq("id", hunterId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return { success: false, error: "Hunter not found or access denied." };
      }
      console.error("gainExperience - Fetch Error:", fetchError);
      throw new Error("Database error fetching hunter data");
    }

    // 2. Calculate new state
    const currentExperience = currentHunterData.experience ?? 0;
    const currentLevel = currentHunterData.level ?? calculateLevelFromExp(currentExperience);
    const newTotalExperience = currentExperience + amount;
    const newCalculatedLevel = calculateLevelFromExp(newTotalExperience);

    let levelUp = false;
    let levelsGained = 0;
    let statPointsGained = 0;
    let skillPointsGained = 0;
    let updatedStatPoints = currentHunterData.stat_points ?? 0;
    let updatedSkillPoints = currentHunterData.skill_points ?? 0;
    // Variables for HP/MP recovery
    let newMaxHP = 0;
    let newMaxMP = 0;

    if (newCalculatedLevel > currentLevel) {
        levelUp = true;
        levelsGained = newCalculatedLevel - currentLevel;
        statPointsGained = levelsGained * 3;
        skillPointsGained = levelsGained * 1;
        updatedStatPoints += statPointsGained;
        updatedSkillPoints += skillPointsGained;

        // Calculate new Max HP/MP for recovery
        const vitality = currentHunterData.vitality ?? 0;
        const intelligence = currentHunterData.intelligence ?? 0;
        newMaxHP = calculateMaxHP(vitality, newCalculatedLevel);
        newMaxMP = calculateMaxMP(intelligence, newCalculatedLevel);
    }

    // 3. Prepare update payload
    const updatePayload: any = {
        experience: newTotalExperience,
    };
    if (levelUp) {
        updatePayload.level = newCalculatedLevel;
        updatePayload.stat_points = updatedStatPoints;
        updatePayload.skill_points = updatedSkillPoints;
        // Add HP/MP recovery to payload using snake_case column names
        updatePayload.current_hp = newMaxHP; // Use snake_case
        updatePayload.current_mp = newMaxMP; // Use snake_case
    }

    // 4. Update hunter in DB
    const { error: updateError } = await supabase
      .from("hunters")
      .update(updatePayload)
      .eq("id", hunterId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("gainExperience - Update Error:", updateError);
      throw new Error("Database error updating experience/level/points/recovery");
    }

    // 5. Fetch the complete updated hunter data
    const updatedHunter = await getHunterById(hunterId);
    if (!updatedHunter) {
      console.error("gainExperience - Failed to fetch hunter after update.");
      throw new Error("Failed to retrieve updated hunter data.");
    }

    // 6. Return success response
    const message = `Gained ${amount} EXP.${levelUp ? ` Leveled up to ${newCalculatedLevel}!` : ""}`;
    return {
      success: true,
      updatedHunter: updatedHunter,
      message: message,
      levelUp: levelUp,
      newLevel: levelUp ? newCalculatedLevel : undefined,
      levelsGained: levelUp ? levelsGained : 0,
      statPointsGained: levelUp ? statPointsGained : 0,
      skillPointsGained: levelUp ? skillPointsGained : 0,
    };

  } catch (error: any) {
    console.error("gainExperience - Unexpected Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred gaining experience.",
    };
  }
}

// TODO: Add functions for selecting and potentially updating hunter (e.g., active status)
