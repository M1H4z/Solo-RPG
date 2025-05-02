// Remove 'use server'; directive as these are service functions, not direct Server Actions
// 'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSession } from "./authService";
import { Database, Tables } from "@/lib/supabase/database.types";
import {
  InventoryItem,
  EquipmentSlots,
  EquipmentSlotType,
  ItemType,
  Rarity,
} from "@/types/item.types";
import { Hunter } from "@/types/hunter.types"; // Import Hunter type
import { EQUIPMENT_SLOTS_ORDER } from "@/constants/inventory.constants";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Type guard to check if a string is a valid EquipmentSlotType
 */
export function isEquipmentSlotType(slot: string): slot is EquipmentSlotType {
  return EQUIPMENT_SLOTS_ORDER.includes(slot as EquipmentSlotType);
}

/**
 * Helper function to verify hunter ownership.
 */
async function verifyHunterOwnership(
  hunterId: string,
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<boolean> {
  const { data, error, count } = await supabase
    .from("hunters")
    .select("id", { count: "exact" })
    .eq("id", hunterId)
    .eq("user_id", userId)
    .single(); // Use single() or limit(1) to be efficient

  if (error && error.code !== "PGRST116") {
    // Ignore 'not found' error for check
    console.error("Ownership check error:", error);
    return false; // Treat DB errors as lack of ownership for safety
  }
  return count === 1;
}

// Define the expected shape for inventory query result
type HunterInventoryItemRow = Tables<'hunter_inventory_items'> & {
  items: Tables<'items'> | null;
};

// Define the expected shape for the specific query in equipItemToSpecificSlot
type ItemInstanceWithSlot = Tables<'hunter_inventory_items'> & {
    items: Pick<Tables<'items'>, 'id' | 'slot' | 'item_type' | 'name'> | null;
};

/**
 * Fetches the full inventory details for a given hunter.
 * Joins hunter_inventory_items with items table.
 * Assumes ownership has been checked by the caller (e.g., getHunterById)
 */
export async function getHunterInventory(
  hunterId: string,
  supabase?: SupabaseClient<Database>,
): Promise<InventoryItem[]> {
  const client: SupabaseClient<Database> = supabase || createSupabaseServerClient();

  const { data, error } = await client
    .from("hunter_inventory_items")
    .select(
      `
            instance_id,
            quantity,
            items (*)
        `,
    )
    .eq("hunter_id", hunterId);

  if (error) {
    console.error(`Error fetching inventory for hunter ${hunterId}:`, error);
    throw new Error(`Database error fetching inventory: ${error.message}`);
  }

  // Map the data safely
  return (data || []) // Work with data directly, fallback to empty array
    .map((itemData) => {
      // Type guard for the individual itemData might be needed if TS still struggles
      // For now, let's use optional chaining and explicit checks
      const baseItem = itemData?.items;
      if (!baseItem) { // Check if joined item data exists
        console.warn(`Missing base item data for inventory instance: ${itemData?.instance_id}`);
        return null;
      }

      // Map known properties explicitly
      return {
        id: baseItem.id,
        name: baseItem.name,
        description: baseItem.description || '',
        type: baseItem.item_type as ItemType,
        rarity: baseItem.rarity as Rarity,
        icon: baseItem.icon || undefined,
        stats: baseItem.stats,
        slot: baseItem.slot ? (baseItem.slot as EquipmentSlotType) : undefined,
        stackable: baseItem.stackable,
        sellPrice: baseItem.sell_price || undefined,
        inventoryId: itemData.instance_id,
        quantity: itemData.quantity,
      } as InventoryItem;
    })
    .filter((item): item is InventoryItem => item !== null);
}

/**
 * Fetches the equipped items details for a given hunter.
 * Assumes ownership has been checked by the caller.
 */
export async function getHunterEquipment(
  hunterId: string,
  supabase?: SupabaseClient<Database>,
): Promise<EquipmentSlots> {
  const client: SupabaseClient<Database> = supabase || createSupabaseServerClient();

  // 1. Fetch the hunter row to get the equipped instance IDs for all slots
  const { data: hunterData, error: hunterError } = await client
    .from("hunters")
    .select(
      "equipped_head, equipped_chest, equipped_legs, equipped_feet, equipped_hands, equipped_mainhand, equipped_offhand, equipped_accessory1, equipped_accessory2",
    )
    .eq("id", hunterId)
    .single();

  if (hunterError) {
    console.error(
      `Error fetching hunter equipment slots for ${hunterId}:`,
      hunterError,
    );
    throw new Error(
      `Database error fetching hunter equipment: ${hunterError.message}`,
    );
  }

  if (!hunterData) {
    // Should ideally not happen if hunter exists, but good practice
    console.warn(`Hunter ${hunterId} not found when fetching equipment.`);
    return {};
  }

  // Extract all instance IDs that are not null
  const equippedInstanceIds = Object.values(hunterData).filter(
    (id) => id !== null,
  ) as string[];
  if (equippedInstanceIds.length === 0) {
    return {}; // No items equipped, return early
  }

  // 2. Fetch the details for *all* potentially equipped item instances
  const { data: equippedItemsData, error: itemsError } = await client
    .from("hunter_inventory_items")
    .select(
      `
            instance_id,
            quantity,
            items (*)
        `,
    )
    .in("instance_id", equippedInstanceIds);

  if (itemsError) {
    console.error(
      `Error fetching equipped item details for hunter ${hunterId}:`,
      itemsError,
    );
    throw new Error(
      `Database error fetching equipped items: ${itemsError.message}`,
    );
  }

  if (!equippedItemsData) {
    console.warn(
      `No item details found for equipped instance IDs: ${equippedInstanceIds.join(", ")}`,
    );
    return {}; // No details found for the IDs
  }

  // Create lookup map - use data directly
  const itemDetailsMap = new Map<string, HunterInventoryItemRow>();
  for (const itemData of (equippedItemsData || [])) {
      // Check itemData structure before accessing
      if (itemData && itemData.instance_id) {
        itemDetailsMap.set(itemData.instance_id, itemData as HunterInventoryItemRow);
      }
  }

  // Build equipment map safely
  const equipmentMap: EquipmentSlots = {};
  for (const slot of EQUIPMENT_SLOTS_ORDER) {
    const columnName = `equipped_${slot.toLowerCase().replace("1", "1").replace("2", "2")}` as keyof typeof hunterData;
    const instanceId = hunterData[columnName];

    if (instanceId && typeof instanceId === "string") {
      const itemData = itemDetailsMap.get(instanceId);
      const baseItem = itemData?.items;
      // Check if itemData and nested baseItem exist
      if (baseItem) { // Simplified check: if baseItem exists, map it
        equipmentMap[slot] = {
            id: baseItem.id,
            name: baseItem.name,
            description: baseItem.description || '',
            type: baseItem.item_type as ItemType,
            rarity: baseItem.rarity as Rarity,
            icon: baseItem.icon || undefined,
            stats: baseItem.stats,
            slot: baseItem.slot ? (baseItem.slot as EquipmentSlotType) : undefined,
            stackable: baseItem.stackable,
            sellPrice: baseItem.sell_price || undefined,
            inventoryId: itemData.instance_id,
            quantity: itemData.quantity,
        } as InventoryItem;
      } else {
        console.warn(`Item details or nested item data not found for instance ID ${instanceId} in slot ${slot}`);
      }
    }
  }
  return equipmentMap;
}

/**
 * Adds an item to a hunter's inventory.
 * Handles stacking for stackable items.
 * Verifies hunter ownership.
 */
export async function addInventoryItem(
  hunterId: string,
  itemId: string,
  quantityToAdd: number = 1,
): Promise<{
  success: boolean;
  updatedInventory?: InventoryItem[];
  error?: string;
}> {
  const session = await getUserSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: No session" };
  }
  const supabase: SupabaseClient<Database> = createSupabaseServerClient();

  // Verify Ownership
  const isOwner = await verifyHunterOwnership(
    hunterId,
    session.user.id,
    supabase,
  );
  if (!isOwner) {
    return {
      success: false,
      error: "Unauthorized: Hunter does not belong to user",
    };
  }

  try {
    // 1. Get base item info (especially stackable status)
    const { data: baseItem, error: itemError } = await supabase
      .from("items")
      .select("id, stackable")
      .eq("id", itemId)
      .maybeSingle();

    if (itemError) throw itemError;
    if (!baseItem)
      return { success: false, error: `Item definition not found: ${itemId}` };

    let inventoryUpdateError: any = null;

    if (baseItem.stackable) {
      // 2a. Try to increment quantity for existing stackable item
      console.log(`[addInventoryItem] Item ${itemId} is stackable. Checking for existing stack for hunter ${hunterId}...`);
      const { data: existingItem, error: findError } = await supabase
        .from("hunter_inventory_items")
        .select("instance_id, quantity")
        .eq("hunter_id", hunterId)
        .eq("item_id", itemId)
        .maybeSingle(); // Assume only one stack per item_id for a hunter

      if (findError) {
          console.error(`[addInventoryItem] Error finding existing stack for ${itemId}:`, findError);
          throw findError;
      }

      if (existingItem) {
        // Update existing stack
        console.log(`[addInventoryItem] Found existing stack (instance_id: ${existingItem.instance_id}). Updating quantity...`);
        const newQuantity = existingItem.quantity + quantityToAdd;
        const { error: updateError } = await supabase
          .from("hunter_inventory_items")
          .update({ quantity: newQuantity })
          .eq("instance_id", existingItem.instance_id);
        if (updateError) {
            console.error(`[addInventoryItem] Error updating stack for instance ${existingItem.instance_id}:`, updateError);
            inventoryUpdateError = updateError;
        } else {
            console.log(`[addInventoryItem] Successfully updated stack for instance ${existingItem.instance_id} to quantity ${newQuantity}.`);
        }
      } else {
        // Insert new stack if not found
        console.log(`[addInventoryItem] No existing stack found for ${itemId}. Inserting new stack...`);
        const insertPayload = {
            hunter_id: hunterId,
            item_id: itemId,
            quantity: quantityToAdd,
            updated_at: new Date().toISOString(),
          };
        const { error: insertError } = await supabase
          .from("hunter_inventory_items")
          .insert(insertPayload);
        if (insertError) {
            console.error(`[addInventoryItem] Error inserting new stack for ${itemId}:`, insertError);
            inventoryUpdateError = insertError;
        } else {
             console.log(`[addInventoryItem] Successfully inserted new stack for ${itemId} with quantity ${quantityToAdd}.`);
        }
      }
    } else {
      // 2b. Insert new instance for non-stackable item
      console.log(`[addInventoryItem] Item ${itemId} is not stackable. Inserting ${quantityToAdd} new instance(s)...`);
      const itemsToInsert = Array(quantityToAdd)
        .fill(0)
        .map((_, index) => ({
          hunter_id: hunterId,
          item_id: itemId,
          quantity: 1,
          updated_at: new Date().toISOString(),
        }));
      const { error: insertError } = await supabase
        .from("hunter_inventory_items")
        .insert(itemsToInsert);
      if (insertError) {
          console.error(`[addInventoryItem] Error inserting non-stackable item(s) ${itemId}:`, insertError);
          inventoryUpdateError = insertError;
      } else {
          console.log(`[addInventoryItem] Successfully inserted ${quantityToAdd} instance(s) of non-stackable item ${itemId}.`);
      }
    }

    if (inventoryUpdateError) {
      console.error("[addInventoryItem] Inventory update failed.", inventoryUpdateError);
      throw inventoryUpdateError;
    }

    // 3. Fetch updated inventory to return
    console.log(`[addInventoryItem] Fetching updated inventory for hunter ${hunterId}...`);
    const updatedInventory = await getHunterInventory(hunterId, supabase);
    console.log(`[addInventoryItem] Successfully added item ${itemId} and fetched updated inventory.`);

    return { success: true, updatedInventory };
  } catch (error: any) {
    console.error(`[addInventoryItem] CATCH BLOCK: Error adding item ${itemId} for hunter ${hunterId}:`, error);
    // REMOVED Check for unique constraint violation specifically
    // if (error.code === '23505' && error.message?.includes('idx_unique_unequipped_item')) {
    //     return { success: false, error: "Cannot add duplicate unique unequipped item." };
    // }
    // Return generic error for other issues
    return { success: false, error: error.message || "Failed to add item." };
  }
}

/**
 * Equips an item to a SPECIFIC slot, allowing for rules like MainHand in OffHand.
 * Verifies hunter ownership, item existence, and slot validity.
 */
export async function equipItemToSpecificSlot(
  hunterId: string,
  inventoryInstanceId: string,
  targetSlot: EquipmentSlotType,
): Promise<{ success: boolean; updatedEquipment?: EquipmentSlots; error?: string; }> {
  const session = await getUserSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: No session" };
  }
  const supabase: SupabaseClient<Database> = createSupabaseServerClient();
  const isOwner = await verifyHunterOwnership(hunterId, session.user.id, supabase);
  if (!isOwner) {
    return {
      success: false,
      error: "Unauthorized: Hunter does not belong to user",
    };
  }

  try {
    // Step 1: Fetch the specific inventory item instance
    const { data: itemInstance, error: instanceError } = await supabase
      .from('hunter_inventory_items')
      .select('instance_id, item_id') // Get item_id to fetch base item
      .eq('instance_id', inventoryInstanceId)
      .eq('hunter_id', hunterId)
      .maybeSingle();

    if (instanceError) throw instanceError;
    if (!itemInstance) {
      return {
        success: false,
        error: `Item instance not found in inventory: ${inventoryInstanceId}`,
      };
    }

    // Step 2: Fetch the base item details using the item_id
    const { data: baseItem, error: itemError } = await supabase
      .from('items')
      .select('id, slot, item_type, name')
      .eq('id', itemInstance.item_id)
      .maybeSingle();

    if (itemError) throw itemError;
    if (!baseItem) {
      return {
        success: false,
        error: `Base item definition not found for item ID: ${itemInstance.item_id}`,
      };
    }

    // Now we have baseItem typed correctly from the separate query
    const itemDefinedSlot = baseItem.slot as EquipmentSlotType | null;
    const itemName = baseItem.name || "Item";

    // Validation if the item is generally equippable
    if (!itemDefinedSlot || !isEquipmentSlotType(itemDefinedSlot)) {
      return {
        success: false,
        error: `${itemName} is not an equippable item.`,
      };
    }

    // Validation if the item can go into the *target* slot
    let canEquipInTargetSlot = false;
    if (itemDefinedSlot === targetSlot) {
      canEquipInTargetSlot = true;
    } else if (itemDefinedSlot === "MainHand" && (targetSlot === "MainHand" || targetSlot === "OffHand")) {
      canEquipInTargetSlot = true;
    }

    if (!canEquipInTargetSlot) {
      return {
        success: false,
        error: `Cannot equip ${itemName} (${itemDefinedSlot}) in the ${targetSlot} slot.`,
      };
    }

    // Construct the update object
    const equippedColumn = `equipped_${targetSlot.toLowerCase().replace("1", "1").replace("2", "2")}` as keyof Hunter;
    const hunterUpdate: Partial<Record<keyof Hunter, any>> = {
      [equippedColumn]: inventoryInstanceId,
    };

    // Perform the update
    const { error: updateError } = await supabase
      .from("hunters")
      .update(hunterUpdate)
      .eq("id", hunterId);

    if (updateError) throw updateError;

    // Fetch updated equipment state
    const updatedEquipment = await getHunterEquipment(hunterId, supabase);
    return { success: true, updatedEquipment };

  } catch (error: any) {
    console.error(`Error in equipItemToSpecificSlot for hunter ${hunterId}, item ${inventoryInstanceId}, target ${targetSlot}:`, error);
    return { success: false, error: error.message || "Failed to equip item to specified slot." };
  }
}

/**
 * Equips an item from the hunter's inventory, replacing any item currently in the slot.
 * Verifies hunter ownership and item existence/type.
 */
export async function equipItem(
  hunterId: string,
  inventoryInstanceId: string,
): Promise<{
  success: boolean;
  updatedEquipment?: EquipmentSlots;
  error?: string;
}> {
  const session = await getUserSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: No session" };
  }
  const supabase: SupabaseClient<Database> = createSupabaseServerClient();

  // Verify Ownership
  const isOwner = await verifyHunterOwnership(
    hunterId,
    session.user.id,
    supabase,
  );
  if (!isOwner) {
    return {
      success: false,
      error: "Unauthorized: Hunter does not belong to user",
    };
  }

  try {
    // 1. Find the item instance in inventory AND get its base item details (slot, etc.)
    const { data: itemInstance, error: instanceError } = await supabase
      .from("hunter_inventory_items")
      .select(
        `
                instance_id,
                items (id, slot, item_type)
            `,
      )
      .eq("instance_id", inventoryInstanceId)
      .eq("hunter_id", hunterId) // Ensure item belongs to this hunter
      .maybeSingle();

    if (instanceError) throw instanceError;
    if (!itemInstance || !itemInstance.items) {
      return {
        success: false,
        error: `Item instance not found in inventory: ${inventoryInstanceId}`,
      };
    }

    const baseItem = itemInstance.items;
    const targetSlot = baseItem.slot as EquipmentSlotType | null;

    // 2. Validate if the item is actually equippable
    if (!targetSlot || !isEquipmentSlotType(targetSlot)) {
      return {
        success: false,
        error: "Item is not equippable or has an invalid slot type.",
      };
    }

    // 3. Construct the update object for the hunters table
    const equippedColumn =
      `equipped_${targetSlot.toLowerCase().replace("1", "1").replace("2", "2")}` as keyof Hunter; // e.g., equipped_mainhand
    const hunterUpdate: Partial<Record<keyof Hunter, any>> = {
      [equippedColumn]: inventoryInstanceId,
      // updated_at will be handled by the DB trigger
    };

    // 4. Perform the update on the hunters table
    // This directly replaces whatever was in the slot before.
    const { error: updateError } = await supabase
      .from("hunters")
      .update(hunterUpdate)
      .eq("id", hunterId);

    if (updateError) {
      console.error(
        `Error equipping item ${inventoryInstanceId} to slot ${targetSlot} for hunter ${hunterId}:`,
        updateError,
      );
      throw new Error(
        `Database error updating equipment slot: ${updateError.message}`,
      );
    }

    // 5. Fetch the updated equipment state to return
    // We don't need to return inventory here as equipping doesn't change it directly
    const updatedEquipment = await getHunterEquipment(hunterId, supabase);

    return { success: true, updatedEquipment };
  } catch (error: any) {
    console.error(
      `Error in equipItem for hunter ${hunterId}, item ${inventoryInstanceId}:`,
      error,
    );
    return { success: false, error: error.message || "Failed to equip item." };
  }
}

/**
 * Unequips an item from a specific slot.
 * Verifies hunter ownership.
 */
export async function unequipItem(
  hunterId: string,
  slot: EquipmentSlotType,
): Promise<{
  success: boolean;
  updatedEquipment?: EquipmentSlots;
  error?: string;
}> {
  const session = await getUserSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: No session" };
  }
  const supabase: SupabaseClient<Database> = createSupabaseServerClient();

  // Verify Ownership
  const isOwner = await verifyHunterOwnership(
    hunterId,
    session.user.id,
    supabase,
  );
  if (!isOwner) {
    return {
      success: false,
      error: "Unauthorized: Hunter does not belong to user",
    };
  }

  // Restore the try...catch block for the actual unequip logic
  try {
    // 1. Determine the column name (ensure lowercase mapping matches previous logic)
    const equippedColumn = `equipped_${slot.toLowerCase()}` as keyof Hunter;

    // 2. Set the hunter's equipped slot to NULL
    const { error: updateError } = await supabase
      .from("hunters")
      .update({ [equippedColumn]: null })
      .eq("id", hunterId);

    if (updateError) throw updateError;

    // 3. Fetch updated equipment state
    const updatedEquipment = await getHunterEquipment(hunterId, supabase);

    return { success: true, updatedEquipment };
  } catch (error: any) {
    console.error(
      `Error unequipping item from slot ${slot} for hunter ${hunterId}:`,
      error,
    );
    return {
      success: false,
      error: error.message || "Failed to unequip item.",
    };
  }
}

/**
 * Drops (deletes) an item instance from the hunter's inventory.
 * Prevents dropping equipped items.
 */
export async function dropInventoryItem(
  hunterId: string,
  inventoryInstanceId: string,
  quantityToDrop: number = 1, // Default to dropping the whole instance/stack for now
): Promise<{
  success: boolean;
  updatedInventory?: InventoryItem[];
  error?: string;
}> {
  const session = await getUserSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: No session" };
  }
  const supabase: SupabaseClient<Database> = createSupabaseServerClient();

  // Verify Ownership
  const isOwner = await verifyHunterOwnership(
    hunterId,
    session.user.id,
    supabase,
  );
  if (!isOwner) {
    return {
      success: false,
      error: "Unauthorized: Hunter does not belong to user",
    };
  }

  if (quantityToDrop <= 0) {
    return { success: false, error: "Quantity to drop must be positive." };
  }

  try {
    // 1. Check if the item is currently equipped
    const currentEquipment = await getHunterEquipment(hunterId, supabase);
    const isEquipped = Object.values(currentEquipment).some(
      (item) => item?.inventoryId === inventoryInstanceId,
    );

    if (isEquipped) {
      return {
        success: false,
        error: "Cannot drop an equipped item. Unequip it first.",
      };
    }

    // 2. Find the item instance to get its quantity and stackable status
    const { data: itemInstance, error: findError } = await supabase
      .from("hunter_inventory_items")
      .select("instance_id, quantity, items(stackable)") // Select stackable from base item
      .eq("instance_id", inventoryInstanceId)
      .eq("hunter_id", hunterId)
      .maybeSingle();

    if (findError) throw findError;
    if (!itemInstance) {
      return { success: false, error: "Item instance not found in inventory." };
    }

    const currentQuantity = itemInstance.quantity;
    const isStackable = itemInstance.items?.stackable ?? false;

    // 3. Perform delete or update based on quantity and stackability
    if (isStackable && currentQuantity > quantityToDrop) {
      // Reduce quantity
      const { error: updateError } = await supabase
        .from("hunter_inventory_items")
        .update({ quantity: currentQuantity - quantityToDrop })
        .eq("instance_id", inventoryInstanceId);
      if (updateError) throw updateError;
    } else {
      // Delete the item instance (either non-stackable, or dropping >= current quantity)
      const { error: deleteError } = await supabase
        .from("hunter_inventory_items")
        .delete()
        .eq("instance_id", inventoryInstanceId);
      if (deleteError) throw deleteError;
    }

    // 4. Fetch updated inventory to return
    const updatedInventory = await getHunterInventory(hunterId, supabase);
    return { success: true, updatedInventory };
  } catch (error: any) {
    console.error(
      `Error dropping item ${inventoryInstanceId} for hunter ${hunterId}:`,
      error,
    );
    return { success: false, error: error.message || "Failed to drop item." };
  }
}
