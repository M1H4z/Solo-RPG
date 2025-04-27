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
    // Add gold/diamonds back if fetched from elsewhere or default to 0
    gold: 0,
    diamonds: 0,
    // Use createdAt as placeholder for updatedAt since it's required by type but not in DB
    updatedAt: processedHunter.createdAt || new Date().toISOString(), // Fallback to current time if createdAt is missing
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

// Add Hunter Stat/Skill Allocation Functions (if they were here before)
// Example placeholder - implement based on previous logic if needed
export async function allocateStatPoint(
  hunterId: string,
  statName: string,
): Promise<{ success: boolean; updatedHunter?: Hunter; error?: string }> {
  // TODO: Implement logic to check points, update hunter stats in DB
  console.warn("allocateStatPoint function not fully implemented yet.");
  // Fetch updated hunter data after allocation
  const updatedHunter = await getHunterById(hunterId);
  return {
    success: false,
    updatedHunter: updatedHunter || undefined,
    error: "Not implemented",
  };
}

export async function gainExperience(
  hunterId: string,
  amount: number,
): Promise<{
  success: boolean;
  updatedHunter?: Hunter;
  message?: string;
  error?: string;
}> {
  // TODO: Implement logic to update hunter experience, check for level up, grant points
  console.warn("gainExperience function not fully implemented yet.");
  // Fetch updated hunter data after gaining exp
  const updatedHunter = await getHunterById(hunterId);
  return {
    success: false,
    updatedHunter: updatedHunter || undefined,
    error: "Not implemented",
  };
}

// TODO: Add functions for selecting and potentially updating hunter (e.g., active status)
