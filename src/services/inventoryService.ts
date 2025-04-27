// Remove 'use server'; directive as these are service functions, not direct Server Actions
// 'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserSession } from './authService';
import { InventoryItem, EquipmentSlots, EquipmentSlotType } from '@/types/item.types';
import { Hunter } from '@/types/hunter.types'; // Import Hunter type
import { EQUIPMENT_SLOTS_ORDER } from '@/constants/inventory.constants';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Type guard to check if a string is a valid EquipmentSlotType
 */
export function isEquipmentSlotType(slot: string): slot is EquipmentSlotType {
    return EQUIPMENT_SLOTS_ORDER.includes(slot as EquipmentSlotType);
}

/**
 * Helper function to verify hunter ownership.
 */
async function verifyHunterOwnership(hunterId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
    const { data, error, count } = await supabase
        .from('hunters')
        .select('id', { count: 'exact' })
        .eq('id', hunterId)
        .eq('user_id', userId)
        .single(); // Use single() or limit(1) to be efficient

    if (error && error.code !== 'PGRST116') { // Ignore 'not found' error for check
        console.error('Ownership check error:', error);
        return false; // Treat DB errors as lack of ownership for safety
    }
    return count === 1;
}

/**
 * Fetches the full inventory details for a given hunter.
 * Joins hunter_inventory_items with items table.
 * Assumes ownership has been checked by the caller (e.g., getHunterById)
 */
export async function getHunterInventory(hunterId: string, supabase?: SupabaseClient): Promise<InventoryItem[]> {
    const client = supabase || createSupabaseServerClient();

    const { data, error } = await client
        .from('hunter_inventory_items')
        .select(`
            instance_id,
            quantity,
            items (*)
        `)
        .eq('hunter_id', hunterId);

    if (error) {
        console.error(`Error fetching inventory for hunter ${hunterId}:`, error);
        throw new Error(`Database error fetching inventory: ${error.message}`);
    }

    // Map the data to the InventoryItem structure
    return (data || []).map(itemData => {
        const baseItem = itemData.items;
        if (!baseItem) return null; // Should not happen with inner join (*)
        return {
            ...(baseItem as any), // Spread base item properties
            inventoryId: itemData.instance_id, // Map instance_id to inventoryId
            quantity: itemData.quantity,
            // Explicitly map fields if needed to match BaseItem/InventoryItem types exactly
            id: baseItem.id,
            name: baseItem.name,
            description: baseItem.description,
            type: baseItem.item_type,
            rarity: baseItem.rarity,
            slot: baseItem.slot,
            stats: baseItem.stats,
            icon: baseItem.icon,
            stackable: baseItem.stackable,
            sellPrice: baseItem.sell_price
        } as InventoryItem;
    }).filter((item): item is InventoryItem => item !== null); // Filter out any nulls just in case
}

/**
 * Fetches the equipped items details for a given hunter.
 * Assumes ownership has been checked by the caller.
 */
export async function getHunterEquipment(hunterId: string, supabase?: SupabaseClient): Promise<EquipmentSlots> {
    const client = supabase || createSupabaseServerClient();

    // 1. Fetch the hunter row to get the equipped instance IDs for all slots
    const { data: hunterData, error: hunterError } = await client
        .from('hunters')
        .select('equipped_head, equipped_chest, equipped_legs, equipped_feet, equipped_hands, equipped_mainhand, equipped_offhand, equipped_accessory1, equipped_accessory2')
        .eq('id', hunterId)
        .single();

    if (hunterError) {
        console.error(`Error fetching hunter equipment slots for ${hunterId}:`, hunterError);
        throw new Error(`Database error fetching hunter equipment: ${hunterError.message}`);
    }

    if (!hunterData) {
        // Should ideally not happen if hunter exists, but good practice
        console.warn(`Hunter ${hunterId} not found when fetching equipment.`);
        return {}; 
    }

    // Extract all instance IDs that are not null
    const equippedInstanceIds = Object.values(hunterData).filter(id => id !== null) as string[];
    if (equippedInstanceIds.length === 0) {
        return {}; // No items equipped, return early
    }

    // 2. Fetch the details for *all* potentially equipped item instances
    const { data: equippedItemsData, error: itemsError } = await client
        .from('hunter_inventory_items')
        .select(`
            instance_id,
            quantity, 
            items (*) // Select all base item fields
        `)
        .in('instance_id', equippedInstanceIds);

    if (itemsError) {
        console.error(`Error fetching equipped item details for hunter ${hunterId}:`, itemsError);
        throw new Error(`Database error fetching equipped items: ${itemsError.message}`);
    }

    if (!equippedItemsData) {
        console.warn(`No item details found for equipped instance IDs: ${equippedInstanceIds.join(', ')}`);
        return {}; // No details found for the IDs
    }

    // 3. Create a lookup map for faster access to item details by instance_id
    const itemDetailsMap = new Map<string, typeof equippedItemsData[number]>();
    for (const itemData of equippedItemsData) {
        itemDetailsMap.set(itemData.instance_id, itemData);
    }

    // 4. Iterate through the defined equipment slots and build the result map
    const equipmentMap: EquipmentSlots = {};
    for (const slot of EQUIPMENT_SLOTS_ORDER) {
        // Construct the column name dynamically (handle accessory1/2)
        const columnName = `equipped_${slot.toLowerCase().replace('1','1').replace('2','2')}` as keyof typeof hunterData;
        const instanceId = hunterData[columnName];

        if (instanceId && typeof instanceId === 'string') {
            const itemData = itemDetailsMap.get(instanceId);
            if (itemData && itemData.items) {
                const baseItem = itemData.items;
                 // Map the data correctly to InventoryItem structure
                equipmentMap[slot] = {
                    ...(baseItem as any),
                    inventoryId: itemData.instance_id, // Use the instance ID from inventory table
                    quantity: itemData.quantity,
                    // Explicit mapping for clarity and type safety
                    id: baseItem.id,
                    name: baseItem.name,
                    description: baseItem.description,
                    type: baseItem.item_type,
                    rarity: baseItem.rarity,
                    slot: baseItem.slot, // Keep the item's defined slot for info
                    stats: baseItem.stats,
                    icon: baseItem.icon,
                    stackable: baseItem.stackable,
                    sellPrice: baseItem.sell_price
                } as InventoryItem;
            } else {
                // This case should be rare if IDs are consistent
                 console.warn(`Item details not found for instance ID ${instanceId} in slot ${slot}`);
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
export async function addInventoryItem(hunterId: string, itemId: string, quantityToAdd: number = 1): Promise<{ success: boolean; updatedInventory?: InventoryItem[]; error?: string }> {
    const session = await getUserSession();
    if (!session?.user) { 
        return { success: false, error: 'Unauthorized: No session' };
    }
    const supabase = createSupabaseServerClient();

    // Verify Ownership
    const isOwner = await verifyHunterOwnership(hunterId, session.user.id, supabase);
    if (!isOwner) {
        return { success: false, error: 'Unauthorized: Hunter does not belong to user' };
    }

    try {
        // 1. Get base item info (especially stackable status)
        const { data: baseItem, error: itemError } = await supabase
            .from('items')
            .select('id, stackable')
            .eq('id', itemId)
            .maybeSingle(); 

        if (itemError) throw itemError;
        if (!baseItem) return { success: false, error: `Item definition not found: ${itemId}` };

        let inventoryUpdateError: any = null;

        if (baseItem.stackable) {
            // 2a. Try to increment quantity for existing stackable item
            const { data: existingItem, error: findError } = await supabase
                .from('hunter_inventory_items')
                .select('instance_id, quantity')
                .eq('hunter_id', hunterId)
                .eq('item_id', itemId)
                .maybeSingle(); // Assume only one stack per item_id for a hunter

            if (findError) throw findError;

            if (existingItem) {
                // Update existing stack
                const { error: updateError } = await supabase
                    .from('hunter_inventory_items')
                    .update({ quantity: existingItem.quantity + quantityToAdd })
                    .eq('instance_id', existingItem.instance_id);
                if (updateError) inventoryUpdateError = updateError;
            } else {
                // Insert new stack if not found
                const { error: insertError } = await supabase
                    .from('hunter_inventory_items')
                    .insert({ hunter_id: hunterId, item_id: itemId, quantity: quantityToAdd });
                if (insertError) inventoryUpdateError = insertError;
            }
        } else {
            // 2b. Insert new instance for non-stackable item
            const itemsToInsert = Array(quantityToAdd).fill(0).map(() => ({
                hunter_id: hunterId,
                item_id: itemId,
                quantity: 1 
            }));
            const { error: insertError } = await supabase
                .from('hunter_inventory_items')
                .insert(itemsToInsert);
             if (insertError) inventoryUpdateError = insertError;
        }

        if (inventoryUpdateError) {
            throw inventoryUpdateError;
        }

        // 3. Fetch updated inventory to return
        const updatedInventory = await getHunterInventory(hunterId, supabase);

        return { success: true, updatedInventory };

    } catch (error: any) {
        console.error(`Error adding item ${itemId} for hunter ${hunterId}:`, error);
        return { success: false, error: error.message || 'Failed to add item.' };
    }
}

/**
 * Equips an item to a SPECIFIC slot, allowing for rules like MainHand in OffHand.
 * Verifies hunter ownership, item existence, and slot validity.
 */
export async function equipItemToSpecificSlot(
    hunterId: string, 
    inventoryInstanceId: string, 
    targetSlot: EquipmentSlotType // Explicitly require the target slot
): Promise<{ success: boolean; updatedEquipment?: EquipmentSlots; error?: string }> {
    const session = await getUserSession();
    if (!session?.user) { 
        return { success: false, error: 'Unauthorized: No session' };
    }
    const supabase = createSupabaseServerClient();

    // Verify Ownership
    const isOwner = await verifyHunterOwnership(hunterId, session.user.id, supabase);
    if (!isOwner) {
        return { success: false, error: 'Unauthorized: Hunter does not belong to user' };
    }

    try {
        // 1. Find item instance and get its base defined slot
        const { data: itemInstance, error: instanceError } = await supabase
            .from('hunter_inventory_items')
            .select(`
                instance_id,
                items (id, slot, item_type, name) // Get name for error messages
            `)
            .eq('instance_id', inventoryInstanceId)
            .eq('hunter_id', hunterId)
            .maybeSingle(); 

        if (instanceError) throw instanceError;
        if (!itemInstance || !itemInstance.items) {
            return { success: false, error: `Item instance not found in inventory: ${inventoryInstanceId}` };
        }

        const baseItem = itemInstance.items;
        const itemDefinedSlot = baseItem.slot as EquipmentSlotType | null;
        const itemName = baseItem.name || 'Item'; // Fallback name

        // 2. Validate if the item is generally equippable
        if (!itemDefinedSlot || !isEquipmentSlotType(itemDefinedSlot)) {
             return { success: false, error: `${itemName} is not an equippable item.` };
        }

        // 3. Validate if the item can go into the *target* slot
        let canEquipInTargetSlot = false;
        if (itemDefinedSlot === targetSlot) {
            canEquipInTargetSlot = true; // Direct match
        } else if (itemDefinedSlot === 'MainHand' && (targetSlot === 'MainHand' || targetSlot === 'OffHand')) {
            canEquipInTargetSlot = true; // MainHand weapon to Main/Off Hand
        }
        // Add other rules here if needed (e.g., Shields)

        if (!canEquipInTargetSlot) {
            return { success: false, error: `Cannot equip ${itemName} (${itemDefinedSlot}) in the ${targetSlot} slot.` };
        }
        
        // 4. Construct the update object using the *targetSlot*
        const equippedColumn = `equipped_${targetSlot.toLowerCase().replace('1','1').replace('2','2')}` as keyof Hunter;
        const hunterUpdate: Partial<Record<keyof Hunter, any>> = {
            [equippedColumn]: inventoryInstanceId,
        };

        // 5. Perform the update on the hunters table
        const { error: updateError } = await supabase
            .from('hunters')
            .update(hunterUpdate)
            .eq('id', hunterId);

        if (updateError) {
            console.error(`Error equipping item ${inventoryInstanceId} to specific slot ${targetSlot} for hunter ${hunterId}:`, updateError);
            throw new Error(`Database error updating equipment slot: ${updateError.message}`);
        }

        // 6. Fetch updated equipment state
        const updatedEquipment = await getHunterEquipment(hunterId, supabase);
        return { success: true, updatedEquipment };

    } catch (error: any) {
        console.error(`Error in equipItemToSpecificSlot for hunter ${hunterId}, item ${inventoryInstanceId}, target ${targetSlot}:`, error);
        return { success: false, error: error.message || 'Failed to equip item to specified slot.' };
    }
}

/**
 * Equips an item from the hunter's inventory, replacing any item currently in the slot.
 * Verifies hunter ownership and item existence/type.
 */
export async function equipItem(hunterId: string, inventoryInstanceId: string): Promise<{ success: boolean; updatedEquipment?: EquipmentSlots; error?: string }> {
    const session = await getUserSession();
    if (!session?.user) { 
        return { success: false, error: 'Unauthorized: No session' };
    }
    const supabase = createSupabaseServerClient();

    // Verify Ownership
    const isOwner = await verifyHunterOwnership(hunterId, session.user.id, supabase);
    if (!isOwner) {
        return { success: false, error: 'Unauthorized: Hunter does not belong to user' };
    }

    try {
        // 1. Find the item instance in inventory AND get its base item details (slot, etc.)
        const { data: itemInstance, error: instanceError } = await supabase
            .from('hunter_inventory_items')
            .select(`
                instance_id,
                items (id, slot, item_type)
            `)
            .eq('instance_id', inventoryInstanceId)
            .eq('hunter_id', hunterId) // Ensure item belongs to this hunter
            .maybeSingle(); 

        if (instanceError) throw instanceError;
        if (!itemInstance || !itemInstance.items) {
            return { success: false, error: `Item instance not found in inventory: ${inventoryInstanceId}` };
        }

        const baseItem = itemInstance.items;
        const targetSlot = baseItem.slot as EquipmentSlotType | null;

        // 2. Validate if the item is actually equippable
        if (!targetSlot || !isEquipmentSlotType(targetSlot)) {
             return { success: false, error: 'Item is not equippable or has an invalid slot type.' };
        }
        
        // 3. Construct the update object for the hunters table
        const equippedColumn = `equipped_${targetSlot.toLowerCase().replace('1','1').replace('2','2')}` as keyof Hunter; // e.g., equipped_mainhand
        const hunterUpdate: Partial<Record<keyof Hunter, any>> = {
            [equippedColumn]: inventoryInstanceId,
            // updated_at will be handled by the DB trigger
        };

        // 4. Perform the update on the hunters table
        // This directly replaces whatever was in the slot before.
        const { error: updateError } = await supabase
            .from('hunters')
            .update(hunterUpdate)
            .eq('id', hunterId);

        if (updateError) {
            console.error(`Error equipping item ${inventoryInstanceId} to slot ${targetSlot} for hunter ${hunterId}:`, updateError);
            throw new Error(`Database error updating equipment slot: ${updateError.message}`);
        }

        // 5. Fetch the updated equipment state to return
        // We don't need to return inventory here as equipping doesn't change it directly
        const updatedEquipment = await getHunterEquipment(hunterId, supabase);

        return { success: true, updatedEquipment };

    } catch (error: any) {
        console.error(`Error in equipItem for hunter ${hunterId}, item ${inventoryInstanceId}:`, error);
        return { success: false, error: error.message || 'Failed to equip item.' };
    }
}

/**
 * Unequips an item from a specific slot.
 * Verifies hunter ownership.
 */
export async function unequipItem(hunterId: string, slot: EquipmentSlotType): Promise<{ success: boolean; updatedEquipment?: EquipmentSlots; error?: string }> {
    const session = await getUserSession();
     if (!session?.user) { 
        return { success: false, error: 'Unauthorized: No session' };
    }
     const supabase = createSupabaseServerClient();

    // Verify Ownership
    const isOwner = await verifyHunterOwnership(hunterId, session.user.id, supabase);
    if (!isOwner) {
        return { success: false, error: 'Unauthorized: Hunter does not belong to user' };
    }

    // Restore the try...catch block for the actual unequip logic
    try {
        // 1. Determine the column name (ensure lowercase mapping matches previous logic)
        const equippedColumn = `equipped_${slot.toLowerCase()}` as keyof Hunter; 
        
        // 2. Set the hunter's equipped slot to NULL
        const { error: updateError } = await supabase
            .from('hunters')
            .update({ [equippedColumn]: null })
            .eq('id', hunterId);

        if (updateError) throw updateError;

        // 3. Fetch updated equipment state
        const updatedEquipment = await getHunterEquipment(hunterId, supabase);
        
        return { success: true, updatedEquipment };

    } catch (error: any) {
        console.error(`Error unequipping item from slot ${slot} for hunter ${hunterId}:`, error);
        return { success: false, error: error.message || 'Failed to unequip item.' };
    }
}

/**
 * Drops (deletes) an item instance from the hunter's inventory.
 * Prevents dropping equipped items.
 */
export async function dropInventoryItem(
    hunterId: string, 
    inventoryInstanceId: string, 
    quantityToDrop: number = 1 // Default to dropping the whole instance/stack for now
): Promise<{ success: boolean; updatedInventory?: InventoryItem[]; error?: string }> {
    const session = await getUserSession();
    if (!session?.user) { 
        return { success: false, error: 'Unauthorized: No session' };
    }
    const supabase = createSupabaseServerClient();

    // Verify Ownership
    const isOwner = await verifyHunterOwnership(hunterId, session.user.id, supabase);
    if (!isOwner) {
        return { success: false, error: 'Unauthorized: Hunter does not belong to user' };
    }

    if (quantityToDrop <= 0) {
        return { success: false, error: 'Quantity to drop must be positive.' };
    }

    try {
        // 1. Check if the item is currently equipped
        const currentEquipment = await getHunterEquipment(hunterId, supabase);
        const isEquipped = Object.values(currentEquipment)
                            .some(item => item?.inventoryId === inventoryInstanceId);

        if (isEquipped) {
            return { success: false, error: 'Cannot drop an equipped item. Unequip it first.' };
        }

        // 2. Find the item instance to get its quantity and stackable status
        const { data: itemInstance, error: findError } = await supabase
            .from('hunter_inventory_items')
            .select('instance_id, quantity, items(stackable)') // Select stackable from base item
            .eq('instance_id', inventoryInstanceId)
            .eq('hunter_id', hunterId)
            .maybeSingle();

        if (findError) throw findError;
        if (!itemInstance) {
            return { success: false, error: 'Item instance not found in inventory.' };
        }

        const currentQuantity = itemInstance.quantity;
        const isStackable = itemInstance.items?.stackable ?? false;

        // 3. Perform delete or update based on quantity and stackability
        if (isStackable && currentQuantity > quantityToDrop) {
            // Reduce quantity
            const { error: updateError } = await supabase
                .from('hunter_inventory_items')
                .update({ quantity: currentQuantity - quantityToDrop })
                .eq('instance_id', inventoryInstanceId);
            if (updateError) throw updateError;
        } else {
            // Delete the item instance (either non-stackable, or dropping >= current quantity)
            const { error: deleteError } = await supabase
                .from('hunter_inventory_items')
                .delete()
                .eq('instance_id', inventoryInstanceId);
            if (deleteError) throw deleteError;
        }

        // 4. Fetch updated inventory to return
        const updatedInventory = await getHunterInventory(hunterId, supabase);
        return { success: true, updatedInventory };

    } catch (error: any) {
        console.error(`Error dropping item ${inventoryInstanceId} for hunter ${hunterId}:`, error);
        return { success: false, error: error.message || 'Failed to drop item.' };
    }
}